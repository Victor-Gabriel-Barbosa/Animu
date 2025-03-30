/**
 * Classe utilitária para o sistema Animu
 * Fornece métodos úteis para a aplicação
 */
class AnimuUtils {
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
   * Obtém o avatar de um usuário pelo nome de usuário.
   * Se o usuário não for encontrado nos dados armazenados, gera um avatar com as iniciais.
   * @param {string} username - Nome do usuário para buscar o avatar.
   * @returns {string} URL do avatar do usuário.
   */
  static getUserAvatar(username) {
    const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
    const user = users.find(u => u.username === username);
    return user ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B5CF6&color=ffffff&size=100`;
  }
}

// Exporta a classe AnimuUtils para uso global como 'Utils'
window.Utils = AnimuUtils;