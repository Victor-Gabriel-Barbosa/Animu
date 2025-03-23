/**
 * Classe responsável por gerenciar dados de animes no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD
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
      
      const commentsSnapshot = await this.db.collection(this.commentsCollection)
        .where('animeTitle', '==', animeTitle)
        .orderBy('timestamp', 'desc')
        .get();
      
      const comments = [];
      commentsSnapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      localComments[animeTitle] = comments;
      localStorage.setItem('animeComments', JSON.stringify(localComments));
      
      return comments;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      
      // Fallback para dados em cache
      const cachedComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
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
      
      const now = new Date().toISOString();
      const comment = {
        animeTitle,
        text: commentData.text,
        rating: commentData.rating || 0,
        username: commentData.username,
        timestamp: now,
        likes: [],
        dislikes: []
      };
      
      // Adiciona ao Firestore
      const docRef = await this.db.collection(this.commentsCollection).add(comment);
      
      // Atualiza o cache local
      const savedComment = {
        id: docRef.id,
        ...comment
      };
      
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      if (!localComments[animeTitle]) localComments[animeTitle] = [];
      localComments[animeTitle].unshift(savedComment);
      localStorage.setItem('animeComments', JSON.stringify(localComments));
      
      // Atualiza a média de avaliação do anime
      await this.updateAnimeAverageRating(animeTitle);
      
      return savedComment;
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
      
      const commentRef = this.db.collection(this.commentsCollection).doc(commentId);
      const doc = await commentRef.get();
      
      if (!doc.exists) throw new Error('Comentário não encontrado');
      
      const existingData = doc.data();
      const animeTitle = existingData.animeTitle;
      
      const updatedData = {
        ...commentData,
        edited: true,
        editedAt: new Date().toISOString()
      };
      
      // Atualiza no Firestore
      await commentRef.update(updatedData);
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      if (localComments[animeTitle]) {
        const index = localComments[animeTitle].findIndex(c => c.id === commentId);
        if (index !== -1) {
          localComments[animeTitle][index] = {
            ...localComments[animeTitle][index],
            ...updatedData
          };
          localStorage.setItem('animeComments', JSON.stringify(localComments));
        }
      }
      
      // Atualiza a média de avaliação do anime
      await this.updateAnimeAverageRating(animeTitle);
      
      return {
        id: commentId,
        ...existingData,
        ...updatedData
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
      
      // Obtém os dados do comentário antes de excluí-lo
      const commentRef = this.db.collection(this.commentsCollection).doc(commentId);
      const doc = await commentRef.get();
      
      if (!doc.exists) throw new Error('Comentário não encontrado');
      
      const commentData = doc.data();
      const animeTitle = commentData.animeTitle;
      
      // Exclui do Firestore
      await commentRef.delete();
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      if (localComments[animeTitle]) {
        localComments[animeTitle] = localComments[animeTitle].filter(c => c.id !== commentId);
        localStorage.setItem('animeComments', JSON.stringify(localComments));
      }
      
      // Atualiza a média de avaliação do anime
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
      
      // Usa uma transação para garantir consistência
      const result = await this.db.runTransaction(async (transaction) => {
        const commentRef = this.db.collection(this.commentsCollection).doc(commentId);
        const doc = await transaction.get(commentRef);
        
        if (!doc.exists) throw new Error('Comentário não encontrado');
        
        const commentData = doc.data();
        const animeTitle = commentData.animeTitle;
        
        // Inicializa arrays se não existirem
        const likes = commentData.likes || [];
        const dislikes = commentData.dislikes || [];
        
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
        
        // Atualiza no Firestore
        transaction.update(commentRef, {
          likes: newLikes,
          dislikes: newDislikes
        });
        
        // Prepara o objeto atualizado para o cache
        const updatedComment = {
          ...commentData,
          likes: newLikes,
          dislikes: newDislikes
        };
        
        // Retorna os dados atualizados e o título do anime
        return {
          comment: updatedComment,
          animeTitle
        };
      });
      
      // Atualiza o cache local
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      if (localComments[result.animeTitle]) {
        const index = localComments[result.animeTitle].findIndex(c => c.id === commentId);
        if (index !== -1) {
          localComments[result.animeTitle][index] = {
            id: commentId,
            ...result.comment
          };
          localStorage.setItem('animeComments', JSON.stringify(localComments));
        }
      }
      
      return {
        id: commentId,
        ...result.comment
      };
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
      
      // Busca todos os comentários do anime para calcular a média
      const commentsSnapshot = await this.db.collection(this.commentsCollection)
        .where('animeTitle', '==', animeTitle)
        .get();
      
      let totalRating = 0;
      let commentCount = 0;
      
      commentsSnapshot.forEach(doc => {
        const comment = doc.data();
        if (typeof comment.rating === 'number') {
          totalRating += comment.rating;
          commentCount++;
        }
      });
      
      // Calcula a nova média
      const averageRating = commentCount > 0 ? totalRating / commentCount : 0;
      const formattedRating = parseFloat(averageRating.toFixed(1));
      
      // Busca o anime pelo título para atualizar sua avaliação
      const animesSnapshot = await this.db.collection(this.animeCollection)
        .where('primaryTitle', '==', animeTitle)
        .limit(1)
        .get();
      
      if (!animesSnapshot.empty) {
        const animeDoc = animesSnapshot.docs[0];
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
      const commentsSnapshot = await this.db.collection(this.commentsCollection)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const comments = [];
      commentsSnapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return comments;
    } catch (error) {
      console.error('Erro ao buscar comentários recentes:', error);
      
      // Fallback para dados em cache
      try {
        const cachedComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
        
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
      
      // Busca usando consulta no Firestore
      const snapshot = await this.db.collection(this.commentsCollection)
        .where('animeTitle', '==', animeTitle)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao contar comentários:', error);
      
      // Fallback para contagem local
      const localComments = JSON.parse(localStorage.getItem('animeComments') || '{}');
      return localComments[animeTitle]?.length || 0;
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.AnimeManager = AnimeManager;