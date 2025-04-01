// Classe para gerenciamento da barra de navegação e barra lateral
class Navbar {
  constructor() {
    // Template HTML principal da navbar com menu lateral e painel de usuário
    this.navHTML = `
      <button id="toggle-navigation" class="toggle-nav-btn" title="Ocultar Navegação (ALT + H)">
        <i class="fi fi-ss-layer-minus"></i>
      </button>
      <nav class="fixed top-0 left-0 right-0" style="z-index:100">
        <div class="mx-auto px-4">
          <div class="flex items-center justify-between h-14">
            <!-- Espaço reservado para o menu e logo -->
            <div class="nav-menu-container">
              <!-- Menu Toggle Button -->
              <button id="menu-toggle" class="menu-toggle-btn" title="Expandir Menu (ALT + M)">
                <i class="fi fi-ss-menu-burger"></i>
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
        <div class="side-menu-content">
          <a href="index.html" class="nav-link" title="Ir para página inicial">
            <i class="fi fi-ss-house-chimney"></i>
            <span>Início</span>
          </a>
          <a href="animes.html" class="nav-link" title="Ver lista de animes">
            <i class="fi fi-ss-graphic-style"></i>
            <span>Animes</span>
          </a>
          <a href="recommendation.html" class="nav-link" title="Ver recomendações de animes">
            <i class="fi fi-ss-sparkles"></i>
            <span>Recomendações</span>
          </a>
          <a href="news.html" class="nav-link" title="Ver notícias sobre animes">
            <i class="fi fi-ss-book-open-cover"></i>
            <span>Notícias</span>
          </a>
          <a href="profile.html" class="nav-link" title="Acessar perfil do usuário">
            <i class="fi fi-ss-user-pen"></i>
            <span>Perfil</span>
          </a>
          <a href="category.html" class="nav-link" title="Explorar categorias de animes">
            <i class="fi fi-ss-palette"></i>
            <span>Categorias</span>
          </a>
          <a href="about.html" class="nav-link" title="Informações sobre o site">
            <i class="fi fi-ss-comment-info"></i>
            <span>Sobre</span>
          </a>
          <!-- Opções de Admin (inicialmente ocultas) -->
          <div id="admin-options" class="hidden">
            <a href="./users-admin.html" class="nav-link admin-link" title="Gerenciar usuários do sistema">
              <i class="fi fi-ss-user-gear"></i>
              <span>Gerenciar Usuários</span>
            </a>
            <a href="./category-admin.html" class="nav-link admin-link" title="Gerenciar categorias de animes">
              <i class="fi fi-ss-customize-computer"></i>
              <span>Gerenciar Categorias</span>
            </a>
            <a href="./animes-admin.html" class="nav-link admin-link" title="Gerenciar catálogo de animes">
              <i class="fi fi-ss-add-image"></i>
              <span>Gerenciar Animes</span>
            </a>
            <a href="./news-admin.html" class="nav-link admin-link" title="Gerenciar notícias do site">
              <i class="fi fi-ss-books-medical"></i>
              <span>Gerenciar Notícias</span>
            </a>
          </div>
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
              <i class="fi fi-ss-user-pen"></i>
              <span>Perfil</span>
            </a>
            ${themeSection}
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-red-600" id="logout-btn">
              <i class="fi fi-ss-leave"></i>
              <span>Sair</span>
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="relative">
          <button id="auth-dropdown-btn" class="auth-btn focus:outline-none" title="Opções de Login">
            <i class="fi fi-ss-user"></i>
          </button>
          <div id="auth-dropdown" class="user-dropdown hidden">
            <a href="./signin.html" class="dropdown-item">
              <i class="fi fi-ss-address-card"></i>
              <span>Entrar</span>
            </a>
            <a href="./signup.html" class="dropdown-item">
              <i class="fi fi-ss-user-add"></i>
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
    document.body.insertAdjacentHTML('afterbegin', this.navHTML);
    document.body.classList.add('has-navbar');

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
    const avatarImg = document.querySelector('.user-avatar');
    const infoAvatarImg = document.querySelector('.user-info-avatar');
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');
    const userType = document.querySelector('.user-type');
    
    if (avatarImg && userData.avatar) avatarImg.src = userData.avatar;
    
    if (infoAvatarImg && userData.avatar) infoAvatarImg.src = userData.avatar;
    
    if (userName) userName.textContent = userData.name || userData.username || 'Usuário';
    
    if (userEmail) userEmail.textContent = userData.email || '';
    
    if (userType) userType.textContent = userData.isAdmin ? 'Administrador' : (userData.isPremium ? 'Assinante Premium' : 'Conta Padrão');
  }

  // Marca o link ativo baseado na URL atual, tratando páginas normais e admin
  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().split('?')[0]; // Ignora parâmetros após o .html

    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href').split('?')[0]; // Ignora parâmetros do href também
      const isAdminPage = currentPage.includes('-admin');
      const isAdminLink = href.includes('-admin');

      // Verifica se é uma página de administração
      if (isAdminPage && isAdminLink) {
        if (currentPage === href.replace('./', '')) link.classList.add('active');
        else link.classList.remove('active');
      }
      // Verifica páginas normais
      else if (!isAdminPage && !isAdminLink) {
        if (currentPage === href.replace('./', '') ||
          (currentPage.includes('anime') && href === 'animes.html') ||
          (currentPage === '' && href === 'index.html')) {
          link.classList.add('active');
        } else link.classList.remove('active');
      }
    });
  }

  // Verifica status de login e configura interface de acordo com permissões
  checkLoginStatus() {
    const userSession = JSON.parse(localStorage.getItem('userSession'));

    if (userSession) {
      const adminOptions = document.getElementById('admin-options');
      const userPanel = document.getElementById('user-panel');

      // Atualiza o avatar se disponível
      if (userSession.avatar && userPanel) {
        const avatarImg = userPanel.querySelector('img');
        if (avatarImg) avatarImg.src = userSession.avatar;
      }

      // Mostra as opções de admin no menu lateral se o usuário for admin
      if (adminOptions && userSession.isAdmin) {
        console.log('Usuário é admin, mostrando opções de admin');
        adminOptions.classList.remove('hidden');
        // Adiciona classe específica para links de admin
        const adminLinks = adminOptions.querySelectorAll('.nav-link');
        adminLinks.forEach(link => { link.classList.add('admin-link'); });
      }
    }
  }

  // Gerencia o menu de administração dropdown
  initAdminMenu() {
    const adminButton = document.getElementById('admin-menu-button');
    const adminMenu = document.getElementById('admin-menu-items');

    if (adminButton && adminMenu) {
      // Adiciona manipulador de clique ao botão
      adminButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        adminMenu.classList.toggle('hidden');
      });

      // Fecha o menu ao clicar em qualquer lugar fora
      document.addEventListener('click', (e) => {
        if (!adminButton.contains(e.target) && !adminMenu.contains(e.target)) adminMenu.classList.add('hidden');
      });

      // Previne que cliques dentro do menu o fechem
      adminMenu.addEventListener('click', (e) => { 
        e.stopPropagation(); 
      });
    }
  }

  // Gerencia estados e eventos do menu lateral, incluindo persistência
  initSideMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    // Verifica o estado do menu ao carregar a página
    const menuState = localStorage.getItem('sideMenuState');
    if (menuState === 'open') {
      sideMenu.classList.add('open');
      menuOverlay.classList.add('show');
      document.body.classList.add('menu-open');
    }

    menuToggle.addEventListener('click', () => {
      sideMenu.classList.toggle('open');
      menuOverlay.classList.toggle('show');
      document.body.classList.toggle('menu-open');

      // Salva o estado do menu
      const isOpen = sideMenu.classList.contains('open');
      localStorage.setItem('sideMenuState', isOpen ? 'open' : 'closed');

      // Adiciona ou remove listener de clique fora baseado no estado do menu
      if (isOpen && window.innerWidth <= 768) document.addEventListener('click', this.handleOutsideClick);
      else document.removeEventListener('click', this.handleOutsideClick);
    });

    // Adiciona listener para mudanças no tamanho da tela
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) document.removeEventListener('click', this.handleOutsideClick);
      else if (sideMenu.classList.contains('open')) document.addEventListener('click', this.handleOutsideClick);
    });
  }

  handleOutsideClick(event) {
    const sideMenu = document.getElementById('side-menu');
    const menuToggle = document.getElementById('menu-toggle');
    const menuOverlay = document.getElementById('menu-overlay');

    // Verifica se o clique foi fora do menu e do botão de toggle
    if (!sideMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      sideMenu.classList.remove('open');
      menuOverlay.classList.remove('show');
      document.body.classList.remove('menu-open');
      localStorage.setItem('sideMenuState', 'closed');
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  // Inicializa o dropdown do usuário
  initUserDropdown() {
    const dropdownBtn = document.getElementById('user-dropdown-btn');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const themeOptions = dropdown?.querySelectorAll('.theme-option');

    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      // Usa o ThemeManager global para eventos de tema
      themeOptions?.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const theme = option.dataset.theme;
          window.ThemeManager.applyTheme(theme);
        });
      });

      // Fecha o dropdown ao clicar fora dele
      document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden'); 
      });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', this.handleLogout);
  }

  // Limpa sessão e redireciona para login
  handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('userSession');
    window.location.href = './signin.html';
  }

  // Inicializa o dropdown de autenticação
  initAuthDropdown() {
    const authBtn = document.getElementById('auth-dropdown-btn');
    const authDropdown = document.getElementById('auth-dropdown');
    const themeOptions = authDropdown?.querySelectorAll('.theme-option');

    if (authBtn && authDropdown) {
      authBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        authDropdown.classList.toggle('hidden');
      });

      // Configura opções de tema
      themeOptions?.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const theme = option.dataset.theme;
          // Usa as funções globais do sistema de temas
          window.applyTheme(theme);
          window.updateActiveTheme(theme);
          localStorage.setItem('theme', theme);
        });
      });

      document.addEventListener('click', (e) => {
        if (!authBtn.contains(e.target) && !authDropdown.contains(e.target))  authDropdown.classList.add('hidden');
      });
    }
  }

  // Configura navegação pelo teclado
  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // ESC fecha menus
      if (e.key === 'Escape') this.closeAllMenus();

      // Alt + M toggle menu lateral
      if (e.key === 'm' && e.altKey) document.getElementById('menu-toggle').click();
      
      // Alt + H toggle visibilidade da navegação
      if (e.key === 'h' && e.altKey) document.getElementById('toggle-navigation').click();
    });

    // Navegação por Tab nos menus
    const menuItems = document.querySelectorAll('.nav-link, .dropdown-item');
    menuItems.forEach(item => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.click();
      });
    });
  }

  // Configura gestos de toque para abrir/fechar o menu lateral
  setupTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const edgeThreshold = 30; // Define uma área de 30px da borda esquerda

    document.addEventListener('touchstart', (e) => { 
      touchStartX = e.touches[0].clientX; 
    }, false);

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      this.handleSwipe();
    }, false);

    this.handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const sideMenu = document.getElementById('side-menu');
      const menuOverlay = document.getElementById('menu-overlay');
      const startedAtLeftEdge = touchStartX <= edgeThreshold;

      if (Math.abs(swipeDistance) > 50) { // Mínimo de 50px
        if (swipeDistance > 0 && startedAtLeftEdge) {
          // Swipe direita a partir da borda esquerda - Abre o menu
          sideMenu.classList.add('open');
          menuOverlay.classList.add('show');
          document.body.classList.add('menu-open');
          // Salva o estado do menu
          localStorage.setItem('sideMenuState', 'open');
          // Adiciona listener para dispositivos móveis
          if (window.innerWidth <= 768) document.addEventListener('click', this.handleOutsideClick);
        } else if (swipeDistance < 0 && sideMenu.classList.contains('open')) {
          // Swipe esquerda (qualquer posição) - Fecha o menu se estiver aberto
          sideMenu.classList.remove('open');
          menuOverlay.classList.remove('show');
          document.body.classList.remove('menu-open');
          // Atualiza estado no localStorage
          localStorage.setItem('sideMenuState', 'closed');
          // Remove listener
          document.removeEventListener('click', this.handleOutsideClick);
        }
      }
    }
  }

  // Configura observador de conexão para atualizar links
  setupConnectionObserver() {
    // Monitora estado da conexão
    window.addEventListener('online', () => { 
      this.updateConnectionStatus(true); 
    });

    window.addEventListener('offline', () => { 
      this.updateConnectionStatus(false); 
    });
  }

  // Atualiza o estado da conexão e estiliza links de acordo
  updateConnectionStatus(isOnline) {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      if (!isOnline) {
        link.setAttribute('data-offline', 'true');
        link.style.opacity = '0.5';
        link.title += ' (Offline)';
      } else {
        link.removeAttribute('data-offline');
        link.style.opacity = '';
        link.title = link.title.replace(' (Offline)', '');
      }
    });
  }

  // Fecha todos os menus abertos
  closeAllMenus() {
    // Fecha menu lateral
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('show');
    document.body.classList.remove('menu-open');
    
    // Atualiza estado no localStorage
    localStorage.setItem('sideMenuState', 'closed');
    
    // Remove listener de clique caso esteja ativo
    document.removeEventListener('click', this.handleOutsideClick);

    // Fecha dropdowns
    document.querySelectorAll('.user-dropdown, .theme-menu').forEach(menu => menu.classList.add('hidden'));
  }

  // Inicializa o botão de alternância de navegação
  initNavigationToggle() {
    const toggleBtn = document.getElementById('toggle-navigation');
    const navbar = document.querySelector('nav');
    const sideMenu = document.getElementById('side-menu');
    
    // Verifica estado salvo
    const navHidden = localStorage.getItem('navigationHidden') === 'true';
    if (navHidden) {
      navbar.classList.add('nav-hidden');
      sideMenu.classList.add('nav-hidden');
      document.body.classList.add('nav-hidden');
      toggleBtn.classList.add('rotated');
      // Atualiza o SVG para olho fechado quando oculto
      toggleBtn.innerHTML = `
        <i class="fi fi-ss-layer-minus"></i>
      `;
    }

    toggleBtn.addEventListener('click', () => {
      navbar.classList.toggle('nav-hidden');
      sideMenu.classList.toggle('nav-hidden');
      document.body.classList.toggle('nav-hidden');
      toggleBtn.classList.toggle('rotated');
      
      // Alterna entre olho aberto e fechado
      const isHidden = navbar.classList.contains('nav-hidden');
      toggleBtn.innerHTML = isHidden ? `
        <i class="fi fi-ss-layer-plus"></i>
      ` : `
        <i class="fi fi-ss-layer-minus"></i>
      `;
      
      // Salva estado
      localStorage.setItem('navigationHidden', isHidden);
    });
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const navbar = new Navbar();
  navbar.init();
});