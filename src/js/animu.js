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

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
  window.ThemeManager.init();
  updateUserInterface();
  
  // Inicializa dados da página
  initPageData();
});

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