// Sistema de Temas - Funções Globais
window.applyTheme = function (theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const $body = $('body');

  if (theme === 'system') {
    if (prefersDark.matches) $body.addClass('dark-mode');
    else $body.removeClass('dark-mode');
  } else if (theme === 'dark') $body.addClass('dark-mode');
  else $body.removeClass('dark-mode');
}

window.updateActiveTheme = function (theme) {
  $('.theme-option').each(function() {
    $(this).toggleClass('active', $(this).data('theme') === theme);
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
          <i class="fi fi-sr-dashboard-monitor"></i>
          <span>Sistema</span>
        </button>
        <button data-theme="light" class="theme-option">
          <i class="fi fi-sr-brightness"></i>
          </svg>
          <span>Claro</span>
        </button>
        <button data-theme="dark" class="theme-option">
          <i class="fi fi-sr-moon-stars"></i>
          <span>Escuro</span>
        </button>
      </div>
    `;
  },

  // Retorna o ícone correspondente ao tema
  getThemeIcon(theme) {
    const icons = {
      system: `<i class="fi fi-sr-dashboard-monitor"></i>`,
      light: `<i class="fi fi-sr-brightness"></i>`,
      dark: `<i class="fi fi-sr-moon-stars"></i>`
    };
    return icons[theme] || icons.system;
  },

  // Atualiza o ícone do botão de tema
  updateThemeIcon(theme) { 
    const $themeBtn = $('#theme-dropdown-btn');
    if ($themeBtn.length) $themeBtn.html(this.getThemeIcon(theme));
  },

  // Aplica o tema selecionado
  applyTheme(theme) { 
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const $body = $('body');

    if (theme === 'system') {
      if (prefersDark.matches) $body.addClass('dark-mode');
      else $body.removeClass('dark-mode');
    } else if (theme === 'dark') $body.addClass('dark-mode');
    else $body.removeClass('dark-mode');

    localStorage.setItem('theme', theme);
    this.updateActiveTheme(theme);
    this.updateThemeIcon(theme); 
  },

  updateActiveTheme(theme) {
    $('.theme-option').each(function() {
      $(this).toggleClass('active', $(this).data('theme') === theme);
    });
  },

  // Inicializa o dropdown de temas
  initThemeDropdown() { 
    const $themeMenu = $('#theme-menu');
    if (!$themeMenu.length) return;

    // Injeta o HTML das opções de tema
    $themeMenu.html(`
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
    `);

    // Configura os eventos do dropdown
    const $themeDropdownBtn = $('#theme-dropdown-btn');
    const $themeOptions = $themeMenu.find('.theme-option');

    $themeDropdownBtn.on('click', (e) => {
      e.stopPropagation();
      $themeMenu.toggleClass('hidden');
    });

    $themeOptions.on('click', (e) => {
      e.stopPropagation();
      const theme = $(e.currentTarget).data('theme');
      this.applyTheme(theme);
      $themeMenu.addClass('hidden');
    });

    $(document).on('click', (e) => {
      if (!$themeDropdownBtn.is(e.target) && !$themeDropdownBtn.has(e.target).length && 
          !$themeMenu.is(e.target) && !$themeMenu.has(e.target).length) $themeMenu.addClass('hidden');
    });
  },

  // Inicializa o sistema de temas
  init() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    this.applyTheme(savedTheme);
    this.updateThemeIcon(savedTheme);

    // Inicializa o dropdown se estiver em uma página de login/signup/portfolio
    if (window.location.pathname.includes('signin.html') || 
        window.location.pathname.includes('signup.html') ||
        window.location.pathname.includes('portfolio.php')) this.initThemeDropdown();

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', () => {
      if (localStorage.getItem('theme') === 'system') this.applyTheme('system');
    });
  }
};

// Inicializa a página
$(window).on('load', () => {
  window.ThemeManager.init();
  updateUserInterface();
});

// Adiciona a chamada da função no carregamento do DOM
$(document).ready(() => {
  initThemeSystem(); // Garante que o tema seja aplicado primeiro

  // Controle de visibilidade dos painéis baseado em permissões
  const $adminPanel = $("#admin-panel");
  const sessionData = JSON.parse(localStorage.getItem('userSession'));

  if (sessionData?.isAdmin && $adminPanel.length) $adminPanel.removeClass("hidden");

  // Gerenciamento do menu administrativo
  const $adminButton = $('#admin-menu-button');
  const $adminMenu = $('#admin-menu-items');

  if ($adminButton.length && $adminMenu.length) {
    // Controle do menu admin e animação do ícone
    $adminButton.on('click', (e) => {
      e.stopPropagation();
      $adminMenu.toggleClass('hidden');

      const $gearIcon = $adminButton.find('svg');
      $gearIcon.addClass('gear-spin');
      setTimeout(() => $gearIcon.removeClass('gear-spin'), 600);
    });

    // Fecha menu ao clicar fora
    $(document).on('click', (e) => {
      if (!$adminMenu.has(e.target).length && !$adminButton.has(e.target).length && !$adminButton.is(e.target)) $adminMenu.addClass('hidden');
    });
  }

  // Cria e adiciona o botão de voltar ao topo
  const $backToTopButton = $('<button></button>', {
    'class': 'back-to-top',
    'html': '<i class="fi fi-sr-sort"></i>',
    'title': 'Voltar ao topo'
  });
  $('body').append($backToTopButton);

  // Controla a visibilidade do botão
  $(window).on('scroll', () => {
    if ($(window).scrollTop() > 300) $backToTopButton.addClass('visible');
    else $backToTopButton.removeClass('visible');
  });

  // Adiciona o evento de clique para rolar suavemente ao topo
  $backToTopButton.on('click', () => {
    $('html, body').animate({
      scrollTop: 0
    }, 'smooth');
  });
});

// Atualiza interface do usuário na navbar
function updateUserInterface() {
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (sessionData) {
    const $userPanel = $('#user-panel');
    const $userNameSpan = $('#user-name');
    const $userAvatar = $userPanel.find('img');
    const $logoutLink = $('#logout-link');
    
    if ($userPanel.length && $userNameSpan.length) {
      $userNameSpan.html(`<a href="profile.html" class="hover:text-purple-600 transition-colors">${sessionData.username}</a>`);
      
      // Adiciona o avatar do usuário
      if ($userAvatar.length) {
        $userAvatar
          .attr('src', AnimuUtils.getUserAvatar(sessionData.username))
          .css('cursor', 'pointer')
          .attr('title', 'Ver perfil')
          .on('click', () => window.location.href = 'profile.html');
      }
      
      if ($logoutLink.length) $logoutLink.removeClass('hidden');
    }
  }
}