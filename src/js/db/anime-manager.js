/**
 * Classe responsável por gerenciar animes no Firestore
 * Encapsula todas as operações de leitura/escrita de animes
 */
class AnimeManager {
  constructor() {
    this.db = firebase.firestore();
    this.animeCollection = 'animes';
    this.commentsCollection = 'animeComments';
    this.localStorageKey = 'animeData';
    this.initCheck();
  }

  // Verifica a inicialização do Firebase e conexão
  async initCheck() {
    try {
      await this.checkFirebaseConnection();
    } catch (error) {
      console.error('Erro na inicialização do AnimeManager:', error);
    }
  }

  /**
   * Verifica a conexão com o Firebase
   * @returns {Promise<boolean>} - Status da conexão
   */
  async checkFirebaseConnection() {
    try {
      await this.db.collection(this.animeCollection).limit(1).get();
      return true;
    } catch (error) {
      console.error('Erro de conexão com o Firebase:', error);
      return false;
    }
  }

  /**
   * Carrega todos os animes do Firestore
   * @param {string} orderBy - Campo pelo qual ordenar (padrão: 'primaryTitle')
   * @returns {Promise<Array>} - Lista de animes
   */
  async getAnimes(orderBy = 'primaryTitle') {
    try {
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .orderBy(orderBy).get();
      
      const animes = [];
      animesSnapshot.forEach(doc => {
        animes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Cria cache local
      localStorage.setItem(this.localStorageKey, JSON.stringify(animes));
      
      return animes;
    } catch (error) {
      console.error('Erro ao carregar animes:', error);
      
      // Fallback para dados em cache
      return this.getAnimesFromCache();
    }
  }

  /**
   * Obtém animes do cache local
   * @returns {Array} - Lista de animes em cache
   */
  getAnimesFromCache() {
    const cachedData = localStorage.getItem(this.localStorageKey);
    return cachedData ? JSON.parse(cachedData) : [];
  }

  /**
   * Busca um anime específico pelo ID
   * @param {string} animeId - ID do anime
   * @returns {Promise<Object|null>} - Dados do anime ou null
   */
  async getAnimeById(animeId) {
    try {
      const animeDoc = await this.db.collection(this.animeCollection)
        .doc(animeId).get();
      
      if (!animeDoc.exists) return null;
      
      return {
        id: animeDoc.id,
        ...animeDoc.data()
      };
    } catch (error) {
      console.error('Erro ao buscar anime:', error);
      
      // Tenta buscar do cache
      const cachedAnimes = this.getAnimesFromCache();
      return cachedAnimes.find(anime => anime.id === animeId) || null;
    }
  }

  /**
   * Salva um novo anime no Firestore
   * @param {Object} animeData - Dados do anime
   * @returns {Promise<string>} - ID do anime criado
   */
  async saveAnime(animeData) {
    try {
      // Adiciona timestamps
      const now = new Date().toISOString();
      const completeData = {
        ...animeData,
        createdAt: now,
        updatedAt: now,
        score: 0,
        popularity: 0,
        comments: [],
        favoriteCount: 0
      };
      
      const docRef = await this.db.collection(this.animeCollection).add(completeData);
      
      // Atualiza o cache local
      this.updateLocalCache();
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar anime:', error);
      throw error;
    }
  }

  /**
   * Atualiza um anime existente
   * @param {string} animeId - ID do anime a ser atualizado
   * @param {Object} animeData - Novos dados do anime
   * @returns {Promise<void>}
   */
  async updateAnime(animeId, animeData) {
    try {
      const animeRef = this.db.collection(this.animeCollection).doc(animeId);
      
      // Verifica se o anime existe
      const animeDoc = await animeRef.get();
      if (!animeDoc.exists) throw new Error('Anime não encontrado para atualização');
      
      const existingData = animeDoc.data();
      
      // Preserva dados importantes que não estão no formulário
      await animeRef.update({
        ...animeData,
        updatedAt: new Date().toISOString(),
        score: existingData.score || 0,
        popularity: existingData.popularity || 0,
        comments: existingData.comments || [],
        createdAt: existingData.createdAt,
        favoriteCount: existingData.favoriteCount || 0
      });
      
      // Atualiza o cache local
      this.updateLocalCache();
    } catch (error) {
      console.error('Erro ao atualizar anime:', error);
      throw error;
    }
  }

  /**
   * Exclui um anime e seus comentários associados
   * @param {string} animeId - ID do anime a ser excluído
   * @returns {Promise<void>}
   */
  async deleteAnime(animeId) {
    try {
      // Exclui o anime
      await this.db.collection(this.animeCollection).doc(animeId).delete();
      
      // Exclui comentários associados
      const commentSnapshot = await this.db.collection(this.commentsCollection)
        .where('animeId', '==', animeId)
        .get();
      
      const batch = this.db.batch();
      commentSnapshot.forEach(doc => batch.delete(doc.ref));
      
      if (!commentSnapshot.empty) await batch.commit();
      
      // Atualiza o cache local
      this.updateLocalCache();
    } catch (error) {
      console.error('Erro ao excluir anime:', error);
      throw error;
    }
  }

  /**
   * Atualiza o cache local com os dados mais recentes
   * @returns {Promise<void>}
   */
  async updateLocalCache() {
    try {
      const animes = await this.getAnimes();
      localStorage.setItem(this.localStorageKey, JSON.stringify(animes));
    } catch (error) {
      console.warn('Não foi possível atualizar o cache local:', error);
    }
  }

  /**
   * Exporta todos os animes como arquivo JSON
   * @returns {Promise<void>}
   */
  async exportAnimes() {
    try {
      const animes = await this.getAnimes();
      
      const blob = new Blob([JSON.stringify(animes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animes_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar animes:', error);
      throw error;
    }
  }

  /**
   * Importa animes a partir de um arquivo JSON
   * @param {Array} animes - Array de objetos de anime para importar
   * @returns {Promise<void>}
   */
  async importAnimes(animes) {
    try {
      if (!Array.isArray(animes)) throw new Error('Formato inválido');
      
      // Exclui todos os animes existentes
      const animesSnapshot = await this.db.collection(this.animeCollection).get();
      const batch = this.db.batch();
      animesSnapshot.forEach(doc => batch.delete(doc.ref));
      
      if (!animesSnapshot.empty) await batch.commit();
      
      // Adiciona os novos animes em lotes
      const importBatch = this.db.batch();
      for (const anime of animes) {
        const animeId = anime.id;
        const animeData = {...anime};
        
        // Remove o campo id para não duplicar no documento
        if (animeData.id) delete animeData.id;
        
        // Gera um novo ID ou usa o existente
        const docRef = animeId ? 
          this.db.collection(this.animeCollection).doc(animeId) : 
          this.db.collection(this.animeCollection).doc();
          
        importBatch.set(docRef, animeData);
      }
      
      await importBatch.commit();
      
      // Atualiza o cache local
      this.updateLocalCache();
      
      return true;
    } catch (error) {
      console.error('Erro ao importar animes:', error);
      throw error;
    }
  }

  /**
   * Comprime uma imagem para reduzir o tamanho
   * @param {string} imageDataUrl - URL da imagem em base64
   * @param {number} maxWidth - Largura máxima
   * @param {number} quality - Qualidade (0-1)
   * @returns {Promise<string>} - URL da imagem comprimida
   */
  async compressImage(imageDataUrl, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = imageDataUrl;
    });
  }

  /**
   * Incrementa o contador de favoritos de um anime
   * @param {string} animeId - ID do anime
   * @param {number} incrementBy - Valor a incrementar (1 ou -1)
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async updateFavoriteCount(animeId, incrementBy = 1) {
    try {
      if (!animeId) {
        console.error('ID do anime é obrigatório para atualizar favoritos');
        return false;
      }
      
      console.log(`Atualizando contador de favoritos para anime ID: ${animeId}, incremento: ${incrementBy}`);
      
      const animeRef = this.db.collection(this.animeCollection).doc(animeId);
      
      // Usar uma transação para garantir a integridade dos dados
      await this.db.runTransaction(async (transaction) => {
        const docSnapshot = await transaction.get(animeRef);
        
        if (!docSnapshot.exists) {
          throw new Error(`Anime com ID ${animeId} não encontrado na transação`);
        }
        
        const currentData = docSnapshot.data();
        const currentCount = typeof currentData.favoriteCount === 'number' ? currentData.favoriteCount : 0;
        const newCount = Math.max(0, currentCount + incrementBy);
        
        transaction.update(animeRef, { 
          favoriteCount: newCount,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Anime ${animeId}: contador de favoritos atualizado para ${newCount}`);
      });
      
      // Atualiza o cache local
      await this.updateLocalCache();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar contador de favoritos:', error);
      
      // Tenta falhar de maneira segura atualizando o cache local se possível
      try {
        const animeDoc = await this.db.collection(this.animeCollection).doc(animeId).get();
        if (animeDoc.exists) {
          const animes = this.getAnimesFromCache();
          const index = animes.findIndex(a => a.id === animeId);
          if (index >= 0) {
            animes[index] = { id: animeId, ...animeDoc.data() };
            localStorage.setItem(this.localStorageKey, JSON.stringify(animes));
          }
        }
      } catch (e) {
        console.warn('Não foi possível fazer a recuperação do cache:', e);
      }
      
      return false;
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.AnimeManager = AnimeManager;