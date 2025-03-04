// Classe para gerenciamento das notícias
class NewsManager {
  constructor() {
    // Carrega dados do localStorage e configura listeners globais
    this.newsData = JSON.parse(localStorage.getItem('news') || '[]');

    // Listeners para sincronização de dados entre abas
    window.addEventListener('newsUpdated', () => this.refreshData());
    window.addEventListener('storage', (e) => { 
      if (e.key === 'news') this.refreshData(); 
    });

    // Identifica contexto da página atual
    this.currentPage = this.getCurrentPage();
    this.gridView = document.getElementById('news-grid-view');
    this.detailView = document.getElementById('news-detail-view');

    // Referências aos elementos principais da página
    this.parallaxSection = document.querySelector('.parallax-section');
    this.newsGridContainer = document.querySelector('.news-grid')?.parentElement;
    this.paginationContainer = document.querySelector('.pagination-container');

    // Inicializa grid com base no contexto da página
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
      this.currentPage === 'news'
        ? this.initializeFilters()
        : this.currentPage === 'index' && this.renderNewsGrid(newsGrid, 4);
    }

    // Inicializa visualização detalhada na página de notícias
    this.currentPage === 'news' && this.init();

    // Novo sistema de views
    this.views = {
      grid: {
        element: document.getElementById('news-grid-view'),
        title: 'Notícias | Animu',
        init: () => this.initializeFilters()
      },
      detail: {
        element: document.getElementById('news-detail-view'),
        init: (id) => this.loadNews(id)
      }
    };

    this.activeView = null;
    this.init();
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    // Configura a navegação
    this.setupNavigation();

    // Mostra a view apropriada baseado na URL
    newsId ? this.switchToView('detail', newsId) : this.switchToView('grid');
  }

  setupNavigation() {
    // Lida com navegação do browser
    window.addEventListener('popstate', (event) => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      id ? this.switchToView('detail', id, false) : this.switchToView('grid', null, false);
    });
  }

  switchToView(viewName, params = null, updateHistory = true) {
    if (!this.views[viewName]) return;

    // Esconde a view atual
    if (this.activeView) this.views[this.activeView].element.style.display = 'none';

    // Gerenciamento de visibilidade dos elementos da página
    if (viewName === 'detail') {
      // Oculta elementos da visualização em grid quando mostra detalhes da notícia
      if (this.parallaxSection) this.parallaxSection.style.display = 'none';
      if (this.newsGridContainer) this.newsGridContainer.style.display = 'none';
      if (this.paginationContainer) this.paginationContainer.style.display = 'none';
    } else {
      // Mostra elementos da visualização em grid
      if (this.parallaxSection) this.parallaxSection.style.display = 'block';
      if (this.newsGridContainer) this.newsGridContainer.style.display = 'block';
      if (this.paginationContainer) this.paginationContainer.style.display = 'flex';
    }

    // Mostra e inicializar nova view
    const view = this.views[viewName];
    view.element.style.display = 'block';
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
    window.scrollTo(0, 0);
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('news.html')) return 'news';
    if (path.includes('index.html')) return 'index';
    return '';
  }

  initNewsGrid() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;

    // Se estiver na página de notícias, inicializa filtros
    if (this.currentPage === 'news') this.initializeFilters();
    else this.renderNewsGrid(newsGrid, 4); // Na página inicial, mostrar apenas 4 notícias
  }

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

  createNewsCard(news) {
    const newsLink = this.currentPage === 'index'
      ? `news.html?id=${news.id}`  // Link direto para página de notícias quando na index
      : `javascript:void(0)`; // Link JavaScript quando na página de notícias

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
            <span class="news-date">${this.formatDate(news.date)}</span>
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

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  renderNewsGrid(container, limit = null, newsData = null) {
    if (!container) return;

    // Ordena as notícias por data, mais recentes primeiro
    const sortedNews = newsData || [...this.newsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    const newsToShow = limit ? sortedNews.slice(0, limit) : sortedNews;
    container.innerHTML = newsToShow.map(news => this.createNewsCard(news)).join('');
  }

  // Método para atualizar os dados quando houver mudanças
  refreshData() {
    this.newsData = JSON.parse(localStorage.getItem('news') || '[]');
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
      // Se estiver na página inicial, mostra apenas 4 notícias, senão mostra todas
      const limit = window.location.pathname.includes('index.html') ? 4 : null;
      this.renderNewsGrid(newsGrid, limit);
    }
  }

  // Adiciona novos métodos para gerenciar filtros e paginação
  initializeFilters() {
    // Configuração inicial dos filtros e paginação
    this.currentPage = 1;
    this.itemsPerPage = 12;

    // Cache dos elementos DOM para filtros
    this.searchInput = document.getElementById('search-news');
    this.categoryFilter = document.getElementById('category-filter');
    this.sortSelect = document.getElementById('sort-news');
    this.newsGrid = document.querySelector('.news-grid');
    this.prevButton = document.getElementById('prev-page');
    this.nextButton = document.getElementById('next-page');
    this.pageInfo = document.getElementById('page-info');

    // Inicializa listeners dos filtros se existirem
    this.searchInput && this.setupEventListeners();
    this.updateNews();
  }

  setupEventListeners() {
    this.searchInput.addEventListener('input', () => {
      this.updateNews();
      // Removido o scroll automático aqui
    });
    
    // Manter apenas o scroll ao pressionar Enter
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.updateNews();
        this.scrollToResults();
      }
    });
    
    this.categoryFilter.addEventListener('change', () => {
      this.updateNews();
      // Removido o scroll automático aqui
    });
    
    this.sortSelect.addEventListener('change', () => {
      this.updateNews();
      // Removido o scroll automático aqui
    });
    
    this.prevButton.addEventListener('click', () => this.changePage('prev'));
    this.nextButton.addEventListener('click', () => this.changePage('next'));
  }

  // Novo método para fazer scroll para os resultados
  scrollToResults() {
    const newsGrid = this.newsGrid;
    if (newsGrid) {
      // Calcula a posição para scroll
      const offsetTop = newsGrid.getBoundingClientRect().top + window.pageYOffset;
      const headerOffset = 80; // Ajuste para compensar cabeçalhos fixos ou outros elementos
      
      // Realiza o scroll suave
      window.scrollTo({
        top: offsetTop - headerOffset,
        behavior: 'smooth'
      });
    }
  }

  changePage(direction) {
    if (direction === 'prev' && this.currentPage > 1) this.currentPage--;
    else if (direction === 'next') this.currentPage++;
    this.updateNews();
  }

  filterAndSortNews() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const selectedCategory = this.categoryFilter.value;
    const sortOrder = this.sortSelect.value;

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

  updatePaginationControls(totalPages) {
    this.prevButton.disabled = this.currentPage === 1;
    this.nextButton.disabled = this.currentPage === totalPages;
    this.pageInfo.textContent = `Página ${this.currentPage} de ${totalPages || 1}`;
  }

  loadNews(newsId) {
    // Encontra a notícia pelo ID
    const news = this.newsData.find(item => item.id.toString() === newsId.toString());

    // Redireciona para grid se notícia não existir
    if (!news) {
      this.showGridView();
      return;
    }

    // Atualiza metadata da página
    document.title = `${news.title} | Animu`;
    this.updateMetaTags(news);

    // Cache dos elementos DOM da notícia
    const elements = {
      date: document.getElementById('news-date'),
      category: document.getElementById('news-category'),
      title: document.getElementById('news-title'),
      image: document.getElementById('news-image'),
      summary: document.getElementById('news-summary'),
      content: document.getElementById('news-content'),
      tags: document.getElementById('news-tags')
    };

    // Preenche conteúdo nos elementos existentes
    elements.date && (elements.date.textContent = this.formatDate(news.date));
    elements.category && (elements.category.textContent = news.category);
    elements.title && (elements.title.textContent = news.title);
    if (elements.image) {
      elements.image.src = news.image;
      elements.image.alt = news.title;
    }
    elements.summary && (elements.summary.textContent = news.summary);
    elements.content && (elements.content.innerHTML = this.formatContent(news.content));
    elements.tags && (elements.tags.innerHTML = news.tags
      .map(tag => `<span class="news-tag">#${tag}</span>`)
      .join(''));

    // Configura compartilhamento e notícias relacionadas
    this.setupShareButtons();
    this.loadRelatedNews(news);

    // Alterna para visualização detalhada
    if (this.gridView && this.detailView) {
      this.gridView.style.display = 'none';
      this.detailView.style.display = 'block';
    }
  }

  showDetailView(id, updateHistory = true) {
    this.switchToView('detail', id, updateHistory);
  }

  formatContent(content) {
    // Converte quebras de linha em parágrafos
    return content.split('\n')
      .filter(paragraph => paragraph.trim())
      .map(paragraph => `<p>${paragraph}</p>`)
      .join('');
  }

  loadRelatedNews(currentNews) {
    const relatedNews = this.newsData
      .filter(item =>
        item.id !== currentNews.id &&
        (item.category === currentNews.category ||
          item.tags.some(tag => currentNews.tags.includes(tag)))
      )
      .slice(0, 2);

    const relatedGrid = document.getElementById('related-news-grid');
    relatedGrid.innerHTML = relatedNews
      .map(news => this.createRelatedNewsCard(news))
      .join('');
  }

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

  updateMetaTags(news) {
    // Atualiza meta tags para SEO e compartilhamento
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

  updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(name.includes('og:') ? 'property' : 'name', name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }

  setupShareButtons() {
    // Dados para compartilhamento
    const shareData = {
      url: window.location.href,
      title: document.title,
      text: document.getElementById('news-summary')?.textContent
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
      document.querySelector(`.share-btn.${network}`).addEventListener('click', handler); 
    });
  }

  showGridView(updateHistory = true) {
    this.switchToView('grid', null, updateHistory);
  }
}

// Inicializa gerenciador de notícias
const newsManager = new NewsManager();