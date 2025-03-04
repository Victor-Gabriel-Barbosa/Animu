// Restringe acesso à área administrativa validando credenciais do usuário
function checkAdminAccess() {
  const session = JSON.parse(localStorage.getItem('userSession'));
  // Redireciona para página inicial se não for admin
  if (!session || !session.isAdmin) {
    alert('Acesso negado. Esta página é restrita a administradores.');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Inicialização da página administrativa
document.addEventListener('DOMContentLoaded', function () {
  // Verifica permissões apenas
  if (!checkAdminAccess()) return;
});