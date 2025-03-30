class AnimuUtils {
  // Propriedade estática para armazenar a instância única
  static #instance;

  // Construtor privado
  constructor() {
    // Verificar se já existe uma instância
    if (AnimuUtils.#instance) return AnimuUtils.#instance;
    
    // Armazenar a instância criada
    AnimuUtils.#instance = this;
  }

  // Método estático para obter a instância única
  static getInstance() {
    if (!AnimuUtils.#instance) AnimuUtils.#instance = new AnimuUtils();
    return AnimuUtils.#instance;
  }

  formatDate(dateString) {
    try {
      let date;

      // Verifica se é um objeto do Firestore timestamp
      if (dateString && typeof dateString === 'object' && dateString.toDate) date = dateString.toDate();
      else if (!isNaN(dateString) && dateString !== null) date = new Date(Number(dateString));
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

  // Verifica permissões de administrador
  isUserAdmin() {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    return sessionData?.isAdmin || false;
  }

  // Obtém o avatar do usuário
  getUserAvatar(username) {
    const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
    const user = users.find(u => u.username === username);
    return user ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B5CF6&color=ffffff&size=100`;
  }
}

// Cria uma instância global
window.Utils = AnimuUtils.getInstance();