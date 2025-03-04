// Extrai parâmetros da URL de forma segura
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Busca anime por título principal ou alternativos
function findAnimeByTitle(title) {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
  return animes.find(anime =>
    anime.primaryTitle.toLowerCase() === title.toLowerCase() ||
    anime.alternativeTitles.some(alt =>
      alt.title.toLowerCase() === title.toLowerCase()
    )
  );
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

// Adicione esta constante no topo do arquivo junto com as outras
const STAFF_LIMIT = 6; // Limite inicial de membros da staff mostrados

// Renderiza detalhes completos do anime na página
function renderAnimeDetails(anime) {
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

  // Formatar a data de lançamento
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
  renderRelatedAnimes(anime);

  // Adicione esta linha antes do return
  initParallax();
}

// Inicializa o efeito parallax
function initParallax() {
  const heroBackdrop = document.querySelector('.hero-backdrop');
  if (!heroBackdrop) return;

  let ticking = false;
  const PARALLAX_SPEED = 0.4; // Ajuste este valor para mudar a velocidade do efeito

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
function renderAllAnimes() {
  const container = document.getElementById('anime-content');
  const commentsSection = document.getElementById('comments-section');
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
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
    filteredAnimes = getSeasonalAnimes(seasonPeriod, seasonYear);
    pageTitle = `Melhores Animes - ${formatSeason({ period: seasonPeriod, year: seasonYear })}`;
  } else if (statusFilter?.toLowerCase() === 'anunciado') {
    filteredAnimes = animes.filter(anime => anime.status?.toLowerCase() === 'anunciado')
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
  } else if (categoryFilter) {
    filteredAnimes = animes.filter(anime =>
      anime.genres.some(genre =>
        normalizeCategory(genre) === normalizeCategory(categoryFilter)
      )
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
    ${headerContent || `<h1 class="text-3xl font-bold mb-6">${pageTitle}</h1>`}
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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
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
                  onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}')"
                  ${!currentUser ? 'title="Faça login para favoritar"' : ''}
                >
                  <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span class="favorite-number">${countAnimeFavorites(anime.primaryTitle)}</span>
                </button>
              </div>
            </div>
          </a>
        </div>
      `).join('')}
    </div>
  `;

  document.title = pageTitle;
}

// Formata temporada para exibição
function formatSeason(season) {
  if (!season) return '';
  const period = season.period.charAt(0).toUpperCase() + season.period.slice(1);
  return `${period} ${season.year}`;
}

// Filtra animes por temporada e ordena por pontuação
function getSeasonalAnimes(period, year) {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];

  const normalizedPeriod = period.toLowerCase().trim();
  const normalizedYear = parseInt(year);

  const filtered = animes.filter(anime => {
    // Normaliza a temporada do anime para minúsculo
    const animePeriod = anime.season?.period?.toLowerCase().trim();
    return anime.season &&
      animePeriod === normalizedPeriod &&
      anime.season.year === normalizedYear;
  });

  return filtered.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));
}

// Retorna temporadas disponíveis
function getAvailableSeasons() {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
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
}

// Gerencia sistema de comentários
function loadComments(animeTitle) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    return comments[animeTitle] || [];
  } catch (e) {
    console.warn('Erro ao carregar comentários:', e);
    return [];
  }
}

// Verifica limite de um comentário por usuário (exceto admin)
function hasUserAlreadyCommented(animeTitle, username) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    const animeComments = comments[animeTitle] || [];
    return animeComments.some(comment => comment.username === username);
  } catch (e) {
    console.error('Erro ao verificar comentário existente:', e);
    return false;
  }
}

const MAX_COMMENT_LENGTH = 500; // Limite de 500 caracteres para comentários

// Salva comentário com validação e moderação
function saveComment(animeTitle, comment, rating) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('userSession'));
    if (!currentUser) {
      alert('Você precisa estar logado para comentar!');
      return null;
    }

    // Verifica se o usuário é admin
    const isAdmin = currentUser.isAdmin || false;

    // Se não for admin, verifica se já comentou
    if (!isAdmin && hasUserAlreadyCommented(animeTitle, currentUser.username)) {
      alert('Você já fez um comentário neste anime. Apenas administradores podem fazer múltiplos comentários.');
      return null;
    }

    // Verifica o tamanho do comentário
    if (comment.length > MAX_COMMENT_LENGTH) {
      alert(`O comentário deve ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`);
      return null;
    }

    // Valida o conteúdo usando o ForumModerator
    try {
      ForumModerator.validateContent(comment, 'comentário');
    } catch (error) {
      alert(error.message);
      return null;
    }

    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    if (!comments[animeTitle]) comments[animeTitle] = [];

    const sliderRating = document.getElementById('rating-slider').value / 10;

    const newComment = {
      id: Date.now(),
      text: TextFormatter.format(comment), // Usa o TextFormatter para formatar o texto
      rating: sliderRating,
      username: currentUser.username,
      timestamp: new Date().toISOString()
    };

    comments[animeTitle].unshift(newComment);
    localStorage.setItem('animeComments', JSON.stringify(comments));

    // Atualiza a média de avaliações do anime
    updateAnimeRating(animeTitle);

    // Após salvar o comentário, atualiza a popularidade de todos os animes
    updateAllAnimesPopularity();

    return newComment;
  } catch (e) {
    console.error('Erro ao salvar comentário:', e);
    return null;
  }
}

// Atualiza score médio do anime baseado nos comentários
function updateAnimeRating(animeTitle) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    const animeComments = comments[animeTitle] || [];

    if (animeComments.length === 0) return;

    const totalRating = animeComments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    const averageRating = totalRating / animeComments.length;

    // Atualiza a avaliação no objeto do anime
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const animeIndex = animes.findIndex(a => a.primaryTitle === animeTitle);

    if (animeIndex !== -1) {
      animes[animeIndex].score = averageRating.toFixed(1);
      localStorage.setItem('animeData', JSON.stringify(animes));
    }
  } catch (e) {
    console.error('Erro ao atualizar avaliação:', e);
  }
}

// Formata data para exibição no padrão brasileiro
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Renderiza as estrelas
function renderStars(rating) {
  const starsTotal = 10;
  const fillPercentage = (rating / starsTotal) * 100;

  return `
    <div class="rating-display">
      <div class="stars-container">
        <div class="stars-empty">
          ${Array(starsTotal).fill('').map(() => '<i>★</i>').join('')}
        </div>
        <div class="stars-filled" style="width: ${fillPercentage}%">
          ${Array(starsTotal).fill('').map(() => '<i>★</i>').join('')}
        </div>
      </div>
      <span class="rating-number">${rating.toFixed(1)}</span>
    </div>
  `;
}

// Sistema de moderação de comentários
function deleteComment(animeTitle, commentId) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    if (!comments[animeTitle]) return false;

    // Filtra o comentário a ser removido
    comments[animeTitle] = comments[animeTitle].filter(comment => comment.id !== commentId);
    localStorage.setItem('animeComments', JSON.stringify(comments));

    // Atualiza a média de avaliações do anime
    updateAnimeRating(animeTitle);
    return true;
  } catch (e) {
    console.error('Erro ao deletar comentário:', e);
    return false;
  }
}

// Sistema de votação em comentários
function voteComment(animeTitle, commentId, voteType) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    if (!currentUser) {
      alert('Você precisa estar logado para votar!');
      return false;
    }

    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    const comment = comments[animeTitle].find(c => c.id === commentId);

    if (!comment) return false;

    // Inicializa arrays de votos se não existirem
    comment.likes = comment.likes || [];
    comment.dislikes = comment.dislikes || [];

    // Verifica se o usuário já votou
    const hasVotedThisWay = voteType === 'like' ?
      comment.likes.includes(currentUser) :
      comment.dislikes.includes(currentUser);

    // Remove todos os votos existentes do usuário
    comment.likes = comment.likes.filter(user => user !== currentUser);
    comment.dislikes = comment.dislikes.filter(user => user !== currentUser);

    // Se não tinha votado, adiciona o voto, senão o voto é apenas removido (toggle)
    if (!hasVotedThisWay) {
      if (voteType === 'like') comment.likes.push(currentUser);
      else if (voteType === 'dislike') comment.dislikes.push(currentUser);
    }

    localStorage.setItem('animeComments', JSON.stringify(comments));
    return true;
  } catch (e) {
    console.error('Erro ao votar:', e);
    return false;
  }
}

// Verifica voto existente do usuário em um comentário
function getUserVote(likes = [], dislikes = []) {
  const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
  if (!currentUser) return null;

  if (likes.includes(currentUser)) return 'like';
  if (dislikes.includes(currentUser)) return 'dislike';
  return null;
}

// Verifica permissões de administrador
function isUserAdmin() {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  return sessionData?.isAdmin || false;
}

// Sistema de edição de comentários com validação
function editComment(animeTitle, commentId, newText, newRating) {
  try {
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    if (!comments[animeTitle]) return false;

    const comment = comments[animeTitle].find(c => c.id === commentId);
    if (!comment) return false;

    // Verifica se o usuário atual é o dono do comentário
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    if (currentUser !== comment.username) return false;

    // Valida o conteúdo usando o ForumModerator
    try {
      ForumModerator.validateContent(newText, 'comentário');
    } catch (error) {
      alert(error.message);
      return false;
    }

    comment.text = TextFormatter.format(newText); // Usa o TextFormatter para formatar o texto
    comment.rating = newRating;
    comment.edited = true;
    comment.editedAt = new Date().toISOString();

    localStorage.setItem('animeComments', JSON.stringify(comments));

    // Atualiza a média de avaliações do anime
    updateAnimeRating(animeTitle);
    return true;
  } catch (e) {
    console.error('Erro ao editar comentário:', e);
    return false;
  }
}

// Interface de edição de comentários
function toggleEditMode(commentId) {
  const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
  const commentText = commentDiv.querySelector('.comment-text');
  const commentRating = commentDiv.querySelector('.comment-rating');
  const editForm = commentDiv.querySelector('.edit-form');

  if (editForm) {
    commentText.style.display = 'block';
    commentRating.style.display = 'block';
    editForm.remove();
  } else {
    const currentText = commentText.textContent;
    const currentRating = parseFloat(commentDiv.getAttribute('data-rating')) * 10;

    commentText.style.display = 'none';
    commentRating.style.display = 'none';

    const form = document.createElement('form');
    form.className = 'edit-form mt-2';
    form.innerHTML = `
      <div class="rating-container mb-4">
        <p class="mb-2 font-semibold">
          Sua avaliação: 
          <span class="rating-number-input">
            <input type="number" 
                   id="edit-rating-display"
                   class="text-purple-600 ml-2 w-16 text-center" 
                   min="0" 
                   max="10" 
                   step="0.1" 
                   value="${(currentRating / 10).toFixed(1)}">
          </span>
        </p>
        <div class="rating-slider-container">
          <input type="range" 
                 id="edit-rating-slider" 
                 min="0" 
                 max="100" 
                 value="${currentRating}"
                 class="rating-slider"
                 step="1">
          <div class="rating-emoji-container">
            <span id="edit-rating-emoji" class="rating-emoji">😊</span>
          </div>
        </div>
      </div>
      <div class="relative">
        <textarea 
          class="w-full p-2 border rounded resize-none dark:bg-gray-800"
          maxlength="${MAX_COMMENT_LENGTH}"
          oninput="updateCharCount(this, 'edit-comment-count-${commentId}')"
        >${currentText}</textarea>
        <small id="edit-comment-count-${commentId}" class="text-right block mt-1">0/${MAX_COMMENT_LENGTH}</small>
      </div>
      <div class="flex gap-2 mt-2">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <button type="button" onclick="toggleEditMode(${commentId})" class="btn btn-cancel">Cancelar</button>
      </div>
    `;

    commentText.insertAdjacentElement('afterend', form);

    // Inicializa o slider e input de avaliação na edição
    const editSlider = form.querySelector('#edit-rating-slider');
    const editInput = form.querySelector('#edit-rating-display');

    editSlider.addEventListener('input', function () {
      updateEditRatingDisplay(this.value);
    });

    editInput.addEventListener('input', function () {
      let value = parseFloat(this.value);

      // Valida o valor
      if (isNaN(value)) value = 0;
      if (value < 0) value = 0;
      if (value > 10) value = 10;

      // Multiplica por 10 para a escala do slider
      updateEditRatingDisplay(value * 10, false);
    });

    // Formata o valor quando o input perde o foco
    editInput.addEventListener('blur', function () {
      let value = parseFloat(this.value || 0);
      this.value = (Math.round(value * 10) / 10).toFixed(1);
    });

    updateEditRatingDisplay(currentRating);

    // Atualiza contador inicial
    const textarea = form.querySelector('textarea');
    const counter = form.querySelector(`#edit-comment-count-${commentId}`);
    counter.textContent = `${textarea.value.length}/${MAX_COMMENT_LENGTH}`;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newText = form.querySelector('textarea').value.trim();
      const newRating = parseFloat(form.querySelector('#edit-rating-slider').value) / 10;

      if (newText) {
        const animeTitle = new URLSearchParams(window.location.search).get('anime');
        if (editComment(decodeURIComponent(animeTitle), commentId, newText, newRating))  updateCommentsList(decodeURIComponent(animeTitle));
      }
    });
  }
}

// Atualiza interface visual da avaliação durante edição
function updateEditRatingDisplay(value, updateInput = true) {
  const emoji = document.getElementById('edit-rating-emoji');
  const display = document.getElementById('edit-rating-display');
  const slider = document.getElementById('edit-rating-slider');
  const rating = value / 10;

  // Adiciona classe de animação
  emoji.classList.remove('animate');
  void emoji.offsetWidth;
  emoji.classList.add('animate');

  // Define o emoji baseado no valor
  const emojiRanges = [
    { max: 0, emoji: '😶' },
    { max: 20, emoji: '😭' },
    { max: 40, emoji: '☹️' },
    { max: 60, emoji: '😐' },
    { max: 80, emoji: '😊' },
    { max: Infinity, emoji: '🤩' }
  ];

  emoji.textContent = emojiRanges.find(range => value <= range.max).emoji;

  // Atualiza os valores
  if (updateInput && display) display.value = rating.toFixed(1);
  if (!updateInput && slider) slider.value = Math.round(value);
}

// Recupera avatar do usuário ou gera placeholder
function getUserAvatar(username) {
  const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
  const user = users.find(u => u.username === username);
  return user ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B5CF6&color=ffffff&size=100`;
}

// Renderiza comentário individual com controles de moderação
function renderComment(comment, animeTitle) {
  const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
  const isCommentOwner = currentUser === comment.username;
  const userVote = getUserVote(comment.likes, comment.dislikes);
  const isAdmin = isUserAdmin();
  const canDelete = isCommentOwner || isAdmin;

  return `
    <div class="comment p-4 rounded-lg" data-comment-id="${comment.id}" data-rating="${comment.rating}">
      <div class="flex items-start gap-3">
        <img class="h-10 w-10 rounded-full object-cover"
             src="${getUserAvatar(comment.username)}"
             alt="${comment.username}">
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <div>
              <strong class="text-purple-600">${comment.username}</strong>
              <div class="comment-rating">${renderStars(comment.rating)}</div>
              <span class="text-sm text-gray-500">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="action-buttons">
              ${isCommentOwner ? `
                <button 
                  class="btn-action btn-edit" 
                  onclick="toggleEditMode(${comment.id})"
                  title="Editar comentário"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              ` : ''}
              ${canDelete ? `
                <button 
                  class="btn-action btn-delete"
                  onclick="if(confirm('Deseja realmente excluir este comentário?')) { 
                    deleteComment('${animeTitle}', ${comment.id}); 
                    updateCommentsList('${animeTitle}');
                  }"
                  title="${isAdmin && !isCommentOwner ? 'Excluir como administrador' : 'Excluir comentário'}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
          <p class="comment-text mt-2">${comment.text}</p>
          ${comment.edited ? `
            <small class="text-gray-500 italic">
              (editado em ${formatDate(comment.editedAt)})
            </small>
          ` : ''}
          <div class="vote-buttons mt-2">
            <button 
              class="vote-btn ${userVote === 'like' ? 'active' : ''}"
              onclick="voteComment('${animeTitle}', ${comment.id}, 'like') && updateCommentsList('${animeTitle}')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
              <span class="vote-count">${comment.likes?.length || 0}</span>
            </button>
            <button 
              class="vote-btn ${userVote === 'dislike' ? 'active' : ''}"
              onclick="voteComment('${animeTitle}', ${comment.id}, 'dislike') && updateCommentsList('${animeTitle}')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
              <span class="vote-count">${comment.dislikes?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Atualiza lista completa de comentários
function updateCommentsList(animeTitle) {
  const commentsList = document.getElementById('comments-list');
  const comments = loadComments(animeTitle);

  if (comments.length === 0) {
    commentsList.innerHTML = `
      <p class="text-center">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
    `;
    return;
  }

  commentsList.innerHTML = comments.map(comment => renderComment(comment, animeTitle)).join('');
}

// Gerenciamento de exibição de avaliações
function updateRatingDisplay(value) {
  const display = document.getElementById('rating-display');
  if (display) display.textContent = parseFloat(value).toFixed(1);
}

// Exibe resultados de busca de animes
function renderSearchResults(query) {
  const container = document.getElementById('anime-content');
  const results = JSON.parse(localStorage.getItem('searchResults')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));

  if (!container) return;

  document.title = `Resultados da busca: ${query}`;

  container.innerHTML = `
    <h1 class="text-3xl font-bold mb-6">
      Resultados da busca: "${query}"
    </h1>
    ${results.length === 0 ? `
      <div class="no-results">
        <p>Nenhum anime encontrado para sua busca.</p>
      </div>
    ` : `
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
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
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
                    onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}')"
                    ${!currentUser ? 'title="Faça login para favoritar"' : ''}
                  >
                    <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span class="favorite-number">${countAnimeFavorites(anime.primaryTitle)}</span>
                  </button>
                </div>
              </div>
            </a>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// Atualiza emoji da avaliação baseado no valor do slider
function updateRatingEmoji(value, updateInput = true) {
  const emoji = document.getElementById('rating-emoji');
  const display = document.getElementById('rating-display');
  const slider = document.getElementById('rating-slider');
  const rating = parseFloat(value) / 10;

  // Adiciona classe de animação
  emoji.classList.remove('animate');
  void emoji.offsetWidth;
  emoji.classList.add('animate');

  // Define o emoji baseado no valor
  const emojiRanges = [
    { max: 0, emoji: '😶' },
    { max: 20, emoji: '😭' },
    { max: 40, emoji: '☹️' },
    { max: 60, emoji: '😐' },
    { max: 80, emoji: '😊' },
    { max: Infinity, emoji: '🤩' }
  ];
  emoji.textContent = emojiRanges.find(range => value <= range.max).emoji;

  // Atualiza os valores com precisão de uma casa decimal
  if (updateInput && display) display.value = rating.toFixed(1);
  if (!updateInput && slider)  slider.value = Math.round(value);
}

// Sistema de favoritos
function isAnimeFavorited(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) return false;

  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = users.find(user => user.id === sessionData.userId);

  return currentUser?.favoriteAnimes?.includes(animeTitle) || false;
}

// Alterna estado de favorito do anime
function toggleFavorite(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    alert('Você precisa estar logado para favoritar animes!');
    window.location.href = 'signin.html';
    return;
  }

  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const userIndex = users.findIndex(user => user.id === sessionData.userId);

  if (userIndex === -1) return;

  // Inicializa o array de favoritos se não existir
  if (!users[userIndex].favoriteAnimes) {
    users[userIndex].favoriteAnimes = [];
  }

  const isFavorited = users[userIndex].favoriteAnimes.includes(animeTitle);

  if (isFavorited) {
    // Remove dos favoritos
    users[userIndex].favoriteAnimes = users[userIndex].favoriteAnimes.filter(
      title => title !== animeTitle
    );
  } else users[userIndex].favoriteAnimes.push(animeTitle); // Adiciona aos favoritos

  // Atualiza o localStorage
  localStorage.setItem('animuUsers', JSON.stringify(users));

  // Atualiza o botão
  updateFavoriteButton(animeTitle);
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
function findRelatedAnimes(currentAnime, limit = 10) {
  if (!currentAnime) return [];

  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
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
        Math.abs(currentAnime.season.year - anime.season.year) <= 1) {
      similarityScore += 1;
    }

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
}

// Renderiza carrossel de animes relacionados com Swiper
function renderRelatedAnimes(currentAnime) {
  const relatedSection = document.getElementById('related-animes-section');
  const swiperWrapper = document.getElementById('related-animes-wrapper');
  
  if (!relatedSection || !swiperWrapper || !currentAnime) return;

  const relatedAnimes = findRelatedAnimes(currentAnime);
  
  if (relatedAnimes.length === 0) {
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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/>
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
              onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}')"
            >
              <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="favorite-number">${countAnimeFavorites(anime.primaryTitle)}</span>
            </button>
          </div>
        </div>
      </a>
    </div>
  `).join('');

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
}

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
  updateAllAnimesPopularity(); // Atualiza popularidade ao carregar

  const animeTitle = getUrlParameter('anime');
  const searchQuery = getUrlParameter('search');

  if (searchQuery) {
    renderSearchResults(decodeURIComponent(searchQuery));
  } else if (animeTitle) {
    const anime = findAnimeByTitle(decodeURIComponent(animeTitle));
    renderAnimeDetails(anime);

    // Adiciona handler para o formulário de comentários
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => {
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

        saveComment(decodeURIComponent(animeTitle), commentText);
        document.getElementById('comment-text').value = '';
        document.getElementById('rating-slider').value = '0';
        updateRatingEmoji(0); // Reseta o emoji
        updateCommentsList(decodeURIComponent(animeTitle));
      });
    }

    // Carrega comentários existentes
    updateCommentsList(decodeURIComponent(animeTitle));
  } else renderAllAnimes(); // Se não houver parâmetros, mostra lista de todos os animes
});

// Evento para inicializar o slider de avaliação
document.addEventListener('DOMContentLoaded', function () {
  const slider = document.getElementById('rating-slider');
  if (slider) {
    slider.addEventListener('input', function () {
      updateRatingEmoji(this.value);
    });
  }

  // Adiciona o contador de caracteres ao textarea
  const commentText = document.getElementById('comment-text');
  if (commentText) {
    commentText.setAttribute('maxlength', MAX_COMMENT_LENGTH);
    commentText.insertAdjacentHTML('afterend',
      `<small id="comment-char-count" class="text-right block mt-1">0/${MAX_COMMENT_LENGTH}</small>`
    );

    commentText.addEventListener('input', function () {
      const counter = document.getElementById('comment-char-count');
      counter.textContent = `${this.value.length}/${MAX_COMMENT_LENGTH}`;
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
      updateRatingEmoji(value, false);
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
      updateRatingEmoji(this.value);
    });
  }
});

// Adicione esta função auxiliar para formatar os papéis da staff
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

// Adicione esta nova função para controlar a expansão/contração da grid
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