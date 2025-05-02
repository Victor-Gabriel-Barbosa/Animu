// Classe para gerenciamento da interface de notícias
class NewsUIManager {
  constructor() {
    // Inicializa o gerenciador de notícias do Firestore
    this.newsManagerDB = new NewsManager();
    
    // Armazena as notícias
    this.newsData = [];
    
    // Inicializa indicador de carregamento
    this.isLoading = false;

    // Identifica contexto da página atual
    this.currentPage = this.getCurrentPage();
    
    // Referências aos elementos principais da página
    this.parallaxSection = $('.parallax-section');
    this.newsGridContainer = $('.news-grid').parent();
    this.paginationContainer = $('.pagination-container');
    
    // Sistema de views
    this.views = {
      grid: {
        element: this.newsGridContainer, 
        title: 'Notícias | Animu',
        init: () => this.initializeFilters()
      },
      detail: {
        element: $('#news-detail-view'),
        init: (id) => this.loadNews(id)
      }
    };

    this.activeView = null;
    
    // Carrega notícias e inicializa a página
    this.loadNewsData().then(() => {
      this.init();
    });
  }

  // Carrega notícias do cache ou do Firestore
  async loadNewsData() { 
    try {
      this.isLoading = true;
      const newsGrid = $('.news-grid');
      
      if (newsGrid.length) {
        // Exibe indicador de carregamento
        newsGrid.html(`
          <div class="flex justify-center items-center w-full py-12">
            <div class="loader"></div>
            <p class="ml-3 text-gray-600">Carregando notícias...</p>
          </div>
        `);
      }

      // Primeiro tenta carregar do cache
      if (typeof newsCache !== 'undefined') {
        const cachedNews = newsCache.getAll();
        if (cachedNews.length > 0) {
          console.log('Carregando notícias do cache local');
          this.newsData = cachedNews;
          
          // Inicializa grid com base no contexto da página
          if (newsGrid.length) {
            this.currentPage === 'news'
              ? this.initializeFilters()
              : this.currentPage === 'index' && this.renderNewsGrid(newsGrid, 4);
          }
          
          // Mesmo com cache, atualiza em segundo plano
          this.fetchFromFirestore();
          return;
        }
      }

      // Se não tem cache, carrega diretamente do Firestore
      await this.fetchFromFirestore();
      
      // Inicializa grid com base no contexto da página
      if (newsGrid.length) {
        this.currentPage === 'news'
          ? this.initializeFilters()
          : this.currentPage === 'index' && this.renderNewsGrid(newsGrid, 4);
      }
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      const newsGrid = $('.news-grid');
      if (newsGrid.length) {
        newsGrid.html(`
          <div class="text-center py-8 text-red-500">
            <p>Erro ao carregar notícias. Por favor, tente novamente.</p>
            <button class="btn btn-secondary mt-4" onclick="newsManager.loadNewsData()">
              Tentar novamente
            </button>
          </div>
        `);
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Carrega notícias do Firestore
  async fetchFromFirestore() { 
    try {
      console.log('Carregando notícias usando NewsManager');
      // Usa o NewsManager para buscar as notícias
      const news = await this.newsManagerDB.getAllNews();
      
      // Atualiza dados locais
      this.newsData = news;
      
      // Salva no localStorage para acesso offline
      localStorage.setItem('news', JSON.stringify(news));
      
      console.log(`${news.length} notícias carregadas`);
      
      return news;
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      throw error;
    }
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    // Configura a navegação
    this.setupNavigation();

    // Mostra a view apropriada baseado na URL
    newsId ? this.switchToView('detail', newsId) : this.switchToView('grid');
  }

  // Lida com navegação do browser
  setupNavigation() {
    $(window).on('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      id ? this.switchToView('detail', id, false) : this.switchToView('grid', null, false);
    });
  }

  switchToView(viewName, params = null, updateHistory = true) {
    if (!this.views[viewName]) return;
    
    // Verifica se os elementos estão disponíveis
    if (viewName === 'detail' && !this.views.detail.element.length) {
      console.error("Elemento de visualização detalhada não encontrado");
      return;
    }
    
    // Esconde a view atual se o activeView for válido
    if (this.activeView && this.views[this.activeView].element) 
      this.views[this.activeView].element.hide();

    // Gerenciamento de visibilidade dos elementos da página
    if (viewName === 'detail') {
      // Exibe a visualização detalhada
      if (this.views.detail.element) this.views.detail.element.show();
      
      // Oculta elementos da visualização em grid
      if (this.parallaxSection.length) this.parallaxSection.hide();
      if (this.newsGridContainer.length) this.newsGridContainer.hide();
      if (this.paginationContainer.length) this.paginationContainer.hide();
    } else {
      // Oculta a visualização detalhada
      if (this.views.detail.element) this.views.detail.element.hide();
      
      // Mostra elementos da visualização em grid
      if (this.parallaxSection.length) this.parallaxSection.show();
      if (this.newsGridContainer.length) this.newsGridContainer.show();
      if (this.paginationContainer.length) this.paginationContainer.css('display', 'flex');
    }

    // Mostra e inicializa nova view
    const view = this.views[viewName];
    view.init(params);
    this.activeView = viewName;

    // Atualiza URL e histórico se necessário
    if (updateHistory) {
      const url = viewName === 'detail' ? `news.html?id=${params}` : 'news.html';
      history.pushState({ view: viewName, params }, '', url);
    }

    // Atualiza título e metadata
    if (viewName === 'grid') {
      document.title = view.title;
      this.updateMetaTags({
        title: view.title,
        description: 'Notícias sobre anime e mangá',
        image: '',
        url: window.location.href
      });
    }

    // Rola para o topo da página
    $(window).scrollTop(0);
  }

  // Verifica o caminho atual da URL
  getCurrentPage() { 
    const path = window.location.pathname;
    if (path.includes('news.html')) return 'news';
    if (path.includes('index.html')) return 'index';
    return '';
  }

  // Inicializa grid de notícias
  initNewsGrid() { 
    const newsGrid = $('.news-grid');
    if (!newsGrid.length) return;

    // Se estiver na página de notícias, inicializa filtros
    if (this.currentPage === 'news') this.initializeFilters();
    else this.renderNewsGrid(newsGrid, 4); // Na página inicial, mostrar apenas 4 notícias
  }

  // Carrega notícia única
  initSingleNews() { 
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) {
      window.location.href = 'news.html';
      return;
    }

    this.loadNews(newsId);
    this.setupShareButtons();
  }

  // Cria card de notícia
  createNewsCard(news) {
    const newsLink = this.currentPage === 'index'
      ? `news.html?id=${news.id}`  // Link direto para página de notícias quando na index
      : `#`;  

    const onClickHandler = this.currentPage === 'index'
      ? ''  // Sem handler quando na index
      : `onclick="event.preventDefault(); newsManager.switchToView('detail', '${news.id}')"`; 

    return `
      <a href="${newsLink}" ${onClickHandler} class="news-card">
        <div class="news-image-container">
          <img src="${news.image}" alt="${news.title}" class="news-image">
          <span class="news-category">${news.category}</span>
        </div>
        <div class="news-content">
          <div class="news-metadata">
            <span class="news-date">${AnimuUtils.formatDate(news.date)}</span>
            <div class="news-tags">
              ${news.tags.map(tag => `<span class="news-tag">#${tag}</span>`).join('')}
            </div>
          </div>
          <h3 class="news-title">${news.title}</h3>
          <p class="news-summary">${news.summary}</p>
        </div>
      </a>
    `;
  }

  // Renderiza o grid de notícias
  renderNewsGrid(container, limit = null, newsData = null) {
    if (!container.length) return;

    // Ordena as notícias por data, mais recentes primeiro
    const sortedNews = newsData || [...this.newsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    const newsToShow = limit ? sortedNews.slice(0, limit) : sortedNews;
    container.html(newsToShow.map(news => this.createNewsCard(news)).join(''));
  }

  // Método para atualizar os dados quando houver mudanças
  refreshData() {
    this.newsData = JSON.parse(localStorage.getItem('news') || '[]');
    const newsGrid = $('.news-grid');
    if (newsGrid.length) {
      // Se estiver na página inicial, mostra apenas 4 notícias, senão mostra todas
      const limit = window.location.pathname.includes('index.html') ? 4 : null;
      this.renderNewsGrid(newsGrid, limit);
    }
  }

  // Inicializa filtros e paginação
  initializeFilters() {
    // Configuração inicial dos filtros e paginação
    this.currentPage = 1;
    this.itemsPerPage = 12;

    // Cache dos elementos DOM para filtros
    this.searchInput = $('#search-news');
    this.categoryFilter = $('#category-filter');
    this.sortSelect = $('#sort-news');
    this.newsGrid = $('.news-grid');
    this.prevButton = $('#prev-page');
    this.nextButton = $('#next-page');
    this.pageInfo = $('#page-info');

    // Inicializa listeners dos filtros se existirem
    if (this.searchInput.length) this.setupEventListeners();
    this.updateNews();
    
    // Popula categorias do filtro com base nas notícias carregadas
    this.populateCategoryFilter();
  }
  
  // Popula o filtro de categorias com as categorias únicas das notícias
  populateCategoryFilter() {
    if (!this.categoryFilter.length) return;
    
    // Obtém todas as categorias únicas das notícias
    const categories = [...new Set(this.newsData.map(news => news.category))];
    
    // Mantém a opção "Todas as categorias"
    const defaultOption = this.categoryFilter.find('option:first');
    
    // Limpa e recria as opções
    this.categoryFilter.empty().append(defaultOption);
    
    // Adiciona as categorias em ordem alfabética
    categories.sort().forEach(category => {
      // Pula se categoria for vazia
      if (!category) return;
      
      $('<option>', {
        value: category,
        text: category
      }).appendTo(this.categoryFilter);
    });
  }

  // Configura listeners para os filtros e botões de paginação
  setupEventListeners() {
    this.searchInput.on('input', () => {
      this.updateNews();
    });
    
    // Manter apenas o scroll ao pressionar Enter
    this.searchInput.on('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.updateNews();
        this.scrollToResults();
      }
    });
    
    this.categoryFilter.on('change', () => {
      this.updateNews();
    });
    
    this.sortSelect.on('change', () => {
      this.updateNews();
    });
    
    this.prevButton.on('click', () => this.changePage('prev'));
    this.nextButton.on('click', () => this.changePage('next'));
  }

  // Faz scroll para os resultados
  scrollToResults() {
    if (this.newsGrid.length) {
      // Calcula a posição para scroll
      const offsetTop = this.newsGrid.offset().top;
      const headerOffset = 80; // Ajuste para compensar cabeçalhos fixos ou outros elementos
      
      // Realiza o scroll suave
      $('html, body').animate({
        scrollTop: offsetTop - headerOffset
      }, 300);
    }
  }

  // Muda a página de notícias
  changePage(direction) {
    if (direction === 'prev' && this.currentPage > 1) this.currentPage--;
    else if (direction === 'next') this.currentPage++;
    this.updateNews();
  }

  // Filtra e ordena as notícias com base nos critérios selecionados
  filterAndSortNews() {
    const searchTerm = this.searchInput.val().toLowerCase();
    const selectedCategory = this.categoryFilter.val();
    const sortOrder = this.sortSelect.val();

    // Aplica filtros de busca e categoria
    let filteredNews = this.newsData.filter(news => {
      const matchesSearch = news.title.toLowerCase().includes(searchTerm) || news.summary.toLowerCase().includes(searchTerm);
      const matchesCategory = !selectedCategory || news.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Ordena por data (crescente/decrescente)
    return filteredNews.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }

  // Atualiza a grid de notícias com base nos filtros e paginação
  updateNews() {
    const filteredNews = this.filterAndSortNews();
    const totalPages = Math.ceil(filteredNews.length / this.itemsPerPage);

    // Ajusta página atual se necessário
    if (this.currentPage > totalPages) this.currentPage = totalPages || 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedNews = filteredNews.slice(start, start + this.itemsPerPage);

    // Renderiza notícias e atualiza controles
    this.renderNewsGrid(this.newsGrid, null, paginatedNews);
    this.updatePaginationControls(totalPages);
  }

  // Atualiza os controles de paginação
  updatePaginationControls(totalPages) {
    this.prevButton.prop('disabled', this.currentPage === 1);
    this.nextButton.prop('disabled', this.currentPage === totalPages);
    this.pageInfo.text(`Página ${this.currentPage} de ${totalPages || 1}`);
  }

  // Carrega notícia específica pelo ID
  loadNews(newsId) {
    // Encontra a notícia pelo ID
    const news = this.newsData.find(item => item.id.toString() === newsId.toString());

    // Tenta buscar do gerenciador de notícias se não encontrar localmente
    if (!news) {
      // Mostra indicador de carregamento
      const contentArea = $('#news-content');
      if (contentArea.length) {
        contentArea.html(`
          <div class="flex justify-center items-center w-full py-12">
            <div class="loader"></div>
            <p class="ml-3 text-gray-600">Carregando notícia...</p>
          </div>
        `);
      }

      // Busca usando o NewsManager
      this.newsManagerDB.getNewsById(newsId).then(newsData => {
        if (newsData) this.displayNewsDetails(newsData);
        else this.showGridView();
      }).catch(error => {
        console.error('Erro ao carregar notícia:', error);
        this.showGridView();
      });
      
      return;
    }

    // Redireciona para grid se notícia não existir
    if (!news) {
      this.showGridView();
      return;
    }

    this.displayNewsDetails(news);
  }
  
  displayNewsDetails(news) {
    // Atualiza metadata da página
    document.title = `${news.title} | Animu`;
    this.updateMetaTags(news);

    // Cache dos elementos DOM da notícia
    const elements = {
      date: $('#news-date'),
      category: $('#news-category'),
      title: $('#news-title'),
      image: $('#news-image'),
      summary: $('#news-summary'),
      content: $('#news-content'),
      tags: $('#news-tags')
    };

    // Preenche conteúdo nos elementos existentes
    if (elements.date.length) elements.date.text(AnimuUtils.formatDate(news.date));
    if (elements.category.length) elements.category.text(news.category);
    if (elements.title.length) elements.title.text(news.title);
    if (elements.image.length) {
      elements.image.attr({
        src: news.image,
        alt: news.title
      });
    }
    if (elements.summary.length) elements.summary.text(news.summary);
    if (elements.content.length) elements.content.html(news.content || '');
    if (elements.tags.length) {
      elements.tags.html(news.tags
        .map(tag => `<span class="news-tag">#${tag}</span>`)
        .join(''));
    }

    // Configura compartilhamento e notícias relacionadas
    this.setupShareButtons();
    this.loadRelatedNews(news);
  }

  // Mostra a visualização detalhada da notícia
  showDetailView(id, updateHistory = true) {
    this.switchToView('detail', id, updateHistory);
  }

  // Formata o conteúdo da notícia
  formatContent(content) {
    // Converte quebras de linha em parágrafos
    return content.split('\n')
      .filter(paragraph => paragraph.trim())
      .map(paragraph => `<p>${paragraph}</p>`)
      .join('');
  }

  // Carrega notícias relacionadas
  loadRelatedNews(currentNews) {
    const relatedNews = this.newsData
      .filter(item =>
        item.id !== currentNews.id &&
        (item.category === currentNews.category ||
          item.tags.some(tag => currentNews.tags.includes(tag)))
      )
      .slice(0, 2);

    $('#related-news-grid').html(relatedNews
      .map(news => this.createRelatedNewsCard(news))
      .join(''));
  }

  // Cria card de notícias relacionadas
  createRelatedNewsCard(news) {
    return `
      <a href="javascript:void(0)" 
         onclick="event.preventDefault(); newsManager.switchToView('detail', '${news.id}')" 
         class="related-news-card">
        <div class="news-image-container">
          <img src="${news.image}" alt="${news.title}" class="news-image">
          <span class="news-category">${news.category}</span>
        </div>
        <div class="news-content">
          <h4 class="text-lg font-semibold mb-2">${news.title}</h4>
          <p class="text-sm opacity-75 line-clamp-2">${news.summary}</p>
        </div>
      </a>
    `;
  }

  // Atualiza meta tags para SEO e compartilhamento
  updateMetaTags(news) {
    const meta = {
      description: news.summary,
      image: news.image,
      url: window.location.href
    };

    // Meta tags básicas
    this.updateMetaTag('description', meta.description);

    // Open Graph
    this.updateMetaTag('og:title', news.title);
    this.updateMetaTag('og:description', meta.description);
    this.updateMetaTag('og:image', meta.image);
    this.updateMetaTag('og:url', meta.url);

    // Twitter Card
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', news.title);
    this.updateMetaTag('twitter:description', meta.description);
    this.updateMetaTag('twitter:image', meta.image);
  }

  // Atualiza uma meta tag específica
  updateMetaTag(name, content) {
    let meta = $(`meta[name="${name}"], meta[property="${name}"]`);

    if (!meta.length) {
      meta = $('<meta>');
      meta.attr(name.includes('og:') ? 'property' : 'name', name);
      $('head').append(meta);
    }

    meta.attr('content', content);
  }

  // Configura botões de compartilhamento
  setupShareButtons() {
    // Dados para compartilhamento
    const shareData = {
      url: window.location.href,
      title: document.title,
      text: $('#news-summary').text()
    };

    // Configura handlers para cada rede social
    const shareHandlers = {
      twitter: () => {
        const text = encodeURIComponent(shareData.title);
        const url = encodeURIComponent(shareData.url);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      },
      facebook: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`, '_blank');
      },
      whatsapp: () => {
        const text = encodeURIComponent(`${shareData.title}\n\n${shareData.url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    };

    // Adiciona listeners aos botões
    Object.entries(shareHandlers).forEach(([network, handler]) => { 
      $(`.share-btn.${network}`).on('click', handler); 
    });
  }

  // Mostra a visualização em grid
  showGridView(updateHistory = true) {
    this.switchToView('grid', null, updateHistory);
  }
}

// Inicializa gerenciador de interface de notícias
const newsManager = new NewsUIManager();

// Listener para evento de atualização de cache
$(window).on('newsCacheUpdated', () => {
  if (newsManager) {
    console.log('Cache de notícias atualizado, recarregando dados');
    newsManager.loadNewsData();
  }
});