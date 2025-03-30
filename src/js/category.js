// Classe para gerenciamento das categorias
class CategoryDisplay { 
  constructor() {
    this.mainContainer = document.getElementById('main-categories');
    this.subContainer = document.getElementById('subcategories');
    this.categoryManager = new CategoryManager(); 
    this.initialize();
    
    // Recarrega categorias quando houver atualizações
    window.addEventListener('categoriesUpdated', () => this.renderCategories());
  }

  async initialize() {
    try {
      // Inicializa o CategoryManager e carrega categorias
      await this.loadCategories();
    } catch (error) {
      console.error('Erro ao inicializar categorias:', error);
      // Em caso de erro, tenta renderizar com dados do localStorage
      this.renderCategories();
    }
    
    this.setupEventListeners();
  }

  // Função para carregar categorias usando CategoryManager
  async loadCategories() {
    try {
      console.log('Carregando categorias usando CategoryManager...');
      
      // Primeiro tenta sincronizar categorias (local com remoto)
      const syncResult = await this.categoryManager.syncCategories();
      
      if (syncResult.success) {
        console.log('Categorias sincronizadas com sucesso');
        this.renderCategories();
        return;
      }
      
      // Se a sincronização falhar, tenta carregar diretamente
      const result = await this.categoryManager.loadCategories();
      
      if (result.success) {
        console.log('Categorias carregadas com sucesso:', result.data.length);
        this.renderCategories();
      } else {
        console.warn('Falha ao carregar categorias:', result.message);
        this.renderCategories(); // Carrega o que estiver no localStorage como fallback
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error; // Propaga o erro para ser tratado no initialize()
    }
  }

  getCategories() {
    // Obtém categorias do localStorage (CategoryManager já armazena lá)
    const savedCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
    
    // Inicializa com categorias padrão se não houver dados salvos
    if (savedCategories.length === 0) {
      const defaultCategories = [
        {
          id: 1,
          name: 'Ação',
          icon: '⚔️',
          description: 'Combates épicos e adrenalina pura',
          isSubcategory: false,
          gradient: {
            start: '#FF6B6B',
            end: '#FF8E8E'
          }
        },
        {
          id: 2,
          name: 'Drama',
          icon: '🎭',
          description: 'Histórias emocionantes e profundas',
          isSubcategory: false,
          gradient: {
            start: '#4ECDC4',
            end: '#45B7AF'
          }
        }
      ];
      
      // Salva localmente as categorias padrão
      localStorage.setItem('animuCategories', JSON.stringify(defaultCategories));
      
      // Também salva no Firestore através do CategoryManager
      this.categoryManager.saveCategories(defaultCategories).catch(err => console.error('Erro ao salvar categorias padrão:', err));
        
      return defaultCategories;
    }
    
    return savedCategories;
  }

  renderCategories() {
    const categories = this.getCategories();
    
    // Renderiza categorias principais
    if (this.mainContainer && categories.length > 0) {
      this.mainContainer.innerHTML = categories
        .filter(cat => !cat.isSubcategory)
        .map(category => this.createCategoryCard(category))
        .join('');
    }

    // Renderiza subcategorias
    if (this.subContainer && categories.length > 0) {
      this.subContainer.innerHTML = categories
        .filter(cat => cat.isSubcategory)
        .map(category => this.createSubcategoryTag(category))
        .join('');
    }

    // Exibe mensagem quando não há categorias
    if (categories.length === 0) {
      this.mainContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-xl text-gray-500">Nenhuma categoria encontrada.</p>
        </div>
      `;
    }
  }

  // Gera card HTML para categoria principal com contagem de animes
  createCategoryCard(category) {
    const animeCount = this.countAnimesByCategory(category.name);
    return `
      <div class="category-card" 
           data-category="${category.name.toLowerCase()}" 
           style="background: linear-gradient(45deg, ${category.gradient.start}, ${category.gradient.end})">
        <div class="category-icon">${category.icon}</div>
        <h3>${category.name}</h3>
        <p>${category.description}</p>
        <span class="anime-count">${animeCount} ${animeCount === 1 ? 'anime' : 'animes'}</span>
      </div>
    `;
  }

  // Gera tag HTML para subcategoria com contagem de animes
  createSubcategoryTag(category) {
    const animeCount = this.countAnimesByCategory(category.name);
    return `
      <span class="subcategory-tag" 
            data-subcategory="${category.name.toLowerCase()}"
            title="${animeCount} ${animeCount === 1 ? 'anime' : 'animes'}"
            style="background: linear-gradient(45deg, ${category.gradient.start}, ${category.gradient.end})">
        ${category.icon} ${category.name}
      </span>
    `;
  }

  // Retorna quantidade de animes em uma categoria específica
  countAnimesByCategory(category) {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    return animes.filter(anime => anime.genres.some(genre => this.normalizeCategory(genre) === this.normalizeCategory(category))).length;
  }

  // Padroniza o formato do nome da categoria para comparações
  normalizeCategory(category) {
    return category.toLowerCase().trim();
  }

  setupEventListeners() {
    // Gerencia cliques em categorias e subcategorias usando delegação de eventos
    document.addEventListener('click', (e) => {
      const categoryCard = e.target.closest('.category-card');
      const subcategoryTag = e.target.closest('.subcategory-tag');

      if (categoryCard) this.filterByCategory(categoryCard.dataset.category);
      else if (subcategoryTag) this.filterByCategory(subcategoryTag.dataset.subcategory);
    });
  }

  // Redireciona para página de animes filtrada por categoria
  filterByCategory(category) {
    window.location.href = `animes.html?category=${encodeURIComponent(category)}`;
  }
}

// Inicializa o gerenciador de categorias
document.addEventListener('DOMContentLoaded', () => { 
  new CategoryDisplay(); 
});