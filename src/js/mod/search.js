/**
 * Classe que implementa uma barra de busca de 
 * animes com filtros e sugestões em tempo real
 */
class AnimeSearchBar {
  constructor(options = {}) {
    // Carrega as categorias do localStorage
    const categories = this.loadCategories();

    // Configurações padrão da barra de busca
    this.options = {
      containerId: 'search-area',
      inputId: 'search-input',
      resultsId: 'search-results',
      debounceTime: 300,
      minChars: 1,
      maxResults: 10,
      filters: {
        genre: {
          label: 'Gênero',
          options: [
            { value: '', label: 'Todos' },
            ...this.formatCategoriesToOptions(categories)
          ]
        },
        date: { 
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
      rating: '',
      status: '',
      season: '',
      source: ''
    };

    this.$container = $(`#${this.options.containerId}`);
    this.setupSearchBar();
    this.setupEventListeners();
    
    // Carrega a busca anterior e filtros salvos
    this.loadPreviousSearch();

    // Adiciona listener para atualização de categorias
    $(window).on('categoriesUpdated', () => {
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
    const $genreSelect = this.$container.find('#genre-filter');

    if ($genreSelect.length) {
      const currentValue = $genreSelect.val();
      const options = [
        { value: '', label: 'Todos' },
        ...this.formatCategoriesToOptions(categories)
      ];

      // Atualiza as opções do select de gêneros
      $genreSelect.html(options.map(option =>
        `<option value="${option.value}" ${currentValue === option.value ? 'selected' : ''}>${option.label}</option>`
      ).join('')); 
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
    if (this.$container.length === 0) return;

    this.$container.html(`
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
            <i class="fi fi-rr-settings-sliders"></i>
          </button>
          <div class="filter-menu">
            ${Object.keys(this.options.filters)
        .map(filterKey => this.createFilterSelect(filterKey))
        .join('')}
            <button class="btn-action clear-filters-btn hidden" id="clear-filters-btn">
              <span class="flex items-center justify-center gap-2">
                <i class="fi fi-bs-trash"></i>
                Limpar filtros
              </span>
            </button>
          </div>
        </div>

        <button class="search-button">
          <i class="fi fi-rr-search mt-1"></i>
        </button>
        <div id="${this.options.resultsId}" class="search-results"></div>
      </div>
    `);

    this.$input = $(`#${this.options.inputId}`);
    this.$results = $(`#${this.options.resultsId}`);
    this.$searchButton = this.$container.find('.search-button');
    this.$filterBtn = this.$container.find('.filter-btn');
    this.$filterMenu = this.$container.find('.filter-menu');
    this.$clearFiltersBtn = this.$container.find('#clear-filters-btn');

    // Adiciona referência ao botão de limpar
    this.$clearButton = this.$container.find('.clear-input');

    // Atualiza visibilidade inicial do botão
    this.updateClearButtonVisibility();

    // Configura eventos dos filtros
    this.setupFilterEvents();
  }

  // Configura listeners para input de busca e interações do usuário
  setupEventListeners() {
    if (this.$input.length === 0 || this.$results.length === 0) return;

    // Debounce para evitar múltiplas requisições durante digitação
    let timeout = null;
    this.$input.on('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.handleSearch(false), this.options.debounceTime);
    });

    this.$input.on('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSearch(true);
      }
    });

    this.$searchButton.on('click', () => this.handleSearch(true));

    // Fecha resultados ao clicar fora
    $(document).on('click', (e) => { 
      if (!this.$container.has(e.target).length) this.hideResults(); 
    });

    // Adiciona evento para o botão de limpar
    this.$clearButton.on('click', () => {
      this.$input.val('');
      this.hideResults();
      this.updateClearButtonVisibility();
      this.$input.focus();
    });

    // Atualiza visibilidade do botão ao digitar
    this.$input.on('input', () => { 
      this.updateClearButtonVisibility(); 
    });
  }

  // Controla a visibilidade do botão de limpar
  updateClearButtonVisibility() {
    if (this.$input.val().length > 0) this.$clearButton.show();
    else this.$clearButton.hide();
  }

  // Configura eventos para interação com filtros de busca
  setupFilterEvents() {
    // Toggle do menu de filtros
    this.$filterBtn.on('click', () => { 
      this.$filterMenu.toggleClass('show'); 
    });

    // Fecha filtros ao clicar fora
    $(document).on('click', (e) => {
      if (!this.$container.has(e.target).length) this.$filterMenu.removeClass('show'); 
    });

    // Adiciona listeners para cada select de filtro
    const $filterSelects = this.$container.find('.filter-group select');
    $filterSelects.on('change', () => {
      this.filters = {
        genre: this.$container.find('#genre-filter').val(),
        date: this.$container.find('#date-filter').val(),
        rating: this.$container.find('#rating-filter').val(),
        status: this.$container.find('#status-filter').val(),
        season: this.$container.find('#season-filter').val(),
        source: this.$container.find('#source-filter').val()
      };
      
      // Atualiza visibilidade do botão de limpar filtros
      this.updateClearFiltersButtonVisibility();
      
      // Salva os filtros no localStorage para persistência
      localStorage.setItem('searchFilters', JSON.stringify(this.filters));
      
      this.handleSearch();
    });

    // Adiciona evento para o botão de limpar filtros
    if (this.$clearFiltersBtn.length) {
      this.$clearFiltersBtn.on('click', () => {
        this.clearAllFilters();
      });
    }

    // Adiciona listener específico para o filtro de data
    const $dateFilter = this.$container.find('#date-filter');
    const $customDateFilter = this.$container.find('#custom-date-filter');

    if ($dateFilter.length && $customDateFilter.length) {
      $dateFilter.on('change', () => {
        if ($dateFilter.val() === 'custom') $customDateFilter.removeClass('hidden');
        else $customDateFilter.addClass('hidden');
      });

      $customDateFilter.on('change', () => {
        this.filters.customDate = $customDateFilter.val();
        // Salva os filtros atualizados no localStorage
        localStorage.setItem('searchFilters', JSON.stringify(this.filters));
        this.handleSearch();
      });
    }

    // Adiciona tratamento especial para dispositivos móveis
    if (window.innerWidth <= 480) {
      // Fecha o menu de filtros ao tocar fora
      $(document).on('touchstart', (e) => {
        if (this.$filterMenu.hasClass('show') &&
            !this.$filterMenu.has(e.target).length &&
            !this.$filterBtn.has(e.target).length) this.$filterMenu.removeClass('show');
      });

      // Adiciona gesto de swipe down para fechar os filtros
      let touchStartY = 0;
      let touchEndY = 0;

      this.$filterMenu.on('touchstart', (e) => { 
        touchStartY = e.touches[0].clientY; 
      });

      this.$filterMenu.on('touchmove', (e) => {
        touchEndY = e.touches[0].clientY;
        const diffY = touchEndY - touchStartY;

        // Se arrastar mais de 50px para baixo
        if (diffY > 50) this.$filterMenu.removeClass('show');
      });
    }

    // Ajusta posição dos resultados baseado no viewport
    $(window).on('resize', () => {
      if (this.$results.length) {
        const rect = this.$input[0].getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        // Se houver pouco espaço abaixo
        if (spaceBelow < 300) this.$results.css('maxHeight', `${spaceBelow - 10}px`);
        else this.$results.css('maxHeight', '400px');
      }
    });
  }

  // Atualiza a visibilidade do botão de limpar filtros
  updateClearFiltersButtonVisibility() {
    if (!this.$clearFiltersBtn.length) return;
    
    // Verifica se algum filtro está aplicado
    const hasActiveFilters = Object.values(this.filters).some(value => value !== '');
    
    if (hasActiveFilters) this.$clearFiltersBtn.removeClass('hidden');
    else this.$clearFiltersBtn.addClass('hidden');
  }

  // Limpa todos os filtros aplicados
  clearAllFilters() {
    // Reseta todos os valores dos selects
    const $filterSelects = this.$container.find('.filter-group select');
    $filterSelects.val('');
    
    // Oculta o campo de data personalizada se estiver visível
    const $customDateFilter = this.$container.find('#custom-date-filter');
    if ($customDateFilter.length) {
      $customDateFilter.addClass('hidden');
      $customDateFilter.val('');
    }
    
    // Reseta o objeto de filtros
    this.filters = {
      genre: '',
      date: '',
      rating: '',
      status: '',
      season: '',
      source: ''
    };
    
    // Remove os filtros do localStorage
    localStorage.removeItem('searchFilters');
    
    // Atualiza visibilidade do botão
    this.updateClearFiltersButtonVisibility();
    
    // Refaz a busca com os filtros limpos
    this.handleSearch();
  }

  /**
   * Processa a busca e decide entre exibir resultados ou redirecionar
   * @param {boolean} redirect - Se true, redireciona para página de resultados
   */
  async handleSearch(redirect = false) {
    const query = this.$input.val().trim();

    if (query.length < this.options.minChars) {
      this.hideResults();
      return;
    }

    try {
      const results = await this.searchAnimes(query);

      if (redirect) {
        // Salva resultados e filtros no localStorage
        localStorage.setItem('searchResults', JSON.stringify(results));
        localStorage.setItem('searchFilters', JSON.stringify(this.filters));
        localStorage.setItem('searchQuery', query); // Salva o termo de busca atual
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

    const statusMatch = !this.filters.status || this.normalizeText(anime.status) === this.normalizeText(this.filters.status);

    const seasonMatch = !this.filters.season || (anime.season && this.normalizeText(anime.season.period) === this.normalizeText(this.filters.season));

    const ratingMatch = !this.filters.rating || (anime.score && parseFloat(anime.score) >= parseFloat(this.filters.rating));

    const sourceMatch = !this.filters.source || (anime.source && this.normalizeText(anime.source) === this.normalizeText(this.filters.source));

    return genreMatch && dateMatch && statusMatch && seasonMatch && ratingMatch && sourceMatch;
  }

  /**
   * Renderiza lista de resultados da busca
   * @param {Array} results - Array de animes encontrados
   */
  displayResults(results) {
    if (this.$results.length === 0) return;

    if (results.length === 0) {
      this.$results.html(`
        <div class="no-results">
          Nenhum anime encontrado
        </div>
      `);
    } else {
      this.$results.html(results
        .map(anime => this.createResultItem(anime))
        .join(''));
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
    if (this.$results.length === 0) return;

    this.$results.html(`
      <div class="no-results">
        Ocorreu um erro na busca
      </div>
    `);
    this.showResults();
  }

  // Métodos auxiliares para controle de visibilidade
  showResults() {
    if (this.$results.length) this.$results.show();
  }

  hideResults() {
    if (this.$results.length) this.$results.hide();
  }

  // Carrega busca anterior e filtros aplicados
  loadPreviousSearch() {
    // Verifica se há filtros salvos
    const savedFilters = localStorage.getItem('searchFilters');
    if (savedFilters) {
      try {
        this.filters = JSON.parse(savedFilters);
        this.applyFilterValues();
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error);
      }
    }

    // Tenta carregar termo de busca da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery && this.$input.length) {
      // Aplica o termo de busca da URL
      this.$input.val(decodeURIComponent(searchQuery));
      this.updateClearButtonVisibility();
    }
  }

  // Aplica valores dos filtros aos elementos de interface
  applyFilterValues() {
    if (this.$container.length === 0) return;

    // Aplica cada filtro ao seu respectivo elemento de interface
    Object.keys(this.filters).forEach(key => {
      const $filterSelect = this.$container.find(`#${key}-filter`);
      if ($filterSelect.length && this.filters[key]) $filterSelect.val(this.filters[key]);
    });

    // Trata caso especial do filtro de data personalizada
    if (this.filters.date === 'custom') {
      const $customDateFilter = this.$container.find('#custom-date-filter');
      if ($customDateFilter.length) {
        $customDateFilter.removeClass('hidden');
        if (this.filters.customDate) $customDateFilter.val(this.filters.customDate);
      }
    }

    // Atualiza visibilidade do botão de limpar filtros
    this.updateClearFiltersButtonVisibility();
  }
}

// Inicializa barra de busca com configurações personalizadas
$(document).ready(() => {
  new AnimeSearchBar({
    debounceTime: 400,
    maxResults: 8
  });
});