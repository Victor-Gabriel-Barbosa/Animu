// Classe responsável por carregar e renderizar animes em diferentes seções da aplicação
class AnimeLoader {
  constructor(animeManager = null) {
    // Inicializa o AnimeManager automaticamente se não for fornecido
    this.animeManager = animeManager || new AnimeManager();
    // Inicializa o UserManager para gerenciar os usuários
    this.userManager = new UserManager();
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
  async isAnimeFavorited(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) return false;

    try {
      // Usa o UserManager para verificar se o anime está nos favoritos
      return await this.userManager.isAnimeFavorited(sessionData.userId, animeTitle);
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
      return false;
    }
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
  async renderFeaturedAnimes(featuredAnimes) {
    const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
    if (!swiperWrapper) return;
    
    const currentUser = JSON.parse(localStorage.getItem('userSession'));

    if (featuredAnimes.length === 0) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime em destaque disponível.</p></div>';
      return;
    }

    // Para cada anime, verifica se está na lista de favoritos do usuário atual
    if (currentUser) {
      // Verifica favoritos para cada anime
      for (let anime of featuredAnimes) anime.isFavorited = await this.isAnimeFavorited(anime.primaryTitle);
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
                class="meta-item favorite-count ${anime.isFavorited ? 'is-favorited' : ''}"
                data-anime-title="${anime.primaryTitle}"
                data-anime-id="${anime.id || ''}"
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

    // Adiciona eventos de clique para os botões de favoritar
    this.attachFavoriteButtonEvents(swiperWrapper);

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
  async renderSeasonalAnimes(seasonalAnimes) {
    const swiperWrapper = document.querySelector('.seasonal-swiper .swiper-wrapper');
    if (!swiperWrapper) return;

    const currentUser = JSON.parse(localStorage.getItem('userSession'));

    if (seasonalAnimes.length === 0) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime da temporada disponível.</p></div>';
      return;
    }

    // Para cada anime, verifica se está na lista de favoritos do usuário atual
    if (currentUser) {
      // Verifica favoritos para cada anime
      for (let anime of seasonalAnimes) anime.isFavorited = await this.isAnimeFavorited(anime.primaryTitle);
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
                class="meta-item favorite-count ${anime.isFavorited ? 'is-favorited' : ''}"
                data-anime-title="${anime.primaryTitle}"
                data-anime-id="${anime.id || ''}"
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

    // Adiciona eventos de clique para os botões de favoritar
    this.attachFavoriteButtonEvents(swiperWrapper);

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

  // Alterna estado de favorito do anime
  async toggleFavorite(animeTitle) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) {
      window.location.href = 'signin.html';
      return;
    }

    try {
      // Busca o ID do anime pelo título
      const animeId = await this.getAnimeIdByTitle(animeTitle);
      if (!animeId) {
        console.error(`Anime não encontrado: ${animeTitle}`);
        return;
      }

      // Usa o UserManager para alternar o favorito
      const result = await this.userManager.toggleAnimeFavorite(sessionData.userId, animeTitle);
      
      if (result.success) {
        // Determina se adicionou ou removeu dos favoritos
        const increment = result.isFavorited ? 1 : -1;
        
        // Atualiza o contador de favoritos no Firestore
        await this.animeManager.updateFavoriteCount(animeId, increment);
        
        return result.isFavorited;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
      return false;
    }
  }

  // Busca o ID do anime pelo título
  async getAnimeIdByTitle(animeTitle) {
    try {
      const animes = await this.animeManager.getAnimes();
      const anime = animes.find(a => a.primaryTitle === animeTitle);
      return anime ? anime.id : null;
    } catch (error) {
      console.error("Erro ao buscar ID do anime:", error);
      return null;
    }
  }

  // Atualiza contador de favoritos usando o AnimeManager - não utilizado mais diretamente
  async updateAnimeFavoritesCount(animeTitle, increment) {
    try {
      const animeId = await this.getAnimeIdByTitle(animeTitle);
      if (!animeId) {
        console.warn(`Anime não encontrado: ${animeTitle}`);
        return;
      }
      
      await this.animeManager.updateFavoriteCount(animeId, increment);
      console.log(`Contador de favoritos do anime ${animeTitle} atualizado (${increment > 0 ? '+' : ''}${increment})`);
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    }
  }

  // Gerencia favoritos a partir do card dos animes
  async toggleFavoriteFromCard(animeTitle) {
    event.preventDefault(); // Previne navegação ao clicar no botão
    
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) {
      window.location.href = 'signin.html';
      return;
    }

    try {
      const isFavoritedNow = await this.toggleFavorite(animeTitle);

      // Busca o novo valor atualizado no Firestore
      const animeId = await this.getAnimeIdByTitle(animeTitle);
      if (animeId) {
        // Obtém os dados atualizados do anime
        const animeData = await this.animeManager.getAnimeById(animeId);
        const newCount = animeData ? (animeData.favoriteCount || 0) : 0;

        // Atualiza todos os botões do mesmo anime no carrossel
        const favoriteBtns = document.querySelectorAll(`[onclick*="${animeTitle}"]`);
        
        favoriteBtns.forEach(btn => {
          btn.classList.toggle('is-favorited', isFavoritedNow);
          const countElement = btn.querySelector('.favorite-number');
          if (countElement) countElement.textContent = newCount;
        });
      }
    } catch (error) {
      console.error("Erro ao gerenciar favorito:", error);
    }
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

  // Anexa eventos aos botões de favoritos
  attachFavoriteButtonEvents(container) {
    // Seleciona todos os botões de favoritar dentro do container
    const favoriteButtons = container.querySelectorAll('.favorite-count');
    
    // Adiciona o evento de clique para cada botão
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const animeTitle = button.getAttribute('data-anime-title');
        const animeId = button.getAttribute('data-anime-id');
        
        await this.handleFavoriteClick(animeTitle, animeId, button);
      });
    });
  }

  // Gerencia o clique no botão de favorito
  async handleFavoriteClick(animeTitle, animeId, buttonElement) {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    if (!sessionData) {
      window.location.href = 'signin.html';
      return;
    }

    try {
      // Verifica o estado atual antes da alteração
      const currentState = await this.isAnimeFavorited(animeTitle);
      
      // Busca o ID do anime se não foi fornecido
      let validAnimeId = animeId;
      if (!validAnimeId) {
        validAnimeId = await this.getAnimeIdByTitle(animeTitle);
        if (!validAnimeId) {
          console.error(`Anime não encontrado: ${animeTitle}`);
          return;
        }
      }

      // Usa o UserManager para alternar o favorito
      const result = await this.userManager.toggleAnimeFavorite(sessionData.userId, animeTitle);
      
      if (result.success) {
        // Determina se adicionou ou removeu dos favoritos
        const increment = result.isFavorited ? 1 : -1;
        
        // Atualiza o contador de favoritos no Firestore
        await this.animeManager.updateFavoriteCount(validAnimeId, increment);
        
        // Obtém o anime atualizado do Firestore
        const updatedAnime = await this.animeManager.getAnimeById(validAnimeId);
        const favoriteCount = updatedAnime ? (updatedAnime.favoriteCount || 0) : 0;
        
        // Atualiza o botão clicado
        buttonElement.classList.toggle('is-favorited', result.isFavorited);
        const countElement = buttonElement.querySelector('.favorite-number');
        if (countElement) {
          countElement.textContent = favoriteCount;
        }
        
        // Atualiza todos os outros botões do mesmo anime
        const allButtons = document.querySelectorAll(`.favorite-count[data-anime-title="${animeTitle}"]`);
        allButtons.forEach(btn => {
          if (btn !== buttonElement) {
            btn.classList.toggle('is-favorited', result.isFavorited);
            const count = btn.querySelector('.favorite-number');
            if (count) {
              count.textContent = favoriteCount;
            }
          }
        });
        
        console.log(`Anime ${animeTitle} ${result.isFavorited ? 'adicionado aos' : 'removido dos'} favoritos.`);
      }
    } catch (error) {
      console.error('Erro ao gerenciar favoritos:', error);
    }
  }
}

// Função para inicializar todos os dados da página
async function initPageData() {
  try {
    // Array para armazenar todas as promessas de carregamento
    const loadPromises = [];
    
    // Carrega dados de categorias populares e notícias
    loadPromises.push(loadPopularCategories());
    loadPromises.push(loadRecentNews());
    
    // Aguarda todas as promessas serem resolvidas
    await Promise.all(loadPromises);
  } catch (error) {
    console.error("Erro ao carregar dados da página:", error);
  }
}

// Pega a descrição de uma categoria
function getCategoryDescription(category) {
  // Busca as categorias salvas no localStorage
  const savedCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
  
  // Procura por correspondência no array de categorias salvas (ignorando case)
  const foundCategory = savedCategories.find(cat => 
    cat.name.toLowerCase() === category.toLowerCase()
  );
  
  // Se encontrou a categoria, retorna os dados salvos
  if (foundCategory) {
    return {
      desc: foundCategory.description,
      icon: foundCategory.icon
    };
  }
  
  // Fallback para categorias que não estão cadastradas
  return {
    desc: 'Explore mais desta categoria',
    icon: '📺'
  };
}

// Função atualizada para obter categorias populares
function getPopularCategories(limit = 3) {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
  const categoryCount = {};
  const categoryAnimes = {};

  // Conta animes por categoria e guarda exemplos
  animes.forEach(anime => {
    anime.genres.forEach(genre => {
      categoryCount[genre] = (categoryCount[genre] || 0) + 1;
      if (!categoryAnimes[genre]) categoryAnimes[genre] = [];
      if (categoryAnimes[genre].length < 3) categoryAnimes[genre].push(anime.primaryTitle);
    });
  });

  // Converte para array e ordena por contagem
  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category, count]) => ({
      category,
      count,
      examples: categoryAnimes[category],
      ...getCategoryDescription(category)
    }));
}

// Renderiza as categorias
function renderPopularCategories() {
  const popularCategoriesList = document.getElementById('popular-categories');
  if (!popularCategoriesList) return;

  const popularCategories = getPopularCategories();

  popularCategoriesList.innerHTML = popularCategories.map(({ category, desc, icon, count, examples }) => `
    <li class="index-card-item">
      <a href="animes.html?category=${encodeURIComponent(category)}" class="index-card-link">
        <div class="flex items-center gap-2 mb-1">
          <span class="category-icon">${icon}</span>
          <span class="index-card-link-title">${category}</span>
          <span class="text-sm opacity-75">(${count})</span>
        </div>
        <p class="index-card-link-subtitle">${desc}</p>
        ${examples && examples.length > 0 ? `
          <p class="text-sm mt-1 opacity-75">
            Ex: ${examples.slice(0, 2).join(', ')}
          </p>
        ` : ''}
      </a>
    </li>
  `).join('');
}

// Carrega categorias populares do Firestore
async function loadPopularCategories() {
  try {
    const popularCategoriesList = document.getElementById('popular-categories');
    if (!popularCategoriesList) return;
    
    // Busca as categorias mais populares
    const snapshot = await firebase.firestore()
      .collection('categories')
      .orderBy('animeCount', 'desc')
      .limit(3)
      .get();
    
    const popularCategories = [];
    snapshot.forEach(doc => {
      const categoryData = doc.data();
      popularCategories.push({
        category: categoryData.name,
        count: categoryData.animeCount,
        examples: categoryData.examples || [],
        desc: categoryData.description || 'Explore mais desta categoria',
        icon: categoryData.icon || '📺'
      });
    });
    
    // Se não houver categorias cadastradas, usa a função antiga
    if (popularCategories.length === 0) {
      renderPopularCategories();
      return;
    }
    
    // Renderiza as categorias
    popularCategoriesList.innerHTML = popularCategories.map(({ category, desc, icon, count, examples }) => `
      <li class="index-card-item">
        <a href="animes.html?category=${encodeURIComponent(category)}" class="index-card-link">
          <div class="flex items-center gap-2 mb-1">
            <span class="category-icon">${icon}</span>
            <span class="index-card-link-title">${category}</span>
            <span class="text-sm opacity-75">(${count})</span>
          </div>
          <p class="index-card-link-subtitle">${desc}</p>
          ${examples && examples.length > 0 ? `
            <p class="text-sm mt-1 opacity-75">
              Ex: ${examples.slice(0, 2).join(', ')}
            </p>
          ` : ''}
        </a>
      </li>
    `).join('');
    
  } catch (error) {
    console.error("Erro ao carregar categorias populares:", error);
    // Fallback para método antigo
    renderPopularCategories();
  }
}

// Renderiza as notícias na página inicial
function renderIndexNews() {
  const newsGrid = document.querySelector('.news-grid');
  if (!newsGrid) return;

  const newsData = JSON.parse(localStorage.getItem('news') || '[]');

  // Ordena as notícias por data, mais recentes primeiro
  const sortedNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Mostra apenas as 4 notícias mais recentes
  const recentNews = sortedNews.slice(0, 4);

  newsGrid.innerHTML = recentNews.map(news => `
    <a href="news.html?id=${news.id}" class="news-card block hover:transform hover:scale-[1.02] transition-transform">
      <div class="news-image-container">
        <img src="${news.image}" alt="${news.title}" class="news-image">
        <span class="news-category">${news.category}</span>
      </div>
      <div class="news-content">
        <div class="news-metadata">
          <span class="news-date">${formatDate(news.date)}</span>
          <div class="news-tags">
            ${news.tags.map(tag => `<span class="news-tag">#${tag}</span>`).join('')}
          </div>
        </div>
        <h3 class="news-title">${news.title}</h3>
        <p class="news-summary">${news.summary}</p>
      </div>
    </a>
  `).join('');
}

// Carrega notícias recentes do Firestore
async function loadRecentNews() {
  try {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    
    // Busca as notícias mais recentes
    const snapshot = await firebase.firestore()
      .collection('news')
      .orderBy('date', 'desc')
      .limit(4)
      .get();
    
    const recentNews = [];
    snapshot.forEach(doc => {
      recentNews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Renderiza as notícias
    newsGrid.innerHTML = recentNews.map(news => `
      <a href="news.html?id=${news.id}" class="news-card block hover:transform hover:scale-[1.02] transition-transform">
        <div class="news-image-container">
          <img src="${news.image}" alt="${news.title}" class="news-image">
          <span class="news-category">${news.category}</span>
        </div>
        <div class="news-content">
          <div class="news-metadata">
            <span class="news-date">${formatDate(news.date)}</span>
            <div class="news-tags">
              ${news.tags.map(tag => `<span class="news-tag">#${tag}</span>`).join('')}
            </div>
          </div>
          <h3 class="news-title">${news.title}</h3>
          <p class="news-summary">${news.summary}</p>
        </div>
      </a>
    `).join('');
    
  } catch (error) {
    console.error("Erro ao carregar notícias recentes:", error);

    // Fallback para método antigo
    renderIndexNews();
  }
}

// Formata data para o formato brasileiro
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Inicializa o AnimeLoader automaticamente quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o AnimeLoader se estivermos na página principal
  window.animeLoader = AnimeLoader.init();

  // Inicializa dados da página
  initPageData();
});