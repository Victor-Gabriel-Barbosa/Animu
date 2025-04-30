// Classe para gerenciamento da barra de navegação e barra lateral
class Navbar {
  constructor() {
    // Template HTML principal da navbar com menu lateral e painel de usuário
    this.navHTML = `
      <button id="toggle-navigation" class="toggle-nav-btn" title="Ocultar Navegação (ALT + H)">
        <i class="fi fi-sr-layer-minus"></i>
      </button>
      <nav class="fixed top-0 left-0 right-0" style="z-index:100">
        <div class="mx-auto px-4">
          <div class="flex items-center justify-between h-14">
            <!-- Espaço reservado para o menu e logo -->
            <div class="nav-menu-container">
              <!-- Menu Toggle Button -->
              <button id="menu-toggle" class="menu-toggle-btn" title="Expandir Menu (ALT + M)">
                <i class="fi fi-sr-menu-burger"></i>
              </button>
              
              <!-- Logo -->
              <div class="logo-container">
                <a href="index.html" class="logo-link" title="Página Inicial do Animu">
                  <img src="src/assets/images/favicon/favicon.svg" class="logo-icon" alt="Logo Animu">
                  <span class="logo-text">Animu</span>
                </a>
              </div>
            </div>
            <!-- Barra de pesquisa -->
            <div class="flex-1 max-w-xl mx-4" id="search-area">
              <!-- Gerada via JavaScript -->
            </div>

            <!-- Área do usuário -->
            <div class="flex items-center space-x-4">
              <!-- Painel do usuário -->
              <div id="user-panel" class="flex items-center">
                ${this.getUserPanel()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Menu Lateral -->
      <div id="side-menu" class="side-menu">
        <a href="index.html" class="nav-link" title="Ir para página inicial">
          <i class="fi fi-sr-house-chimney"></i>
          <span>Início</span>
        </a>
        <a href="animes.html" class="nav-link" title="Ver lista de animes">
          <i class="fi fi-sr-graphic-style"></i>
          <span>Animes</span>
        </a>
        <a href="recommendation.html" class="nav-link" title="Ver recomendações de animes">
          <i class="fi fi-sr-sparkles"></i>
          <span>Recomendações</span>
        </a>
        <a href="news.html" class="nav-link" title="Ver notícias sobre animes">
          <i class="fi fi-sr-book-open-cover"></i>
          <span>Notícias</span>
        </a>
        <a href="profile.html" class="nav-link" title="Acessar perfil do usuário">
          <i class="fi fi-sr-user-pen"></i>
          <span>Perfil</span>
        </a>
        <a href="category.html" class="nav-link" title="Explorar categorias de animes">
          <i class="fi fi-sr-palette"></i>
          <span>Categorias</span>
        </a>
        <a href="about.html" class="nav-link" title="Informações sobre o site">
          <i class="fi fi-sr-comment-info"></i>
          <span>Sobre</span>
        </a>
        <!-- Opções de Admin (inicialmente ocultas) -->
        <div id="admin-options" class="hidden">
          <a href="users-admin.html" class="nav-link admin-link" title="Gerenciar usuários do sistema">
            <i class="fi fi-sr-user-gear"></i>
            <span>Gerenciar Usuários</span>
          </a>
          <a href="category-admin.html" class="nav-link admin-link" title="Gerenciar categorias de animes">
            <i class="fi fi-sr-customize-computer"></i>
            <span>Gerenciar Categorias</span>
          </a>
          <a href="animes-admin.html" class="nav-link admin-link" title="Gerenciar catálogo de animes">
            <i class="fi fi-sr-add-image"></i>
            <span>Gerenciar Animes</span>
          </a>
          <a href="news-admin.html" class="nav-link admin-link" title="Gerenciar notícias do site">
            <i class="fi fi-sr-books-medical"></i>
            <span>Gerenciar Notícias</span>
          </a>
        </div>
      </div>
      <div id="menu-overlay" class="menu-overlay"></div>
    `;

    // Adiciona suporte a navegação por teclado
    this.setupKeyboardNav();

    // Adiciona suporte a gestos touch
    this.setupTouchGestures();

    // Adiciona observador de conexão
    this.setupConnectionObserver();

    // Adiciona handler para fechar menu em telas pequenas
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    
    // Inicializa o gerenciador de usuários
    this.userManager = new UserManager();
  }

  // Gera o painel do usuário com avatar e opções de login/logout
  getUserPanel() {
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    const themeSection = window.ThemeManager.getThemeSectionTemplate(); // Usa o template do ThemeManager global

    // Retorna um template inicial, que será atualizado após carregar do Firestore
    if (userSession) {
      return `
        <div class="relative">
          <button id="user-dropdown-btn" class="flex items-center focus:outline-none" title="Menu do usuário">
            <img class="h-10 w-10 rounded-full object-cover user-avatar" src="${userSession.avatar || 'https://ui-avatars.com/api/?name=User&background=random'}" alt="Avatar do Usuário" />
          </button>
          <div id="user-dropdown" class="user-dropdown hidden">
            <div class="user-info-section">
              <div class="user-info-header">
                <img class="h-12 w-12 rounded-full object-cover user-info-avatar" src="${userSession.avatar || 'https://ui-avatars.com/api/?name=User&background=random'}" alt="Avatar do Usuário" />
                <div class="user-info-text">
                  <div class="user-name">${userSession.name || userSession.username || 'Usuário'}</div>
                  <div class="user-email">${userSession.email || ''}</div>
                  <div class="user-type">${userSession.isAdmin ? 'Administrador' : (userSession.isPremium ? 'Assinante Premium' : 'Conta Padrão')}</div>
                </div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="./profile.html" class="dropdown-item">
              <i class="fi fi-sr-user-pen"></i>
              <span>Perfil</span>
            </a>
            ${themeSection}
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-red-600" id="logout-btn">
              <i class="fi fi-sr-leave"></i>
              <span>Sair</span>
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="relative">
          <button id="auth-dropdown-btn" class="auth-btn focus:outline-none" title="Opções de Login">
            <i class="fi fi-sr-user"></i>
          </button>
          <div id="auth-dropdown" class="user-dropdown hidden">
            <a href="./signin.html" class="dropdown-item text-green-600">
              <i class="fi fi-sr-address-card"></i>
              <span>Entrar</span>
            </a>
            <a href="./signup.html" class="dropdown-item text-blue-600">
              <i class="fi fi-sr-user-add"></i>
              <span>Criar Conta</span>
            </a>
            ${themeSection}
          </div>
        </div>
      `;
    }
  }

  // Inicializa todos os componentes da navbar
  init() {
    // Insere a navbar no início do body
    $('body').prepend(this.navHTML);
    $('body').addClass('has-navbar');

    // Destaca o link da página atual
    this.highlightCurrentPage();
    
    // Inicializa componentes de UI
    this.initSideMenu();
    this.initNavigationToggle();
    
    // Carrega os dados do usuário do Firestore
    this.loadUserData();
  }
  
  // Método para carregar dados do usuário do Firestore
  async loadUserData() {
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    
    if (userSession && userSession.userId) {
      try {
        // Busca dados atualizados do usuário no Firestore
        const userData = await this.userManager.getUserById(userSession.userId);
        
        if (userData) {
          // Atualiza o localStorage com os dados mais recentes
          const updatedSession = {
            ...userSession,
            name: userData.name || userSession.name,
            username: userData.username || userSession.username,
            email: userData.email || userSession.email,
            avatar: userData.avatar || userSession.avatar,
            isAdmin: userData.isAdmin || userSession.isAdmin,
            isPremium: userData.isPremium || userSession.isPremium
          };
          
          localStorage.setItem('userSession', JSON.stringify(updatedSession));
          
          // Atualiza a UI com os dados do Firestore
          this.updateUserPanel(userData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário do Firestore:", error);
      }
    }
    
    // Inicializa os componentes que dependem dos dados do usuário
    this.checkLoginStatus();
    this.initUserDropdown();
    this.initAuthDropdown();
  }
  
  // Método para atualizar o painel do usuário com dados do Firestore
  updateUserPanel(userData) {
    // Atualiza o avatar do usuário na navbar
    if (userData.avatar) {
      $('.user-avatar').attr('src', userData.avatar);
      $('.user-info-avatar').attr('src', userData.avatar);
    }
    
    $('.user-name').text(userData.name || userData.username || 'Usuário');
    $('.user-email').text(userData.email || '');
    $('.user-type').text(userData.isAdmin ? 'Administrador' : (userData.isPremium ? 'Assinante Premium' : 'Conta Padrão'));
  }

  // Marca o link ativo baseado na URL atual, tratando páginas normais e admin
  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().split('?')[0]; // Ignora parâmetros após o .html

    $('.nav-link').each(function() {
      const href = $(this).attr('href').split('?')[0]; // Ignora parâmetros do href também
      const isAdminPage = currentPage.includes('-admin');
      const isAdminLink = href.includes('-admin');

      // Verifica se é uma página de administração
      if (isAdminPage && isAdminLink) {
        if (currentPage === href.replace('./', '')) $(this).addClass('active');
        else $(this).removeClass('active');
      }
      // Verifica páginas normais
      else if (!isAdminPage && !isAdminLink) {
        if (currentPage === href.replace('./', '') ||
          (currentPage.includes('anime') && href === 'animes.html') ||
          (currentPage === '' && href === 'index.html')) {
          $(this).addClass('active');
        } else $(this).removeClass('active');
      }
    });
  }

  // Verifica status de login e configura interface de acordo com permissões
  checkLoginStatus() {
    const userSession = JSON.parse(localStorage.getItem('userSession'));

    if (userSession) {
      // Atualiza o avatar se disponível
      if (userSession.avatar && $('#user-panel').length) $('#user-panel img').attr('src', userSession.avatar);

      // Mostra as opções de admin no menu lateral se o usuário for admin
      if ($('#admin-options').length && userSession.isAdmin) {
        console.log('Usuário é admin, mostrando opções de admin');
        $('#admin-options').removeClass('hidden');
        $('#admin-options .nav-link').addClass('admin-link');
      }
    }
  }

  // Gerencia o menu de administração dropdown
  initAdminMenu() {
    const $adminButton = $('#admin-menu-button');
    const $adminMenu = $('#admin-menu-items');

    if ($adminButton.length && $adminMenu.length) {
      // Adiciona manipulador de clique ao botão
      $adminButton.on('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        $adminMenu.toggleClass('hidden');
      });

      // Fecha o menu ao clicar em qualquer lugar fora
      $(document).on('click', (e) => {
        if (!$adminButton[0].contains(e.target) && !$adminMenu[0].contains(e.target)) $adminMenu.addClass('hidden');
      });

      // Previne que cliques dentro do menu o fechem
      $adminMenu.on('click', (e) => { 
        e.stopPropagation(); 
      });
    }
  }

  // Gerencia estados e eventos do menu lateral, incluindo persistência
  initSideMenu() {
    const $menuToggle = $('#menu-toggle');
    const $sideMenu = $('#side-menu');
    const $menuOverlay = $('#menu-overlay');

    // Verifica o estado do menu ao carregar a página
    const menuState = localStorage.getItem('sideMenuState');
    if (menuState === 'open') {
      $sideMenu.addClass('open');
      $menuOverlay.addClass('show');
      $('body').addClass('menu-open');
    }

    $menuToggle.on('click', () => {
      $sideMenu.toggleClass('open');
      $menuOverlay.toggleClass('show');
      $('body').toggleClass('menu-open');

      // Salva o estado do menu
      const isOpen = $sideMenu.hasClass('open');
      localStorage.setItem('sideMenuState', isOpen ? 'open' : 'closed');

      // Adiciona ou remove listener de clique fora baseado no estado do menu
      if (isOpen && $(window).width() <= 768) $(document).on('click', this.handleOutsideClick);
      else $(document).off('click', this.handleOutsideClick);
    });

    // Adiciona listener para mudanças no tamanho da tela
    $(window).on('resize', () => {
      if ($(window).width() > 768) $(document).off('click', this.handleOutsideClick);
      else if ($sideMenu.hasClass('open')) $(document).on('click', this.handleOutsideClick);
    });
  }

  // Fecha o menu se o clique for fora do menu e do botão de toggle
  handleOutsideClick(event) {
    const $sideMenu = $('#side-menu');
    const $menuToggle = $('#menu-toggle');
    const $menuOverlay = $('#menu-overlay');

    // Verifica se o clique foi fora do menu e do botão de toggle
    if (!$sideMenu[0].contains(event.target) && !$menuToggle[0].contains(event.target)) {
      $sideMenu.removeClass('open');
      $menuOverlay.removeClass('show');
      $('body').removeClass('menu-open');
      localStorage.setItem('sideMenuState', 'closed');
      $(document).off('click', this.handleOutsideClick);
    }
  }

  // Inicializa o dropdown do usuário
  initUserDropdown() {
    const $dropdownBtn = $('#user-dropdown-btn');
    const $dropdown = $('#user-dropdown');
    const $logoutBtn = $('#logout-btn');
    const $themeOptions = $dropdown.find('.theme-option');

    if ($dropdownBtn.length && $dropdown.length) {
      $dropdownBtn.on('click', (e) => {
        e.stopPropagation();
        $dropdown.toggleClass('hidden');
      });

      // Usa o ThemeManager global para eventos de tema
      $themeOptions.each(function() {
        $(this).on('click', (e) => {
          e.stopPropagation();
          const theme = $(this).data('theme');
          window.ThemeManager.applyTheme(theme);
        });
      });

      // Fecha o dropdown ao clicar fora dele
      $(document).on('click', (e) => {
        if (!$dropdownBtn[0].contains(e.target) && !$dropdown[0].contains(e.target)) $dropdown.addClass('hidden');
      });
    }

    if ($logoutBtn.length) $logoutBtn.on('click', this.handleLogout);
  }

  // Limpa sessão e redireciona para login
  handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('userSession');
    window.location.href = './signin.html';
  }

  // Inicializa o dropdown de autenticação
  initAuthDropdown() {
    const $authBtn = $('#auth-dropdown-btn');
    const $authDropdown = $('#auth-dropdown');
    const $themeOptions = $authDropdown.find('.theme-option');

    if ($authBtn.length && $authDropdown.length) {
      $authBtn.on('click', (e) => {
        e.stopPropagation();
        $authDropdown.toggleClass('hidden');
      });

      // Configura opções de tema
      $themeOptions.each(function() {
        $(this).on('click', (e) => {
          e.stopPropagation();
          const theme = $(this).data('theme');
          // Usa as funções globais do sistema de temas
          window.applyTheme(theme);
          window.updateActiveTheme(theme);
          localStorage.setItem('theme', theme);
        });
      });

      $(document).on('click', (e) => {
        if (!$authBtn[0].contains(e.target) && !$authDropdown[0].contains(e.target)) $authDropdown.addClass('hidden');
      });
    }
  }

  // Configura navegação pelo teclado
  setupKeyboardNav() {
    $(document).on('keydown', (e) => {
      // ESC fecha menus
      if (e.key === 'Escape') this.closeAllMenus();

      // Alt + M toggle menu lateral
      if (e.key === 'm' && e.altKey) $('#menu-toggle').click();
      
      // Alt + H toggle visibilidade da navegação
      if (e.key === 'h' && e.altKey) $('#toggle-navigation').click();
    });

    // Navegação por Tab nos menus
    $('.nav-link, .dropdown-item').on('keydown', (e) => {
      if (e.key === 'Enter') $(e.target).click();
    });
  }

  // Configura gestos de toque para abrir/fechar o menu lateral
  setupTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const edgeThreshold = 30; // Define uma área de 30px da borda esquerda

    $(document).on('touchstart', (e) => { 
      touchStartX = e.originalEvent.touches[0].clientX; 
    });

    $(document).on('touchend', (e) => {
      touchEndX = e.originalEvent.changedTouches[0].clientX;
      this.handleSwipe();
    });

    this.handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const $sideMenu = $('#side-menu');
      const $menuOverlay = $('#menu-overlay');
      const startedAtLeftEdge = touchStartX <= edgeThreshold;

      if (Math.abs(swipeDistance) > 50) { // Mínimo de 50px
        if (swipeDistance > 0 && startedAtLeftEdge) {
          // Swipe direita - Abre o menu se estiver fechado
          $sideMenu.addClass('open'); // 
          $menuOverlay.addClass('show');
          $('body').addClass('menu-open');

          // Salva o estado do menu
          localStorage.setItem('sideMenuState', 'open');

          // Adiciona listener para dispositivos móveis
          if ($(window).width() <= 768) $(document).on('click', this.handleOutsideClick);
        } else if (swipeDistance < 0 && $sideMenu.hasClass('open')) {
          // Swipe esquerda (qualquer posição) - Fecha o menu se estiver aberto
          $sideMenu.removeClass('open');
          $menuOverlay.removeClass('show');
          $('body').removeClass('menu-open');

          // Atualiza estado no localStorage
          localStorage.setItem('sideMenuState', 'closed');

          // Remove listener
          $(document).off('click', this.handleOutsideClick);
        }
      }
    }
  }

  // Configura observador de conexão para atualizar links
  setupConnectionObserver() {
    // Monitora estado da conexão
    $(window).on('online', () => { 
      this.updateConnectionStatus(true); 
    });

    $(window).on('offline', () => { 
      this.updateConnectionStatus(false); 
    });
  }

  // Atualiza o estado da conexão e estiliza links de acordo
  updateConnectionStatus(isOnline) {
    $('.nav-link').each(function() {
      if (!isOnline) {
        $(this).attr('data-offline', 'true');
        $(this).css('opacity', '0.5');
        $(this).attr('title', $(this).attr('title') + ' (Offline)');
      } else {
        $(this).removeAttr('data-offline');
        $(this).css('opacity', '');
        $(this).attr('title', $(this).attr('title').replace(' (Offline)', ''));
      }
    });
  }

  // Fecha todos os menus abertos
  closeAllMenus() {
    // Fecha menu lateral
    $('#side-menu').removeClass('open');
    $('#menu-overlay').removeClass('show');
    $('body').removeClass('menu-open');
    
    // Atualiza estado no localStorage
    localStorage.setItem('sideMenuState', 'closed');
    
    // Remove listener de clique caso esteja ativo
    $(document).off('click', this.handleOutsideClick);

    // Fecha dropdowns
    $('.user-dropdown, .theme-menu').addClass('hidden');
  }

  // Inicializa o botão de alternância de navegação
  initNavigationToggle() {
    const $toggleBtn = $('#toggle-navigation');
    const $navbar = $('nav');
    const $sideMenu = $('#side-menu');
    
    // Verifica estado salvo
    const navHidden = localStorage.getItem('navigationHidden') === 'true';
    if (navHidden) {
      $navbar.addClass('nav-hidden');
      $sideMenu.addClass('nav-hidden');
      $('body').addClass('nav-hidden');
      $toggleBtn.addClass('rotated');
      // Atualiza o SVG para olho fechado quando oculto
      $toggleBtn.html('<i class="fi fi-sr-layer-plus"></i>');
    }

    $toggleBtn.on('click', () => {
      $navbar.toggleClass('nav-hidden');
      $sideMenu.toggleClass('nav-hidden');
      $('body').toggleClass('nav-hidden');
      $toggleBtn.toggleClass('rotated');
      
      // Alterna entre olho aberto e fechado
      const isHidden = $navbar.hasClass('nav-hidden');
      $toggleBtn.html(isHidden ? '<i class="fi fi-sr-layer-plus"></i>' : '<i class="fi fi-sr-layer-minus"></i>');
      
      // Salva estado
      localStorage.setItem('navigationHidden', isHidden);
    });
  }
}

// Inicializa quando DOM estiver pronto
$(document).ready(function() {
  const navbar = new Navbar();
  navbar.init();
});