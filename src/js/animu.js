// Sistema de Temas - Funções Globais
window.applyTheme = function (theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const body = document.body;

  if (theme === 'system') {
    if (prefersDark.matches) body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');
  } else if (theme === 'dark') body.classList.add('dark-mode');
  else body.classList.remove('dark-mode');
}

window.updateActiveTheme = function (theme) {
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === theme);
  });
}

// Inicialização do tema
function initThemeSystem() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  window.applyTheme(savedTheme);
  window.updateActiveTheme(savedTheme);

  // Listener para mudanças na preferência do sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDark.addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'system') window.applyTheme('system');
  });
}

// Sistema de Gerenciamento de Temas
window.ThemeManager = {
  getThemeSectionTemplate() {
    return `
      <div class="dropdown-divider"></div>
      <div class="dropdown-theme-section">
        <span class="theme-label">Tema</span>
        <button data-theme="system" class="theme-option">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
          </svg>
          <span>Sistema</span>
        </button>
        <button data-theme="light" class="theme-option">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>
          <span>Claro</span>
        </button>
        <button data-theme="dark" class="theme-option">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
          <span>Escuro</span>
        </button>
      </div>
    `;
  },

  getThemeIcon(theme) {
    const icons = {
      system: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
      </svg>`,
      light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
      </svg>`,
      dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>`
    };
    return icons[theme] || icons.system;
  },

  updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-dropdown-btn');
    if (themeBtn) themeBtn.innerHTML = this.getThemeIcon(theme);
  },

  applyTheme(theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const body = document.body;

    if (theme === 'system') {
      if (prefersDark.matches) body.classList.add('dark-mode');
      else body.classList.remove('dark-mode');
    } else if (theme === 'dark') body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');

    localStorage.setItem('theme', theme);
    this.updateActiveTheme(theme);
    this.updateThemeIcon(theme); // Atualiza o ícone
  },

  updateActiveTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === theme);
    });
  },

  initThemeDropdown() {
    const themeMenu = document.getElementById('theme-menu');
    if (!themeMenu) return;

    // Injeta o HTML das opções de tema
    themeMenu.innerHTML = `
      <button data-theme="system" class="theme-option">
        ${this.getThemeIcon('system')}
        <span>Sistema</span>
      </button>
      <button data-theme="light" class="theme-option">
        ${this.getThemeIcon('light')}
        <span>Claro</span>
      </button>
      <button data-theme="dark" class="theme-option">
        ${this.getThemeIcon('dark')}
        <span>Escuro</span>
      </button>
    `;

    // Configura os eventos do dropdown
    const themeDropdownBtn = document.getElementById('theme-dropdown-btn');
    const themeOptions = themeMenu.querySelectorAll('.theme-option');

    themeDropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('hidden');
    });

    themeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = option.dataset.theme;
        this.applyTheme(theme);
        themeMenu.classList.add('hidden');
      });
    });

    document.addEventListener('click', (e) => {
      if (!themeDropdownBtn?.contains(e.target) && !themeMenu.contains(e.target)) themeMenu.classList.add('hidden');
    });
  },

  init() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    this.applyTheme(savedTheme);
    this.updateThemeIcon(savedTheme); // Atualiza o ícone inicial

    // Inicializa o dropdown se estiver em uma página de login/signup
    if (window.location.pathname.includes('signin.html') || window.location.pathname.includes('signup.html')) this.initThemeDropdown();

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', () => {
      if (localStorage.getItem('theme') === 'system') this.applyTheme('system');
    });
  }
};

// Adiciona a chamada da função no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem(); // Garante que o tema seja aplicado primeiro

  // Controle de visibilidade dos painéis baseado em permissões
  const adminPanel = document.getElementById("admin-panel");
  const sessionData = JSON.parse(localStorage.getItem('userSession'));

  if (sessionData?.isAdmin && adminPanel) adminPanel.classList.remove("hidden");

  // Gerenciamento do menu administrativo
  const adminButton = document.getElementById('admin-menu-button');
  const adminMenu = document.getElementById('admin-menu-items');

  if (adminButton && adminMenu) {
    // Controle do menu admin e animação do ícone
    adminButton.addEventListener('click', (e) => {
      e.stopPropagation();
      adminMenu.classList.toggle('hidden');

      const gearIcon = adminButton.querySelector('svg');
      gearIcon.classList.add('gear-spin');
      setTimeout(() => gearIcon.classList.remove('gear-spin'), 600);
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!adminMenu.contains(e.target) && !adminButton.contains(e.target)) adminMenu.classList.add('hidden');
    });
  }

  // Cria e adiciona o botão de voltar ao topo
  const backToTopButton = document.createElement('button');
  backToTopButton.className = 'back-to-top';
  backToTopButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 20V4M5 11L12 4L19 11" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  document.body.appendChild(backToTopButton);

  // Controla a visibilidade do botão
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTopButton.classList.add('visible');
    else backToTopButton.classList.remove('visible');
  });

  // Adiciona o evento de clique para rolar suavemente ao topo
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

// Obtém o avatar do usuário
function getUserAvatar(username) {
  const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
  const user = users.find(u => u.username === username);
  return user ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B5CF6&color=ffffff&size=100`;
}

// Atualiza interface do usuário na navbar
function updateUserInterface() {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (sessionData) {
    const userPanel = document.getElementById('user-panel');
    const userNameSpan = document.getElementById('user-name');
    const userAvatar = userPanel?.querySelector('img');
    const logoutLink = document.getElementById('logout-link');

    if (userPanel && userNameSpan) {
      userNameSpan.innerHTML = `<a href="profile.html" class="hover:text-purple-600 transition-colors">${sessionData.username}</a>`;
      if (userAvatar) {
        userAvatar.src = getUserAvatar(sessionData.username);
        userAvatar.style.cursor = 'pointer';
        userAvatar.onclick = () => window.location.href = 'profile.html';
        userAvatar.title = 'Ver perfil';
      }
      if (logoutLink) logoutLink.classList.remove('hidden');
    }
  }
}

// Calcula pontuação para destaque do anime
function calculateHighlightScore(anime, comments) {
  const commentCount = comments[anime.primaryTitle]?.length || 0;
  const score = parseFloat(anime.score) || 0;
  // Fórmula: (nota * 0.7) + (número de comentários * 0.3)
  return (score * 0.7) + (commentCount * 0.3);
}

// Seleciona animes em destaque baseado em popularidade
function getFeaturedAnimes(limit = 16) {
  try {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};

    // Calcula a pontuação de destaque para cada anime
    const scoredAnimes = animes.map(anime => ({
      ...anime,
      highlightScore: calculateHighlightScore(anime, comments)
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
function countAnimeFavorites(animeTitle) {
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
  
  // Atualiza o contador de favoritos no Firestore
  updateAnimeFavoritesInFirestore(animeTitle, increment);
}

// Nova função para atualizar o contador de favoritos no Firestore
async function updateAnimeFavoritesInFirestore(animeTitle, increment) {
  try {
    // Busca o documento do anime no Firestore pelo título
    const animeQuery = await firebase.firestore()
      .collection('animes')
      .where('primaryTitle', '==', animeTitle)
      .limit(1)
      .get();
    
    if (animeQuery.empty) {
      console.warn(`Anime não encontrado no Firestore: ${animeTitle}`);
      return;
    }
    
    // Obtém a referência ao documento do anime
    const animeDoc = animeQuery.docs[0];
    const animeRef = animeDoc.ref;
    
    // Usa o operador FieldValue.increment para atualizar o contador de forma atômica
    // Isso evita problemas de concorrência quando múltiplos usuários favoritam ao mesmo tempo
    await animeRef.update({
      favoriteCount: firebase.firestore.FieldValue.increment(increment)
    });
    
    console.log(`Contador de favoritos do anime ${animeTitle} atualizado no Firestore (${increment > 0 ? '+' : ''}${increment})`);
  } catch (error) {
    console.error("Erro ao atualizar favoritos no Firestore:", error);
  }
}

// Gerencia favoritos a partir do card dos animes
function toggleFavoriteFromCard(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  toggleFavorite(animeTitle);

  // Atualiza todos os botões do mesmo anime no carrossel
  const favoriteBtns = document.querySelectorAll(`[onclick*="${animeTitle}"]`);
  const isFavorited = isAnimeFavorited(animeTitle);
  const newFavoriteCount = countAnimeFavorites(animeTitle);

  favoriteBtns.forEach(btn => {
    btn.classList.toggle('is-favorited', isFavorited);
    const countElement = btn.querySelector('.favorite-number');
    if (countElement) countElement.textContent = newFavoriteCount;
  });
}

// Renderiza seção de animes em destaque com Swiper
function renderFeaturedAnimes() {
  const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
  if (!swiperWrapper) return;

  const featuredAnimes = getFeaturedAnimes();
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
  `).join('');

  // Inicializa o Swiper
  new Swiper('.featured-swiper', {
    slidesPerView: 2,
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true  // Pausa o autoplay quando o mouse estiver sobre o carrossel
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

// Gerencia favoritos a partir do card dos animes
function toggleFavoriteFromCard(animeTitle) {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  toggleFavorite(animeTitle);

  // Atualiza todos os botões do mesmo anime no carrossel
  const favoriteBtns = document.querySelectorAll(`[onclick*="${animeTitle}"]`);
  const isFavorited = isAnimeFavorited(animeTitle);
  const newFavoriteCount = countAnimeFavorites(animeTitle);

  favoriteBtns.forEach(btn => {
    btn.classList.toggle('is-favorited', isFavorited);
    const countElement = btn.querySelector('.favorite-number');
    if (countElement) countElement.textContent = newFavoriteCount;
  });
}

// Carrega os últimos reviews
function loadLatestReviews() {
  const reviewsList = document.getElementById('latest-reviews');
  if (!reviewsList) return;

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

// Formata data para o formato brasileiro
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Seleciona animes da temporada atual
function getSeasonalAnimes(limit = 12) {
  try {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const currentSeason = getCurrentSeason();

    // Filtra animes da temporada atual
    const seasonalAnimes = animes.filter(anime => {
      // Verifica se tem a propriedade season e se os valores correspondem
      return anime.season?.period?.toLowerCase() === currentSeason.season.toLowerCase() &&
        parseInt(anime.season?.year) === currentSeason.year;
    });

    // Ordena por pontuação antes de retornar
    return seasonalAnimes
      .sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))
      .slice(0, limit);
  } catch (e) {
    console.error('Erro ao obter animes da temporada:', e);
    return [];
  }
}

// Determina a temporada atual
function getCurrentSeason() {
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

// Renderiza seção de animes da temporada com Swiper
function renderSeasonalAnimes() {
  const swiperWrapper = document.querySelector('.seasonal-swiper .swiper-wrapper');
  if (!swiperWrapper) return;

  const seasonalAnimes = getSeasonalAnimes();
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

// Atualiza o link da temporada atual no card de Novidades
function updateCurrentSeasonLink() {
  const currentSeason = getCurrentSeason();
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

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
  window.ThemeManager.init();
  updateUserInterface();
  updateCurrentSeasonLink();
  
  // Substitui as chamadas síncronas por versões assíncronas
  initIndexPageData();
});

// Função para inicializar todos os dados da página inicial
async function initIndexPageData() {
  try {
    // Carrega todos os dados necessários de forma paralela
    await Promise.all([
      loadFeaturedAnimes(),
      loadSeasonalAnimes(),
      loadLatestReviewsFromFirestore(),
      loadPopularCategories(),
      loadRecentNews()
    ]);
  } catch (error) {
    console.error("Erro ao carregar dados da página inicial:", error);
  }
}

// Busca animes em destaque diretamente do Firestore
async function loadFeaturedAnimes() {
  try {
    // Limita a consulta aos 16 animes com maior pontuação
    const snapshot = await firebase.firestore()
      .collection('animes')
      .orderBy('score', 'desc') // Ordena por pontuação
      .limit(16) // Limita a quantidade de resultados
      .get();
    
    const featuredAnimes = [];
    snapshot.forEach(doc => {
      featuredAnimes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Armazena temporariamente para uso na página
    localStorage.setItem('featuredAnimes', JSON.stringify(featuredAnimes));
    
    // Renderiza os animes em destaque
    renderFeaturedAnimes(featuredAnimes);
  } catch (error) {
    console.error("Erro ao carregar animes em destaque:", error);
    
    // Fallback: tenta usar dados em cache se disponíveis
    const cachedData = JSON.parse(localStorage.getItem('featuredAnimes') || '[]');
    if (cachedData.length > 0) renderFeaturedAnimes(cachedData);
  }
}

// Busca animes da temporada atual
async function loadSeasonalAnimes() {
  try {
    const currentSeason = getCurrentSeason();
    
    // Busca os animes da temporada atual
    const snapshot = await firebase.firestore()
      .collection('animes')
      .where('season.period', '==', currentSeason.season)
      .where('season.year', '==', currentSeason.year)
      .orderBy('score', 'desc') // Ordena por pontuação
      .limit(12) // Limita aos 12 melhores
      .get();
    
    const seasonalAnimes = [];
    snapshot.forEach(doc => {
      seasonalAnimes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Animes da temporada carregados: ${seasonalAnimes.length}`);
    
    // Armazena temporariamente
    localStorage.setItem('seasonalAnimes', JSON.stringify(seasonalAnimes));
    
    // Renderiza os animes da temporada - passando explicitamente os dados
    renderSeasonalAnimes(seasonalAnimes);
    
    // Caso não haja animes da temporada, tenta buscar animes recentes
    if (seasonalAnimes.length === 0) {
      console.log('Nenhum anime da temporada encontrado, buscando animes recentes...');
      loadRecentAnimes();
    }
  } catch (error) {
    console.error("Erro ao carregar animes da temporada:", error);
    
    // Fallback: tenta usar dados em cache
    const cachedData = JSON.parse(localStorage.getItem('seasonalAnimes') || '[]');
    if (cachedData.length > 0) {
      console.log('Usando dados de cache para animes da temporada');
      renderSeasonalAnimes(cachedData);
    } else loadRecentAnimes(); // Se não houver cache, tenta carregar animes recentes como alternativa
  }
}

// Função auxiliar para carregar animes recentes caso não existam animes da temporada
async function loadRecentAnimes() {
  try {
    const snapshot = await firebase.firestore()
      .collection('animes')
      .orderBy('createdAt', 'desc')
      .limit(12)
      .get();
    
    const recentAnimes = [];
    snapshot.forEach(doc => {
      recentAnimes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Animes recentes carregados como alternativa: ${recentAnimes.length}`);
    
    // Renderiza os animes recentes no lugar dos da temporada
    if (recentAnimes.length > 0) {
      renderSeasonalAnimes(recentAnimes);
    }
  } catch (error) {
    console.error("Erro ao carregar animes recentes:", error);
    // Exibe mensagem de erro no carrossel
    const swiperWrapper = document.querySelector('.seasonal-swiper .swiper-wrapper');
    if (swiperWrapper) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Nenhum anime disponível no momento.</p></div>';
    }
  }
}

// Carrega reviews mais recentes
async function loadLatestReviewsFromFirestore() {
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
      
      // Para cada comentário, busca o anime correspondente
      const promise = firebase.firestore()
        .collection('animes')
        .doc(commentData.animeId)
        .get()
        .then(animeDoc => {
          if (animeDoc.exists) {
            latestReviews.push({
              animeTitle: animeDoc.data().primaryTitle,
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
    
  } catch (error) {
    console.error("Erro ao carregar reviews recentes:", error);
    // Fallback para método antigo
    loadLatestReviews();
  }
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

// Versão atualizada para receber dados como parâmetro
function renderFeaturedAnimes(featuredAnimes) {
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
              class="meta-item favorite-count ${isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
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

// Versão atualizada para receber dados como parâmetro
function renderSeasonalAnimes(seasonalAnimes) {
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
              class="meta-item favorite-count ${isAnimeFavorited(anime.primaryTitle) ? 'is-favorited' : ''}"
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

// Função auxiliar para sincronizar contadores de favoritos
async function syncAnimeFavorites() {
  try {
    // Caso seja necessário sincronizar todos os contadores de favoritos
    const animes = JSON.parse(localStorage.getItem('animeData') || '[]');
    const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
    
    // Para cada anime, conta os favoritos e atualiza no Firestore
    for (const anime of animes) {
      const favoriteCount = users.reduce((count, user) => {
        if (user.favoriteAnimes && user.favoriteAnimes.includes(anime.primaryTitle)) return count + 1;
        return count;
      }, 0);
      
      // Atualiza o count no Firestore (sem usar increment, definindo o valor correto)
      const animeQuery = await firebase.firestore()
        .collection('animes')
        .where('primaryTitle', '==', anime.primaryTitle)
        .limit(1)
        .get();
        
      if (!animeQuery.empty) {
        await animeQuery.docs[0].ref.update({ favoriteCount });
        console.log(`Contador de favoritos sincronizado para ${anime.primaryTitle}: ${favoriteCount}`);
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar contadores de favoritos:", error);
  }
}