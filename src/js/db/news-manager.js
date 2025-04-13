/**
 * Classe responsável por gerenciar dados de notícias no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD
 */
class NewsManager {
  constructor() {
    // Verifica se o Firebase está inicializado
    if (!firebase || !firebase.firestore) {
      console.error('Firebase não está disponível. Verifique a importação.');
      return;
    }

    // Inicializa a referência à coleção de notícias
    this.newsCollection = firebase.firestore().collection('news');
    
    // Flag para indicar uso de armazenamento local (fallback)
    this.useLocalStorage = false;
  }

  /**
   * Carrega todas as notícias ordenadas por data (decrescente)
   * @returns {Promise<Array>} Lista de notícias
   */
  async getAllNews() {
    try {
      if (this.useLocalStorage) return this.getNewsFromLocalStorage();
      
      const snapshot = await this.newsCollection.orderBy('date', 'desc').get();
      const news = [];
      
      snapshot.forEach(doc => {
        news.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return news;
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      // Tenta usar localStorage como fallback
      if (!this.useLocalStorage) {
        this.useLocalStorage = true;
        return this.getNewsFromLocalStorage();
      }
      throw error;
    }
  }

  /**
   * Obtém notícia específica pelo ID
   * @param {string} id - ID da notícia
   * @returns {Promise<Object|null>} Dados da notícia ou null se não encontrada
   */
  async getNewsById(id) {
    try {
      if (this.useLocalStorage) {
        const allNews = this.getNewsFromLocalStorage();
        return allNews.find(news => news.id === id) || null;
      }
      
      const doc = await this.newsCollection.doc(id).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar notícia:', error);
      throw error;
    }
  }

  /**
   * Salva notícia (cria nova ou atualiza existente)
   * @param {Object} newsData - Dados da notícia
   * @param {string|null} id - ID da notícia (null para nova notícia)
   * @returns {Promise<string>} ID da notícia salva
   */
  async saveNews(newsData, id = null) {
    try {
      // Adiciona timestamps de atualização
      const dataToSave = {
        ...newsData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      if (this.useLocalStorage) return this.saveNewsToLocalStorage(dataToSave, id);
      
      if (id) {
        // Atualiza notícia existente
        await this.newsCollection.doc(id).update(dataToSave);
        console.log('Notícia atualizada com sucesso!');
        return id;
      } else {
        // Cria nova notícia
        dataToSave.date = new Date().toISOString();
        dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        const docRef = await this.newsCollection.add(dataToSave);
        console.log('Notícia criada com sucesso!');
        return docRef.id;
      }
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      
      // Fallback para localStorage em caso de erro
      if (!this.useLocalStorage) {
        this.useLocalStorage = true;
        return this.saveNewsToLocalStorage(newsData, id);
      }
      
      throw error;
    }
  }

  /**
   * Exclui notícia pelo ID
   * @param {string} id - ID da notícia a ser excluída
   * @returns {Promise<boolean>} true se sucesso, false caso contrário
   */
  async deleteNews(id) {
    try {
      if (this.useLocalStorage) return this.deleteNewsFromLocalStorage(id);
      
      await this.newsCollection.doc(id).delete();
      console.log('Notícia excluída com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      
      // Fallback para localStorage
      if (!this.useLocalStorage) {
        this.useLocalStorage = true;
        return this.deleteNewsFromLocalStorage(id);
      }
      
      throw error;
    }
  }

  /**
   * Obtém notícias armazenadas no localStorage
   * @returns {Array} Lista de notícias
   */
  getNewsFromLocalStorage() {
    try {
      const newsData = localStorage.getItem('animu_news');
      return newsData ? JSON.parse(newsData) : [];
    } catch (e) {
      console.error('Erro ao ler notícias do localStorage:', e);
      return [];
    }
  }

  /**
   * Salva notícia no localStorage
   * @param {Object} newsData - Dados da notícia
   * @param {string|null} id - ID da notícia (null para nova)
   * @returns {string} ID da notícia salva
   */
  saveNewsToLocalStorage(newsData, id = null) {
    try {
      let allNews = this.getNewsFromLocalStorage();
      
      if (id) {
        // Atualiza notícia existente
        const index = allNews.findIndex(news => news.id === id);
        if (index !== -1) allNews[index] = { ...allNews[index], ...newsData, id };
      } else {
        // Cria nova notícia
        const newId = 'local_' + Date.now();
        const newNews = {
          ...newsData,
          id: newId,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        allNews.unshift(newNews); // Adiciona no início
        id = newId;
      }
      
      // Salva no localStorage
      localStorage.setItem('animu_news', JSON.stringify(allNews));
      return id;
    } catch (e) {
      console.error('Erro ao salvar notícia no localStorage:', e);
      throw e;
    }
  }

  /**
   * Exclui notícia do localStorage
   * @param {string} id - ID da notícia
   * @returns {boolean} true se sucesso
   */
  deleteNewsFromLocalStorage(id) {
    try {
      let allNews = this.getNewsFromLocalStorage();
      const filteredNews = allNews.filter(news => news.id !== id);
      
      localStorage.setItem('animu_news', JSON.stringify(filteredNews));
      return true;
    } catch (e) {
      console.error('Erro ao excluir notícia do localStorage:', e);
      throw e;
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.NewsManager = NewsManager;