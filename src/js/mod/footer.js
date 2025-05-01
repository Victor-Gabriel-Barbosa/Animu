// Classe para gerenciamento do rodapé
class Footer {
  constructor() {
    // Template HTML do rodapé com novo separador refinado e classes Tailwind para responsividade
    this.footerHTML = `
      <footer class="animu-footer">
        <div class="footer-separator">
          <div class="separator-pattern"></div>
          <div class="separator-line"></div>
        </div>

        <div class="footer-content">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div class="footer-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              <!-- Logo e descrição -->
              <div class="footer-brand col-span-1 sm:col-span-2 lg:col-span-1">
                <div class="footer-logo-container flex items-center gap-3">
                  <img src="src/assets/images/favicon/favicon.svg" alt="Logo Animu" class="footer-logo w-10 sm:w-12">
                  <span class="footer-logo-text text-xl sm:text-2xl">Animu</span>
                </div>
                <p class="footer-description text-sm sm:text-base mt-3 sm:mt-4 max-w-md">Sua plataforma definitiva para explorar, descobrir e compartilhar sua paixão pelo universo dos animes.</p>
                <div class="footer-social flex flex-wrap gap-3 sm:gap-4 mt-4">
                  <a href="#" class="social-icon" aria-label="Twitter" title="Siga-nos no Twitter">
                    <i class="fi fi-brands-twitter"></i>
                  </a>
                  <a href="#" class="social-icon" aria-label="Facebook" title="Curta nossa página no Facebook">
                    <i class="fi fi-brands-facebook"></i>
                  </a>
                  <a href="#" class="social-icon" aria-label="Instagram" title="Siga-nos no Instagram">
                    <i class="fi fi-brands-instagram"></i>
                  </a>
                  <a href="#" class="social-icon" aria-label="Discord" title="Entre no nosso Discord">
                    <i class="fi fi-brands-discord"></i>
                  </a>
                </div>
              </div>

              <!-- Links de navegação -->
              <div class="footer-links">
                <h3 class="footer-title text-base sm:text-lg mb-3 sm:mb-4">Navegação</h3>
                <ul class="footer-nav-list space-y-2 sm:space-y-3">
                  <li><a href="index.html" class="footer-link text-sm sm:text-base">Início</a></li>
                  <li><a href="animes.html" class="footer-link text-sm sm:text-base">Animes</a></li>
                  <li><a href="recommendation.html" class="footer-link text-sm sm:text-base">Recomendações</a></li>
                  <li><a href="news.html" class="footer-link text-sm sm:text-base">Notícias</a></li>
                  <li><a href="category.html" class="footer-link text-sm sm:text-base">Categorias</a></li>
                  <li><a href="about.html" class="footer-link text-sm sm:text-base">Sobre</a></li>
                </ul>
              </div>

              <!-- Links legais -->
              <div class="footer-links">
                <h3 class="footer-title text-base sm:text-lg mb-3 sm:mb-4">Informações</h3>
                <ul class="footer-nav-list space-y-2 sm:space-y-3">
                  <li><a href="about.html#termos" class="footer-link text-sm sm:text-base">Termos de Uso</a></li>
                  <li><a href="about.html#privacidade" class="footer-link text-sm sm:text-base">Política de Privacidade</a></li>
                  <li><a href="about.html#cookies" class="footer-link text-sm sm:text-base">Uso de Cookies</a></li>
                  <li><a href="about.html#direitos" class="footer-link text-sm sm:text-base">Direitos Autorais</a></li>
                  <li><a href="about.html#contato" class="footer-link text-sm sm:text-base">Contato</a></li>
                </ul>
              </div>

              <!-- Newsletter -->
              <div class="footer-newsletter col-span-1 sm:col-span-2 lg:col-span-1">
                <h3 class="footer-title text-base sm:text-lg mb-3 sm:mb-4">Fique por dentro</h3>
                <p class="newsletter-text text-sm sm:text-base mb-4">Inscreva-se para receber novidades sobre animes, eventos e atualizações exclusivas.</p>
                <form class="newsletter-form" id="newsletter-form">
                  <div class="newsletter-input-container w-full">
                    <input type="email" placeholder="Seu email" class="newsletter-input w-full text-sm sm:text-base" id="newsletter-email" required>
                    <button type="submit" class="newsletter-button" aria-label="Enviar">
                      <i class="fi fi-sr-paper-plane-top"></i>
                    </button>
                  </div>
                  <div class="newsletter-consent flex items-start gap-2 mt-3">
                    <input type="checkbox" id="newsletter-consent-check" class="mt-1" required>
                    <label for="newsletter-consent-check" class="text-xs sm:text-sm">Concordo em receber emails de marketing</label>
                  </div>
                </form>
              </div>
            </div>

            <div class="footer-bottom flex flex-col md:flex-row md:justify-between md:items-center gap-4 pt-6 mt-8 border-t border-white/10">
              <div class="footer-credit text-center md:text-left">
                <p>
                  <span class="credit-text text-sm">Desenvolvido com</span>
                  <i class="fi fi-sr-heart credit-icon"></i>
                  <span class="credit-text text-sm">por </span>
                  <a href="about.html#equipe" class="credit-link text-sm">Equipe Animu</a>
                </p>
              </div>
              
              <div class="footer-attributions flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-center md:text-right">
                <p class="attribution-item text-xs sm:text-sm">
                  <span>Uicons por </span>
                  <a href="https://www.flaticon.com/uicons" target="_blank" class="attribution-link hover:text-cyan-500">
                    Flaticon
                    <i class="fi fi-brands-flaticon"></i>
                  </a>
                </p>
                <p class="attribution-item text-xs sm:text-sm">
                  <span>Editor por </span>
                  <a href="https://quilljs.com/" target="_blank" class="attribution-link hover:text-yellow-500">
                    Quill.js
                    <i class="fi fi-sr-quill-pen-story"></i>
                  </a>
                </p>
              </div>
              
              <div class="footer-copyright text-center md:text-right">
                <p class="text-xs sm:text-sm">&copy; ${new Date().getFullYear()} Animu. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    `;

    // Inicializa armazenamento para os callbacks de plugins
    this.plugins = [];
  }

  // Inicializa o rodapé
  init() {
    // Remove qualquer rodapé existente
    $('footer').remove();
    
    // Insere o rodapé no final do body
    $('body').append(this.footerHTML);
    
    // Inicializa os componentes interativos
    this.initNewsletter();
    this.initSocialHover();
    this.initSeparatorEffect();
    
    // Aplica o tema atual ao rodapé
    this.applyCurrentTheme();
    
    // Executa os plugins registrados
    this.runPlugins();
  }
  
  // Registra um plugin/extensão para o rodapé
  registerPlugin(callback) {
    if (typeof callback === 'function') {
      this.plugins.push(callback);
    }
  }
  
  // Executa todos os plugins registrados
  runPlugins() {
    this.plugins.forEach(plugin => {
      try {
        plugin(this);
      } catch (error) {
        console.error('Erro ao executar plugin do rodapé:', error);
      }
    });
  }

  // Inicializa formulário de newsletter
  initNewsletter() {
    $('#newsletter-form').on('submit', (e) => {
      e.preventDefault();
      
      const email = $('#newsletter-email').val();
      const consentChecked = $('#newsletter-consent-check').is(':checked');
      
      if (email && consentChecked) {
        // Simula o envio (aqui você implementaria a integração real)
        this.showToast('Inscrição realizada com sucesso!', 'success');
        $('#newsletter-email').val('');
        $('#newsletter-consent-check').prop('checked', false);
        
        // Aqui você pode adicionar código para salvar no Firebase ou outro serviço
        console.log('Email inscrito:', email);
      } else {
        this.showToast('Por favor, preencha todos os campos.', 'error');
      }
    });
  }
  
  // Mostra um toast de confirmação/erro
  showToast(message, type = 'info') {
    // Verifica se o sistema de toasts existe
    if (typeof AnimuUtils !== 'undefined' && AnimuUtils.showToast) {
      AnimuUtils.showToast(message, type);
    } else {
      // Fallback simples se o AnimuUtils não estiver disponível
      const toast = $('<div>').addClass(`toast toast-${type}`).text(message);
      $('body').append(toast);
      setTimeout(() => toast.addClass('show'), 100);
      setTimeout(() => {
        toast.removeClass('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }
  
  // Adiciona efeitos de hover aos ícones sociais
  initSocialHover() {
    $('.social-icon').each(function() {
      $(this).on('mouseenter', function() {
        $(this).addClass('social-hover');
      }).on('mouseleave', function() {
        $(this).removeClass('social-hover');
      });
    });
  }
  
  // Inicializa efeitos interativos do separador
  initSeparatorEffect() {
    // Adiciona interatividade ao padrão do separador
    $('.footer-separator').on('mouseenter', function() {
      $(this).find('.separator-pattern').css({
        'animation-duration': '15s',
        'opacity': '0.6'
      });
    }).on('mouseleave', function() {
      $(this).find('.separator-pattern').css({
        'animation-duration': '20s',
        'opacity': '0.5'
      });
    });
  }
  
  // Aplica o tema atual ao rodapé
  applyCurrentTheme() {
    // Verifica se o ThemeManager global existe
    if (window.ThemeManager) {
      // Obtém o tema atual do localStorage em vez de usar getCurrentTheme()
      const currentTheme = localStorage.getItem('theme') || 'system';
      // Aplica classes específicas de tema se necessário
      $('.animu-footer').attr('data-theme', currentTheme);
    }
  }
  
  // Remove o rodapé completamente (útil para páginas específicas)
  remove() {
    $('.animu-footer, #scroll-to-top').remove();
  }
}

// Inicializa quando DOM estiver pronto
$(document).ready(function() {
  // Cria instância global para poder ser acessada por outros scripts
  window.FooterManager = new Footer();
  window.FooterManager.init();
});