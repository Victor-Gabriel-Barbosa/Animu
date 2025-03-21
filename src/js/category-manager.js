/**
 * CategoryManager
 * Classe responsável por gerenciar dados de categorias no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD.
 */
class CategoryManager {
  constructor() {
    // Referência à coleção 'categories' no Firestore
    this.categoriesRef = db.collection('categories');
    this.categoriesDoc = this.categoriesRef.doc('categoriesList');
    this.isInitialized = false;
  }

  // Inicializa o manager, verificando conexão com Firebase
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Verifica se o Firebase está disponível
      if (!firebase || !firebase.firestore) {
        console.error('Firebase não está inicializado corretamente');
        return false;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar CategoryManager:', error);
      return false;
    }
  }

  // Carrega categorias do Firebase
  async loadCategories() {
    try {
      await this.initialize();
      console.log('Carregando categorias do Firestore...');
      
      const snapshot = await this.categoriesDoc.get();
      
      if (snapshot.exists && snapshot.data() && snapshot.data().items) {
        const categoriesData = snapshot.data().items;
        console.log('Categorias carregadas do Firestore:', categoriesData.length);
        
        // Salva no localStorage para acesso offline
        localStorage.setItem('animuCategories', JSON.stringify(categoriesData));
        
        return {
          success: true,
          data: categoriesData,
          message: `${categoriesData.length} categorias carregadas com sucesso`
        };
      } else {
        console.log('Nenhuma categoria encontrada no Firestore');
        return {
          success: false,
          data: [],
          message: 'Nenhuma categoria encontrada no Firestore'
        };
      }
    } catch (error) {
      console.error('Erro ao carregar categorias do Firestore:', error);
      return {
        success: false,
        error,
        message: `Erro ao carregar categorias: ${error.message}`
      };
    }
  }

  // Salva categorias no Firestore
  async saveCategories(categories) {
    try {
      await this.initialize();
      
      if (!categories || categories.length === 0) {
        console.warn('Nenhuma categoria para salvar no Firestore');
        return {
          success: false,
          message: 'Nenhuma categoria para salvar'
        };
      }
      
      await this.categoriesDoc.set({
        items: categories,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Categorias salvas no Firestore com sucesso:', categories.length);
      
      return {
        success: true,
        message: `${categories.length} categorias salvas com sucesso`
      };
    } catch (error) {
      console.error('Erro ao salvar categorias no Firestore:', error);
      return {
        success: false,
        error,
        message: `Erro ao salvar categorias: ${error.message}`
      };
    }
  }

  // Sincroniza as categorias locais com o Firestore
  async syncCategories() {
    try {
      await this.initialize();
      
      // Primeiro tenta carregar do Firestore
      const remoteResult = await this.loadCategories();
      
      // Se não existirem categorias remotas, verifica o localStorage
      if (!remoteResult.success || remoteResult.data.length === 0) {
        const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
        
        if (localCategories.length > 0) {
          console.log('Usando categorias locais para sincronizar com Firestore');
          
          // Salva as categorias locais no Firestore
          return await this.saveCategories(localCategories);
        } else {
          return {
            success: false,
            message: 'Nenhuma categoria encontrada local ou remotamente'
          };
        }
      }
      
      return remoteResult;
    } catch (error) {
      console.error('Erro ao sincronizar categorias:', error);
      return {
        success: false,
        error,
        message: `Erro na sincronização: ${error.message}`
      };
    }
  }

  // Adiciona uma nova categoria
  async addCategory(categoryData) {
    try {
      await this.initialize();
      
      // Carrega categorias atuais
      const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
      
      // Verifica se já existe categoria com mesmo nome
      if (localCategories.some(cat => cat.name.toLowerCase() === categoryData.name.toLowerCase())) {
        return {
          success: false,
          message: 'Já existe uma categoria com este nome'
        };
      }
      
      // Adiciona a nova categoria
      const updatedCategories = [...localCategories, categoryData];
      
      // Salva localmente
      localStorage.setItem('animuCategories', JSON.stringify(updatedCategories));
      
      // Salva no Firestore
      const result = await this.saveCategories(updatedCategories);
      
      return {
        ...result,
        data: categoryData
      };
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      return {
        success: false,
        error,
        message: `Erro ao adicionar categoria: ${error.message}`
      };
    }
  }

  // Atualiza uma categoria existente
  async updateCategory(categoryData) {
    try {
      await this.initialize();
      
      // Carrega categorias atuais
      const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
      
      // Verifica se existe outra categoria com o mesmo nome (exceto a própria)
      if (localCategories.some(cat => 
        cat.id !== categoryData.id && 
        cat.name.toLowerCase() === categoryData.name.toLowerCase()
      )) {
        return {
          success: false,
          message: 'Já existe uma categoria com este nome'
        };
      }
      
      // Atualiza a categoria
      const updatedCategories = localCategories.map(cat => 
        cat.id === categoryData.id ? categoryData : cat
      );
      
      // Salva localmente
      localStorage.setItem('animuCategories', JSON.stringify(updatedCategories));
      
      // Salva no Firestore
      const result = await this.saveCategories(updatedCategories);
      
      return {
        ...result,
        data: categoryData
      };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return {
        success: false,
        error,
        message: `Erro ao atualizar categoria: ${error.message}`
      };
    }
  }

  // Remove uma categoria
  async deleteCategory(categoryId) {
    try {
      await this.initialize();
      
      // Carrega categorias atuais
      const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
      
      // Remove a categoria
      const updatedCategories = localCategories.filter(cat => cat.id !== categoryId);
      
      // Salva localmente
      localStorage.setItem('animuCategories', JSON.stringify(updatedCategories));
      
      // Salva no Firestore
      const result = await this.saveCategories(updatedCategories);
      
      return {
        ...result,
        deletedId: categoryId
      };
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return {
        success: false,
        error,
        message: `Erro ao excluir categoria: ${error.message}`
      };
    }
  }

  // Obtém estatísticas sobre as categorias
  async getCategoryStats() {
    try {
      await this.initialize();
      
      // Carrega categorias atuais
      const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
      
      const mainCategories = localCategories.filter(cat => !cat.isSubcategory).length;
      const subCategories = localCategories.filter(cat => cat.isSubcategory).length;
      
      return {
        success: true,
        stats: {
          total: localCategories.length,
          main: mainCategories,
          sub: subCategories
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de categorias:', error);
      return {
        success: false,
        error,
        message: `Erro ao obter estatísticas: ${error.message}`
      };
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.CategoryManager = CategoryManager;
