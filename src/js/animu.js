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
          <i class="fi fi-ss-dashboard-monitor"></i>
          <span>Sistema</span>
        </button>
        <button data-theme="light" class="theme-option">
          <i class="fi fi-ss-eclipse-alt"></i>
          </svg>
          <span>Claro</span>
        </button>
        <button data-theme="dark" class="theme-option">
          <i class="fi fi-ss-moon-stars"></i>
          <span>Escuro</span>
        </button>
      </div>
    `;
  },

  getThemeIcon(theme) {
    const icons = {
      system: `<i class="fi fi-ss-dashboard-monitor"></i>`,
      light: `<i class="fi fi-ss-eclipse-alt"></i>`,
      dark: `<i class="fi fi-ss-moon-stars"></i>`
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
});

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
  backToTopButton.innerHTML = `<i class="fi fi-ss-sort"></i>`;
  backToTopButton.title = 'Voltar ao topo';
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
        userAvatar.src = AnimuUtils.getUserAvatar(sessionData.username);
        userAvatar.style.cursor = 'pointer';
        userAvatar.onclick = () => window.location.href = 'profile.html';
        userAvatar.title = 'Ver perfil';
      }
      if (logoutLink) logoutLink.classList.remove('hidden');
    }
  }
}