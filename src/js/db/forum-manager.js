/**
 * Classe responsável por gerenciar dados do fórum no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD
 */
class ForumManager {
  constructor() {
    // Tenta usar o Firestore, com fallback para localStorage
    this.useLocalStorage = false;
    
    try {
      // Importa a referência do Firestore do arquivo de configuração
      this.db = db;
      // Define a coleção principal para o fórum
      this.forumCollection = this.db.collection('forum');
      console.log('ForumManager: Usando Firestore');
    } catch (error) {
      // Se Firestore não estiver disponível, usa localStorage
      console.warn('Firestore não disponível. Usando localStorage como fallback:', error);
      this.useLocalStorage = true;
      
      // Inicializa dados no localStorage se não existirem
      if (!localStorage.getItem('forum_topics')) localStorage.setItem('forum_topics', JSON.stringify([]));
      if (!localStorage.getItem('forumViews')) localStorage.setItem('forumViews', JSON.stringify({}));
    }
  }

  /**
   * Obtém todos os tópicos do fórum
   * @param {string} categoryId - Opcional: filtra por categoria
   * @returns {Promise<Array>} - Array de tópicos
   */
  async getAllTopics(categoryId = null) {
    if (this.useLocalStorage) {
      try {
        // Obter tópicos do localStorage
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        
        // Filtra por categoria se especificado
        const filteredTopics = categoryId 
          ? topics.filter(topic => topic.category === categoryId)
          : topics;
        
        // Ordenar por data (decrescente)
        return filteredTopics.sort((a, b) => {
          const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
          const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime();
          return dateB - dateA;
        });
      } catch (error) {
        console.error('Erro ao obter tópicos do localStorage:', error);
        return [];
      }
    }
    
    try {
      let query = this.forumCollection.orderBy('date', 'desc');
      
      if (categoryId) query = query.where('category', '==', categoryId);
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('Nenhum tópico encontrado');
        return [];
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao obter tópicos:', error);
      throw new Error('Não foi possível carregar os tópicos. Verifique sua conexão.');
    }
  }

  /**
   * Obtém um tópico específico pelo ID
   * @param {string} topicId - ID do tópico
   * @returns {Promise<Object>} - Dados do tópico
   */
  async getTopicById(topicId) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topic = topics.find(t => t.id === topicId);
        
        if (!topic) throw new Error('Tópico não encontrado');
        
        return topic;
      } catch (error) {
        console.error('Erro ao obter tópico do localStorage:', error);
        throw error;
      }
    }
    
    try {
      const docRef = this.forumCollection.doc(topicId);
      const doc = await docRef.get();
      
      if (!doc.exists) throw new Error('Tópico não encontrado');
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Erro ao obter tópico:', error);
      throw error;
    }
  }

  /**
   * Cria um novo tópico no fórum
   * @param {Object} topicData - Dados do tópico
   * @returns {Promise<string>} - ID do tópico criado
   */
  async createTopic(topicData) {
    if (this.useLocalStorage) {
      try {
        // Verifica limite de tópicos por usuário
        const userTopicsCount = await this.getUserTopicsCount(topicData.author);
        if (userTopicsCount >= FORUM_CONFIG.maxTopicsPerUser) throw new Error(`Você atingiu o limite de ${FORUM_CONFIG.maxTopicsPerUser} tópicos.`);
        
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        
        // Cria um novo ID único
        const topicId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        // Prepara o objeto do tópico
        const newTopic = {
          id: topicId,
          ...topicData,
          date: { 
            // Simula o formato do Firestore Timestamp
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          },
          likes: 0,
          views: 0,
          likedBy: [],
          replies: []
        };
        
        // Adiciona ao array e salva no localStorage
        topics.push(newTopic);
        localStorage.setItem('forum_topics', JSON.stringify(topics));
        
        return topicId;
      } catch (error) {
        console.error('Erro ao criar tópico no localStorage:', error);
        throw error;
      }
    }
    
    try {
      // Verifica limite de tópicos por usuário
      const userTopicsCount = await this.getUserTopicsCount(topicData.author);
      if (userTopicsCount >= FORUM_CONFIG.maxTopicsPerUser) throw new Error(`Você atingiu o limite de ${FORUM_CONFIG.maxTopicsPerUser} tópicos.`);
      
      // Adiciona campos importantes
      const newTopic = {
        ...topicData,
        date: firebase.firestore.Timestamp.now(),
        likes: 0,
        views: 0,
        likedBy: [],
        replies: []
      };
      
      const docRef = await this.forumCollection.add(newTopic);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      throw error;
    }
  }

  /**
   * Obtém a contagem de tópicos de um usuário
   * @param {string} username - Nome do usuário
   * @returns {Promise<number>} - Número de tópicos
   */
  async getUserTopicsCount(username) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        return topics.filter(topic => topic.author === username).length;
      } catch (error) {
        console.error('Erro ao contar tópicos do usuário no localStorage:', error);
        return 0;
      }
    }
    
    try {
      const snapshot = await this.forumCollection
        .where('author', '==', username)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao contar tópicos do usuário:', error);
      return 0;
    }
  }

  /**
   * Atualiza um tópico existente
   * @param {string} topicId - ID do tópico
   * @param {Object} topicData - Dados atualizados
   * @returns {Promise<void>}
   */
  async updateTopic(topicId, topicData) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        // Adiciona timestamp de edição
        const updatedData = {
          ...topicData,
          editedAt: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          }
        };
        
        // Atualiza o tópico mantendo os outros campos
        topics[topicIndex] = {
          ...topics[topicIndex],
          ...updatedData
        };
        
        localStorage.setItem('forum_topics', JSON.stringify(topics));
      } catch (error) {
        console.error('Erro ao atualizar tópico no localStorage:', error);
        throw error;
      }
      return;
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      const topicDoc = await topicRef.get();
      
      if (!topicDoc.exists) throw new Error('Tópico não encontrado');
      
      // Adiciona timestamp de edição
      const updatedData = {
        ...topicData,
        editedAt: firebase.firestore.Timestamp.now()
      };
      
      await topicRef.update(updatedData);
    } catch (error) {
      console.error('Erro ao atualizar tópico:', error);
      throw error;
    }
  }

  /**
   * Remove um tópico
   * @param {string} topicId - ID do tópico
   * @returns {Promise<void>}
   */
  async deleteTopic(topicId) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const filteredTopics = topics.filter(t => t.id !== topicId);
        
        if (topics.length === filteredTopics.length) throw new Error('Tópico não encontrado');
        
        localStorage.setItem('forum_topics', JSON.stringify(filteredTopics));
      } catch (error) {
        console.error('Erro ao excluir tópico do localStorage:', error);
        throw error;
      }
      return;
    }
    
    try {
      await this.forumCollection.doc(topicId).delete();
    } catch (error) {
      console.error('Erro ao excluir tópico:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma resposta a um tópico
   * @param {string} topicId - ID do tópico
   * @param {Object} replyData - Dados da resposta
   * @returns {Promise<string>} - ID da resposta criada
   */
  async addReply(topicId, replyData) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        // Cria um ID único para a resposta
        const replyId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        const newReply = {
          id: replyId,
          ...replyData,
          date: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          },
          likes: 0,
          likedBy: []
        };
        
        // Adiciona a resposta ao tópico
        const replies = topics[topicIndex].replies || [];
        replies.push(newReply);
        topics[topicIndex].replies = replies;
        
        localStorage.setItem('forum_topics', JSON.stringify(topics));
        
        return replyId;
      } catch (error) {
        console.error('Erro ao adicionar resposta no localStorage:', error);
        throw error;
      }
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      const topicDoc = await topicRef.get();
      
      if (!topicDoc.exists) throw new Error('Tópico não encontrado');
      
      const topic = topicDoc.data();
      const replies = topic.replies || [];
      
      // Cria um ID único para a resposta
      const replyId = Date.now().toString();
      const newReply = {
        id: replyId,
        ...replyData,
        date: firebase.firestore.Timestamp.now(),
        likes: 0,
        likedBy: []
      };
      
      // Adiciona a nova resposta ao array
      replies.push(newReply);
      
      // Atualiza o documento no Firestore
      await topicRef.update({ replies });
      
      return replyId;
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma resposta existente
   * @param {string} topicId - ID do tópico
   * @param {string} replyId - ID da resposta
   * @param {Object} replyData - Dados atualizados
   * @returns {Promise<void>}
   */
  async updateReply(topicId, replyId, replyData) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        const replies = topics[topicIndex].replies || [];
        const replyIndex = replies.findIndex(r => r.id === replyId);
        
        if (replyIndex === -1) throw new Error('Resposta não encontrada');
        
        // Atualiza a resposta com os novos dados
        replies[replyIndex] = {
          ...replies[replyIndex],
          ...replyData,
          editedAt: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          }
        };
        
        topics[topicIndex].replies = replies;
        localStorage.setItem('forum_topics', JSON.stringify(topics));
      } catch (error) {
        console.error('Erro ao atualizar resposta no localStorage:', error);
        throw error;
      }
      return;
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      const topicDoc = await topicRef.get();
      
      if (!topicDoc.exists) throw new Error('Tópico não encontrado');
      
      const topic = topicDoc.data();
      let replies = topic.replies || [];
      
      // Encontra o índice da resposta
      const replyIndex = replies.findIndex(r => r.id === replyId);
      if (replyIndex === -1) throw new Error('Resposta não encontrada');
      
      // Atualiza a resposta com os novos dados e timestamp de edição
      replies[replyIndex] = {
        ...replies[replyIndex],
        ...replyData,
        editedAt: firebase.firestore.Timestamp.now()
      };
      
      // Atualiza o documento no Firestore
      await topicRef.update({ replies });
    } catch (error) {
      console.error('Erro ao atualizar resposta:', error);
      throw error;
    }
  }

  /**
   * Remove uma resposta
   * @param {string} topicId - ID do tópico
   * @param {string} replyId - ID da resposta
   * @returns {Promise<void>}
   */
  async deleteReply(topicId, replyId) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        const replies = topics[topicIndex].replies || [];
        
        // Filtra para remover a resposta
        const updatedReplies = replies.filter(r => r.id !== replyId);
        
        if (replies.length === updatedReplies.length) throw new Error('Resposta não encontrada');
        
        topics[topicIndex].replies = updatedReplies;
        localStorage.setItem('forum_topics', JSON.stringify(topics));
      } catch (error) {
        console.error('Erro ao excluir resposta do localStorage:', error);
        throw error;
      }
      return;
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      const topicDoc = await topicRef.get();
      
      if (!topicDoc.exists) throw new Error('Tópico não encontrado');
      
      const topic = topicDoc.data();
      const replies = topic.replies || [];
      
      // Filtra para remover a resposta
      const updatedReplies = replies.filter(r => r.id !== replyId);
      
      // Atualiza o documento no Firestore
      await topicRef.update({ replies: updatedReplies });
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      throw error;
    }
  }

  /**
   * Gerencia o like em um tópico (adiciona ou remove)
   * @param {string} topicId - ID do tópico
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} - true se adicionou like, false se removeu
   */
  async likeTopic(topicId, userId) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        const topic = topics[topicIndex];
        const likedBy = topic.likedBy || [];
        const likes = topic.likes || 0;
        
        // Verifica se o usuário já deu like
        const alreadyLiked = likedBy.includes(userId);
        
        if (alreadyLiked) {
          // Remove o like
          topics[topicIndex].likes = likes - 1;
          topics[topicIndex].likedBy = likedBy.filter(id => id !== userId);
          localStorage.setItem('forum_topics', JSON.stringify(topics));
          return false;
        } else {
          // Adiciona o like
          topics[topicIndex].likes = likes + 1;
          topics[topicIndex].likedBy = [...likedBy, userId];
          localStorage.setItem('forum_topics', JSON.stringify(topics));
          return true;
        }
      } catch (error) {
        console.error('Erro ao gerenciar like do tópico no localStorage:', error);
        throw error;
      }
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      
      // Usa transação para garantir operação atômica
      return await this.db.runTransaction(async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        
        if (!topicDoc.exists) throw new Error('Tópico não encontrado');
        
        const topic = topicDoc.data();
        const likedBy = topic.likedBy || [];
        const likes = topic.likes || 0;
        
        // Verifica se o usuário já deu like
        const alreadyLiked = likedBy.includes(userId);
        
        if (alreadyLiked) {
          // Remove o like
          transaction.update(topicRef, {
            likes: likes - 1,
            likedBy: firebase.firestore.FieldValue.arrayRemove(userId)
          });
          return false;
        } else {
          // Adiciona o like
          transaction.update(topicRef, {
            likes: likes + 1,
            likedBy: firebase.firestore.FieldValue.arrayUnion(userId)
          });
          return true;
        }
      });
    } catch (error) {
      console.error('Erro ao gerenciar like do tópico:', error);
      throw error;
    }
  }

  /**
   * Gerencia o like em uma resposta (adiciona ou remove)
   * @param {string} topicId - ID do tópico
   * @param {string} replyId - ID da resposta
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} - true se adicionou like, false se removeu
   */
  async likeReply(topicId, replyId, userId) {
    if (this.useLocalStorage) {
      try {
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) throw new Error('Tópico não encontrado');
        
        const topic = topics[topicIndex];
        const replies = topic.replies || [];
        
        // Encontra o índice da resposta
        const replyIndex = replies.findIndex(r => r.id === replyId);
        if (replyIndex === -1) throw new Error('Resposta não encontrada');
        
        const reply = replies[replyIndex];
        const likedBy = reply.likedBy || [];
        const likes = reply.likes || 0;
        
        // Verifica se o usuário já deu like
        const alreadyLiked = likedBy.includes(userId);
        
        if (alreadyLiked) {
          // Remove o like
          replies[replyIndex].likes = likes - 1;
          replies[replyIndex].likedBy = likedBy.filter(id => id !== userId);
          topics[topicIndex].replies = replies;
          localStorage.setItem('forum_topics', JSON.stringify(topics));
          return false;
        } else {
          // Adiciona o like
          replies[replyIndex].likes = likes + 1;
          replies[replyIndex].likedBy = [...likedBy, userId];
          topics[topicIndex].replies = replies;
          localStorage.setItem('forum_topics', JSON.stringify(topics));
          return true;
        }
      } catch (error) {
        console.error('Erro ao gerenciar like da resposta no localStorage:', error);
        throw error;
      }
    }
    
    try {
      const topicRef = this.forumCollection.doc(topicId);
      
      // Usa transação para garantir operação atômica
      return await this.db.runTransaction(async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        
        if (!topicDoc.exists) throw new Error('Tópico não encontrado');
        
        const topic = topicDoc.data();
        const replies = topic.replies || [];
        
        // Encontra o índice da resposta
        const replyIndex = replies.findIndex(r => r.id === replyId);
        if (replyIndex === -1) throw new Error('Resposta não encontrada');
        
        const reply = replies[replyIndex];
        const likedBy = reply.likedBy || [];
        const likes = reply.likes || 0;
        
        // Cria uma cópia atualizada das respostas
        const updatedReplies = [...replies];
        
        // Verifica se o usuário já deu like
        const alreadyLiked = likedBy.includes(userId);
        
        if (alreadyLiked) {
          // Remove o like
          updatedReplies[replyIndex] = {
            ...reply,
            likes: likes - 1,
            likedBy: likedBy.filter(id => id !== userId)
          };
          transaction.update(topicRef, { replies: updatedReplies });
          return false;
        } else {
          // Adiciona o like
          updatedReplies[replyIndex] = {
            ...reply,
            likes: likes + 1,
            likedBy: [...likedBy, userId]
          };
          transaction.update(topicRef, { replies: updatedReplies });
          return true;
        }
      });
    } catch (error) {
      console.error('Erro ao gerenciar like da resposta:', error);
      throw error;
    }
  }

  /**
   * Incrementa a contagem de visualizações de um tópico
   * @param {string} topicId - ID do tópico
   * @param {string} userId - ID do usuário (para controle de visualizações únicas)
   * @returns {Promise<boolean>} - true se a visualização foi contabilizada
   */
  async incrementTopicView(topicId, userId) {
    if (this.useLocalStorage) {
      try {
        // Obtém ou inicializa o registro de visualizações
        const viewsData = JSON.parse(localStorage.getItem('forumViews') || '{}');
        const viewId = `${userId}_${topicId}`;
        
        const now = new Date();
        const lastViewTimestamp = viewsData[viewId];
        
        // Verifica se já visualizou recentemente (1 hora)
        if (lastViewTimestamp) {
          const lastViewDate = new Date(lastViewTimestamp);
          if ((now - lastViewDate) < 3600000) return false; // Não incrementa
        }
        
        // Atualiza o registro de visualização
        viewsData[viewId] = now.toISOString();
        localStorage.setItem('forumViews', JSON.stringify(viewsData));
        
        // Incrementa a contagem de visualizações
        const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
        const topicIndex = topics.findIndex(t => t.id === topicId);
        
        if (topicIndex === -1) return false;
        
        topics[topicIndex].views = (topics[topicIndex].views || 0) + 1;
        localStorage.setItem('forum_topics', JSON.stringify(topics));
        
        return true;
      } catch (error) {
        console.error('Erro ao incrementar visualização no localStorage:', error);
        return false;
      }
    }
    
    try {
      // Define uma coleção para rastrear visualizações
      const viewsCollection = this.db.collection('forumViews');
      const viewId = `${userId}_${topicId}`;
      const viewRef = viewsCollection.doc(viewId);
      
      // Verifica se o usuário já visualizou recentemente
      const viewDoc = await viewRef.get();
      const now = new Date();
      
      if (viewDoc.exists) {
        const lastView = viewDoc.data().timestamp.toDate();
        // Verifica se já se passou 1 hora desde a última visualização
        if ((now - lastView) < 3600000) return false; // Não incrementa a visualização
      }
      
      // Atualiza o registro de visualização
      await viewRef.set({
        userId,
        topicId,
        timestamp: firebase.firestore.Timestamp.now()
      });
      
      // Incrementa a contagem de visualizações do tópico
      await this.forumCollection.doc(topicId).update({
        views: firebase.firestore.FieldValue.increment(1)
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao incrementar visualização:', error);
      return false;
    }
  }
}

// Exporta a classe ForumManager para uso em outros módulos
window.ForumManager = ForumManager;