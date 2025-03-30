// Restringe acesso à área administrativa validando credenciais do usuário
function checkAdminAccess() {
  // Redireciona para página inicial se não for admin
  if (!AnimuUtils.isUserAdmin()) {
    alert('Acesso negado. Esta página é restrita a administradores.');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Inicialização da página administrativa
document.addEventListener('DOMContentLoaded', function () {
  if (!checkAdminAccess()) return;
});

// Torna acessível globalmente 
window.checkAdminAccess = checkAdminAccess;