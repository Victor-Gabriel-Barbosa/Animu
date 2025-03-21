/**
 * AnimeLoader
 * Responsável por carregar e renderizar animes em diferentes seções da aplicação
 */
class AnimeLoader {
  constructor(animeManager = null) {
    // Inicializa o AnimeManager automaticamente se não for fornecido
    this.animeManager = animeManager || new AnimeManager();
    this.localStorageKeys = {
      featured: 'featuredAnimes',
      seasonal: 'seasonalAnimes',
    };
  }

  // Método estático para inicializar o AnimeLoader
  static init() {
    // Verifica se estamos na página principal antes de inicializar
    if (AnimeLoader.isMainPage()) {
      const loader = new AnimeLoader();
      loader.registerAnimeEventHandlers();
      loader.initializeAnimePageData();
      
      // Retorna a instância criada para uso potencial em outros lugares
      return loader;
    }
    return null;
  }

  // Método estático para verificar se estamos na página principal
  static isMainPage() {
    const path = window.location.pathname;
    return path.endsWith('index.html') || path.endsWith('/') || path === '';
  }

  /**
   * Determina a temporada atual
   * @returns {Object} Objeto com temporada e ano
   */
  getCurrentSeason() {
    const date = new Date();
    const month = date.getMonth();

    let season;
    if (month >= 0 && month < 3) season = 'Inverno';
    else if (month >= 3 && month < 6) season = 'Primavera';
    else if (month >= 6 && month < 9) season = 'Verão';
    else season = 'Outono';

    return {
      season,
      year: date.getFullYear()
    };
  }

  // Verifica se um anime está na lista de favoritos do usuário atual
  isAnimeFavorited(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) return false;

    const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
    const currentUser = users.find(user => user.id === sessionData.userId);

    return currentUser?.favoriteAnimes?.includes(animeTitle) || false;
  }

  /**
   * Carrega animes em destaque
   * Ordenados por pontuação
   */
  async loadFeaturedAnimes() {
    try {
      // Utiliza o AnimeManager para obter animes ordenados por pontuação
      const animes = await this.animeManager.getAnimes('score');
      
      // Limita aos 16 melhores animes
      const featuredAnimes = animes.slice(0, 16);
      
      // Armazena temporariamente para uso na página
      localStorage.setItem(this.localStorageKeys.featured, JSON.stringify(featuredAnimes));
      
      // Renderiza os animes em destaque
      this.renderFeaturedAnimes(featuredAnimes);
      return featuredAnimes;
    } catch (error) {
      console.error("Erro ao carregar animes em destaque:", error);
      
      // Fallback: tenta usar dados em cache se disponíveis
      const cachedData = JSON.parse(localStorage.getItem(this.localStorageKeys.featured) || '[]');
      if (cachedData.length > 0) {
        this.renderFeaturedAnimes(cachedData);
        return cachedData;
      }
      return [];
    }
  }

  // Carrega animes da temporada atual
  async loadSeasonalAnimes() {
    try {
      const currentSeason = this.getCurrentSeason();
      
      // Obtém todos os animes e depois filtra localmente pela temporada
      const allAnimes = await this.animeManager.getAnimes();
      
      // Filtra animes da temporada atual
      const seasonalAnimes = allAnimes.filter(anime => {
        return anime.season?.period?.toLowerCase() === currentSeason.season.toLowerCase() &&
          parseInt(anime.season?.year) === currentSeason.year;
      })
      // Ordena por pontuação e limita aos 12 primeiros
      .sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))
      .slice(0, 12);
      
      console.log(`Animes da temporada carregados: ${seasonalAnimes.length}`);
      
      // Armazena temporariamente
      localStorage.setItem(this.localStorageKeys.seasonal, JSON.stringify(seasonalAnimes));
      
      // Renderiza os animes da temporada
      this.renderSeasonalAnimes(seasonalAnimes);
      
      // Caso não haja animes da temporada, tenta buscar animes recentes
      if (seasonalAnimes.length === 0) {
        console.log('Nenhum anime da temporada encontrado, buscando animes recentes...');
        this.loadRecentAnimes();
      }
      
      return seasonalAnimes;
    } catch (error) {
      console.error("Erro ao carregar animes da temporada:", error);
      
      // Fallback: tenta usar dados em cache
      const cachedData = JSON.parse(localStorage.getItem(this.localStorageKeys.seasonal) || '[]');
      if (cachedData.length > 0) {
        console.log('Usando dados de cache para animes da temporada');
        this.renderSeasonalAnimes(cachedData);
        return cachedData;
      } else this.loadRecentAnimes(); // Se não houver cache, tenta carregar animes recentes como alternativa
      return [];
    }
  }

  /**
   * Carrega animes recentes (caso não existam animes da temporada)
   */
  async loadRecentAnimes() {
    try {
      // Usa o AnimeManager para obter animes ordenados por data de criação
      const animes = await this.animeManager.getAnimes('createdAt');
      
      // Pega os 12 mais recentes
      const recentAnimes = animes.slice(0, 12);
      
      console.log(`Animes recentes carregados como alternativa: ${recentAnimes.length}`);
      
      // Renderiza os animes recentes no lugar dos da temporada
      if (recentAnimes.length > 0) this.renderSeasonalAnimes(recentAnimes);
      return recentAnimes;
    } catch (error) {
      console.error("Erro ao carregar animes recentes:", error);
      // Exibe mensagem de erro no carrossel
      const swiperWrapper = document.querySelector('.seasonal-swiper .swiper-wrapper');
      if (swiperWrapper) swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime disponível no momento.</p></div>';
      return [];
    }
  }

  /**
   * Renderiza animes em destaque
   * @param {Array} featuredAnimes - Lista de animes a serem renderizados
   */
  renderFeaturedAnimes(featuredAnimes) {
    const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
    if (!swiperWrapper) return;
    
    const currentUser = JSON.parse(localStorage.getItem('userSession'));

    if (featuredAnimes.length === 0) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime em destaque disponível.</p></div>';
      return;
    }

    swiperWrapper.innerHTML = featuredAnimes.map(anime => `
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
                ${anime.episodes > 0 ? anime.episodes : '?'}
              </span>
            </div>

            <div class="anime-overlay">
              <div class="overlay-content">
                <div class="anime-genres">
                  ${anime.genres.slice(0, 3).map(genre =>
                    `<span class="genre-tag">${genre}</span>`
                  ).join('')}
                </div>
                <p class="text-sm mt-2 line-clamp-3">${anime.synopsis || 'Sinopse não disponível.'}</p>
              </div>
            </div>
          </div>

          <div class="anime-info">
            <h3 class="anime-title line-clamp-2">${anime.primaryTitle}</h3>
            <div class="anime-meta">
              <span class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                </svg>
                ${anime.commentCount || 0}
              </span>
              <button 
                class="meta-item favorite-count ${this.isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
                onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}')"
                ${!currentUser ? 'title="Faça login para favoritar"' : ''}
              >
                <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span class="favorite-number">${anime.favoriteCount || 0}</span>
              </button>
            </div>
          </div>
        </a>
      </div>
    `).join('');

    // Inicializa o Swiper
    new Swiper('.featured-swiper', {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.featured-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: '.featured-swiper .swiper-button-next',
        prevEl: '.featured-swiper .swiper-button-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 5,
          spaceBetween: 20
        }
      }
    });
  }

  /**
   * Renderiza animes da temporada
   * @param {Array} seasonalAnimes - Lista de animes a serem renderizados
   */
  renderSeasonalAnimes(seasonalAnimes) {
    const swiperWrapper = document.querySelector('.seasonal-swiper .swiper-wrapper');
    if (!swiperWrapper) return;

    const currentUser = JSON.parse(localStorage.getItem('userSession'));

    if (seasonalAnimes.length === 0) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime da temporada disponível.</p></div>';
      return;
    }

    swiperWrapper.innerHTML = seasonalAnimes.map(anime => `
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
                ${anime.episodes > 0 ? anime.episodes : '?'}
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
                ${anime.commentCount || 0}
              </span>
              <button 
                class="meta-item favorite-count ${this.isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
                onclick="event.preventDefault(); toggleFavoriteFromCard('${anime.primaryTitle}')"
                ${!currentUser ? 'title="Faça login para favoritar"' : ''}
              >
                <svg class="meta-icon heart-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span class="favorite-number">${anime.favoriteCount || 0}</span>
              </button>
            </div>
          </div>
        </a>
      </div>
    `).join('');

    // Inicializa o Swiper
    new Swiper('.seasonal-swiper', {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.seasonal-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: '.seasonal-swiper .swiper-button-next',
        prevEl: '.seasonal-swiper .swiper-button-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 5,
          spaceBetween: 20
        }
      }
    });
  }

  // Inicializa a atualização do link da temporada atual
  updateCurrentSeasonLink() {
    const currentSeason = this.getCurrentSeason();
    const seasonLink = document.getElementById('current-season-link');
    const seasonText = document.getElementById('current-season-text');

    if (seasonLink && seasonText) {
      const seasonName = currentSeason.season.toLowerCase();
      const year = currentSeason.year;

      // Atualiza o href com a temporada atual
      seasonLink.href = `animes.html?season=${seasonName}&year=${year}`;

      // Atualiza o texto com a temporada atual
      seasonText.textContent = `Top animes de ${currentSeason.season} ${year}`;
    }
  }

  // Calcula pontuação para destaque do anime
  calculateHighlightScore(anime, comments) {
    const commentCount = comments[anime.primaryTitle]?.length || 0;
    const score = parseFloat(anime.score) || 0;
    // Fórmula: (nota * 0.7) + (número de comentários * 0.3)
    return (score * 0.7) + (commentCount * 0.3);
  }

  // Seleciona animes em destaque baseado em popularidade
  getFeaturedAnimesFromCache(limit = 16) {
    try {
      const animes = JSON.parse(localStorage.getItem('animeData')) || [];
      const comments = JSON.parse(localStorage.getItem('animeComments')) || {};

      // Calcula a pontuação de destaque para cada anime
      const scoredAnimes = animes.map(anime => ({
        ...anime,
        highlightScore: this.calculateHighlightScore(anime, comments)
      }));

      // Ordena os animes pela pontuação de destaque
      return scoredAnimes
        .sort((a, b) => b.highlightScore - a.highlightScore)
        .slice(0, limit);
    } catch (e) {
      console.error('Erro ao obter animes em destaque:', e);
      return [];
    }
  }

  // Conta quantidade de favoritos de um anime
  countAnimeFavorites(animeTitle) {
    try {
      const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
      return users.reduce((count, user) => {
        if (user.favoriteAnimes && user.favoriteAnimes.includes(animeTitle)) return count + 1;
        return count;
      }, 0);
    } catch (e) {
      console.error('Erro ao contar favoritos:', e);
      return 0;
    }
  }

  // Verifica se um anime está na lista de favoritos do usuário atual
  isAnimeFavorited(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) return false;

    const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
    const currentUser = users.find(user => user.id === sessionData.userId);

    return currentUser?.favoriteAnimes?.includes(animeTitle) || false;
  }

  // Alterna estado de favorito do anime
  async toggleFavorite(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) {
      window.location.href = 'signin.html';
      return;
    }

    const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
    const userIndex = users.findIndex(user => user.id === sessionData.userId);

    if (userIndex === -1) return;

    // Inicializa o array de favoritos se não existir
    if (!users[userIndex].favoriteAnimes) users[userIndex].favoriteAnimes = [];

    const isFavorited = users[userIndex].favoriteAnimes.includes(animeTitle);

    // Determina se vamos incrementar ou decrementar o contador
    const increment = isFavorited ? -1 : 1; 

    if (isFavorited) users[userIndex].favoriteAnimes = users[userIndex].favoriteAnimes.filter(title => title !== animeTitle); // Remove dos favoritos
    else users[userIndex].favoriteAnimes.push(animeTitle); // Adiciona aos favoritos

    // Atualiza o localStorage
    localStorage.setItem('animuUsers', JSON.stringify(users));
    
    // Atualiza o contador de favoritos usando o AnimeManager
    await this.updateAnimeFavoritesCount(animeTitle, increment);

    return !isFavorited; // Retorna o novo estado (true = favoritado, false = não favoritado)
  }

  // Atualiza contador de favoritos usando o AnimeManager
  async updateAnimeFavoritesCount(animeTitle, increment) {
    try {
      // Busca o ID do anime pelo título
      const animes = await this.animeManager.getAnimes();
      const anime = animes.find(a => a.primaryTitle === animeTitle);
      
      if (!anime) {
        console.warn(`Anime não encontrado: ${animeTitle}`);
        return;
      }
      
      // Usa o AnimeManager para atualizar o contador de favoritos
      await this.animeManager.updateFavoriteCount(anime.id, increment);
      
      console.log(`Contador de favoritos do anime ${animeTitle} atualizado (${increment > 0 ? '+' : ''}${increment})`);
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    }
  }

  // Gerencia favoritos a partir do card dos animes
  async toggleFavoriteFromCard(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) {
      window.location.href = 'signin.html';
      return;
    }

    const isFavoritedNow = await this.toggleFavorite(animeTitle);

    // Atualiza todos os botões do mesmo anime no carrossel
    const favoriteBtns = document.querySelectorAll(`[onclick*="${animeTitle}"]`);
    const newFavoriteCount = this.countAnimeFavorites(animeTitle);

    favoriteBtns.forEach(btn => {
      btn.classList.toggle('is-favorited', isFavoritedNow);
      const countElement = btn.querySelector('.favorite-number');
      if (countElement) countElement.textContent = newFavoriteCount;
    });
  }

  // Carrega reviews recentes dos animes
  async loadLatestReviews() {
    try {
      const reviewsList = document.getElementById('latest-reviews');
      if (!reviewsList) return;
      
      // Busca os comentários mais recentes
      const snapshot = await firebase.firestore()
        .collection('comments')
        .orderBy('timestamp', 'desc')
        .limit(3)
        .get();
      
      const latestReviews = [];
      const promises = [];
      
      snapshot.forEach(doc => {
        const commentData = doc.data();
        
        // Para cada comentário, busca o anime correspondente usando o AnimeManager
        const promise = this.animeManager.getAnimeById(commentData.animeId)
          .then(animeData => {
            if (animeData) {
              latestReviews.push({
                animeTitle: animeData.primaryTitle,
                comment: commentData
              });
            }
          });
        
        promises.push(promise);
      });
      
      await Promise.all(promises);
      
      // Renderiza os reviews
      reviewsList.innerHTML = latestReviews.map(review => `
        <li class="inicio-card-item">
          <a href="animes.html?anime=${encodeURIComponent(review.animeTitle)}" class="inicio-card-link hover:text-purple-600 transition-colors">
            <span class="inicio-card-link-title">${review.animeTitle}</span>
            <p class="inicio-card-link-subtitle">
              ${review.comment.text.length > 50
            ? review.comment.text.substring(0, 50) + '...'
            : review.comment.text}
            </p>
          </a>
        </li>
      `).join('') || '<li class="inicio-card-item">Nenhum review disponível</li>';
      
      return latestReviews;
    } catch (error) {
      console.error("Erro ao carregar reviews recentes:", error);
      
      // Fallback para método baseado em localStorage
      return this.loadLatestReviewsFromLocalStorage();
    }
  }

  // Fallback: Carrega reviews do localStorage quando Firestore falha
  loadLatestReviewsFromLocalStorage() {
    const reviewsList = document.getElementById('latest-reviews');
    if (!reviewsList) return [];

    // Recupera todos os comentários dos animes
    const allComments = JSON.parse(localStorage.getItem('animeComments')) || {};

    // Cria um array com todos os comentários e suas informações
    const reviews = Object.entries(allComments).flatMap(([animeTitle, comments]) =>
      comments.map(comment => ({
        animeTitle,
        comment,
        timestamp: new Date(comment.timestamp)
      }))
    );

    // Ordena por data, mais recentes primeiro
    reviews.sort((a, b) => b.timestamp - a.timestamp);

    // Pega os 3 reviews mais recentes
    const latestReviews = reviews.slice(0, 3);

    // Renderiza os reviews
    reviewsList.innerHTML = latestReviews.map(review => `
      <li class="inicio-card-item">
        <a href="animes.html?anime=${encodeURIComponent(review.animeTitle)}" class="inicio-card-link hover:text-purple-600 transition-colors">
          <span class="inicio-card-link-title">${review.animeTitle}</span>
          <p class="inicio-card-link-subtitle">
            ${review.comment.text.length > 50
        ? review.comment.text.substring(0, 50) + '...'
        : review.comment.text}
          </p>
        </a>
      </li>
    `).join('') || '<li class="inicio-card-item">Nenhum review disponível</li>';

    return latestReviews;
  }

  // Sincroniza contadores de favoritos
  async syncAnimeFavorites() {
    try {
      // Obter todos os animes usando o AnimeManager
      const animes = await this.animeManager.getAnimes();
      const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      
      // Para cada anime, conta os favoritos e atualiza usando o AnimeManager
      for (const anime of animes) {
        const favoriteCount = users.reduce((count, user) => {
          if (user.favoriteAnimes && user.favoriteAnimes.includes(anime.primaryTitle)) return count + 1;
          return count;
        }, 0);
        
        // Atualiza usando o AnimeManager - passando o ID do anime
        try {
          // Pega a diferença entre o valor atual e o desejado
          const increment = favoriteCount - (anime.favoriteCount || 0);
          if (increment !== 0) {
            await this.animeManager.updateFavoriteCount(anime.id, increment);
            console.log(`Contador de favoritos sincronizado para ${anime.primaryTitle}: ${favoriteCount}`);
          }
        } catch (e) {
          console.error(`Erro ao sincronizar favoritos para ${anime.primaryTitle}:`, e);
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar contadores de favoritos:", error);
    }
  }

  // Inicializa os dados da página inicial relacionados a animes
  async initializeAnimePageData() {
    try {
      // Atualiza o link da temporada atual
      this.updateCurrentSeasonLink();
      
      // Carrega os dados de animes
      await Promise.all([
        this.loadFeaturedAnimes(),
        this.loadSeasonalAnimes(),
        this.loadLatestReviews()
      ]);
      
      console.log("Dados de animes inicializados com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao inicializar dados de animes:", error);
      return false;
    }
  }

  // Registra manipuladores de eventos relacionados a animes
  registerAnimeEventHandlers() {
    // Exponha as funções necessárias para manipulação de eventos
    window.toggleFavoriteFromCard = (animeTitle) => this.toggleFavoriteFromCard(animeTitle);
  }
}

// Exporta a classe para uso global
window.AnimeLoader = AnimeLoader;

// Inicializa o AnimeLoader automaticamente quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o AnimeLoader se estivermos na página principal
  window.animeLoader = AnimeLoader.init();
});