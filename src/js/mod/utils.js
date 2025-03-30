class UtilFunctions {
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
}

// Cria uma instância global
window.Utils = new UtilFunctions();