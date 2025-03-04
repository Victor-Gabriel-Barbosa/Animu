document.addEventListener('DOMContentLoaded', function () {
  // Redireciona usuários não-admin para a página inicial
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData?.isAdmin) {
    window.location.href = 'index.html';
    return;
  }

  // Referências DOM para elementos da interface
  const searchInput = document.getElementById('search-user');
  const filterType = document.getElementById('filter-type');
  const tableBody = document.getElementById('users-table-body');
  const totalUsuarios = document.getElementById('total-usuarios');
  const totalAdmins = document.getElementById('total-admins');
  const novosUsuarios = document.getElementById('novos-usuarios');

  // Gerenciamento de dados dos usuários no localStorage
  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem('animuUsers')) || [];
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
      return [];
    }
  }

  // Salva os usuários no localStorage e atualiza a interface	
  function saveUsers(users) {
    try {
      localStorage.setItem('animuUsers', JSON.stringify(users));
      updateTable();
      updateStats();
    } catch (e) {
      console.error('Erro ao salvar usuários:', e);
    }
  }

  // Converte data para formato brasileiro (dd/mm/aaaa)
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  // Atualiza contadores de usuários totais, admins e novos (últimos 7 dias)
  function updateStats() {
    const users = loadUsers();
    const admins = users.filter(user => user.isAdmin);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = users.filter(user => new Date(user.createdAt) > sevenDaysAgo);

    totalUsuarios.textContent = users.length;
    totalAdmins.textContent = admins.length;
    novosUsuarios.textContent = newUsers.length;
  }

  // Gera linha da tabela com dados e ações do usuário
  function createUserRow(user) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <div class="flex items-center">
          <img class="h-10 w-10 rounded-full object-cover"
               src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=8B5CF6&color=ffffff&size=100`}"
               alt="${user.username}">
          <div class="ml-4">
            <div class="font-medium">${user.username}</div>
          </div>
        </div>
      </td>
      <td>${user.email}</td>
      <td>
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}">
              ${user.isAdmin ? 'Admin' : 'Usuário'}
        </span>
      </td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <div class="flex justify-center gap-2">
          <button onclick="toggleAdminStatus('${user.id}')"
                  class="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
                  ${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
          </button>
          <button onclick="deleteUser('${user.id}')"
                  class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors">
            Excluir
          </button>
        </div>
      </td>
    `;
    return tr;
  }

  // Filtra e exibe usuários com base na busca e tipo selecionado
  function updateTable(filterValue = '', userType = 'all') {
    const users = loadUsers();
    tableBody.innerHTML = '';

    users
      .filter(user => {
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
  }

  // Funções globais para ações na interface
  window.toggleAdminStatus = function (userId) {
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.isAdmin = !user.isAdmin;
      saveUsers(users);
    }
  };

  window.deleteUser = function (userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    const users = loadUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
  };

  // Event listeners para filtros e busca
  searchInput.addEventListener('input', () => {
    updateTable(searchInput.value, filterType.value);
  });

  filterType.addEventListener('change', () => {
    updateTable(searchInput.value, filterType.value);
  });

  // Inicializa a interface
  updateTable();
  updateStats();
});