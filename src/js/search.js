/**
 * Classe que implementa uma barra de busca de animes com filtros
 * e sugestões em tempo real
 */
class AnimeSearchBar {
  constructor(options = {}) {
    // Carregar categorias do localStorage
    const categories = this.loadCategories();

    this.options = {
      containerId: 'search-area',
      inputId: 'search-input',
      resultsId: 'search-results',
      debounceTime: 300,
      minChars: 0,
      maxResults: 10,
      filters: {
        genre: {
          label: 'Gênero',
          options: [
            { value: '', label: 'Todos' },
            ...this.formatCategoriesToOptions(categories)
          ]
        },
        date: {  // Alterado de 'year' para 'date'
          label: 'Data de Lançamento',
          options: [
            { value: '', label: 'Todas' },
            { value: 'this_season', label: 'Esta Temporada' },
            { value: 'this_year', label: 'Este Ano' },
            { value: 'last_year', label: 'Ano Passado' },
            { value: 'older', label: '2 Anos ou Mais' },
            { value: 'custom', label: 'Outra' }
          ]
        },
        status: {
          label: 'Status',
          options: [
            { value: '', label: 'Todos' },
            { value: 'airing', label: 'Em exibição' },
            { value: 'completed', label: 'Completo' },
            { value: 'upcoming', label: 'Próximos' }
          ]
        },
        season: {
          label: 'Temporada',
          options: [
            { value: '', label: 'Todas' },
            { value: 'winter', label: 'Inverno' },
            { value: 'spring', label: 'Primavera' },
            { value: 'summer', label: 'Verão' },
            { value: 'fall', label: 'Outono' }
          ]
        },
        rating: {
          label: 'Classificação',
          options: [
            { value: '', label: 'Todas' },
            { value: '9', label: '9+ ⭐' },
            { value: '8', label: '8+ ⭐' },
            { value: '7', label: '7+ ⭐' },
            { value: '6', label: '6+ ⭐' },
            { value: '5', label: '5+ ⭐' }
          ]
        },
        source: {
          label: 'Fonte',
          options: [
            { value: '', label: 'Todas' },
            { value: 'manga', label: 'Mangá' },
            { value: 'light_novel', label: 'Light Novel' },
            { value: 'original', label: 'Original' },
            { value: 'game', label: 'Jogo' },
            { value: 'visual_novel', label: 'Visual Novel' }
          ]
        }
      },
      ...options
    };

    this.filters = {
      genre: '',
      date: '',
      rating: ''
    };

    this.container = document.getElementById(this.options.containerId);
    this.setupSearchBar();
    this.setupEventListeners();

    // Adiciona listener para atualização de categorias
    window.addEventListener('categoriesUpdated', () => {
      this.updateGenreFilter();
    });
  }

  // Carrega categorias do localStorage
  loadCategories() {
    return JSON.parse(localStorage.getItem('animuCategories')) || [];
  }

  // Converte categorias para o formato de opções do filtro
  formatCategoriesToOptions(categories) {
    return categories.map(cat => ({
      value: cat.name.toLowerCase(),
      label: cat.name
    }));
  }

  // Atualiza o filtro de gêneros quando as categorias são modificadas
  updateGenreFilter() {
    const categories = this.loadCategories();
    const genreSelect = this.container.querySelector('#genre-filter');

    if (genreSelect) {
      const currentValue = genreSelect.value;
      const options = [
        { value: '', label: 'Todos' },
        ...this.formatCategoriesToOptions(categories)
      ];

      genreSelect.innerHTML = options.map(option =>
        `<option value="${option.value}" ${currentValue === option.value ? 'selected' : ''}>${option.label}</option>`
      ).join('');
    }
  }

  /**
   * Gera HTML do select para um filtro específico
   * @param {string} filterKey - Chave do filtro (genre, year, etc)
   */
  createFilterSelect(filterKey) {
    const filter = this.options.filters[filterKey];
    // Adiciona campo de data personalizada para o filtro de data
    if (filterKey === 'date') {
      return `
        <div class="filter-group">
          <label>${filter.label}</label>
          <div class="flex gap-2 items-center">
            <select id="${filterKey}-filter" class="flex-1">
              ${filter.options.map(option =>
        `<option value="${option.value}">${option.label}</option>`
      ).join('')}
            </select>
            <input type="date" 
                   id="custom-date-filter" 
                   class="w-32 p-2 border rounded hidden"
                   min="1960-01-01"
                   max="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      `;
    }
    // Retorno padrão para outros filtros
    return `
      <div class="filter-group">
        <label>${filter.label}</label>
        <select id="${filterKey}-filter">
          ${filter.options.map(option =>
      `<option value="${option.value}">${option.label}</option>`
    ).join('')}
        </select>
      </div>
    `;
  }

  // Inicializa a estrutura HTML da barra de busca e seus componentes
  setupSearchBar() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="search-container">
        <div class="search-input-wrapper">
          <input type="text" 
                 id="${this.options.inputId}" 
                 class="search-input" 
                 placeholder="Pesquisar">
          <button class="clear-input" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="filter-dropdown">
          <button class="filter-btn" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
            </svg>
          </button>
          <div class="filter-menu">
            ${Object.keys(this.options.filters)
        .map(filterKey => this.createFilterSelect(filterKey))
        .join('')}
          </div>
        </div>

        <button class="search-button">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
        <div id="${this.options.resultsId}" class="search-results"></div>
      </div>
    `;

    this.input = document.getElementById(this.options.inputId);
    this.results = document.getElementById(this.options.resultsId);
    this.searchButton = this.container.querySelector('.search-button');
    this.filterBtn = this.container.querySelector('.filter-btn');
    this.filterMenu = this.container.querySelector('.filter-menu');

    // Adiciona referência ao botão de limpar
    this.clearButton = this.container.querySelector('.clear-input');

    // Atualiza visibilidade inicial do botão
    this.updateClearButtonVisibility();

    // Configura eventos dos filtros
    this.setupFilterEvents();
  }

  // Configura listeners para input de busca e interações do usuário
  setupEventListeners() {
    if (!this.input || !this.results) return;

    // Debounce para evitar múltiplas requisições durante digitação
    let timeout = null;
    this.input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.handleSearch(false), this.options.debounceTime);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSearch(true);
      }
    });

    this.searchButton.addEventListener('click', () => this.handleSearch(true));

    // Fecha resultados ao clicar fora
    document.addEventListener('click', (e) => { 
      if (!this.container.contains(e.target)) this.hideResults(); 
    });

    // Adiciona evento para o botão de limpar
    this.clearButton.addEventListener('click', () => {
      this.input.value = '';
      this.hideResults();
      this.updateClearButtonVisibility();
      this.input.focus();
    });

    // Atualizar visibilidade do botão ao digitar
    this.input.addEventListener('input', () => { 
      this.updateClearButtonVisibility(); 
    });
  }

  // Novo método para controlar a visibilidade do botão de limpar
  updateClearButtonVisibility() {
    if (this.input.value.length > 0) this.clearButton.style.display = 'block';
    else this.clearButton.style.display = 'none';
  }

  // Configura eventos para interação com filtros de busca
  setupFilterEvents() {
    // Toggle do menu de filtros
    this.filterBtn.addEventListener('click', () => { 
      this.filterMenu.classList.toggle('show'); 
    });

    // Fecha filtros ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) this.filterMenu.classList.remove('show'); 
    });

    // Adiciona listeners para cada select de filtro
    const filterSelects = this.container.querySelectorAll('.filter-group select');
    filterSelects.forEach(select => {
      select.addEventListener('change', () => {
        this.filters = {
          genre: this.container.querySelector('#genre-filter').value,
          date: this.container.querySelector('#date-filter').value,
          rating: this.container.querySelector('#rating-filter').value,
          status: this.container.querySelector('#status-filter').value,
          season: this.container.querySelector('#season-filter').value,
          source: this.container.querySelector('#source-filter').value
        };
        this.handleSearch();
      });
    });

    // Adiciona listener específico para o filtro de data
    const dateFilter = this.container.querySelector('#date-filter');
    const customDateFilter = this.container.querySelector('#custom-date-filter');

    if (dateFilter && customDateFilter) {
      dateFilter.addEventListener('change', () => {
        if (dateFilter.value === 'custom') customDateFilter.classList.remove('hidden');
        else customDateFilter.classList.add('hidden');
      });

      customDateFilter.addEventListener('change', () => {
        this.filters.customDate = customDateFilter.value;
        this.handleSearch();
      });
    }

    // Adiciona tratamento especial para dispositivos móveis
    if (window.innerWidth <= 480) {
      // Fecha o menu de filtros ao tocar fora
      document.addEventListener('touchstart', (e) => {
        if (this.filterMenu.classList.contains('show') &&
          !this.filterMenu.contains(e.target) &&
          !this.filterBtn.contains(e.target)) {
          this.filterMenu.classList.remove('show');
        }
      });

      // Adiciona gesto de swipe down para fechar os filtros
      let touchStartY = 0;
      let touchEndY = 0;

      this.filterMenu.addEventListener('touchstart', (e) => { 
        touchStartY = e.touches[0].clientY; 
      });

      this.filterMenu.addEventListener('touchmove', (e) => {
        touchEndY = e.touches[0].clientY;
        const diffY = touchEndY - touchStartY;

        // Se arrastar mais de 50px para baixo
        if (diffY > 50) this.filterMenu.classList.remove('show');
      });
    }

    // Ajusta posição dos resultados baseado no viewport
    window.addEventListener('resize', () => {
      if (this.results) {
        const rect = this.input.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        // Se houver pouco espaço abaixo
        if (spaceBelow < 300) this.results.style.maxHeight = `${spaceBelow - 10}px`;
        else this.results.style.maxHeight = '400px';
      }
    });
  }

  /**
   * Processa a busca e decide entre exibir resultados ou redirecionar
   * @param {boolean} redirect - Se true, redireciona para página de resultados
   */
  async handleSearch(redirect = false) {
    const query = this.input.value.trim();

    if (query.length < this.options.minChars) {
      this.hideResults();
      return;
    }

    try {
      const results = await this.searchAnimes(query);

      if (redirect) {
        // Salva resultados no localStorage e redireciona
        localStorage.setItem('searchResults', JSON.stringify(results));
        window.location.href = `animes.html?search=${encodeURIComponent(query)}`;
      } else this.displayResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      this.displayError();
    }
  }

  /**
   * Realiza busca nos dados locais com sistema de pontuação por relevância
   * @param {string} query - Termo de busca
   * @returns {Array} Animes ordenados por relevância
   */
  async searchAnimes(query) {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 1);

    // Sistema de pontuação para relevância dos resultados
    const scoredResults = animes
      .map(anime => {
        let score = 0;
        const normalizedTitle = this.normalizeText(anime.primaryTitle);

        // Pontuação para título principal
        if (normalizedTitle === normalizedQuery) score += 100;
        if (normalizedTitle.startsWith(normalizedQuery)) score += 50;
        if (normalizedTitle.includes(normalizedQuery)) score += 30;

        // Pontuação para palavras individuais no título
        queryWords.forEach(word => { 
          if (normalizedTitle.includes(word)) score += 15; 
        });

        // Pontuação para títulos alternativos
        anime.alternativeTitles.forEach(alt => {
          const normalizedAlt = this.normalizeText(alt.title);
          if (normalizedAlt.includes(normalizedQuery)) score += 20;
          queryWords.forEach(word => { 
            if (normalizedAlt.includes(word)) score += 10; 
          });
        });

        // Pontuação para gêneros
        if (anime.genres.some(genre => this.normalizeText(genre).includes(normalizedQuery))) score += 5;

        // Aplica filtros
        const passesFilters = this.applyFilters(anime);

        return {
          anime,
          score: passesFilters ? score : 0
        };
      })
      .filter(result => result.score > 0) // Remove resultados sem relevância
      .sort((a, b) => b.score - a.score) // Ordena por relevância
      .slice(0, this.options.maxResults)
      .map(result => result.anime);

    return scoredResults;
  }

  /**
   * Normaliza texto removendo acentos e caracteres especiais
   * @param {string} text - Texto a ser normalizado
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, ''); // Remove caracteres especiais
  }

  /**
   * Aplica filtros selecionados aos resultados da busca
   * @param {Object} anime - Objeto contendo dados do anime
   * @returns {boolean} True se o anime passa pelos filtros
   */
  applyFilters(anime) {
    const genreMatch = !this.filters.genre ||
      anime.genres.some(g => this.normalizeText(g) === this.normalizeText(this.filters.genre));

    // Nova lógica para filtro de data
    const dateMatch = !this.filters.date || (() => {
      if (!anime.releaseDate) return false;

      const releaseDate = new Date(anime.releaseDate);
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      switch (this.filters.date) {
        case 'this_season':
          // Considera a temporada atual (3 meses)
          const seasonStart = new Date(today.setMonth(currentMonth - currentMonth % 3));
          return releaseDate >= seasonStart;

        case 'this_year':
          return releaseDate.getFullYear() === currentYear;

        case 'last_year':
          return releaseDate.getFullYear() === currentYear - 1;

        case 'older':
          return releaseDate.getFullYear() <= currentYear - 2;

        case 'custom':
          if (!this.filters.customDate) return true;
          const customDate = new Date(this.filters.customDate);
          return releaseDate >= customDate;

        default:
          return true;
      }
    })();

    const statusMatch = !this.filters.status ||
      this.normalizeText(anime.status) === this.normalizeText(this.filters.status);

    const seasonMatch = !this.filters.season ||
      (anime.season && this.normalizeText(anime.season.period) === this.normalizeText(this.filters.season));

    const ratingMatch = !this.filters.rating ||
      (anime.score && parseFloat(anime.score) >= parseFloat(this.filters.rating));

    const sourceMatch = !this.filters.source ||
      (anime.source && this.normalizeText(anime.source) === this.normalizeText(this.filters.source));

    return genreMatch && dateMatch && statusMatch &&
      seasonMatch && ratingMatch && sourceMatch;
  }

  /**
   * Renderiza lista de resultados da busca
   * @param {Array} results - Array de animes encontrados
   */
  displayResults(results) {
    if (!this.results) return;

    if (results.length === 0) {
      this.results.innerHTML = `
        <div class="no-results">
          Nenhum anime encontrado
        </div>
      `;
    } else {
      this.results.innerHTML = results
        .map(anime => this.createResultItem(anime))
        .join('');
    }

    this.showResults();
  }

  /**
   * Gera HTML para um item individual da lista de resultados
   * @param {Object} anime - Dados do anime a ser exibido
   */
  createResultItem(anime) {
    const releaseDate = anime.releaseDate ? new Date(anime.releaseDate).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    }) : 'N/A';

    return `
      <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" 
         class="search-result-item">
        <img src="${anime.coverImage}" 
             alt="${anime.primaryTitle}" 
             class="search-result-image">
        <div class="search-result-info">
          <div class="search-result-title">${anime.primaryTitle}</div>
          <div class="search-result-metadata">
            ${releaseDate} • ⭐ ${anime.score || 'N/A'}
          </div>
        </div>
      </a>
    `;
  }

  // Exibe mensagem de erro na interface
  displayError() {
    if (!this.results) return;

    this.results.innerHTML = `
      <div class="no-results">
        Ocorreu um erro na busca
      </div>
    `;
    this.showResults();
  }

  // Métodos auxiliares para controle de visibilidade
  showResults() {
    if (this.results) this.results.style.display = 'block';
  }

  hideResults() {
    if (this.results) this.results.style.display = 'none';
  }
}

// Inicializa barra de busca com configurações personalizadas
document.addEventListener('DOMContentLoaded', () => {
  new AnimeSearchBar({
    debounceTime: 400,
    maxResults: 8
  });
});