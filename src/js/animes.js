// Inicializa os gerenciadores
const userManager = new UserManager();
const animeManager = new AnimeManager();
const animeChat = new AnimeChat(); 

// Extrai parâmetros da URL de forma segura
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Busca anime por título principal ou alternativos
async function findAnimeByTitle(title) {
  try {
    // Tenta primeiro obter animes do cache para performance
    let animes = animeManager.getAnimesFromCache();
    
    // Se o cache estiver vazio, carrega do Firestore
    if (!animes || animes.length === 0) animes = await animeManager.getAnimes();
    
    return animes.find(anime =>
      anime.primaryTitle.toLowerCase() === title.toLowerCase() ||
      anime.alternativeTitles.some(alt => alt.title.toLowerCase() === title.toLowerCase())
    );
  } catch (error) {
    console.error('Erro ao buscar anime por título:', error);
    return null;
  }
}

// Converte URLs do YouTube para formato embed, suportando múltiplos formatos
function getYouTubeEmbedUrl(url) {
  if (!url) return '';

  // Padrões possíveis de URL do YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/
  ];

  // Tenta encontrar o ID do vídeo usando os padrões
  let videoId = '';
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }

  // Retorna a URL de embed se encontrou um ID, ou string vazia se não encontrou
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

const STAFF_LIMIT = 6; // Limite inicial de membros da staff mostrados

// Renderiza detalhes completos do anime na página
async function renderAnimeDetails(anime) {
  const container = document.getElementById('anime-content');
  const commentsSection = document.getElementById('comments-section');

  // Verifica se os elementos necessários existem
  if (!container || !commentsSection) {
    console.warn('Elementos necessários não encontrados no DOM');
    return;
  }

  if (!anime) {
    container.innerHTML = `
      <div class="no-anime-found">
        <h2>Anime não encontrado</h2>
        <p>O anime solicitado não está disponível em nossa base de dados.</p>
      </div>
    `;
    commentsSection.style.display = 'none';
    return;
  }

  const alternativeTitlesHtml = anime.alternativeTitles
    .map((t, index) => `
      <span class="alt-title">${t.title} (${t.type})</span>
      ${index < anime.alternativeTitles.length - 1 ? '<span class="title-separator">•</span>' : ''}
    `).join('');

  const genresHtml = anime.genres
    .map(genre => `<span class="genre-tag">${genre}</span>`)
    .join('');

  const embedUrl = getYouTubeEmbedUrl(anime.trailerUrl);

  // Formata a data de lançamento
  const releaseDate = anime.releaseDate ? new Date(anime.releaseDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Não informado';

  container.innerHTML = `
    <div class="anime-hero">
      <div class="hero-backdrop" style="background-image: url('${anime.coverImage}')"></div>
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <img src="${anime.coverImage}" alt="${anime.primaryTitle}" class="hero-cover">
        <div class="hero-info">
          <h1 class="text-4xl font-bold mb-2">${anime.primaryTitle}</h1>
          <div class="alternative-titles text-sm mb-4">
            ${alternativeTitlesHtml}
          </div>
          <div class="genres flex flex-wrap gap-2 mb-4">
            ${genresHtml}
          </div>
          <div class="anime-stats">
            <div class="stat-item">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              <div>
                <div class="stat-value">${Number(anime.score).toFixed(1)}</div>
                <div class="stat-label">Pontuação</div>
              </div>
            </div>
            <div class="stat-item">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <div>
                <div class="stat-value">${countAnimeFavorites(anime.primaryTitle)}</div>
                <div class="stat-label">Favoritos</div>
              </div>
            </div>
            <div class="stat-item">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
              </svg>
              <div>
                <div class="stat-value">${(JSON.parse(localStorage.getItem('animeComments')) || {})[anime.primaryTitle]?.length || 0}</div>
                <div class="stat-label">Comentários</div>
              </div>
            </div>
          </div>
          <button id="favorite-button" 
            onclick="toggleFavorite('${anime.primaryTitle}')"
            class="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors mt-4">
          </button>
        </div>
      </div>
    </div>

    <div class="anime-main-content">
      <div class="anime-primary-info">
        <h2 class="text-2xl font-bold mb-4">Sinopse</h2>
        <p class="text-lg leading-relaxed mb-8">${anime.synopsis}</p>

        ${embedUrl ? `
          <h2 class="text-2xl font-bold mb-4">Trailer</h2>
          <div class="trailer-container">
            <iframe 
              src="${embedUrl}"
              allowfullscreen
              class="w-full aspect-video rounded-lg shadow-md">
            </iframe>
          </div>
        ` : ''}
      </div>

      <div class="anime-secondary-info">
        <h2 class="text-xl font-bold mb-4">Informações</h2>
        <dl class="space-y-4">
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Episódios</dt>
            <dd>${anime.episodes}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Estúdio</dt>
            <dd>${anime.studio}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Status</dt>
            <dd>${anime.status || 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Classificação</dt>
            <dd>${anime.ageRating || 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Temporada</dt>
            <dd>${anime.season ? `${anime.season.period} ${anime.season.year}` : 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Duração</dt>
            <dd>${anime.episodeDuration ? `${anime.episodeDuration} min` : 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Produtores</dt>
            <dd>${anime.producers ? anime.producers.join(', ') : 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Licenciadores</dt>
            <dd>${anime.licensors ? anime.licensors.join(', ') : 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Fonte</dt>
            <dd>${anime.source || 'Não informado'}</dd>
          </div>
          <div class="detail-row">
            <dt class="text-sm font-semibold text-gray-500">Lançamento</dt>
            <dd>${releaseDate}</dd>
          </div>
        </dl>
      </div>
    </div>

    ${anime.staff && anime.staff.length > 0 ? `
      <div class="staff-section">
        <h2 class="section-title">Staff</h2>
        <div class="staff-grid ${anime.staff.length > STAFF_LIMIT ? 'collapsed' : ''}" id="staffGrid">
          ${anime.staff.map(member => `
            <div class="staff-card">
              <div>
                <div class="staff-name">${member.name}</div>
                <div class="staff-role">${formatRole(member.role)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        ${anime.staff.length > STAFF_LIMIT ? `
          <button class="staff-toggle-btn" onclick="toggleStaffGrid()">
            <span class="text">Ver mais</span>
            <svg class="icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ` : ''}
      </div>
    ` : ''}
  `;

  // Mostra a seção de comentários apenas para detalhes de um anime específico
  commentsSection.style.display = 'block';

  // Atualiza o título da página
  document.title = `${anime.primaryTitle} - Detalhes do Anime`;

  // Atualiza o estado inicial do botão de favorito
  updateFavoriteButton(anime.primaryTitle);

  // Adiciona renderização de animes relacionados após renderizar os detalhes do anime
  try {
    await renderRelatedAnimes(anime);
  } catch (error) {
    console.error('Erro ao renderizar animes relacionados:', error);
  }

  initParallax();
}

// Inicializa o efeito parallax
function initParallax() {
  const heroBackdrop = document.querySelector('.hero-backdrop');
  if (!heroBackdrop) return;

  let ticking = false;
  const PARALLAX_SPEED = 0.4;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        const parallaxOffset = scrolled * PARALLAX_SPEED;
        
        // Aplica a transformação com translate3d para melhor performance
        heroBackdrop.style.transform = `scale(1.1) translate3d(0, ${parallaxOffset}px, 0)`;
        ticking = false;
      });

      ticking = true;
    }
  });
}

// Padroniza categorias para busca e filtragem
function normalizeCategory(category) {
  const normalizations = {
    'action': ['ação', 'action', 'acao'],
    'drama': ['drama'],
    'comedy': ['comédia', 'comedy', 'comedia'],
    'fantasy': ['fantasia', 'fantasy'],
    'sci-fi': ['ficção científica', 'sci-fi', 'sci fi', 'ficcao cientifica'],
    'romance': ['romance', 'romântico', 'romantico'],
    'supernatural': ['sobrenatural', 'supernatural'],
    'game': ['game', 'games', 'jogos']
  };

  if (!category) return '';

  category = category.toLowerCase().trim();

  for (const [key, variants] of Object.entries(normalizations)) if (variants.includes(category)) return key;

  return category;
}

// Exibe lista de animes com filtro opcional por categoria
async function renderAllAnimes() {
  const container = document.getElementById('anime-content');
  const commentsSection = document.getElementById('comments-section');
  
  try {
    // Tenta primeiro obter animes do cache para performance
    let animes = animeManager.getAnimesFromCache();
    
    // Se o cache estiver vazio, carrega do Firestore
    if (!animes || animes.length === 0) animes = await animeManager.getAnimes();
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const statusFilter = urlParams.get('status');
    const seasonPeriod = urlParams.get('season');
    const seasonYear = urlParams.get('year');
    const currentUser = JSON.parse(localStorage.getItem('userSession'));

    if (commentsSection) commentsSection.style.display = 'none';

    if (!container) return;

    let filteredAnimes = animes;
    let pageTitle = 'Todos os Animes';
    let headerContent = '';

    // Aplica os filtros existentes
    if (seasonPeriod && seasonYear) {
      filteredAnimes = getSeasonalAnimes(seasonPeriod, seasonYear, animes);
      pageTitle = `Melhores Animes - ${formatSeason({ period: seasonPeriod, year: seasonYear })}`;
    } else if (statusFilter?.toLowerCase() === 'anunciado') {
      filteredAnimes = animes.filter(anime => anime.status?.toLowerCase() === 'anunciado')
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    } else if (categoryFilter) {
      filteredAnimes = animes.filter(anime =>
        anime.genres.some(genre => normalizeCategory(genre) === normalizeCategory(categoryFilter))
      );
    }

    if (filteredAnimes.length === 0) {
      container.innerHTML = `
        <div class="no-anime-found">
          <h2>Nenhum anime encontrado</h2>
          <p>Não encontramos animes ${seasonPeriod ? 
            `para a temporada ${formatSeason({ period: seasonPeriod, year: seasonYear })}` :
            statusFilter ? 'com o status: ' + statusFilter :
            categoryFilter ? 'na categoria: ' + categoryFilter : ''
          }</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      ${headerContent || `<h1 class="section-title text-2xl md:text-3xl lg:text-4xl my-4 md:my-6">${pageTitle}</h1>`}
      <div class="anime-grid">
        ${filteredAnimes.map(anime => `
          <div class="anime-card">
            <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" class="anime-card-link">
              <div class="image-wrapper">
                <img 
                  src="${anime.coverImage}" 
                  alt="${anime.primaryTitle}" 
                  class="anime-image"
                  onerror="this.src='https://ui-avatars.com/api/?name=Anime&background=8B5CF6&color=fff'">
              
                <div class="quick-info">
                  <span class="info-pill">⭐ ${Number(anime.score).toFixed(1)}</span>
                  <span class="info-pill">
                    <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
                    </svg>
                    ${anime.episodes > 0 ? anime.episodes : '?'} eps
                  </span>
                </div>
              </div>

              <div class="anime-info">
                <h3 class="anime-title line-clamp-2">${anime.primaryTitle}</h3>
                <div class="anime-meta">
                  <span class="meta-item">
                    <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                    </svg>
                    ${(JSON.parse(localStorage.getItem('animeComments')) || {})[anime.primaryTitle]?.length || 0}
                  </span>
                  <button 
                    class="meta-item favorite-count ${isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
                    data-anime-title="${anime.primaryTitle}"
                    data-anime-id="${anime.id || ''}"
                    ${!currentUser ? 'title="Faça login para favoritar"' : ''}
                  >
                    <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span class="favorite-number">${anime.favoriteCount || countAnimeFavorites(anime.primaryTitle)}</span>
                  </button>
                </div>
              </div>
            </a>
          </div>
        `).join('')}
      </div>
    `;

    document.title = pageTitle;
    
    // Adiciona eventos para os botões de favorito
    attachFavoriteButtonEvents();
  } catch (error) {
    console.error('Erro ao renderizar animes:', error);
    container.innerHTML = `
      <div class="no-anime-found">
        <h2>Erro ao carregar animes</h2>
        <p>Ocorreu um erro ao carregar os animes. Por favor, tente novamente mais tarde.</p>
      </div>`;
  }
}

// Formata temporada para exibição
function formatSeason(season) {
  if (!season) return '';
  const period = season.period.charAt(0).toUpperCase() + season.period.slice(1);
  return `${period} ${season.year}`;
}

// Filtra animes por temporada e ordena por pontuação
function getSeasonalAnimes(period, year, animesData) {
  // Recebe animes como parâmetro em vez de usar localStorage
  const animes = animesData || animeManager.getAnimesFromCache();

  const normalizedPeriod = period.toLowerCase().trim();
  const normalizedYear = parseInt(year);

  const filtered = animes.filter(anime => {
    // Normaliza a temporada do anime para minúsculo
    const animePeriod = anime.season?.period?.toLowerCase().trim();
    return anime.season && animePeriod === normalizedPeriod && anime.season.year === normalizedYear;
  });

  return filtered.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));
}

// Retorna temporadas disponíveis
async function getAvailableSeasons() {
  try {
    // Tenta primeiro obter animes do cache
    let animes = animeManager.getAnimesFromCache();
    
    // Se o cache estiver vazio, carrega do Firestore
    if (!animes || animes.length === 0) animes = await animeManager.getAnimes();
    
    const seasons = new Set();

    animes.forEach(anime => {
      if (anime.season?.period && anime.season?.year) seasons.add(`${anime.season.period}-${anime.season.year}`);
    });

    return Array.from(seasons)
      .map(s => {
        const [period, year] = s.split('-');
        return { period, year: parseInt(year) };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const periods = ['inverno', 'primavera', 'verão', 'outono'];
        return periods.indexOf(b.period.toLowerCase()) - periods.indexOf(a.period.toLowerCase());
      });
  } catch (error) {
    console.error('Erro ao obter temporadas disponíveis:', error);
    return [];
  }
}

// Exibe resultados de busca de animes
function renderSearchResults(query) {
  const container = document.getElementById('anime-content');
  const results = JSON.parse(localStorage.getItem('searchResults')) || [];
  const filters = JSON.parse(localStorage.getItem('searchFilters')) || {};
  const currentUser = JSON.parse(localStorage.getItem('userSession'));

  if (!container) return;

  document.title = `Resultados da busca: ${query}`;
  
  // Gera HTML dos filtros aplicados
  const filtersHtml = formatFilterDisplay(filters);
  
  // Número de resultados encontrados
  const resultsCount = `<span class="results-count">${results.length} ${results.length === 1 ? 'anime encontrado' : 'animes encontrados'}</span>`;

  container.innerHTML = `
    <h1 class="text-3xl font-bold mb-6">
      Resultados da busca: "${query}"
    </h1>
    ${filtersHtml ? `
    <div class="search-filters-display">
      ${filtersHtml}
    </div>` : ''}
    ${results.length === 0 ? `
      <div class="no-results">
        <p>Nenhum anime encontrado para sua busca.</p>
        ${filtersHtml ? '<p class="text-sm mt-2">Tente remover alguns filtros para ampliar os resultados.</p>' : ''}
      </div>
    ` : `
      <div class="mb-4 text-lg">${resultsCount}</div>
      <div class="anime-grid">
        ${results.map(anime => `
          <div class="anime-card">
            <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" class="anime-card-link">
              <div class="image-wrapper">
                <img 
                  src="${anime.coverImage}" 
                  alt="${anime.primaryTitle}" 
                  class="anime-image"
                  onerror="this.src='https://ui-avatars.com/api/?name=Anime&background=8B5CF6&color=fff'">
                
                <div class="quick-info">
                  <span class="info-pill">⭐ ${Number(anime.score).toFixed(1)}</span>
                  <span class="info-pill">
                    <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
                    </svg>
                    ${anime.episodes > 0 ? anime.episodes : '?'} eps
                  </span>
                </div>
              </div>

              <div class="anime-info">
                <h3 class="anime-title line-clamp-2">${anime.primaryTitle}</h3>
                <div class="anime-meta">
                  <span class="meta-item">
                    <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                    </svg>
                    ${(JSON.parse(localStorage.getItem('animeComments')) || {})[anime.primaryTitle]?.length || 0}
                  </span>
                  <button 
                    class="meta-item favorite-count ${isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
                    data-anime-title="${anime.primaryTitle}"
                    data-anime-id="${anime.id || ''}"
                    ${!currentUser ? 'title="Faça login para favoritar"' : ''}
                  >
                    <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span class="favorite-number">${anime.favoriteCount || countAnimeFavorites(anime.primaryTitle)}</span>
                  </button>
                </div>
              </div>
            </a>
          </div>
        `).join('')}
      </div>
    `}
  `;
  
  // Adiciona eventos para os botões de favorito
  attachFavoriteButtonEvents();
}

// Sistema de favoritos
function isAnimeFavorited(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) return false;

  // Primeiro tenta obter dados do usuário atualizados no cache
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = users.find(user => user.id === sessionData.userId);
  
  // Verifica se o usuário tem favoritos e se o anime está entre eles
  return currentUser && Array.isArray(currentUser.favoriteAnimes) && currentUser.favoriteAnimes.includes(animeTitle);
}

// Alterna estado de favorito do anime
async function toggleFavorite(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    alert('Você precisa estar logado para favoritar animes!');
    window.location.href = 'signin.html';
    return;
  }

  try {
    // Busca o ID do anime antes de prosseguir
    const animes = animeManager.getAnimesFromCache();
    const animeToUpdate = animes.find(anime => anime.primaryTitle === animeTitle);
    
    if (!animeToUpdate || !animeToUpdate.id) {
      console.error(`Anime não encontrado ou sem ID: ${animeTitle}`);
      return;
    }
    
    // Usa o método toggleAnimeFavorite do UserManager
    const result = await userManager.toggleAnimeFavorite(sessionData.userId, animeTitle);
    
    // Verifica o resultado da operação
    if (!result.success) {
      console.error('Erro ao atualizar favorito:', result.error);
      alert('Houve um problema ao salvar seu favorito. Por favor, tente novamente.');
      return;
    }
    
    // Define se o anime foi adicionado ou removido dos favoritos
    const wasAdded = result.isFavorited;
    const incrementValue = wasAdded ? 1 : -1;
    
    // Atualiza o contador de favoritos no Firestore
    await animeManager.updateFavoriteCount(animeToUpdate.id, incrementValue);
    
    // Obtém o anime atualizado para ter o valor correto de favoritos
    const updatedAnime = await animeManager.getAnimeById(animeToUpdate.id);
    const favoriteCount = updatedAnime ? (updatedAnime.favoriteCount || 0) : 0;
    
    // Atualiza todos os botões relacionados a este anime em toda a página
    updateAllFavoriteButtons(animeTitle, wasAdded, favoriteCount);
    
    // Atualiza as estatísticas em tempo real - utiliza a função de animes-chat.js
    if (typeof window.updateAnimeStats === 'function') window.updateAnimeStats(animeTitle);
    
    return result;
  } catch (error) {
    console.error('Erro ao atualizar favorito no Firestore:', error);
    alert('Houve um problema ao salvar seu favorito no servidor. Por favor, tente novamente mais tarde.');
  }
}

// Alterna favoritos a partir do card do anime
async function toggleFavoriteFromCard(animeTitle, event) {
  if (event) {
    event.preventDefault(); // Previne navegação ao clicar no botão
    event.stopPropagation(); // Impede a propagação do evento para links pai
  }
  
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  
  if (!sessionData) {
    alert('Você precisa estar logado para favoritar animes!');
    window.location.href = 'signin.html';
    return;
  }

  try {
    // Busca o ID do anime antes de prosseguir
    const animes = animeManager.getAnimesFromCache();
    const animeToUpdate = animes.find(anime => anime.primaryTitle === animeTitle);
    
    if (!animeToUpdate || !animeToUpdate.id) {
      console.error(`Anime não encontrado ou sem ID: ${animeTitle}`);
      return;
    }
    
    // Usa o método toggleAnimeFavorite do UserManager
    const result = await userManager.toggleAnimeFavorite(sessionData.userId, animeTitle);
    
    // Verifica o resultado da operação
    if (!result.success) {
      console.error('Erro ao atualizar favorito:', result.error);
      alert('Houve um problema ao salvar seu favorito. Por favor, tente novamente.');
      return;
    }
    
    // Define se o anime foi adicionado ou removido dos favoritos
    const wasAdded = result.isFavorited;
    const incrementValue = wasAdded ? 1 : -1;
    
    // Atualiza o contador de favoritos no Firestore
    await animeManager.updateFavoriteCount(animeToUpdate.id, incrementValue);
    
    // Obtém o anime atualizado para ter o valor correto de favoritos
    const updatedAnime = await animeManager.getAnimeById(animeToUpdate.id);
    const favoriteCount = updatedAnime ? (updatedAnime.favoriteCount || 0) : 0;
    
    // Atualiza todos os botões relacionados a este anime em toda a página
    updateAllFavoriteButtons(animeTitle, wasAdded, favoriteCount);
    
    // Atualiza as estatísticas em tempo real para a página de detalhes, se estiver nela
    if (window.location.search.includes(`anime=${encodeURIComponent(animeTitle)}`) && 
        typeof window.updateAnimeStats === 'function') window.updateAnimeStats(animeTitle);
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    alert('Houve um problema ao salvar seu favorito. Por favor, tente novamente.');
  }
}

// Atualiza todos os botões de favorito para um anime específico
function updateAllFavoriteButtons(animeTitle, isFavorited, count) {
  // Atualiza todos os botões de favorito nos cards
  const favoriteButtons = document.querySelectorAll(`.favorite-count[data-anime-title="${animeTitle}"], .meta-item.favorite-count`);
  
  favoriteButtons.forEach(button => {
    const buttonAnimeTitle = button.getAttribute('data-anime-title');
    const buttonLink = button.closest('a');
    
    // Verifica se este botão pertence ao anime em questão usando atributo ou link
    if (buttonAnimeTitle === animeTitle || (buttonLink && buttonLink.href &&
        buttonLink.href.includes(encodeURIComponent(animeTitle)))) {
      // Atualiza a classe para refletir o novo estado
      button.classList.toggle('is-favorited', isFavorited);
      
      // Atualiza o contador
      const countElement = button.querySelector('.favorite-number');
      if (countElement) countElement.textContent = count;
    }
  });
  
  // Atualiza o botão principal da página de detalhes se existir
  const mainButton = document.getElementById('favorite-button');
  if (mainButton) {
    mainButton.innerHTML = isFavorited ? 
      '❤️ Remover dos Favoritos' : 
      '🤍 Adicionar aos Favoritos';
    mainButton.classList.toggle('favorited', isFavorited);
    mainButton.setAttribute('data-anime-title', animeTitle);
  }
}

// Atualiza interface do botão de favoritos
function updateFavoriteButton(animeTitle) {
  const favoriteButton = document.getElementById('favorite-button');
  const isFavorited = isAnimeFavorited(animeTitle);

  if (favoriteButton) {
    favoriteButton.innerHTML = isFavorited ?
      '❤️ Remover dos Favoritos' :
      '🤍 Adicionar aos Favoritos';
    favoriteButton.classList.toggle('favorited', isFavorited);
    favoriteButton.setAttribute('data-anime-title', animeTitle);
  }
}

// Conta o número de usuários que favoritaram um anime específico
function countAnimeFavorites(animeTitle) {
  try {
    // Primeiro tenta buscar o valor do Firestore através do cache do AnimeManager
    const animes = animeManager.getAnimesFromCache();
    const anime = animes.find(a => a.primaryTitle === animeTitle);
    
    // Se tiver o valor favoriteCount no objeto do anime, usa esse valor 
    if (anime && typeof anime.favoriteCount === 'number') return anime.favoriteCount;
    
    // Fallback para contagem local caso o valor do Firestore não esteja disponível
    const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
    return users.reduce((total, user) => {
      if (Array.isArray(user.favoriteAnimes) && user.favoriteAnimes.includes(animeTitle)) return total + 1;
      return total;
    }, 0);
  } catch (error) {
    console.error('Erro ao contar favoritos:', error);
    return 0;
  }
}

// Calcula popularidade do anime baseado nas notas
function calculatePopularity(animeTitle) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    const animeComments = comments[animeTitle] || [];
    
    if (animeComments.length === 0) return 0;

    const score = parseFloat(animeComments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / animeComments.length);
    
    // Fórmula para calcular popularidade: (média das notas * 0.6) + (número de comentários * 0.4) * 10
    const popularityScore = (score * 0.6 + (animeComments.length * 0.4)) * 10;
    
    return Math.round(popularityScore);
  } catch (e) {
    console.error('Erro ao calcular popularidade:', e);
    return 0;
  }
}

// Atualiza ranking de popularidade de todos os animes
function updateAllAnimesPopularity() {
  try {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    
    // Calcula popularidade para cada anime
    const animesWithPopularity = animes.map(anime => ({
      ...anime,
      popularity: calculatePopularity(anime.primaryTitle)
    }));

    // Ordena por popularidade
    animesWithPopularity.sort((a, b) => b.popularity - a.popularity);

    // Atualiza o ranking (posição) de cada anime
    animesWithPopularity.forEach((anime, index) => {
      anime.popularityRank = index + 1;
    });

    // Salva de volta no localStorage
    localStorage.setItem('animeData', JSON.stringify(animesWithPopularity));
    
    return true;
  } catch (e) {
    console.error('Erro ao atualizar popularidade:', e);
    return false;
  }
}

// Encontra animes relacionados baseado em gêneros similares
async function findRelatedAnimes(currentAnime, limit = 10) {
  if (!currentAnime) return [];

  try {
    // Tenta primeiro obter animes do cache
    let animes = animeManager.getAnimesFromCache();
    
    // Se o cache estiver vazio, carrega do Firestore
    if (!animes || animes.length === 0) animes = await animeManager.getAnimes();
    
    const relatedAnimes = [];
    
    // Remove o anime atual da lista
    const otherAnimes = animes.filter(anime => anime.primaryTitle !== currentAnime.primaryTitle);
    
    // Calcula pontuação de similaridade para cada anime
    otherAnimes.forEach(anime => {
      let similarityScore = 0;
      
      // Pontos por gêneros em comum
      currentAnime.genres.forEach(genre => {
        if (anime.genres.includes(genre)) similarityScore += 2;
      });
      
      // Pontos por estúdio em comum
      if (currentAnime.studio && anime.studio === currentAnime.studio) similarityScore += 1;
      
      // Pontos por fonte similar
      if (currentAnime.source && anime.source === currentAnime.source) similarityScore += 1;
      
      // Pontos por temporada similar
      if (currentAnime.season && anime.season &&
          currentAnime.season.period === anime.season.period &&
          Math.abs(currentAnime.season.year - anime.season.year) <= 1) similarityScore += 1;

      if (similarityScore > 0) {
        relatedAnimes.push({
          ...anime,
          similarityScore
        });
      }
    });

    // Ordena por pontuação de similaridade e retorna os top N
    return relatedAnimes
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao encontrar animes relacionados:', error);
    return [];
  }
}

// Renderiza carrossel de animes relacionados com Swiper
async function renderRelatedAnimes(currentAnime) {
  const relatedSection = document.getElementById('related-animes-section');
  const swiperWrapper = document.getElementById('related-animes-wrapper');
  
  if (!relatedSection || !swiperWrapper || !currentAnime) return;

  try {
    // Aguarda a resolução da Promise de findRelatedAnimes
    const relatedAnimes = await findRelatedAnimes(currentAnime);
    
    if (!relatedAnimes || relatedAnimes.length === 0) {
      relatedSection.style.display = 'none';
      return;
    }

    // Mostra a seção
    relatedSection.style.display = 'block';
    
    // Renderiza os cards
    swiperWrapper.innerHTML = relatedAnimes.map(anime => `
      <div class="swiper-slide">
        <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" class="anime-card">
          <div class="image-wrapper">
            <img 
              src="${anime.coverImage}" 
              alt="${anime.primaryTitle}" 
              class="anime-image"
              onerror="this.src='https://ui-avatars.com/api/?name=Anime&background=8B5CF6&color=fff'">
            
            <div class="quick-info">
              <span class="info-pill">⭐ ${Number(anime.score).toFixed(1)}</span>
              <span class="info-pill">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
                </svg>
                ${anime.episodes > 0 ? anime.episodes : '?'} eps
              </span>
            </div>
          </div>

          <div class="anime-info">
            <h3 class="anime-title line-clamp-2">${anime.primaryTitle}</h3>
            <div class="anime-meta">
              <span class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                </svg>
                ${(JSON.parse(localStorage.getItem('animeComments')) || {})[anime.primaryTitle]?.length || 0}
              </span>
              <button 
                class="meta-item favorite-count ${isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
                data-anime-title="${anime.primaryTitle}"
                data-anime-id="${anime.id || ''}"
              >
                <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span class="favorite-number">${anime.favoriteCount || countAnimeFavorites(anime.primaryTitle)}</span>
              </button>
            </div>
          </div>
        </a>
      </div>
    `).join('');

    // Adiciona eventos para os botões de favorito
    attachFavoriteButtonEvents();

    // Inicializa o Swiper
    new Swiper('.related-swiper', {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.related-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: '.related-swiper .swiper-button-next',
        prevEl: '.related-swiper .swiper-button-prev',
      },
      breakpoints: {
        // quando a largura da janela é >= 640px
        640: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        // quando a largura da janela é >= 768px
        768: {
          slidesPerView: 4,
          spaceBetween: 20
        },
        // quando a largura da janela é >= 1024px
        1024: {
          slidesPerView: 5,
          spaceBetween: 20
        }
      }
    });
  } catch (error) {
    console.error('Erro ao renderizar animes relacionados:', error);
    relatedSection.style.display = 'none';
  }
}

// Inicialização da página
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Aguarda a inicialização do AnimeManager
    await animeManager.initCheck();
    
    // Atualiza popularidade ao carregar
    updateAllAnimesPopularity(); 

    const animeTitle = getUrlParameter('anime');
    const searchQuery = getUrlParameter('search');
    const nocache = getUrlParameter('nocache'); // Parâmetro para detectar limpeza de filtros

    // Executa uma nova busca sem filtros ou usa os resultados salvos anteriormente
    if (searchQuery) {
      if (nocache || !localStorage.getItem('searchResults')) await searchWithoutFilters(decodeURIComponent(searchQuery));
      else renderSearchResults(decodeURIComponent(searchQuery));
    } else if (animeTitle) {
      const anime = await findAnimeByTitle(decodeURIComponent(animeTitle));
      await renderAnimeDetails(anime);

      // Adiciona handler para o formulário de comentários
      const commentForm = document.getElementById('comment-form');
      if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          // Verifica se usuário está logado
          const session = localStorage.getItem('userSession');
          if (!session) {
            alert('Você precisa estar logado para comentar!');
            window.location.href = 'signin.html';
            return;
          }

          const commentText = document.getElementById('comment-text').value.trim();
          const ratingValue = document.getElementById('rating-slider').value;

          if (!commentText) {
            alert('Por favor, escreva um comentário.');
            return;
          }

          if (ratingValue === '0') {
            alert('Por favor, dê uma avaliação usando o slider.');
            return;
          }

          // Desabilita o botão de enviar durante a submissão
          const submitButton = commentForm.querySelector('button[type="submit"]');
          const originalText = submitButton.innerHTML;
          submitButton.disabled = true;
          submitButton.innerHTML = '<span class="animate-spin mr-2">⏳</span> Enviando...';

          try {
            const animeTitle = new URLSearchParams(window.location.search).get('anime');
            const result = await animeChat.saveComment(decodeURIComponent(animeTitle), commentText, ratingValue);
            
            if (result) {
              document.getElementById('comment-text').value = '';
              document.getElementById('rating-slider').value = '0';
              animeChat.updateRatingEmoji(0); // Reseta o emoji
              animeChat.updateCommentsList(decodeURIComponent(animeTitle));
            }
          } catch (error) {
            console.error('Erro ao enviar comentário:', error);
          } finally {
            // Reabilita o botão com o texto original
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
          }
        });
      }

      // Carrega comentários existentes
      animeChat.updateCommentsList(decodeURIComponent(animeTitle));
      
      // Adiciona eventos para os botões de favorito
      attachFavoriteButtonEvents();
    } else await renderAllAnimes(); // Se não houver parâmetros, mostra lista de todos os animes
  } catch (error) {
    console.error('Erro na inicialização da página:', error);
    document.getElementById('anime-content').innerHTML = `
      <div class="error-message">
        <h2>Erro ao carregar dados</h2>
        <p>Ocorreu um problema ao carregar os dados. Por favor, tente novamente mais tarde.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
});

// Evento para inicializar o slider de avaliação
document.addEventListener('DOMContentLoaded', function () {
  const slider = document.getElementById('rating-slider');
  if (slider) {
    slider.addEventListener('input', function () {
      animeChat.updateRatingEmoji(this.value);
    });
  }

  // Adiciona o contador de caracteres ao textarea
  const commentText = document.getElementById('comment-text');
  if (commentText) {
    commentText.setAttribute('maxlength', AnimeChat.MAX_COMMENT_LENGTH);
    commentText.insertAdjacentHTML('afterend',
      `<small id="comment-char-count" class="text-right block mt-1">0/${AnimeChat.MAX_COMMENT_LENGTH}</small>`
    );

    commentText.addEventListener('input', function () {
      const counter = document.getElementById('comment-char-count');
      counter.textContent = `${this.value.length}/${AnimeChat.MAX_COMMENT_LENGTH}`;
    });
  }

  const ratingInput = document.getElementById('rating-display');
  if (ratingInput) {
    ratingInput.addEventListener('input', function () {
      let value = parseFloat(this.value);

      // Valida o valor
      if (isNaN(value)) value = 0;
      if (value < 0) value = 0;
      if (value > 10) value = 10;

      // Multiplica por 10 e arredonda para garantir números com uma casa decimal
      value = Math.round(value * 10);

      // Atualiza o slider e emoji
      animeChat.updateRatingEmoji(value, false);
    });

    // Formata o valor quando o input perde o foco
    ratingInput.addEventListener('blur', function () {
      let value = parseFloat(this.value || 0);
      // Garante que o valor tenha apenas uma casa decimal
      this.value = (Math.round(value * 10) / 10).toFixed(1);
    });
  }

  const ratingSlider = document.getElementById('rating-slider');
  if (ratingSlider) {
    ratingSlider.addEventListener('input', function () {
      animeChat.updateRatingEmoji(this.value);
    });
  }
});

// Função auxiliar para formatar os papéis da staff
function formatRole(role) {
  const roles = {
    'director': 'Diretor',
    'writer': 'Roteirista',
    'composer': 'Compositor',
    'animator': 'Animador',
    'designer': 'Designer',
    'producer': 'Produtor',
    'other': 'Outro'
  };
  return roles[role.toLowerCase()] || role;
}

// Controla a expansão/contração da grid da staff
function toggleStaffGrid() {
  const grid = document.getElementById('staffGrid');
  const btn = document.querySelector('.staff-toggle-btn');
  const isCollapsed = grid.classList.contains('collapsed');
  
  grid.classList.toggle('collapsed');
  
  // Atualiza o texto e rotação do ícone
  if (isCollapsed) {
    btn.querySelector('.text').textContent = 'Ver menos';
    btn.classList.add('expanded');
  } else {
    btn.querySelector('.text').textContent = 'Ver mais';
    btn.classList.remove('expanded');
    // Scroll suave de volta ao topo da seção
    document.querySelector('.staff-section').scrollIntoView({ behavior: 'smooth' });
  }
}

// Alterna favoritos a partir do card do anime
async function toggleFavoriteFromCard(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  
  if (!sessionData) {
    alert('Você precisa estar logado para favoritar animes!');
    window.location.href = 'signin.html';
    return;
  }

  try {
    const result = await userManager.toggleAnimeFavorite(sessionData.userId, animeTitle);
    
    // Verifica o resultado da operação
    if (!result.success) {
      console.error('Erro ao atualizar favorito:', result.error);
      alert('Houve um problema ao salvar seu favorito. Por favor, tente novamente.');
      return;
    }
    
    // Define se o anime foi adicionado ou removido dos favoritos
    const wasAdded = result.isFavorited;
    const incrementValue = wasAdded ? 1 : -1;

    // Encontra o ID do anime para atualizar o contador no Firestore
    const animes = animeManager.getAnimesFromCache();
    const animeToUpdate = animes.find(anime => anime.primaryTitle === animeTitle);
    
    if (animeToUpdate && animeToUpdate.id) {
      // Atualiza o contador de favoritos no Firestore
      await animeManager.updateFavoriteCount(animeToUpdate.id, incrementValue);
      
      // Atualiza o contador no cache local também para consistência imediata
      animeToUpdate.favoriteCount = (animeToUpdate.favoriteCount || 0) + incrementValue;
      localStorage.setItem('animeData', JSON.stringify(animes));
    } else console.warn(`Não foi possível atualizar o Firestore: ID do anime não encontrado (${animeTitle})`);

    // O novo estado é o oposto do anterior
    const newState = !isAnimeFavorited(animeTitle);
    const updatedCount = countAnimeFavorites(animeTitle);
    
    // Atualiza a UI - todos os botões relacionados a este anime em toda a página
    updateAllFavoriteButtons(animeTitle, newState, updatedCount);
    
    // Atualiza as estatísticas em tempo real para a página de detalhes, se estiver nela
    if (window.location.search.includes(`anime=${encodeURIComponent(animeTitle)}`)) updateAnimeStats(animeTitle);
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    alert('Houve um problema ao salvar seu favorito. Por favor, tente novamente.');
  }
}

// Atualiza todos os botões de favorito para um anime específico
function updateAllFavoriteButtons(animeTitle, isFavorited, count) {
  // Atualiza todos os botões de favorito nos cards
  const favoriteButtons = document.querySelectorAll(`.favorite-count`);
  
  favoriteButtons.forEach(button => {
    const buttonLink = button.closest('a');
    
    // Verifica se este botão pertence ao anime em questão
    if (buttonLink && buttonLink.href.includes(encodeURIComponent(animeTitle))) {
      // Atualiza a classe para refletir o novo estado
      button.classList.toggle('is-favorited', isFavorited);
      
      // Atualiza o contador
      const countElement = button.querySelector('.favorite-number');
      if (countElement) countElement.textContent = count;
    }
  });
  
  // Atualiza o botão principal da página de detalhes se existir
  const mainButton = document.getElementById('favorite-button');
  if (mainButton) {
    mainButton.innerHTML = isFavorited ? 
      '❤️ Remover dos Favoritos' : 
      '🤍 Adicionar aos Favoritos';
    mainButton.classList.toggle('favorited', isFavorited);
  }
}

// Formata os filtros aplicados para exibição com ícones
function formatFilterDisplay(filters) {
  // Verifica se existe algum filtro aplicado
  const hasFilters = Object.values(filters).some(value => value !== '' && value !== undefined);
  if (!hasFilters) return '';
  
  const filterTags = [];
  
  // Gênero
  if (filters.genre) filterTags.push(`
    <span class="filter-tag genre">
      <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
      </svg>
      <span>Gênero: ${capitalizeFirstLetter(filters.genre)}</span>
    </span>
  `);
  
  // Data
  if (filters.date) {
    let dateLabel = '';
    switch (filters.date) {
      case 'this_season': dateLabel = 'Esta Temporada'; break;
      case 'this_year': dateLabel = 'Este Ano'; break;
      case 'last_year': dateLabel = 'Ano Passado'; break;
      case 'older': dateLabel = '2 Anos ou Mais'; break;
      case 'custom': dateLabel = `Data Personalizada: ${filters.customDate ? new Date(filters.customDate).toLocaleDateString('pt-BR') : 'N/A'}`; break;
      default: dateLabel = filters.date;
    }
    
    filterTags.push(`
      <span class="filter-tag date">
        <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
          <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
        </svg>
        <span>${dateLabel}</span>
      </span>
    `);
  }
  
  // Status
  if (filters.status) {
    let statusLabel = '';
    switch (filters.status) {
      case 'airing': statusLabel = 'Em exibição'; break;
      case 'completed': statusLabel = 'Completo'; break;
      case 'upcoming': statusLabel = 'Próximos'; break;
      default: statusLabel = filters.status;
    }
    
    filterTags.push(`
      <span class="filter-tag status">
        <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
        </svg>
        <span>Status: ${statusLabel}</span>
      </span>
    `);
  }
  
  // Temporada
  if (filters.season) {
    let seasonLabel = '';
    switch (filters.season) {
      case 'winter': seasonLabel = 'Inverno'; break;
      case 'spring': seasonLabel = 'Primavera'; break;
      case 'summer': seasonLabel = 'Verão'; break;
      case 'fall': seasonLabel = 'Outono'; break;
      default: seasonLabel = filters.season;
    }
    
    filterTags.push(`
      <span class="filter-tag season">
        <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 1.414V4H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h5v6h2v-6h3.532a1 1 0 0 0 .768-.36l1.933-2.32a.5.5 0 0 0 0-.64L13.3 4.36a1 1 0 0 0-.768-.36H9V1.414a1 1 0 0 0-2 0zM12.532 5l1.666 2-1.666 2H2V5h10.532z"/>
        </svg>
        <span>Temporada: ${seasonLabel}</span>
      </span>
    `);
  }
  
  // Classificação
  if (filters.rating) {
    filterTags.push(`
      <span class="filter-tag rating">
        <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
        <span>Classificação: ${filters.rating}+ ⭐</span>
      </span>
    `);
  }
  
  // Fonte
  if (filters.source) {
    let sourceLabel = '';
    switch (filters.source) {
      case 'manga': sourceLabel = 'Mangá'; break;
      case 'light_novel': sourceLabel = 'Light Novel'; break;
      case 'original': sourceLabel = 'Original'; break;
      case 'game': sourceLabel = 'Jogo'; break;
      case 'visual_novel': sourceLabel = 'Visual Novel'; break;
      default: sourceLabel = filters.source;
    }
    
    filterTags.push(`
      <span class="filter-tag source">
        <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
        </svg>
        <span>Fonte: ${sourceLabel}</span>
      </span>
    `);
  }

  // Monta a estrutura completa do container de filtros
  return `
    <div class="filters-header">
      <div class="filters-title">
        <svg class="filters-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4z"/>
        </svg>
        Filtros aplicados
      </div>
      <button class="clear-filters-btn" onclick="clearSearchFilters()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.83 5.146a.5.5 0 0 0 0 .708L7.975 8l-2.147 2.146a.5.5 0 0 0 .707.708l2.147-2.147 2.146 2.147a.5.5 0 0 0 .707-.708L9.39 8l2.146-2.146a.5.5 0 0 0-.707-.708L8.683 7.293 6.536 5.146a.5.5 0 0 0-.707 0z"/>
          <path d="M13.683 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.08a2 2 0 0 1-1.519-.698L.241 8.65a1 1 0 0 1 0-1.302L5.084 1.7A2 2 0 0 1 6.603 1h7.08zm-7.08 1a1 1 0 0 0-.76.35L1 8l4.844 5.65a1 1 0 0 0 .759.35h7.08a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-7.08z"/>
        </svg>
        Limpar filtros
      </button>
    </div>
    <div class="filter-tags-container">
      ${filterTags.join('')}
    </div>
  `;
}

// Função auxiliar para capitalizar a primeira letra
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Limpa os filtros da busca e recarrega a página
function clearSearchFilters() {
  const searchQuery = getUrlParameter('search');
  
  // Remove tanto os filtros quanto os resultados do localStorage
  localStorage.removeItem('searchFilters');
  localStorage.removeItem('searchResults');
  
  // Adiciona um timestamp para evitar cache e força uma nova busca
  if (searchQuery) window.location.href = `animes.html?search=${encodeURIComponent(searchQuery)}&nocache=${Date.now()}`;
}

// Realiza busca sem filtros
async function searchWithoutFilters(query) {
  try {
    // Tenta primeiro obter animes do cache
    let animes = animeManager.getAnimesFromCache();
    
    // Se o cache estiver vazio, carrega do Firestore
    if (!animes || animes.length === 0) animes = await animeManager.getAnimes();
    
    // Sistema de pontuação similar ao usado no AnimeSearchBar
    const results = animes
      .filter(anime => {
        // Busca simples que verifica se o título principal ou alternativo contém a consulta
        const matchesTitle = anime.primaryTitle.toLowerCase().includes(query.toLowerCase());
        const matchesAltTitle = anime.alternativeTitles.some(alt => alt.title.toLowerCase().includes(query.toLowerCase()));
        return matchesTitle || matchesAltTitle;
      })
      .sort((a, b) => {
        // Ordenação básica por pontuação
        return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
      });
    
    // Salva resultados e renderiza
    localStorage.setItem('searchResults', JSON.stringify(results));
    renderSearchResults(query);
  } catch (error) {
    console.error('Erro na busca de animes:', error);
    document.getElementById('anime-content').innerHTML = `
      <div class="error-message">
        <h2>Erro na busca</h2>
        <p>Ocorreu um problema ao realizar a busca. Por favor, tente novamente mais tarde.</p>
      </div>
    `;
  }
}

// Adiciona eventos aos botões de favoritos
function attachFavoriteButtonEvents() {
  // Seleciona todos os botões de favoritar
  const favoriteButtons = document.querySelectorAll('.favorite-count');
  
  // Adiciona o evento de clique para cada botão
  favoriteButtons.forEach(button => {
    // Remove evento anterior para evitar duplicação
    button.removeEventListener('click', handleFavoriteButtonClick);
    
    // Adiciona o novo evento
    button.addEventListener('click', handleFavoriteButtonClick);
  });
}

// Função de manipulação do clique de favoritos
function handleFavoriteButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.currentTarget;
  const animeTitle = button.getAttribute('data-anime-title');
  
  // Se não tiver o atributo data-anime-title, tenta obter do link pai
  if (!animeTitle) {
    const link = button.closest('a');
    if (link && link.href) {
      const match = link.href.match(/anime=([^&]+)/);
      if (match) toggleFavoriteFromCard(decodeURIComponent(match[1]));
    }
  } else toggleFavoriteFromCard(animeTitle);
}