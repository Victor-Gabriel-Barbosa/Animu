document.addEventListener('DOMContentLoaded', function () {
  // Verifica permissões de administrador e redireciona se necessário
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

  // Referência à coleção de usuários no Firestore
  const usersCollection = db.collection('users');

  // Carrega dados de usuários do Firestore
  async function loadUsers() {
    try {
      const snapshot = await usersCollection.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (e) {
      console.error('Erro ao carregar usuários do Firebase:', e);
      // Fallback para localStorage em caso de erro
      return JSON.parse(localStorage.getItem('animuUsers')) || [];
    }
  }

  // Salva alterações de um usuário no Firestore
  async function saveUser(user) {
    try {
      await usersCollection.doc(user.id).set(user);
      return true;
    } catch (e) {
      console.error('Erro ao salvar usuário:', e);
      return false;
    }
  }

  // Remove um usuário do Firestore
  async function deleteUserFromFirestore(userId) {
    try {
      await usersCollection.doc(userId).delete();
      return true;
    } catch (e) {
      console.error('Erro ao excluir usuário:', e);
      return false;
    }
  }

  // Formata data para padrão brasileiro
  function formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    
    // Verifica se é um timestamp do Firestore
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    
    // Caso contrário, tenta converter a string para Date
    return new Date(timestamp).toLocaleDateString('pt-BR');
  }

  // Atualiza estatísticas do painel administrativo
  async function updateStats() {
    try {
      const users = await loadUsers();
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

  // Aplica filtros e popula tabela com usuários correspondentes
  async function updateTable(filterValue = '', userType = 'all') {
    try {
      const users = await loadUsers();
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
      // Busca usuário atual do Firestore
      const userDoc = await usersCollection.doc(userId).get();
      if (!userDoc.exists) {
        alert('Usuário não encontrado!');
        return;
      }
      
      const userData = userDoc.data();
      
      // Altera status de admin
      userData.isAdmin = !userData.isAdmin;
      
      // Salva alterações
      await usersCollection.doc(userId).update({
        isAdmin: userData.isAdmin
      });
      
      // Atualiza interface
      updateTable(searchInput.value, filterType.value);
      updateStats();
      
      alert(`Usuário ${userData.username} agora ${userData.isAdmin ? 'é' : 'não é'} administrador.`);
    } catch (e) {
      console.error('Erro ao alterar status de admin:', e);
      alert('Erro ao alterar status. Tente novamente.');
    }
  };

  // Remove usuário após confirmação
  window.deleteUser = async function (userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      // Exclui do Firestore
      const success = await deleteUserFromFirestore(userId);
      
      if (success) {
        // Atualiza interface
        updateTable(searchInput.value, filterType.value);
        updateStats();
        alert('Usuário excluído com sucesso!');
      } else {
        alert('Erro ao excluir usuário. Tente novamente.');
      }
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