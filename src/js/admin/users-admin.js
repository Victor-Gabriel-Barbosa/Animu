// Verifica se o usuário é admin ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
 if (!AnimuUtils.isUserAdmin()) return;

  // Instancia o gerenciador de usuários
  const userManager = new UserManager();

  // Referências DOM para elementos da interface
  const searchInput = document.getElementById('search-user');
  const filterType = document.getElementById('filter-type');
  const tableBody = document.getElementById('users-table-body');
  const totalUsuarios = document.getElementById('total-usuarios');
  const totalAdmins = document.getElementById('total-admins');
  const novosUsuarios = document.getElementById('novos-usuarios');

  // Atualiza estatísticas do painel administrativo
  async function updateStats() {
    try {
      const users = await userManager.loadUsers();
      const admins = users.filter(user => user.isAdmin);
      
      // Calcula novos usuários nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const newUsers = users.filter(user => {
        const userDate = user.createdAt?.toDate ? 
          user.createdAt.toDate() : new Date(user.createdAt);
        return userDate > sevenDaysAgo;
      });

      // Atualiza contadores na interface
      totalUsuarios.textContent = users.length;
      totalAdmins.textContent = admins.length;
      novosUsuarios.textContent = newUsers.length;
    } catch (e) {
      console.error('Erro ao atualizar estatísticas:', e);
    }
  }

  // Gera elemento TR com dados e controles para cada usuário
  function createUserRow(user) {
    const tr = document.createElement('tr');

    // Template da linha com informações e botões de ação
    tr.innerHTML = `
      <td>
        <div class="flex flex-col items-center md:flex-row gap-3 mt-6">
          <img class="h-10 w-10 rounded-full object-cover"
               src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=8B5CF6&color=ffffff&size=100`}"
               alt="${user.username}">
          <div class="ml-4">
            <div class="font-medium">${user.username}</div>
          </div>
        </div>
      </td>
      <td >${user.email}</td>
      <td>
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}">
              ${user.isAdmin ? 'Admin' : 'Usuário'}
        </span>
      </td>
      <td>${AnimuUtils.formatDate(user.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button onclick="toggleAdminStatus('${user.id}')"
                  class="btn-action btn-edit"
                  title="${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}">
                  ${user.isAdmin ? 
                    `<i class="fi fi-bs-shield-check"></i>` : 
                    `<i class="fi fi-bs-shield-slash"></i>`
                  }
          </button>
          <button class="btn-action btn-delete" title="Remover" onclick="deleteUser('${user.id}')">
            <i class="fi fi-bs-trash"></i>
          </button>
        </div>
      </td>
    `;
    return tr;
  }

  // Aplica filtros e popula tabela com usuários correspondentes
  async function updateTable(filterValue = '', userType = 'all') {
    try {
      const users = await userManager.loadUsers();
      tableBody.innerHTML = '';

      users
        .filter(user => {
          // Filtra por termo de busca e tipo de usuário
          const matchesSearch = user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
            user.email.toLowerCase().includes(filterValue.toLowerCase());
          const matchesType = userType === 'all' ||
            (userType === 'admin' && user.isAdmin) ||
            (userType === 'user' && !user.isAdmin);
          return matchesSearch && matchesType;
        })
        .forEach(user => {
          tableBody.appendChild(createUserRow(user));
        });
    } catch (e) {
      console.error('Erro ao atualizar tabela:', e);
    }
  }

  // Alterna privilégios de administrador para um usuário
  window.toggleAdminStatus = async function (userId) {
    try {
      // Busca usuário atual
      const user = await userManager.getUserById(userId);
      if (!user) {
        alert('Usuário não encontrado!');
        return;
      }
      
      // Altera status de admin
      user.isAdmin = !user.isAdmin;
      
      // Salva alterações usando userManager
      await userManager.saveUser(user);
      
      // Atualiza interface
      updateTable(searchInput.value, filterType.value);
      updateStats();
      
      alert(`Usuário ${user.username} agora ${user.isAdmin ? 'é' : 'não é'} administrador.`);
    } catch (e) {
      console.error('Erro ao alterar status de admin:', e);
      alert('Erro ao alterar status. Tente novamente.');
    }
  };

  // Remove usuário após confirmação
  window.deleteUser = async function (userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      // Busca referência à coleção de usuários para excluir (não existe método de exclusão no UserManager)
      await db.collection('users').doc(userId).delete();
      
      // Atualiza interface
      updateTable(searchInput.value, filterType.value);
      updateStats();
      alert('Usuário excluído com sucesso!');
    } catch (e) {
      console.error('Erro ao excluir usuário:', e);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  // Conecta eventos de interface aos manipuladores de filtro
  searchInput.addEventListener('input', () => {
    updateTable(searchInput.value, filterType.value);
  });

  filterType.addEventListener('change', () => {
    updateTable(searchInput.value, filterType.value);
  });

  // Inicialização da interface administrativa
  updateTable();
  updateStats();
});