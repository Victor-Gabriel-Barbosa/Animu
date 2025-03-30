/**
 * Classe responsável por gerenciar dados de animes no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD
 */
class AnimeManager {
  constructor() {
    this.db = firebase.firestore();
    this.animeCollection = 'animes';
    this.localStorageKey = 'animeData';
    this.localCommentsKey = 'animeComments';
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
      const animesSnapshot = await this.db.collection(this.animeCollection).orderBy(orderBy).get();
      
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
      const animeDoc = await this.db.collection(this.animeCollection).doc(animeId).get();
      
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
        comments: [], // Inicializa array de comentários vazio
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
        comments: existingData.comments || [], // Preserva comentários existentes
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
      // Exclui o anime (os comentários estão incluídos no documento)
      await this.db.collection(this.animeCollection).doc(animeId).delete();
      
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
      
      // Usa uma transação para garantir a integridade dos dados
      await this.db.runTransaction(async (transaction) => {
        const docSnapshot = await transaction.get(animeRef);
        
        if (!docSnapshot.exists) throw new Error(`Anime com ID ${animeId} não encontrado na transação`);
        
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

  /**
   * Busca os comentários de um anime específico pelo título
   * @param {string} animeTitle - Título do anime
   * @returns {Promise<Array>} - Lista de comentários
   */
  async getCommentsByAnimeTitle(animeTitle) {
    try {
      if (!animeTitle) throw new Error('Título do anime é obrigatório');
      
      // Busca o anime pelo título
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .where('primaryTitle', '==', animeTitle)
        .limit(1)
        .get();
      
      if (animesSnapshot.empty) {
        console.warn(`Anime não encontrado: ${animeTitle}`);
        return [];
      }
      
      // Obtém o documento do anime
      const animeDoc = animesSnapshot.docs[0];
      const animeData = animeDoc.data();
      
      // Retorna os comentários do anime (ou array vazio se não existirem)
      const comments = animeData.comments || [];
      
      // Ordena comentários por data (mais recentes primeiro)
      const sortedComments = comments.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Adiciona ID do documento a cada comentário (o ID é o índice no array)
      const commentsWithIds = sortedComments.map((comment, index) => ({
        id: `${animeDoc.id}_comment_${index}`,
        ...comment
      }));
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      localComments[animeTitle] = commentsWithIds;
      localStorage.setItem(this.localCommentsKey, JSON.stringify(localComments));
      
      return commentsWithIds;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      
      // Fallback para dados em cache
      const cachedComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      return cachedComments[animeTitle] || [];
    }
  }

  /**
   * Adiciona um novo comentário para um anime
   * @param {string} animeTitle - Título do anime
   * @param {Object} commentData - Dados do comentário (texto, avaliação, username)
   * @returns {Promise<Object>} - Comentário criado com ID
   */
  async addComment(animeTitle, commentData) {
    try {
      if (!animeTitle) throw new Error('Título do anime é obrigatório');
      if (!commentData.text) throw new Error('Texto do comentário é obrigatório');
      
      // Busca o anime pelo título
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .where('primaryTitle', '==', animeTitle)
        .limit(1)
        .get();
      
      if (animesSnapshot.empty) throw new Error(`Anime não encontrado: ${animeTitle}`);
      
      // Obtém o documento do anime
      const animeDoc = animesSnapshot.docs[0];
      const animeRef = animeDoc.ref;
      const animeData = animeDoc.data();
      
      // Cria o novo comentário
      const now = new Date().toISOString();
      const newComment = {
        text: commentData.text,
        rating: commentData.rating || 0,
        username: commentData.username,
        timestamp: now,
        likes: [],
        dislikes: []
      };
      
      // Obtém comentários existentes ou inicializa array vazio
      const existingComments = animeData.comments || [];
      
      // Adiciona o novo comentário ao array
      existingComments.unshift(newComment);
      
      // Atualiza o documento com o novo array de comentários
      await animeRef.update({
        comments: existingComments,
        updatedAt: now
      });
      
      // Atualiza a média de avaliação
      await this.updateAnimeAverageRating(animeTitle);
      
      // Atualiza o cache local
      const commentId = `${animeDoc.id}_comment_0`; // O novo comentário está na posição 0 (primeiro)
      const commentWithId = {
        id: commentId,
        ...newComment
      };
      
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      if (!localComments[animeTitle]) localComments[animeTitle] = [];
      localComments[animeTitle].unshift(commentWithId);
      localStorage.setItem(this.localCommentsKey, JSON.stringify(localComments));
      
      return commentWithId;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }

  /**
   * Atualiza um comentário existente
   * @param {string} commentId - ID do comentário
   * @param {Object} commentData - Dados atualizados do comentário
   * @returns {Promise<Object>} - Comentário atualizado
   */
  async updateComment(commentId, commentData) {
    try {
      if (!commentId) throw new Error('ID do comentário é obrigatório');
      
      // Extrai o ID do anime e índice do comentário do ID composto
      const [animeId, _, commentIndex] = commentId.split('_');
      const index = parseInt(commentIndex);
      
      if (isNaN(index)) throw new Error('ID de comentário inválido');
      
      // Busca o documento do anime
      const animeRef = this.db.collection(this.animeCollection).doc(animeId);
      const animeDoc = await animeRef.get();
      
      if (!animeDoc.exists) throw new Error('Anime não encontrado');
      
      const animeData = animeDoc.data();
      const animeTitle = animeData.primaryTitle;
      
      // Verifica se o comentário existe
      if (!animeData.comments || index >= animeData.comments.length) {
        throw new Error('Comentário não encontrado');
      }
      
      // Obtém o comentário existente
      const existingComment = animeData.comments[index];
      
      // Preparar dados atualizados preservando campos não alterados
      const updatedComment = {
        ...existingComment,
        ...commentData,
        edited: true,
        editedAt: new Date().toISOString()
      };
      
      // Atualiza o comentário no array
      const updatedComments = [...animeData.comments];
      updatedComments[index] = updatedComment;
      
      // Atualiza o documento com o array atualizado
      await animeRef.update({
        comments: updatedComments,
        updatedAt: new Date().toISOString()
      });
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      if (localComments[animeTitle]) {
        // O índice no cache pode ser diferente do índice no Firestore devido à ordenação
        const cachedIndex = localComments[animeTitle].findIndex(c => c.id === commentId);
        
        if (cachedIndex !== -1) {
          localComments[animeTitle][cachedIndex] = {
            id: commentId,
            ...updatedComment
          };
          
          localStorage.setItem(this.localCommentsKey, JSON.stringify(localComments));
        }
      }
      
      // Atualiza a média de avaliação
      await this.updateAnimeAverageRating(animeTitle);
      
      return {
        id: commentId,
        ...updatedComment
      };
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      throw error;
    }
  }

  /**
   * Exclui um comentário
   * @param {string} commentId - ID do comentário
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async deleteComment(commentId) {
    try {
      if (!commentId) throw new Error('ID do comentário é obrigatório');
      
      // Extrai o ID do anime e índice do comentário do ID composto
      const [animeId, _, commentIndex] = commentId.split('_');
      const index = parseInt(commentIndex);
      
      if (isNaN(index)) throw new Error('ID de comentário inválido');
      
      // Busca o documento do anime
      const animeRef = this.db.collection(this.animeCollection).doc(animeId);
      const animeDoc = await animeRef.get();
      
      if (!animeDoc.exists) throw new Error('Anime não encontrado');
      
      const animeData = animeDoc.data();
      const animeTitle = animeData.primaryTitle;
      
      // Verifica se o comentário existe
      if (!animeData.comments || index >= animeData.comments.length) {
        throw new Error('Comentário não encontrado');
      }
      
      // Remove o comentário do array
      const updatedComments = [...animeData.comments];
      updatedComments.splice(index, 1);
      
      // Atualiza o documento com o array atualizado
      await animeRef.update({
        comments: updatedComments,
        updatedAt: new Date().toISOString()
      });
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      if (localComments[animeTitle]) {
        localComments[animeTitle] = localComments[animeTitle].filter(c => c.id !== commentId);
        localStorage.setItem(this.localCommentsKey, JSON.stringify(localComments));
      }
      
      // Atualiza a média de avaliação
      await this.updateAnimeAverageRating(animeTitle);
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      throw error;
    }
  }

  /**
   * Adiciona ou remove um voto em um comentário
   * @param {string} commentId - ID do comentário
   * @param {string} username - Nome do usuário que está votando
   * @param {string} voteType - Tipo de voto ('like' ou 'dislike')
   * @returns {Promise<Object>} - Dados atualizados do comentário
   */
  async voteComment(commentId, username, voteType) {
    try {
      if (!commentId) throw new Error('ID do comentário é obrigatório');
      if (!username) throw new Error('Nome de usuário é obrigatório');
      if (voteType !== 'like' && voteType !== 'dislike') throw new Error('Tipo de voto inválido');
      
      // Extrai o ID do anime e índice do comentário do ID composto
      const [animeId, _, commentIndex] = commentId.split('_');
      const index = parseInt(commentIndex);
      
      if (isNaN(index)) throw new Error('ID de comentário inválido');
      
      // Usa uma transação para garantir consistência
      const result = await this.db.runTransaction(async (transaction) => {
        // Busca o documento do anime
        const animeRef = this.db.collection(this.animeCollection).doc(animeId);
        const animeDoc = await transaction.get(animeRef);
        
        if (!animeDoc.exists) throw new Error('Anime não encontrado');
        
        const animeData = animeDoc.data();
        const animeTitle = animeData.primaryTitle;
        
        // Verifica se o comentário existe
        if (!animeData.comments || index >= animeData.comments.length) {
          throw new Error('Comentário não encontrado');
        }
        
        // Obtém o comentário
        const comment = animeData.comments[index];
        
        // Inicializa arrays se não existirem
        const likes = comment.likes || [];
        const dislikes = comment.dislikes || [];
        
        // Verifica se o usuário já votou
        const hasVotedLike = likes.includes(username);
        const hasVotedDislike = dislikes.includes(username);
        
        // Remove votos existentes
        const newLikes = likes.filter(user => user !== username);
        const newDislikes = dislikes.filter(user => user !== username);
        
        // Adiciona o novo voto, se não for um toggle
        if (voteType === 'like' && !hasVotedLike) {
          newLikes.push(username);
        } else if (voteType === 'dislike' && !hasVotedDislike) {
          newDislikes.push(username);
        }
        
        // Atualiza o comentário
        const updatedComment = {
          ...comment,
          likes: newLikes,
          dislikes: newDislikes
        };
        
        // Atualiza o array de comentários
        const updatedComments = [...animeData.comments];
        updatedComments[index] = updatedComment;
        
        // Atualiza o documento
        transaction.update(animeRef, {
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        });
        
        // Retorna os dados atualizados
        return {
          id: commentId,
          animeTitle,
          comment: updatedComment
        };
      });
      
      // Após a transação bem-sucedida, atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      
      if (localComments[result.animeTitle]) {
        const commentIndex = localComments[result.animeTitle].findIndex(c => c.id === result.id);
        
        if (commentIndex !== -1) {
          // Atualiza o comentário no cache local
          localComments[result.animeTitle][commentIndex] = {
            ...localComments[result.animeTitle][commentIndex],
            likes: result.comment.likes,
            dislikes: result.comment.dislikes
          };
          
          // Salva o cache atualizado
          localStorage.setItem(this.localCommentsKey, JSON.stringify(localComments));
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao votar em comentário:', error);
      throw error;
    }
  }

  /**
   * Atualiza a média de avaliação de um anime com base nos comentários
   * @param {string} animeTitle - Título do anime
   * @returns {Promise<number>} - Nova média de avaliação
   */
  async updateAnimeAverageRating(animeTitle) {
    try {
      if (!animeTitle) throw new Error('Título do anime é obrigatório');
      
      // Busca o anime pelo título
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .where('primaryTitle', '==', animeTitle)
        .limit(1)
        .get();
      
      if (animesSnapshot.empty) throw new Error(`Anime não encontrado: ${animeTitle}`);
      
      // Obtém o documento do anime
      const animeDoc = animesSnapshot.docs[0];
      const animeData = animeDoc.data();
      
      // Calcula a média com base nos comentários do próprio documento
      const comments = animeData.comments || [];
      let totalRating = 0;
      let commentCount = 0;
      
      // Soma as avaliações válidas
      comments.forEach(comment => {
        if (typeof comment.rating === 'number') {
          totalRating += comment.rating;
          commentCount++;
        }
      });
      
      // Calcula a nova média
      const averageRating = commentCount > 0 ? totalRating / commentCount : 0;
      const formattedRating = parseFloat(averageRating.toFixed(1));
      
      // Atualiza a avaliação no documento
      await this.db.collection(this.animeCollection).doc(animeDoc.id).update({
        score: formattedRating,
        updatedAt: new Date().toISOString()
      });
      
      // Atualiza no cache local também
      const animes = this.getAnimesFromCache();
      const index = animes.findIndex(a => a.primaryTitle === animeTitle);
      if (index !== -1) {
        animes[index].score = formattedRating;
        localStorage.setItem(this.localStorageKey, JSON.stringify(animes));
      }
      
      return formattedRating;
    } catch (error) {
      console.error('Erro ao atualizar média de avaliação:', error);
      throw error;
    }
  }

  /**
   * Busca comentários mais recentes de todos os animes
   * @param {number} limit - Número máximo de comentários
   * @returns {Promise<Array>} - Comentários mais recentes
   */
  async getRecentComments(limit = 3) {
    try {
      // Busca animes com comentários
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .orderBy('updatedAt', 'desc')
        .limit(20) // Limita a busca inicial
        .get();
      
      let allComments = [];
      
      // Coleta comentários de cada anime
      animesSnapshot.forEach(doc => {
        const animeData = doc.data();
        const animeTitle = animeData.primaryTitle;
        
        if (animeData.comments && animeData.comments.length > 0) {
          // Adiciona ID do anime e título a cada comentário
          const animeComments = animeData.comments.map((comment, index) => ({
            id: `${doc.id}_comment_${index}`,
            animeTitle,
            ...comment
          }));
          
          allComments = [...allComments, ...animeComments];
        }
      });
      
      // Ordena todos os comentários por data (mais recentes primeiro)
      allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Retorna apenas os N comentários mais recentes
      return allComments.slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar comentários recentes:', error);
      
      // Fallback para dados em cache
      try {
        const cachedComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
        
        // Converte o formato de objeto para array
        let allComments = [];
        Object.entries(cachedComments).forEach(([animeTitle, comments]) => {
          comments.forEach(comment => {
            allComments.push({
              ...comment,
              animeTitle
            });
          });
        });
        
        // Ordena por data, mais recentes primeiro
        allComments.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        return allComments.slice(0, limit);
      } catch (fallbackError) {
        console.error('Erro no fallback para comentários recentes:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Obtém categorias populares
   * @param {number} limit - Número máximo de categorias
   * @returns {Promise<Array>} - Lista de categorias populares
   */
  async getPopularCategories(limit = 3) {
    try {
      const categoriesSnapshot = await this.db.collection('categories')
        .orderBy('animeCount', 'desc')
        .limit(limit)
        .get();
      
      const categories = [];
      categoriesSnapshot.forEach(doc => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias populares:', error);
      
      // Fallback: calcula categorias populares a partir dos animes em cache
      try {
        const animes = this.getAnimesFromCache();
        const categoryCounts = {};
        const categoryExamples = {};
        
        // Conta animes por categoria
        animes.forEach(anime => {
          if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
              // Normaliza o nome da categoria
              const normalizedGenre = genre.trim().toLowerCase();
              
              // Incrementa contador
              categoryCounts[normalizedGenre] = (categoryCounts[normalizedGenre] || 0) + 1;
              
              // Adiciona exemplo se ainda não tiver muitos
              if (!categoryExamples[normalizedGenre]) categoryExamples[normalizedGenre] = [];
              if (categoryExamples[normalizedGenre].length < 3) {
                categoryExamples[normalizedGenre].push(anime.primaryTitle);
              }
            });
          }
        });
        
        // Converte para array e ordena
        const sortedCategories = Object.entries(categoryCounts)
          .map(([name, animeCount]) => ({
            name,
            animeCount,
            examples: categoryExamples[name] || [],
            description: `Animes de ${name}`,
            icon: '📺' // Ícone padrão
          }))
          .sort((a, b) => b.animeCount - a.animeCount)
          .slice(0, limit);
        
        return sortedCategories;
      } catch (fallbackError) {
        console.error('Erro no fallback para categorias populares:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Obtém notícias recentes
   * @param {number} limit - Número máximo de notícias
   * @returns {Promise<Array>} - Lista de notícias recentes
   */
  async getRecentNews(limit = 4) {
    try {
      const newsSnapshot = await this.db.collection('news')
        .orderBy('date', 'desc')
        .limit(limit)
        .get();
      
      const news = [];
      newsSnapshot.forEach(doc => {
        news.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return news;
    } catch (error) {
      console.error('Erro ao buscar notícias recentes:', error);
      
      // Fallback para dados em cache
      try {
        const cachedNews = JSON.parse(localStorage.getItem('news') || '[]');
        return cachedNews
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit);
      } catch (fallbackError) {
        console.error('Erro no fallback para notícias recentes:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Conta o número de comentários de um anime específico
   * @param {string} animeTitle - Título do anime
   * @returns {Promise<number>} - Quantidade de comentários
   */
  async getCommentCount(animeTitle) {
    try {
      if (!animeTitle) return 0;
      
      // Busca o anime pelo título
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .where('primaryTitle', '==', animeTitle)
        .limit(1)
        .get();
      
      if (animesSnapshot.empty) return 0;
      
      // Obtém o documento do anime
      const animeData = animesSnapshot.docs[0].data();
      
      // Retorna o tamanho do array de comentários
      return animeData.comments?.length || 0;
    } catch (error) {
      console.error('Erro ao contar comentários:', error);
      
      // Fallback para contagem local
      const localComments = JSON.parse(localStorage.getItem(this.localCommentsKey) || '{}');
      return localComments[animeTitle]?.length || 0;
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.AnimeManager = AnimeManager;