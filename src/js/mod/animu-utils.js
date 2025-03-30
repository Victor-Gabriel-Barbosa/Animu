/**
 * Classe utilitária para o sistema Animu
 * Fornece métodos úteis para a aplicação
 */
class AnimuUtils {
  // Cache para evitar requisições duplicadas de avatares
  static avatarCache = {};

  /**
   * Formata uma string de data para o formato brasileiro (dd/mm/aaaa hh:mm).
   * @param {Date|Object|string|number} dateString - A data a ser formatada. 
   * Pode ser objeto Date, timestamp do Firestore, string de data ou timestamp numérico.
   * @returns {string} Data formatada no padrão brasileiro ou 'Agora' se a data for inválida.
   */
  static formatDate(dateString) {
    try {
      let date;

      // Verifica se é um objeto do Firestore timestamp
      if (dateString && typeof dateString === 'object' && dateString.toDate) date = dateString.toDate();
      // Verifica se é um objeto Date
      else if (!isNaN(dateString) && dateString !== null) date = new Date(Number(dateString));
      // Verifica se é uma string de data
      else date = new Date(dateString); 

      // Verifica se a data é válida
      if (isNaN(date.getTime())) return 'Agora';

      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return 'Agora';
    }
  }

  /**
   * Verifica se o usuário atual possui privilégios de administrador.
   * @returns {boolean} Verdadeiro se o usuário for administrador, falso caso contrário.
   */
  static isUserAdmin() {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    return sessionData?.isAdmin || false;
  }

  /**
   * Verifica se um usuário está atualmente logado.
   * 
   * @returns {boolean} Verdadeiro se o usuário estiver logado 
   * (possui uma sessão válida no localStorage), falso caso contrário.
   */
  static isUserLoggedIn() {
    const session = localStorage.getItem('userSession');
    return session !== null;
  }

  /**
   * Obtém o nome de usuário do usuário logado.
   * 
   * @returns {string|null} O nome de usuário do usuário logado, 
   * ou null se não houver sessão ativa.
   */
  static getLoggedUsername() {
    const session = JSON.parse(localStorage.getItem('userSession'));
    return session ? session.username : null;
  }

  /**
   * Verifica se o usuário atualmente logado é o autor com base no nome fornecido.
   * @param {string} authorName - Nome do autor para comparação
   * @returns {boolean} Retorna verdadeiro se o usuário atual for o autor, falso caso contrário
   */
  static isAuthor(authorName) {
    const session = JSON.parse(localStorage.getItem('userSession'));
    return session && session.username === authorName;
  }

  /**
   * Busca o ID de um usuário pelo seu nome de usuário.
   * @param {string} username - Nome de usuário para buscar
   * @returns {Promise<string|null>} ID do usuário ou null se não encontrado
   */
  static async getUserIdByUsername(username) {
    try {
      // Obtém a instância do UserManager
      const userManager = window.userManager || new UserManager();
      const user = await userManager.findUser(username);
      return user ? user.id : null;
    } catch (error) {
      console.error(`Erro ao buscar ID do usuário ${username}:`, error);
      return null;
    }
  }

  /**
   * Obtém o avatar de um autor pelo seu nome de usuário de forma otimizada.
   * Usa um sistema de cache para evitar requisições desnecessárias.
   * 
   * @param {string} username - Nome do usuário para buscar o avatar
   * @returns {string} URL do avatar do usuário ou um avatar padrão
   */
  static getAuthorAvatar(username) {
    // Se já temos o avatar no cache, retorna imediatamente
    if (this.avatarCache[username]) return this.avatarCache[username];
    
    // Avatar padrão para usar enquanto carrega
    const defaultAvatar = './src/assets/images/default-avatar.jpg';
    this.avatarCache[username] = defaultAvatar;
    
    // Obtém a instância do UserManager
    const userManager = window.userManager || new UserManager();
    
    // Inicia processo assíncrono para buscar o avatar real
    this.getUserIdByUsername(username).then(userId => {
      if (!userId) return;
      
      // Busca o avatar usando o ID do usuário
      userManager.getUserAvatar(userId).then(avatarUrl => {
        if (avatarUrl) {
          // Atualiza o cache
          this.avatarCache[username] = avatarUrl;
          
          // Atualiza todas as imagens de avatar deste usuário na página
          document.querySelectorAll(`img[alt="${username}"]`).forEach(img => {
            img.src = avatarUrl;
          });
        }
      }).catch(error => {
        console.error(`Erro ao buscar avatar para ${username}:`, error);
      });
    });
    
    // Retorna o avatar padrão ou o avatar em cache enquanto a busca acontece
    return this.avatarCache[username];
  }
}

// Exporta a classe AnimuUtils para uso global como 'Utils'
window.AnimuUtils = AnimuUtils;