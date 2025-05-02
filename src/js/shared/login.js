// Aguarda o carregamento do DOM
$(document).ready(async function () { 
  // Classe responsável pela autenticação e gerenciamento de usuários
  class AuthManager { 
    constructor() {
      this.loginAttempts = {};
      this.maxAttempts = 3;
      this.lockoutDuration = 15 * 60 * 1000; // 15 minutos em milissegundos
      this.userManager = new UserManager();
    }

    // Função para hash de senha usando SHA-256
    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Valida força da senha
    validatePasswordStrength(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      const errors = [];
      if (password.length < minLength) errors.push(`Mínimo de ${minLength} caracteres`);
      if (!hasUpperCase) errors.push('Pelo menos uma letra maiúscula');
      if (!hasLowerCase) errors.push('Pelo menos uma letra minúscula');
      if (!hasNumbers) errors.push('Pelo menos um número');
      if (!hasSpecialChars) errors.push('Pelo menos um caractere especial');

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    // Verifica tentativas de login
    checkLoginAttempts(username) {
      const attempts = this.loginAttempts[username];
      if (attempts) {
        if (attempts.count >= this.maxAttempts &&
          Date.now() - attempts.lastAttempt < this.lockoutDuration) {
          const remainingTime = Math.ceil((this.lockoutDuration - (Date.now() - attempts.lastAttempt)) / 1000 / 60);
          throw new Error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
        }
        if (Date.now() - attempts.lastAttempt >= this.lockoutDuration) delete this.loginAttempts[username];
      }
    }

    // Registrar tentativa de login
    recordLoginAttempt(username, success) {
      if (!this.loginAttempts[username]) this.loginAttempts[username] = { count: 0, lastAttempt: Date.now() };
      if (!success) {
        this.loginAttempts[username].count++;
        this.loginAttempts[username].lastAttempt = Date.now();
      } else delete this.loginAttempts[username];
    }

    // Valida registro de usuário
    async validateRegistration(username, email, password, confirmPassword) {
      // Validações básicas
      if (username.length < 3) throw new Error('Nome de usuário deve ter pelo menos 3 caracteres.');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new Error('Por favor, insira um e-mail válido.');

      if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');

      if (password !== confirmPassword) throw new Error('As senhas não coincidem.');

      // Verifica usuário ou e-mail existente
      try {
        const existenceCheck = await this.userManager.checkUserExists(username, email);
        
        if (existenceCheck.usernameExists || existenceCheck.emailExists) throw new Error('Usuário ou e-mail já cadastrado!');
      } catch (error) {
        console.error("Erro ao verificar usuário existente:", error);
        throw error;
      }
    }

    // Registro de usuário
    async registerUser(username, email, password, confirmPassword) {
      try {
        // Valida registro
        await this.validateRegistration(username, email, password, confirmPassword);

        // Valida força da senha
        const passwordValidation = this.validatePasswordStrength(password);
        if (!passwordValidation.isValid) throw new Error('Senha fraca. Requisitos:\n' + passwordValidation.errors.join('\n'));

        // Hash da senha
        const hashedPassword = await this.hashPassword(password);

        // Gera o avatar
        const avatar = this.generateAvatar(username);

        // Cria novo usuário (o timestamp será adicionado pelo método saveUser)
        const newUser = {
          username,
          email,
          password: hashedPassword,
          avatar: avatar,
          isAdmin: false,
          favoriteAnimes: [],
          watchedAnimes: [],
          friends: [],
          friendRequests: []
        };

        // Salva usuário no Firestore e obtém o objeto com ID
        const savedUser = await this.userManager.saveUser(newUser);

        // Cria sessão do usuário automaticamente
        const sessionData = {
          userId: savedUser.id,
          username: savedUser.username,
          isAdmin: savedUser.isAdmin,
          avatar: savedUser.avatar,
          loginTime: new Date().toISOString()
        };

        // Salva sessão
        localStorage.setItem('userSession', JSON.stringify(sessionData));

        return true;
      } catch (error) {
        this.showError(error.message);
        return false;
      }
    }

    // Salva credenciais do usuário
    saveCredentials(username, password) {
      const credentials = {
        username: username,
        password: password, // Mantém senha original para "Lembrar de mim"
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('savedCredentials', JSON.stringify(credentials));
    }

    // Carrega credenciais salvas
    loadSavedCredentials() {
      const saved = localStorage.getItem('savedCredentials');
      return saved ? JSON.parse(saved) : null;
    }

    // Limpa credenciais salvas
    clearSavedCredentials() {
      localStorage.removeItem('savedCredentials');
    }

    // Método para validar credenciais salvas
    validateSavedCredentials(credentials) {
      if (!credentials || !credentials.savedAt) return false;

      // Verifica se as credenciais têm menos de 30 dias
      const savedDate = new Date(credentials.savedAt);
      const now = new Date();
      const diffDays = (now - savedDate) / (1000 * 60 * 60 * 24);

      return diffDays <= 30; // Expira após 30 dias
    }

    // Método de login do usuário
    async loginUser(identifier, password, remember = false) {
      try {
        this.checkLoginAttempts(identifier);

        const hashedPassword = await this.hashPassword(password);
        const user = await this.userManager.findUser(identifier);

        if (!user) throw new Error('Usuário não encontrado.');

        if (user.password !== hashedPassword) {
          this.recordLoginAttempt(identifier, false);
          throw new Error('Senha incorreta.');
        }

        this.recordLoginAttempt(identifier, true);

        const sessionData = {
          userId: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          avatar: user.avatar,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('userSession', JSON.stringify(sessionData));

        if (remember) this.saveCredentials(user.username, password);
        else this.clearSavedCredentials();

        return true;
      } catch (error) {
        console.error('Erro no login:', error);
        throw error;
      }
    }

    // Login com Google
    async loginWithGoogle() {
      try {
        // Inicia o processo de autenticação com popup
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Obtém os dados do usuário Google
        const googleUser = {
          email: user.email,
          username: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL || this.generateAvatar(user.displayName || user.email.split('@')[0]),
          googleId: user.uid
        };
        
        // Verifica se o usuário já existe no sistema
        const existingUser = await this.userManager.findUserByEmail(googleUser.email);
        
        let userData;
        if (!existingUser) {
          // Cria um novo usuário
          const newUser = {
            username: googleUser.username,
            email: googleUser.email,
            avatar: googleUser.avatar,
            googleId: googleUser.googleId,
            isAdmin: false,
            favoriteAnimes: [],
            watchedAnimes: [],
            friends: [],
            friendRequests: []
          };
          
          // Salva no Firestore
          userData = await this.userManager.saveUser(newUser);
        } else {
          // Atualiza o usuário existente com as informações do Google, caso necessário
          if (!existingUser.googleId) {
            await this.userManager.updateUser(existingUser.id, {
              googleId: googleUser.googleId,
              avatar: existingUser.avatar || googleUser.avatar
            });
          }
          userData = existingUser;
        }
        
        // Cria sessão de usuário
        const sessionData = {
          userId: userData.id,
          username: userData.username,
          isAdmin: userData.isAdmin,
          avatar: userData.avatar,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        return true;
      } catch (error) {
        console.error('Erro na autenticação com o Google:', error);
        let errorMessage = 'Erro ao conectar com o Google. Tente novamente.';
        
        // Mensagens específicas para erros comuns
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'O login foi cancelado. A janela de autenticação foi fechada.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'O popup de login foi bloqueado pelo navegador. Permita popups para este site.';
        }
        
        this.showError(errorMessage);
        return false;
      }
    }

    // Atualizar painel de usuário
    updateUserPanel() {
      const sessionData = JSON.parse(localStorage.getItem('userSession'));

      if (sessionData && $('#user-panel').length) {
        // Mostra painel de usuário
        $('#user-panel').removeClass('hidden');

        // Atualiza nome de usuário com link para o perfil
        $('#user-name').html(`<a href="perfil.html" class="hover:text-purple-600 transition-colors">${sessionData.username}</a>`);

        // Mostra link de logout
        $('#logout-link').removeClass('hidden');

        // Usa o avatar salvo no objeto de sessão
        if (sessionData.avatar) {
          const $userAvatar = $('#user-panel img');
          $userAvatar.attr('src', sessionData.avatar);
          $userAvatar.css('cursor', 'pointer');
          $userAvatar.attr('title', 'Ver perfil');
          $userAvatar.on('click', () => window.location.href = 'perfil.html');
        }

        return true;
      } else if ($('#user-name').length) {
        $('#user-name').html('<a href="signin.html">Login</a>');
        $('#logout-link').addClass('hidden');
      }

      return false;
    }

    // Gera avatar único baseado no nome de usuário
    generateAvatar(username) {
      // Gera cor baseada no hash do nome de usuário
      let hash = 0;
      for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);

      // Gerar uma cor mais agradável usando HSL
      const hue = hash % 360;
      const saturation = 70; // Fixo em 70% para cores não muito saturadas
      const lightness = 60;  // Fixo em 60% para cores não muito claras ou escuras

      // Converte HSL para HEX
      const color = this.hslToHex(hue, saturation, lightness);

      // Retorna URL do avatar usando a cor gerada
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${color.substring(1)}&color=ffffff&size=100`;
    }

    // Função auxiliar para converter HSL para HEX
    hslToHex(h, s, l) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }

    // Logout
    logout() {
      // Remove sessão
      localStorage.removeItem('userSession');
      this.clearSavedCredentials();
      
      // Desloga do Firebase Auth
      auth.signOut().catch(error => {
        console.error('Erro ao fazer logout do Firebase:', error);
      });
      
      // Recarrega a janela
      window.location.reload();
    }

    // Mostra erros com feedback visual
    showError(message) {
      // Remove qualquer mensagem de erro existente
      this.clearErrors();

      // Adiciona estilo para a animação se não existir
      if (!$('#error-animation-style').length) {
        $('head').append(
          $('<style id="error-animation-style"></style>').text(`
            @keyframes slideDown {
              from {
                transform: translate(-50%, -100%);
                opacity: 0;
              }
              to {
                transform: translate(-50%, 0);
                opacity: 1;
              }
            }
            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
          `)
        );
      }

      // Cria o elemento de erro com jQuery
      const $errorDiv = $('<div></div>')
        .addClass('error-message')
        .text(message)
        .css({
          'background-color': '#ff5757',
          'color': 'white',
          'padding': '12px 20px',
          'border-radius': '8px',
          'margin-bottom': '16px',
          'position': 'fixed',
          'top': '20px',
          'left': '50%',
          'transform': 'translateX(-50%)',
          'z-index': '1000',
          'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
          'animation': 'slideDown 0.3s ease-out',
          'max-width': '90%',
          'text-align': 'center'
        })
        .appendTo('body');

      // Remove a mensagem após 5 segundos com animação de fade out
      setTimeout(() => {
        $errorDiv.css('animation', 'fadeOut 0.3s ease-out');
        setTimeout(() => $errorDiv.remove(), 300);
      }, 5000);
    }

    // Método para limpar mensagens de erro existentes
    clearErrors() {
      $('.error-message').remove();
    }
  }

  // Inicializa UserManager e migra dados do localStorage para o Firebase
  const userManager = new UserManager();
  await userManager.migrateLocalStorageToFirebase();

  // Inicializa AuthManager
  const authManager = new AuthManager();
  
  // Armazena a página anterior quando o usuário acessa as páginas de login/registro
  if (window.location.pathname.includes('signin.html') || window.location.pathname.includes('signup.html')) {
    const referrer = document.referrer;
    if (referrer && !referrer.includes('signin.html') && !referrer.includes('signup.html')) {
      sessionStorage.setItem('previousPage', referrer);
    }
  }

  // Atualiza o painel de usuário quando o documento estiver pronto
  authManager.updateUserPanel();
  
  // Configuração para o botão "Continuar com Google" (usado em ambas as páginas de login e cadastro)
  $('#google-login-button').on('click', async function () {
    try {
      const success = await authManager.loginWithGoogle();
      if (success) {
        authManager.updateUserPanel();

        // Mostra mensagem de sucesso
        const $message = $('<div></div>')
          .addClass('success-message')
          .text('Login realizado com sucesso! Redirecionando...')
          .css({
            'background-color': '#4CAF50',
            'color': 'white',
            'padding': '12px 20px',
            'border-radius': '8px',
            'position': 'fixed',
            'top': '20px',
            'left': '50%',
            'transform': 'translateX(-50%)',
            'z-index': '1000',
            'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
            'animation': 'slideDown 0.3s ease-out'
          })
          .appendTo('body');

        // Redireciona para a página anterior ou index.html
        setTimeout(() => {
          const previousPage = sessionStorage.getItem('previousPage');
          sessionStorage.removeItem('previousPage'); // Limpar depois de usar
          window.location.href = previousPage || 'index.html';
        }, 1500);
      }
    } catch (error) {
      authManager.showError(error.message);
    }
  });

  // Registro de usuário
  if ($('#register-form').length) {
    $('#register-form').on('submit', async function (event) {
      event.preventDefault();
      try {
        const username = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();

        const success = await authManager.registerUser(
          username,
          email,
          password,
          confirmPassword
        );

        if (success) {
          const $message = $('<div></div>')
            .addClass('success-message')
            .text('Conta criada com sucesso! Redirecionando...')
            .css({
              'background-color': '#4CAF50',
              'color': 'white',
              'padding': '12px 20px',
              'border-radius': '8px',
              'position': 'fixed',
              'top': '20px',
              'left': '50%',
              'transform': 'translateX(-50%)',
              'z-index': '1000',
              'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
              'animation': 'slideDown 0.3s ease-out'
            })
            .appendTo('body');

          // Redireciona para a página anterior ou index.html após o registro
          setTimeout(() => {
            const previousPage = sessionStorage.getItem('previousPage');
            sessionStorage.removeItem('previousPage'); // Limpa depois de usar
            window.location.href = previousPage || 'index.html';
          }, 1500);
        }
      } catch (error) {
        authManager.showError(error.message);
      }
    });
  }

  // Login de usuário
  if ($('#login-form').length) {
    const savedCredentials = authManager.loadSavedCredentials();
    if (savedCredentials && authManager.validateSavedCredentials(savedCredentials)) {
      $('#username').val(savedCredentials.username);
      $('#password').val(savedCredentials.password);
      $('#remember-me').prop('checked', true);
    } else {
      authManager.clearSavedCredentials(); // Limpa credenciais expiradas
    }

    $('#login-form').on('submit', async function (event) {
      event.preventDefault();
      const $submitButton = $(this).find('button[type="submit"]');
      $submitButton.prop('disabled', true);

      try {
        const username = $('#username').val();
        const password = $('#password').val();
        const remember = $('#remember-me').is(':checked');

        await authManager.loginUser(username, password, remember);
        authManager.updateUserPanel();

        // Redireciona para a página anterior ou index.html
        const previousPage = sessionStorage.getItem('previousPage');
        sessionStorage.removeItem('previousPage'); // Limpar depois de usar
        window.location.href = previousPage || 'index.html';
      } catch (error) {
        authManager.showError(error.message);
      } finally {
        $submitButton.prop('disabled', false);
      }
    });

    // Login com Google
    $('#google-login-button').on('click', async function () {
      try {
        const success = await authManager.loginWithGoogle();
        if (success) {
          authManager.updateUserPanel();

          // Redireciona para a página anterior ou index.html
          const previousPage = sessionStorage.getItem('previousPage');
          sessionStorage.removeItem('previousPage'); // Limpar depois de usar
          window.location.href = previousPage || 'index.html';
        }
      } catch (error) {
        authManager.showError(error.message);
      }
    });
  }

  // Adiciona botão/link de logout (se existir)
  $('#logout-link').on('click', function (event) {
    event.preventDefault();
    authManager.logout();
  });

  // Configura o toggle de visibilidade da senha
  $('.password-toggle').on('click', function () {
    const $input = $(this).closest('.password-input-wrapper').find('input');
    const type = $input.attr('type') === 'password' ? 'text' : 'password';
    $input.attr('type', type);

    // Toggle ícones
    const $eyeIcon = $(this).find('.eye-icon');
    const $eyeOffIcon = $(this).find('.eye-off-icon');
    $eyeIcon.toggleClass('hidden');
    $eyeOffIcon.toggleClass('hidden');
  });

  // Configura o botão de voltar
  $('#back-button').on('click', function() {
    if (document.referrer) {
      // Verifica se o referrer é uma URL do projeto Animu
      const referrer = new URL(document.referrer);
      if (referrer.pathname.includes('/PW_1/Animu/')) window.history.back();
      else window.location.href = 'index.html';
    } else window.location.href = 'index.html';
  });
});