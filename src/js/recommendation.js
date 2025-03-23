// Inicializa os gerenciadores
const userManager = new UserManager();
const animeManager = new AnimeManager();

// Redireciona para login se não houver sessão ativa
document.addEventListener('DOMContentLoaded', async function () {
  // Verifica se o usuário está logado
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  // Inicializa recomendações
  await initializeRecommendations();

  // Atualiza avatar e nome do usuário
  await updateUserInfo();
});

// Inicializa sistema de recomendações e configurações da página
async function initializeRecommendations() {
  const user = await getCurrentUser();
  if (!user) {
    console.error('Usuário não encontrado');
    return;
  }

  // Usa AnimeManager para carregar os animes do cache
  const animes = animeManager.getAnimesFromCache();
  if (!animes || animes.length === 0) {
    console.error('Nenhum anime encontrado no cache');
    // Tenta carregar animes do Firestore
    try {
      await animeManager.getAnimes();
      initializeRecommendations(); // Tenta inicializar novamente após carregar
      return;
    } catch (error) {
      console.error('Erro ao carregar animes:', error);
      return;
    }
  }

  // Atualiza estatísticas
  updateStats(user);

  // Carrega as recomendações
  loadGenreBasedRecommendations(user);
  loadSimilarAnimeRecommendations(user);
  loadTrendingRecommendations();

  // Configura os filtros
  setupFilters();
}

// Retorna dados do usuário atual baseado na sessão usando UserManager
async function getCurrentUser() {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData || !sessionData.userId) return null;
  
  try {
    // Usa o método getUserById do UserManager
    const user = await userManager.getUserById(sessionData.userId);
    return user;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

// Gera recomendações baseadas nos gêneros favoritos do usuário
function loadGenreBasedRecommendations(user) {
  const animes = animeManager.getAnimesFromCache();
  const favoriteGenres = user.favoriteGenres || [];
  const watchedAnimes = user.watchedAnimes || [];
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};

  // Calcula pontuação baseada em múltiplos fatores
  const recommendations = animes.map(anime => {
    const genreScore = calculateGenreMatchScore(anime.genres, favoriteGenres);
    const watchHistoryScore = calculateWatchHistoryScore(anime, user, comments);
    const ratingScore = calculateRatingScore(anime, comments);

    const totalScore = (genreScore * 0.5) + (watchHistoryScore * 0.3) + (ratingScore * 0.2);

    return {
      ...anime,
      matchScore: totalScore,
      matchDetails: {
        genreScore,
        watchHistoryScore,
        ratingScore
      }
    };
  })
    .filter(anime => !watchedAnimes.includes(anime.primaryTitle))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  renderRecommendations(recommendations, 'genres-recommendations');
}

// Recomenda animes similares aos já assistidos pelo usuário
function loadSimilarAnimeRecommendations(user) {
  const animes = animeManager.getAnimesFromCache();
  const watchedAnimes = user.watchedAnimes || [];

  // Encontra animes similares baseado nos já assistidos
  const recommendations = animes
    .filter(anime => !watchedAnimes.includes(anime.primaryTitle))
    .map(anime => {
      const similarityScore = calculateSimilarityScore(anime, watchedAnimes, animes);
      return { ...anime, matchScore: similarityScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  renderRecommendations(recommendations, 'similar-recommendations');
}

// Lista animes em tendência baseado em comentários e avaliações
function loadTrendingRecommendations() {
  const animes = animeManager.getAnimesFromCache();
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};

  if (animes.length === 0) {
    console.warn('Nenhum anime encontrado no cache');
    return;
  }

  const recommendations = animes
    .map(anime => ({
      ...anime,
      matchScore: calculatePopularityScore(anime, comments)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  renderRecommendations(recommendations, 'trending-recommendations');
}

// Calcula porcentagem de compatibilidade entre gêneros do anime e preferências do usuário
function calculateGenreMatchScore(animeGenres, userGenres) {
  if (!userGenres?.length || !animeGenres?.length) return 50;

  const matchingGenres = animeGenres.filter(genre => userGenres.includes(genre));

  const matchScore = (matchingGenres.length / userGenres.length) * 100;
  return isNaN(matchScore) ? 50 : Math.min(matchScore, 100);
}

// Determina similaridade entre um anime e histórico do usuário
function calculateSimilarityScore(anime, watchedAnimes, allAnimes) {
  if (!watchedAnimes.length) return 0;

  const watchedAnimeObjects = allAnimes.filter(a => watchedAnimes.includes(a.primaryTitle));

  let totalScore = 0;
  watchedAnimeObjects.forEach(watched => {
    const genreMatch = calculateGenreMatchScore(anime.genres, watched.genres);
    const studioMatch = anime.studio === watched.studio ? 20 : 0;
    totalScore += genreMatch + studioMatch;
  });

  return totalScore / watchedAnimes.length;
}

// Calcula score de popularidade baseado em comentários, notas e visualizações
function calculatePopularityScore(anime, comments) {
  const animeComments = comments[anime.primaryTitle] || [];
  const commentScore = animeComments.length * 10;
  const ratingScore = (anime.score || 0) * 10;
  const watchCount = animeComments.length * 5; // Adiciona peso para quantidade de visualizações

  return commentScore + ratingScore + watchCount;
}

// Calcula a pontuação com dados do perfil
function calculateWatchHistoryScore(anime, user, comments) {
  if (!user.watchedAnimes?.length) return 50;

  const watchedGenres = new Map();
  const watchedStudios = new Map();
  const userComments = Object.values(comments)
    .flat()
    .filter(c => c.username === user.username);

  // Análise mais profunda do histórico
  user.watchedAnimes?.forEach(watchedTitle => {
    const watchedAnime = animeManager.getAnimesFromCache().find(a => a.primaryTitle === watchedTitle);

    if (watchedAnime) {
      // Contagem ponderada de gêneros
      watchedAnime.genres?.forEach(genre => {
        const currentCount = watchedGenres.get(genre) || 0;
        const userRating = getUserRatingForAnime(watchedTitle, userComments);
        const weight = userRating ? (userRating / 5) : 1;
        watchedGenres.set(genre, currentCount + weight);
      });

      // Contagem ponderada de estúdios
      const studioCount = watchedStudios.get(watchedAnime.studio) || 0;
      watchedStudios.set(watchedAnime.studio, studioCount + 1);
    }
  });

  let score = 0;

  // Pontuação por gêneros frequentes
  anime.genres?.forEach(genre => {
    const genreCount = watchedGenres.get(genre) || 0;
    score += (genreCount / user.watchedAnimes.length) * 40;
  });

  // Pontuação por estúdio favorito
  const studioCount = watchedStudios.get(anime.studio) || 0;
  score += (studioCount / user.watchedAnimes.length) * 30;

  // Bônus por atividade recente
  const recentActivity = calculateRecentActivityScore(user, anime.genres);
  score += recentActivity * 30;

  return Math.min(score, 100);
}

// Calcula pontuação baseada em atividade recente
function calculateRecentActivityScore(user, animeGenres) {
  const recentComments = getRecentComments(user.username);
  const recentFavorites = getRecentFavorites(user);
  let score = 0;

  // Analisa comentários recentes
  recentComments.forEach(comment => {
    const commentedAnime = animeManager.getAnimesFromCache().find(a => a.primaryTitle === comment.animeTitle);

    if (commentedAnime) {
      const matchingGenres = commentedAnime.genres.filter(genre => animeGenres.includes(genre));
      score += (matchingGenres.length / animeGenres.length) * 0.3;
    }
  });

  // Analisa favoritos recentes
  recentFavorites.forEach(favorite => {
    const favoriteAnime = animeManager.getAnimesFromCache().find(a => a.primaryTitle === favorite);

    if (favoriteAnime) {
      const matchingGenres = favoriteAnime.genres.filter(genre => animeGenres.includes(genre));
      score += (matchingGenres.length / animeGenres.length) * 0.4;
    }
  });

  return Math.min(score, 1);
}

// Obtém comentários recentes
function getRecentComments(username, days = 30) {
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  const now = new Date();
  const threshold = now.getTime() - (days * 24 * 60 * 60 * 1000);

  return Object.entries(comments)
    .flatMap(([animeTitle, animeComments]) =>
      animeComments
        .filter(c => c.username === username && new Date(c.timestamp).getTime() > threshold)
        .map(c => ({ ...c, animeTitle }))
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Obtém favoritos recentes
function getRecentFavorites(user, days = 30) {
  const favorites = user.favoriteAnimes || [];
  const favoriteDates = user.favoriteDates || {};
  const now = new Date();
  const threshold = now.getTime() - (days * 24 * 60 * 60 * 1000);

  return favorites.filter(anime => {
    const date = favoriteDates[anime];
    return date && new Date(date).getTime() > threshold;
  });
}

// Obtém avaliação do usuário para um anime
function getUserRatingForAnime(animeTitle, userComments) {
  const comment = userComments.find(c => c.animeTitle === animeTitle);
  return comment?.rating;
}

function calculateRatingScore(anime, comments) {
  const animeComments = comments[anime.primaryTitle] || [];
  const ratings = animeComments.map(c => c.rating).filter(Boolean);

  if (ratings.length === 0) return 50; // Score neutro para animes sem avaliações

  const avgRating = ratings.reduce((sum, rating) => sum + Number(rating), 0) / ratings.length;
  const normalizedScore = (avgRating / 5) * 100;

  return isNaN(normalizedScore) ? 50 : Math.min(normalizedScore, 100);
}

// Verifica se um anime está nos favoritos do usuário atual
async function isAnimeFavorited(animeTitle) {
  const user = await getCurrentUser();
  if (!user || !user.favoriteAnimes) return false;
  return user.favoriteAnimes.includes(animeTitle);
}

// Conta quantos usuários têm o anime como favorito
async function countAnimeFavorites(animeTitle) {
  try {
    const users = await userManager.loadUsers();
    return users.filter(user => 
      user.favoriteAnimes && user.favoriteAnimes.includes(animeTitle)
    ).length;
  } catch (error) {
    console.error("Erro ao contar favoritos:", error);
    return 0;
  }
}

// Adiciona ou remove um anime dos favoritos do usuário atual
async function toggleFavoriteFromCard(animeTitle, event) {
  // Impede propagação do evento para não abrir a página do anime
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const user = await getCurrentUser();
  if (!user) {
    alert("Você precisa estar logado para favoritar animes");
    return;
  }
  
  // Busca o ID do anime pelo título
  const animeId = await getAnimeIdByTitle(animeTitle);
  if (!animeId) {
    console.error(`Anime não encontrado: ${animeTitle}`);
    return;
  }

  try {
    // Verifica o estado atual antes da alteração
    const isFavorited = user.favoriteAnimes && user.favoriteAnimes.includes(animeTitle);
    
    if (!user.favoriteAnimes) user.favoriteAnimes = [];
    
    // Cria objeto de datas de favoritos se não existir
    if (!user.favoriteDates) user.favoriteDates = {};
    
    // Toggle favorito
    let newFavoritedState;
    if (isFavorited) {
      user.favoriteAnimes = user.favoriteAnimes.filter(anime => anime !== animeTitle);
      delete user.favoriteDates[animeTitle];
      newFavoritedState = false;
    } else {
      user.favoriteAnimes.push(animeTitle);
      user.favoriteDates[animeTitle] = new Date().toISOString();
      newFavoritedState = true;
    }
    
    // Determina se adicionou ou removeu dos favoritos
    const increment = newFavoritedState ? 1 : -1;
    
    // Salva as alterações no usuário
    await userManager.saveUser(user);
    
    // Atualiza o contador de favoritos no Firestore
    await animeManager.updateFavoriteCount(animeId, increment);
    
    // Obtém o anime atualizado do Firestore
    const updatedAnime = await animeManager.getAnimeById(animeId);
    const favoriteCount = updatedAnime ? (updatedAnime.favoriteCount || 0) : 0;
    
    // Atualiza a UI de todos os botões relacionados ao mesmo anime
    const allButtons = document.querySelectorAll(`[onclick*="${animeTitle}"]`);
    allButtons.forEach(btn => {
      btn.classList.toggle('is-favorited', newFavoritedState);
      const countElement = btn.querySelector('.favorite-number');
      if (countElement) {
        countElement.textContent = favoriteCount;
      }
    });
    
    console.log(`Anime ${animeTitle} ${newFavoritedState ? 'adicionado aos' : 'removido dos'} favoritos.`);
  } catch (error) {
    console.error("Erro ao salvar favorito:", error);
    alert("Ocorreu um erro ao salvar o favorito. Tente novamente.");
  }
}

// Função auxiliar para obter o ID do anime pelo título
async function getAnimeIdByTitle(animeTitle) {
  try {
    const animes = await animeManager.getAnimes();
    const anime = animes.find(a => a.primaryTitle === animeTitle);
    return anime ? anime.id : null;
  } catch (error) {
    console.error("Erro ao buscar ID do anime:", error);
    return null;
  }
}

// Renderiza cards de recomendação com lazy loading de imagens
async function renderRecommendations(recommendations, containerId) {
  const container = document.querySelector(`#${containerId} .grid-recommendations`);
  if (!container) {
    console.error(`Container não encontrado: ${containerId}`);
    return;
  }

  container.classList.add('loading');

  if (recommendations.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center p-8">
        <p class="text-gray-500 dark:text-gray-400">Nenhuma recomendação encontrada.</p>
      </div>`;
    container.classList.remove('loading');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const favoritesMap = new Map();
  const favoritedAnimes = new Set();

  // Verificar favoritos para todos os animes de uma vez para evitar chamadas múltiplas
  try {
    const users = await userManager.loadUsers();
    // Contar favoritos para cada anime
    for (const anime of recommendations) {
      const count = users.filter(user => user.favoriteAnimes && user.favoriteAnimes.includes(anime.primaryTitle)).length;
      favoritesMap.set(anime.primaryTitle, count);
    }
    
    // Verificar quais animes são favoritos do usuário atual
    if (currentUser) {
      const user = await getCurrentUser();
      if (user && user.favoriteAnimes) for (const favorite of user.favoriteAnimes) favoritedAnimes.add(favorite);
    }
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
  }

  const recommendationsHTML = recommendations.map(anime => {
    let formattedScore = 'N/A';
    if (typeof anime.score === 'number') formattedScore = anime.score.toFixed(1);
    else if (typeof anime.score === 'string' && !isNaN(parseFloat(anime.score))) formattedScore = parseFloat(anime.score).toFixed(1);

    const { genreScore = 50, watchHistoryScore = 50, ratingScore = 50 } = anime.matchDetails || {};
    const matchScore = isNaN(anime.matchScore) ? 50 : Math.round(anime.matchScore);
    
    const isFavorited = favoritedAnimes.has(anime.primaryTitle);
    const favoriteCount = favoritesMap.get(anime.primaryTitle) || 0;

    return `
      <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" class="anime-card">
        <div class="image-wrapper">
          <img 
            src="${anime.coverImage}" 
            alt="${anime.primaryTitle}" 
            class="anime-image"
            onerror="this.src='https://ui-avatars.com/api/?name=Anime&background=8B5CF6&color=fff'"
            loading="lazy">
          
          <div class="quick-info">
            <span class="info-pill">⭐ ${formattedScore}</span>
            <span class="info-pill">${matchScore}% Match</span>
          </div>
        </div>

        <div class="anime-info">
          <h3 class="anime-title line-clamp-2">${anime.primaryTitle}</h3>
          <div class="anime-meta">
            <div class="meta-items flex gap-2 text-xs">
              <span title="Compatibilidade de Gênero" class="meta-item">
                🎭 ${Math.round(genreScore) || 0}%
              </span>
              <span title="Baseado no Histórico" class="meta-item">
                📺 ${Math.round(watchHistoryScore) || 0}%
              </span>
            </div>
            <button 
              class="meta-item favorite-count ${isFavorited ? 'is-favorited' : ''}"
              onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}', event)"
              ${!currentUser ? 'title="Faça login para favoritar"' : ''}
            >
              <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="favorite-number">${favoriteCount}</span>
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');

  container.innerHTML = recommendationsHTML;
  container.classList.remove('loading');
}

// Configura filtros de visualização das recomendações
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-tab');
  const sections = document.querySelectorAll('.recommendation-section');
  const slider = document.querySelector('.filter-slider');
  
  // Inicializa o slider para o botão ativo (primeiro botão)
  if (slider && filterButtons.length > 0) {
    const activeButton = document.querySelector('.filter-tab.active');
    updateFilterSlider(activeButton, slider);
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Remove active de todos os botões
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Atualiza o slider
      if (slider) updateFilterSlider(button, slider);

      const filter = button.dataset.filter;

      // Adiciona classe de saída para animação
      sections.forEach(section => {
        if (section.classList.contains('active')) {
          section.classList.add('exiting');
          setTimeout(() => {
            section.classList.remove('exiting');
          }, 300);
        }
      });

      // Timeout para permitir a animação de saída
      setTimeout(async () => {
        // Atualiza visibilidade das seções
        sections.forEach(section => {
          if (filter === 'all') {
            section.style.display = 'block';
            section.classList.add('active');
          } else {
            if (section.id.includes(filter)) {
              section.style.display = 'block';
              section.classList.add('active');
            } else {
              section.style.display = 'none';
              section.classList.remove('active');
            }
          }
        });

        // Recarrega as recomendações da seção ativa
        const user = await getCurrentUser();
        if (user) {
          if (filter === 'all' || filter === 'genres') loadGenreBasedRecommendations(user);
          if (filter === 'all' || filter === 'similar') loadSimilarAnimeRecommendations(user);
          if (filter === 'all' || filter === 'trending') loadTrendingRecommendations();
        }
      }, 300);
    });
  });

  // Ajusta o slider na redimensão da janela
  window.addEventListener('resize', () => {
    const activeButton = document.querySelector('.filter-tab.active');
    if (activeButton && slider) updateFilterSlider(activeButton, slider);
  });
}

// Atualiza a posição e tamanho do slider para o botão ativo
function updateFilterSlider(activeButton, slider) {
  // Verifica se estamos em uma tela menor (responsivo)
  if (window.innerWidth <= 768) return;
  
  // Obtém posição e dimensões do botão ativo
  const rect = activeButton.getBoundingClientRect();
  const parentRect = activeButton.parentElement.getBoundingClientRect();
  
  // Calcula posição relativa dentro do container pai
  slider.style.width = `${rect.width}px`;
  slider.style.left = `${rect.left - parentRect.left}px`;
}

// Atualiza recomendações quando o tema é alterado
document.addEventListener('themeChanged', async function () {
  const user = await getCurrentUser();
  if (user) {
    loadGenreBasedRecommendations(user);
    loadSimilarAnimeRecommendations(user);
    loadTrendingRecommendations();
  }
});

// Atualiza recomendações em tendência a cada 5 minutos
function setupAutoRefresh() {
  setInterval(async () => {
    const user = await getCurrentUser();
    if (user) loadTrendingRecommendations(); // Atualiza apenas as tendências
  }, 300000); // Atualiza a cada 5 minutos
}

// Inicia atualização automática
setupAutoRefresh();

// Captura erros globais da página
window.addEventListener('error', function (e) {
  console.error('Erro na página de recomendações:', e.error);
});

// Atualiza métricas de uso: precisão das recomendações, animes assistidos e média de avaliações
function updateStats(user) {
  const watchedCount = user.watchedAnimes?.length || 0;
  const animes = animeManager.getAnimesFromCache();
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  
  // Calcula porcentagem de perfil completo
  const profileCompletionPercentage = calculateProfileCompletion(user);
  
  // Atualiza o elemento visual da porcentagem e o círculo de progresso
  const percentageElement = document.querySelector('.percentage');
  const progressCircle = document.querySelector('.recommendation-circle path.progress');
  const recommendationCircle = document.querySelector('.recommendation-circle');
  
  if (percentageElement) percentageElement.textContent = `${profileCompletionPercentage}%`;
  
  if (progressCircle) {
    // Remove qualquer animação existente
    progressCircle.style.animation = 'none';
    
    // Força um reflow para garantir que a remoção da animação seja aplicada
    void progressCircle.offsetWidth;
    
    // Define o valor de stroke-dasharray diretamente no elemento
    progressCircle.setAttribute('stroke-dasharray', `${profileCompletionPercentage}, 100`);
    
    // Define a variável CSS para animação futura
    document.documentElement.style.setProperty('--percent-value', profileCompletionPercentage);
    
    // Remove classes anteriores
    recommendationCircle.classList.remove('progress-low', 'progress-medium', 'progress-high', 'progress-complete');
    
    // Aplica a classe correspondente ao nível atual
    if (profileCompletionPercentage < 30) recommendationCircle.classList.add('progress-low');
    else if (profileCompletionPercentage < 60) recommendationCircle.classList.add('progress-medium');
    else if (profileCompletionPercentage < 85) recommendationCircle.classList.add('progress-high');
    else recommendationCircle.classList.add('progress-complete');
  }

  // Calcula precisão média das recomendações
  let totalMatchScore = 0;
  let matchCount = 0;

  animes.forEach(anime => {
    if (user.favoriteGenres?.some(genre => anime.genres.includes(genre))) {
      totalMatchScore += calculateGenreMatchScore(anime.genres, user.favoriteGenres);
      matchCount++;
    }
  });

  const averageMatch = matchCount > 0 ? Math.round(totalMatchScore / matchCount) : 0;

  // Calcula média de avaliações
  let totalRating = 0;
  let ratingCount = 0;

  Object.values(comments).flat().forEach(comment => {
    if (comment.rating) {
      totalRating += comment.rating;
      ratingCount++;
    }
  });

  const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'N/A';

  // Atualiza os elementos na página
  document.getElementById('match-accuracy').textContent = `${averageMatch}%`;
  document.getElementById('watched-count').textContent = watchedCount;
  document.getElementById('avg-rating').textContent = averageRating;

  // Atualiza barras de gêneros favoritos
  const genres = user.favoriteGenres || [];
  const genrePreferences = document.querySelector('.insight-content');

  if (genrePreferences && genres.length > 0) {
    const genreHTML = genres.slice(0, 3).map((genre, index) => {
      const percent = 100 - (index * 15); // Diminui 15% para cada posição
      return `
        <div class="genre-preference">
          <span class="genre-label">${genre}</span>
          <div class="genre-bar" style="--percent: ${percent}%"></div>
        </div>
      `;
    }).join('');

    genrePreferences.innerHTML = `<div class="insight-stat">${genreHTML}</div>`;
  }
}

// Calcula a porcentagem de conclusão do perfil do usuário
function calculateProfileCompletion(user) {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  // Verifica componentes do perfil
  if (user.username) { earnedPoints += 10; totalPoints += 10; }
  if (user.avatar) { earnedPoints += 10; totalPoints += 10; }
  if (user.bio) { earnedPoints += 5; totalPoints += 5; }
  
  // Engajamento com a plataforma
  const watchedCount = user.watchedAnimes?.length || 0;
  totalPoints += 25;
  earnedPoints += Math.min(25, watchedCount);
  
  const favoritesCount = user.favoriteAnimes?.length || 0;
  totalPoints += 15;
  earnedPoints += Math.min(15, favoritesCount * 3);
  
  const commentsCount = countUserComments(user.username);
  totalPoints += 15;
  earnedPoints += Math.min(15, commentsCount * 1.5);
  
  // Gêneros favoritos
  if (user.favoriteGenres && user.favoriteGenres.length > 0) earnedPoints += 10;
  totalPoints += 10;
  
  // Atividade recente
  const recentActivity = hasRecentActivity(user.username);
  if (recentActivity) earnedPoints += 10;
  totalPoints += 10;
  
  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);
  return completionPercentage;
}

// Conta o número de comentários feitos pelo usuário
function countUserComments(username) {
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  let count = 0;
  
  Object.values(comments).forEach(animeComments => {
    count += animeComments.filter(comment => comment.username === username).length;
  });
  
  return count;
}

// Verifica se o usuário tem atividade recente (últimos 7 dias)
function hasRecentActivity(username) {
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  for (const animeComments of Object.values(comments)) {
    for (const comment of animeComments) {
      if (comment.username === username) {
        const commentDate = new Date(comment.timestamp);
        if (commentDate > sevenDaysAgo) return true;
      }
    }
  }
  
  return false;
}

// Atualiza informações do usuário na interface
async function updateUserInfo() {
  const user = await getCurrentUser();
  if (!user) return;

  const avatarImg = document.querySelector('#user-panel img');
  const userName = document.getElementById('user-name');
  const logoutLink = document.getElementById('logout-link');

  if (avatarImg && userName) {
    avatarImg.src = user.avatar || 'https://via.placeholder.com/100';
    userName.textContent = user.username;
    logoutLink.classList.remove('hidden');
  }

  // Verifica se é admin
  if (user.isAdmin) document.getElementById('admin-panel')?.classList.remove('hidden');
}