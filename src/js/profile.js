document.addEventListener('DOMContentLoaded', function () {
  // Obtém ID do usuário da URL se existir
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');

  // Verifica sessão ativa
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  // Carrega dados do usuário
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  let currentUser;

  // Se houver ID na URL, carrega o perfil do usuário específico
  if (profileId) {
    currentUser = users.find(user => user.id === profileId);
    if (!currentUser) {
      alert('Usuário não encontrado');
      window.location.href = 'profile.html';
      return;
    }

    // Verifica se é amigo
    const loggedUser = users.find(user => user.id === sessionData.userId);
    const isFriend = loggedUser.friends?.includes(currentUser.id);

    if (!isFriend && currentUser.id !== sessionData.userId) {
      alert('Você precisa ser amigo deste usuário para ver seu perfil');
      window.location.href = 'profile.html';
      return;
    }

    // Ajusta interface para perfil visitado
    adjustInterfaceForVisitedProfile(currentUser, sessionData.userId === currentUser.id);
  } else currentUser = users.find(user => user.id === sessionData.userId); // Carrega o próprio perfil 

  if (!currentUser) {
    console.error('Usuário não encontrado');
    return;
  }

  // Inicializa os dados do perfil
  initializeProfile(currentUser);
  loadStatistics(currentUser);
  loadAchievements(currentUser);
  loadFavoriteAnimes(currentUser);
  loadActivityTimeline(currentUser);
  setupEventListeners(currentUser, sessionData.userId === currentUser.id);
});

/**
 * Ajusta a interface baseado se é perfil próprio ou visitado
 * @param {Object} profileUser - Dados do usuário do perfil
 * @param {boolean} isOwnProfile - Se é o próprio perfil
 */
function adjustInterfaceForVisitedProfile(profileUser, isOwnProfile) {
  const editButton = document.getElementById('edit-profile');
  const logoutButton = document.getElementById('logout-button');
  const changeAvatarButton = document.querySelector('#change-avatar');
  const addFriendBtn = document.getElementById('add-friend-btn');

  if (!isOwnProfile) {
    // Oculta botões de edição e logout
    editButton.style.display = 'none';
    logoutButton.style.display = 'none';
    changeAvatarButton.style.display = 'none';
    addFriendBtn.style.display = 'none';

    // Adiciona botão de chat se não for o próprio perfil
    const buttonContainer = document.querySelector('.flex.gap-3.mt-4');
    buttonContainer.innerHTML = `
      <button onclick="openChat('${profileUser.id}')"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg 
                     hover:bg-purple-700 transition-all hover:scale-105">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        Enviar Mensagem
      </button>
      <button onclick="window.history.back()"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg 
                     hover:bg-gray-700 transition-all hover:scale-105">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Voltar
      </button>
    `;
  }
}

// Inicializa a página de perfil após carregamento do DOM
document.addEventListener('DOMContentLoaded', function () {
  // Redireciona para login se não houver sessão ativa
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  // Carrega os dados do usuário
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = users.find(user => user.id === sessionData.userId);

  if (!currentUser) {
    console.error('Usuário não encontrado');
    return;
  }

  // Inicializa os dados do perfil
  initializeProfile(currentUser);
  loadStatistics(currentUser);
  loadAchievements(currentUser);
  loadFavoriteAnimes(currentUser);
  loadActivityTimeline(currentUser);
  setupEventListeners(currentUser);
});

// Exibe informações básicas do perfil do usuário
function initializeProfile(user) {
  // Atualiza informações básicas
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('display-name').textContent = user.displayName || user.username;
  document.getElementById('profile-joined').textContent = `Membro desde: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}`;

  // Usa o avatar da sessão do usuário
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (sessionData && sessionData.avatar) document.getElementById('profile-avatar').src = sessionData.avatar;

  // Atualiza gêneros favoritos
  const favoriteGenres = document.getElementById('favorite-genres');
  favoriteGenres.innerHTML = user.favoriteGenres?.map(genre => `<span class="genre">${genre}</span>`).join('') || 'Nenhum gênero favorito';
}

// Calcula e exibe métricas de engajamento do usuário
function loadStatistics(user) {
  // Obtém dados de interações do usuário
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  const forumTopics = JSON.parse(localStorage.getItem('forumTopics')) || [];
  const userComments = Object.values(comments).flat().filter(c => c.username === user.username);

  // Contagem de tópicos e respostas do fórum
  const userTopics = forumTopics.filter(t => t.author === user.username);
  const userReplies = forumTopics.flatMap(t => t.replies).filter(r => r.author === user.username);

  // Total de likes recebidos em tópicos e respostas do fórum
  const forumLikes = userTopics.reduce((sum, topic) => sum + (topic.likes || 0), 0) +
    userReplies.reduce((sum, reply) => sum + (reply.likes || 0), 0);

  document.getElementById('stats-animes').textContent = user.watchedAnimes?.length || 0;
  document.getElementById('stats-reviews').textContent = userComments.length + userTopics.length;
  document.getElementById('stats-likes').textContent = userComments.reduce((sum, comment) => sum + (comment.likes?.length || 0), 0) + forumLikes;
  document.getElementById('stats-favorites').textContent = user.favoriteAnimes?.length || 0;
}

// Gerencia sistema de conquistas baseado nas atividades do usuário
function loadAchievements(user) {
  // Coleta métricas para cálculo de conquistas
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  const forumTopics = JSON.parse(localStorage.getItem('forumTopics')) || [];
  const userComments = Object.values(comments).flat().filter(c => c.username === user.username);
  const userTopics = forumTopics.filter(t => t.author === user.username);
  const userReplies = forumTopics.flatMap(t => t.replies).filter(r => r.author === user.username);

  // Total de likes em comentários, tópicos e respostas
  const totalLikes = userComments.reduce((sum, comment) => sum + (comment.likes?.length || 0), 0) +
    userTopics.reduce((sum, topic) => sum + (topic.likes || 0), 0) +
    userReplies.reduce((sum, reply) => sum + (reply.likes || 0), 0);

  const achievements = [
    {
      title: 'Iniciante',
      description: 'Assistiu seu primeiro anime',
      icon: '🌟',
      unlocked: user.watchedAnimes?.length > 0
    },
    {
      title: 'Crítico',
      description: 'Fez 5 reviews',
      icon: '📝',
      unlocked: userComments.length >= 5
    },
    {
      title: 'Popular',
      description: 'Recebeu 10 likes',
      icon: '❤️',
      unlocked: totalLikes >= 10
    },
    {
      title: 'Otaku',
      description: 'Assistiu 20 animes',
      icon: '🏆',
      unlocked: user.watchedAnimes?.length >= 20
    },
    {
      title: 'Influencer',
      description: 'Criou 5 tópicos no fórum',
      icon: '💭',
      unlocked: userTopics.length >= 5
    },
    {
      title: 'Comunicativo',
      description: 'Fez 10 respostas no fórum',
      icon: '💬',
      unlocked: userReplies.length >= 10
    }
  ];

  const achievementsContainer = document.getElementById('achievements');
  achievementsContainer.innerHTML = achievements.map(achievement => `
    <div class="achievement p-3 rounded-lg ${achievement.unlocked ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-700 opacity-50'}">
      <div class="text-2xl mb-2">${achievement.icon}</div>
      <h3 class="font-semibold">${achievement.title}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">${achievement.description}</p>
    </div>
  `).join('');
}

/**
 * Exibe lista de animes favoritos com informações resumidas
 * @param {Object} user - Dados do usuário
 */
function loadFavoriteAnimes(user) {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
  const favoriteAnimes = user.favoriteAnimes || [];
  const container = document.getElementById('favorite-animes');

  if (favoriteAnimes.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500">Nenhum anime favorito ainda</p>';
    return;
  }

  container.innerHTML = favoriteAnimes.map(animeTitle => {
    const anime = animes.find(a => a.primaryTitle === animeTitle);
    if (!anime) return '';

    return `
      <a href="animes.html?anime=${encodeURIComponent(anime.primaryTitle)}" 
       class="flex items-center gap-4 p-4 rounded-lg 
              hover:bg-purple-50 dark:hover:bg-purple-800/30
              hover:shadow-lg dark:hover:shadow-purple-900/30
              hover:scale-102 transform
              group
              transition-all duration-200 ease-in-out">
        <img src="${anime.coverImage}" alt="${anime.primaryTitle}" 
             class="w-16 h-16 object-cover rounded-lg 
             hover:shadow-md transition-shadow duration-200">
        <div class="flex-1">
          <h3 class="font-semibold">${anime.primaryTitle}</h3>
          <div class="flex gap-2 mt-1">
            <span class="text-sm bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded text-white">
              ⭐ ${anime.score || 'N/A'}
            </span>
            <span class="text-sm">${anime.status}</span>
          </div>
        </div>
        <button onclick="shareAnime(event, '${anime.primaryTitle}', '${anime.coverImage}')"
                class="opacity-0 group-hover:opacity-100 p-2 text-purple-600 hover:text-purple-800 
                       hover:bg-purple-100 rounded-full transition-all duration-200"
                title="Compartilhar com amigos">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
        </button>
      </a>
    `;
  }).join('');
}

function shareAnime(event, animeTitle, coverImage) {
  event.preventDefault();
  event.stopPropagation();

  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = users.find(u => u.id === sessionData.userId);

  if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
    alert('Você precisa ter amigos para compartilhar animes!');
    return;
  }

  // Cria modal de seleção de amigos
  const modalHtml = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" id="share-modal">
      <div class="rounded-lg p-6 max-w-md w-full mx-4" style="background:var(--background)">
        <h3 class="text-lg font-semibold mb-4">Compartilhar "${animeTitle}"</h3>
        <div class="mb-4">
          <label class="text-sm text-gray-500">Selecione os amigos:</label>
          <div class="mt-2 max-h-48 overflow-y-auto space-y-2">
            ${currentUser.friends.map(friendId => {
    const friend = users.find(u => u.id === friendId);
    if (!friend) return '';
    return `
                <label class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <input type="checkbox" value="${friend.id}" 
                         class="w-4 h-4 text-purple-600 rounded border-gray-300">
                  <img src="${friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
                       class="w-8 h-8 rounded-full">
                  <span>${friend.displayName || friend.username}</span>
                </label>
              `;
  }).join('')}
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button onclick="closeShareModal()" 
                  class="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
          <button onclick="confirmShare('${animeTitle}', '${coverImage}')" 
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Remove o modal de compartilhamento da página
function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (modal) modal.remove();
}

/**
 * Compartilha um anime com amigos selecionados e exibe notificação de confirmação
 * @param {string} animeTitle - O título do anime a ser compartilhado
 * @param {string} coverImage - A URL da imagem de capa do anime
 */
function confirmShare(animeTitle, coverImage) {
  const selectedFriends = Array.from(document.querySelectorAll('#share-modal input[type="checkbox"]:checked')).map(cb => cb.value);

  if (selectedFriends.length === 0) {
    alert('Selecione pelo menos um amigo para compartilhar!');
    return;
  }

  const chat = new Chat();
  const sessionData = JSON.parse(localStorage.getItem('userSession'));

  // Cria mensagem especial para compartilhamento de anime
  const message = {
    type: 'anime_share',
    animeTitle,
    coverImage,
    message: `Olha só este anime que legal: ${animeTitle}`
  };

  // Envia para cada amigo selecionado
  selectedFriends.forEach(friendId => { 
    chat.sendMessage(sessionData.userId, friendId, JSON.stringify(message)); 
  });

  closeShareModal();

  // Mostra notificação de sucesso
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  notification.textContent = `Anime compartilhado com ${selectedFriends.length} amigo(s)!`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Gera linha do tempo com atividades recentes do usuário
function loadActivityTimeline(user) {
  // Agrupa diferentes tipos de atividades
  const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
  const forumTopics = JSON.parse(localStorage.getItem('forumTopics')) || [];
  const activities = [];

  // Adiciona comentários ao histórico
  Object.entries(comments).forEach(([animeTitle, animeComments]) => {
    animeComments.forEach(comment => {
      if (comment.username === user.username) {
        activities.push({
          type: 'comment',
          animeTitle,
          timestamp: comment.timestamp,
          content: comment.text
        });
      }
    });
  });

  // Adiciona tópicos do fórum ao histórico
  forumTopics.forEach(topic => {
    if (topic.author === user.username) {
      activities.push({
        type: 'forum_topic',
        title: topic.title,
        timestamp: topic.date,
        content: topic.content.substring(0, 100) + '...'
      });
    }
  });

  // Adiciona respostas do fórum ao histórico
  forumTopics.forEach(topic => {
    topic.replies.forEach(reply => {
      if (reply.author === user.username) {
        activities.push({
          type: 'forum_reply',
          topicTitle: topic.title,
          timestamp: reply.date,
          content: reply.content.substring(0, 100) + '...'
        });
      }
    });
  });

  // Adiciona animes favoritados ao histórico
  user.favoriteAnimes?.forEach(favoriteAnime => {
    activities.push({
      type: 'favorite',
      animeTitle: favoriteAnime,
      timestamp: new Date().toISOString()
    });
  });

  // Ordena atividades por data
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const container = document.getElementById('activity-timeline');
  container.innerHTML = activities.map(activity => `
    <div class="activity-item border-l-2 border-purple-500 pl-4 pb-4">
      <div class="text-sm text-white">
        ${new Date(activity.timestamp).toLocaleDateString('pt-BR')}
      </div>
      <div class="mt-1">
        ${getActivityContent(activity)}
      </div>
    </div>
  `).join('');
}

/**
 * Formata o texto da atividade baseado no seu tipo
 * @param {Object} activity - Dados da atividade
 * @returns {string} HTML formatado da atividade
 */
function getActivityContent(activity) {
  switch (activity.type) {
    case 'comment':
      return `<span class="text-white">Comentou em </span><a href="animes.html?anime=${encodeURIComponent(activity.animeTitle)}" 
              class="text-purple-600 hover:underline">${activity.animeTitle}</a>: 
              <span class="text-gray-600 dark:text-gray-300">${activity.content}</span>`;

    case 'forum_topic':
      return `<span class="text-white">Criou um tópico no fórum: </span><span class="text-purple-600 hover:underline">${activity.title}</span>
              <span class="text-gray-600 dark:text-gray-300">${activity.content}</span>`;

    case 'forum_reply':
      return `<span class="text-white">Respondeu ao tópico </span><span class="text-purple-600 hover:underline">${activity.topicTitle}</span>: 
              <span class="text-gray-600 dark:text-gray-300">${activity.content}</span>`;

    case 'favorite':
      return `<span class="text-white">Adicionou </span><a href="animes.html?anime=${encodeURIComponent(activity.animeTitle)}" 
              class="text-purple-600 hover:underline">${activity.animeTitle}</a> <span class="text-white">aos favoritos</span>`;

    default: return '';
  }
}

/**
 * Atualiza avatar do usuário em todas as camadas de armazenamento
 * @param {string} avatar - URL/Base64 da imagem
 * @param {string} userId - ID do usuário
 */
function changeAvatar(avatar, userId) {
  // Atualiza no localStorage
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    users[userIndex].avatar = avatar;
    localStorage.setItem('animuUsers', JSON.stringify(users));
  }

  // Atualiza na sessão atual
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  sessionData.avatar = avatar;
  localStorage.setItem('userSession', JSON.stringify(sessionData));

  // Atualiza a imagem na interface
  document.getElementById('profile-avatar').src = avatar;
}

// Inicializa seletor de gêneros para edição do perfil
function setupGenreSelection() {
  // Obtém todas as categorias do CategoryDisplay
  const categoryDisplay = new CategoryDisplay();
  const categories = categoryDisplay.getCategories();

  // Extrai os nomes das categorias
  const genres = categories.map(category => category.name);

  const genreContainer = document.getElementById('edit-genres');
  genreContainer.innerHTML = genres.map(genre => `
    <label class="inline-flex items-center p-2.5 border border-gray-200 dark:border-gray-600 
                  rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer
                  transition-colors duration-200">
      <input type="checkbox" name="genres" value="${genre}" 
             class="w-4 h-4 text-purple-600 dark:text-purple-400 
                    border-gray-300 dark:border-gray-600 
                    rounded focus:ring-purple-500 dark:focus:ring-purple-400
                    bg-white dark:bg-gray-700">
      <span class="ml-2 text-sm">${genre}</span>
    </label>
  `).join('');
}

/**
 * Configura interações do usuário com elementos da página
 * @param {Object} user - Dados do usuário
 */
function setupEventListeners(user, isOwnProfile) {
  if (isOwnProfile) {
    // Referências dos elementos UI
    const editButton = document.getElementById('edit-profile');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-profile-form');
    const cancelButton = document.getElementById('cancel-edit');
    const closeButton = document.getElementById('close-modal');

    // Botão de editar perfil
    editButton.addEventListener('click', () => {
      editModal.classList.remove('hidden');
      editModal.classList.add('flex');

      // Preenche o formulário com dados atuais
      document.getElementById('edit-display-name').value = user.displayName || user.username;
      document.getElementById('edit-email').value = user.email;

      // Configura e marca os gêneros favoritos
      setupGenreSelection();
      const checkboxes = document.querySelectorAll('input[name="genres"]');
      checkboxes.forEach(checkbox => { 
        checkbox.checked = user.favoriteGenres?.includes(checkbox.value) || false; 
      });
    });

    // Botão de cancelar edição
    cancelButton.addEventListener('click', () => {
      editModal.classList.remove('flex');
      editModal.classList.add('hidden');
    });

    // Botão de fechar modal (X)
    closeButton.addEventListener('click', () => {
      editModal.classList.remove('flex');
      editModal.classList.add('hidden');
    });

    // Fecha o modal ao clicar fora
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        editModal.classList.remove('flex');
        editModal.classList.add('hidden');
      }
    });

    // Fecha o modal com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
        editModal.classList.remove('flex');
        editModal.classList.add('hidden');
      }
    });

    // Adiciona manipulação de upload de avatar no modal
    const avatarUploadBtn = document.getElementById('avatar-upload-btn');
    const avatarInput = document.getElementById('edit-avatar');
    const previewAvatar = document.getElementById('preview-avatar');

    // Inicializar preview com avatar atual
    previewAvatar.src = user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username);

    avatarUploadBtn.addEventListener('click', () => { 
      avatarInput.click(); 
    });

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => { 
          previewAvatar.src = event.target.result; 
        };
        reader.readAsDataURL(file);
      }
    });

    // Formulário de edição
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const displayName = document.getElementById('edit-display-name').value;
      const email = document.getElementById('edit-email').value;
      const selectedGenres = Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(checkbox => checkbox.value);
      const newAvatar = previewAvatar.src;

      // Atualiza dados do usuário
      const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          displayName,
          email,
          favoriteGenres: selectedGenres,
          avatar: newAvatar
        };

        localStorage.setItem('animuUsers', JSON.stringify(users));

        // Atualiza a sessão com o novo avatar
        const sessionData = JSON.parse(localStorage.getItem('userSession'));
        sessionData.avatar = newAvatar;
        localStorage.setItem('userSession', JSON.stringify(sessionData));

        // Atualiza a página
        window.location.reload();
      }
    });

    // Botão de mudar avatar
    const changeAvatarButton = document.getElementById('change-avatar');
    changeAvatarButton.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const avatar = event.target.result;
            changeAvatar(avatar, user.id);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    });

    // Adiciona handler para o botão de logout
    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', () => {
      localStorage.removeItem('userSession');
      window.location.href = './signin.html';
    });

    // Inicializa sistema de amizades
    initializeFriendSystem(user);
  }
}

// Sistema de Amizades
function initializeFriendSystem(currentUser) {
  loadFriends(currentUser);
  loadFriendRequests(currentUser);
  setupFriendSearchListener();

  // Adiciona o evento de click ao botão existente no HTML
  const addFriendBtn = document.getElementById('add-friend-btn');
  if (addFriendBtn) addFriendBtn.addEventListener('click', showAddFriendModal);
}

// Carrega e exibe a lista de amigos do usuário na interface
function loadFriends(user) {
  const friendsList = document.getElementById('friends-list');
  const friends = user.friends || [];
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];

  if (friends.length === 0) {
    friendsList.innerHTML = `
      <div class="text-center py-8">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <p class="text-gray-500 mt-4">Nenhum amigo adicionado</p>
        <button onclick="showAddFriendModal()" 
                class="mt-4 text-purple-600 hover:text-purple-700 font-medium">
          Começar a adicionar amigos
        </button>
      </div>
    `;
    return;
  }

  friendsList.innerHTML = friends.map(friendId => {
    const friend = users.find(u => u.id === friendId);
    if (!friend) return '';

    return `
      <div class="friend-card group">
        <div class="flex items-center gap-3">
          <div class="relative">
            <a href="profile.html?id=${friend.id}" class="block">
              <img src="${friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
                   alt="${friend.username}" 
                   class="w-12 h-12 rounded-full object-cover transition-transform duration-300">
              <div class="status-indicator ${friend.online ? 'status-online' : 'status-offline'}"></div>
            </a>
          </div>
          
          <div class="flex-1 min-w-0">
            <a href="profile.html?id=${friend.id}" class="hover:text-purple-600 transition-colors">
              <h4 class="font-medium truncate">
                ${friend.displayName || friend.username}
              </h4>
              <p class="text-xs text-gray-500">
                ${friend.online ? 'Online' : 'Offline'}
              </p>
            </a>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="openChat('${friend.id}')" 
                    class="action-btn text-purple-600 hover:text-purple-700"
                    title="Iniciar chat">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </button>
            
            <button onclick="removeFriend('${friend.id}')" 
                    class="action-btn text-red-600 hover:text-red-700"
                    title="Remover amigo">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Carrega e exibe solicitações de amizade pendentes para um usuário
function loadFriendRequests(user) {
  const requestsContainer = document.getElementById('friend-requests');
  const requests = user.friendRequests || [];
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];

  if (requests.length === 0) {
    requestsContainer.style.display = 'none';
    return;
  }

  requestsContainer.style.display = 'block';
  const requestsList = requestsContainer.querySelector('div');
  requestsList.innerHTML = requests.map(requestId => {
    const requester = users.find(u => u.id === requestId);
    if (!requester) return '';

    return `
      <div class="friend-request-card">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="${requester.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(requester.username)}`}" 
                 alt="${requester.username}" 
                 class="w-10 h-10 rounded-full">
            <div>
              <h4 class="font-medium">${requester.displayName || requester.username}</h4>
              <p class="text-xs text-gray-500">Quer ser seu amigo</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="acceptFriendRequest('${requester.id}')" 
                    class="text-green-500 hover:text-green-600 transition-colors"
                    title="Aceitar solicitação">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M5 13l4 4L19 7"/>
              </svg>
            </button>
            <button onclick="rejectFriendRequest('${requester.id}')" 
                    class="text-red-500 hover:text-red-600 transition-colors"
                    title="Recusar solicitação">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Exibe o modal para adicionar amigos, limpando os campos de busca
function showAddFriendModal() {
  const modal = document.getElementById('add-friend-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('friend-search').value = '';
  document.getElementById('friend-search-results').innerHTML = '';
}

// Configura o sistema de busca de amigos com feedback em tempo real
function setupFriendSearchListener() {
  const searchInput = document.getElementById('friend-search');
  const resultsContainer = document.getElementById('friend-search-results');
  const closeModal = document.getElementById('close-friend-modal');
  const modal = document.getElementById('add-friend-modal');

  searchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      resultsContainer.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">Comece digitando para encontrar amigos...</div>';
      return;
    }

    const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
    const currentUser = JSON.parse(localStorage.getItem('userSession'));
    const filteredUsers = users.filter(user =>
      user.id !== currentUser.userId &&
      (user.username.toLowerCase().includes(query) ||
        (user.displayName && user.displayName.toLowerCase().includes(query)))
    );

    // Verifica se o usuário já é amigo ou se já existe uma solicitação pendente
    resultsContainer.innerHTML = filteredUsers.length ?
      filteredUsers.map(user => {
        const targetUser = users.find(u => u.id === user.id);
        const isAlreadyFriend = targetUser.friends?.includes(currentUser.userId);
        const hasPendingRequest = targetUser.friendRequests?.includes(currentUser.userId);

        return `
          <div class="flex items-center justify-between p-2">
            <div class="flex items-center gap-2">
              <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`}" 
                   alt="${user.username}" 
                   class="w-8 h-8 rounded-full">
              <span>${user.displayName || user.username}</span>
            </div>
            ${isAlreadyFriend ?
            '<span class="text-sm text-gray-500">Já é amigo</span>' :
            hasPendingRequest ?
              '<span class="text-sm text-gray-500">Solicitação pendente</span>' :
              `<button onclick="sendFriendRequest('${user.id}')" 
                      class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors">
                Adicionar
              </button>`
          }
          </div>
        `;
      }).join('') :
      '<div class="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum usuário encontrado</div>';
  }, 300));

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
}

// Envia pedido de amizade
function sendFriendRequest(targetUserId) {
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const targetUserIndex = users.findIndex(u => u.id === targetUserId);
  const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);

  if (targetUserIndex === -1 || currentUserIndex === -1) return;

  const targetUser = users[targetUserIndex];
  const currentUserData = users[currentUserIndex];

  // Verifica se já existe uma solicitação ou se já são amigos
  if (targetUser.friendRequests?.includes(currentUser.userId) || targetUser.friends?.includes(currentUser.userId)) return;

  // Nova verificação: se o usuário atual tem uma solicitação pendente do usuário alvo
  if (currentUserData.friendRequests?.includes(targetUserId)) {
    const button = event.target;
    button.disabled = true;
    button.textContent = 'Solicitação pendente recebida';
    button.classList.remove('bg-purple-500', 'hover:bg-purple-600');
    button.classList.add('bg-gray-400');
    return;
  }

  // Inicializa o array de solicitações se não existir
  if (!users[targetUserIndex].friendRequests) users[targetUserIndex].friendRequests = [];

  // Adiciona a solicitação
  users[targetUserIndex].friendRequests.push(currentUser.userId);
  localStorage.setItem('animuUsers', JSON.stringify(users));

  // Atualiza a interface
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Solicitação enviada';
  button.classList.remove('bg-purple-500', 'hover:bg-purple-600');
  button.classList.add('bg-gray-400');

  // Mostra uma notificação
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
  notification.textContent = 'Solicitação de amizade enviada!';
  document.body.appendChild(notification);

  // Remove a notificação após 3 segundos
  setTimeout(() => { 
    notification.remove(); 
  }, 3000);
}

// Aceita uma solicitação de amizade e atualiza as listas de amigos dos usuários envolvidos
function acceptFriendRequest(requesterId) {
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);
  const requesterIndex = users.findIndex(u => u.id === requesterId);

  if (currentUserIndex === -1 || requesterIndex === -1) return;

  // Remove a solicitação e adiciona à lista de amigos de ambos
  users[currentUserIndex].friendRequests = users[currentUserIndex].friendRequests.filter(id => id !== requesterId);
  users[currentUserIndex].friends = users[currentUserIndex].friends || [];
  users[requesterIndex].friends = users[requesterIndex].friends || [];

  users[currentUserIndex].friends.push(requesterId);
  users[requesterIndex].friends.push(currentUser.userId);

  localStorage.setItem('animuUsers', JSON.stringify(users));
  window.location.reload();
}

// Rejeita uma solicitação de amizade removendo o ID do solicitante da lista de pedidos pendentes
function rejectFriendRequest(requesterId) {
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);

  if (currentUserIndex === -1) return;

  // Remove a solicitação
  users[currentUserIndex].friendRequests = users[currentUserIndex].friendRequests.filter(id => id !== requesterId);
  localStorage.setItem('animuUsers', JSON.stringify(users));
  loadFriendRequests(users[currentUserIndex]);
}

// Remove um amigo da lista de amigos do usuário atual e da lista do amigo removido
function removeFriend(friendId) {
  if (!confirm('Tem certeza que deseja remover este amigo?')) return;

  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);
  const friendIndex = users.findIndex(u => u.id === friendId);

  if (currentUserIndex === -1 || friendIndex === -1) return;

  // Remove da lista de amigos de ambos os usuários
  users[currentUserIndex].friends = users[currentUserIndex].friends.filter(id => id !== friendId);
  users[friendIndex].friends = users[friendIndex].friends.filter(id => id !== currentUser.userId);

  localStorage.setItem('animuUsers', JSON.stringify(users));
  window.location.reload();
}

/**
 * Cria uma versão limitada de uma função que só pode ser chamada uma vez dentro de um período de espera.
 * @param {Function} func - A função a ser executada após o período de espera
 * @param {number} wait - O número de milissegundos para aguardar
 * @returns {Function} Uma nova função que implementa o comportamento debounce
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Abre uma janela de chat com um amigo específico
function openChat(friendId) {
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];
  const currentUser = JSON.parse(localStorage.getItem('userSession'));
  const friend = users.find(u => u.id === friendId);

  if (!friend) return;

  // Verifica se já existe uma janela de chat aberta
  const existingChat = document.querySelector(`#chat-${friendId}`);
  if (existingChat) {
    existingChat.querySelector('input').focus();
    return;
  }

  const chatWindow = document.createElement('div');
  chatWindow.id = `chat-${friendId}`;
  chatWindow.className = 'w-80 rounded-lg shadow-lg overflow-hidden';
  chatWindow.style.background = 'var(--background)';
  chatWindow.innerHTML = `
    <div class="flex items-center justify-between p-3 bg-purple-500 text-white">
      <div class="flex items-center gap-2">
        <img src="${friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
             alt="${friend.username}" 
             class="w-8 h-8 rounded-full">
        <span class="font-medium">${friend.displayName || friend.username}</span>
      </div>
      <button onclick="closeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin" id="chat-messages-${friendId}">
      <!-- Mensagens serão inseridas aqui -->
    </div>
    <div class="p-3 border-t dark:border-gray-700">
      <form onsubmit="sendMessage(event, '${currentUser.userId}', '${friendId}')" class="flex gap-2">
        <input type="text" placeholder="Digite sua mensagem..." 
               class="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
        <button type="submit" 
                class="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  `;

  document.getElementById('chat-windows').appendChild(chatWindow);
  loadChatMessages(currentUser.userId, friendId);
}


// Remove a janela de chat com um amigo específico
function closeChat(friendId) {
  const chatWindow = document.getElementById(`chat-${friendId}`);
  if (chatWindow) chatWindow.remove();
}

/**
 * Carrega e exibe as mensagens do chat entre dois usuários, incluindo suporte para compartilhamento de animes
 * @param {string|number} senderId - ID do usuário que está enviando as mensagens
 * @param {string|number} receiverId - ID do usuário que está recebendo as mensagens
 */
function loadChatMessages(senderId, receiverId) {
  const chat = new Chat();
  const messages = chat.getMessages(senderId, receiverId);
  const container = document.getElementById(`chat-messages-${receiverId}`);
  const users = JSON.parse(localStorage.getItem('animuUsers')) || [];

  // Busca os dados dos usuários para os avatares
  const sender = users.find(u => u.id === senderId);
  const receiver = users.find(u => u.id === receiverId);

  container.innerHTML = messages.map(msg => {
    const isMine = msg.senderId === senderId;
    const user = isMine ? sender : receiver;
    const messageClasses = isMine ?
      'ml-auto' :
      'mr-auto';

    const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}`;

    try {
      // Tenta passar mensagem como JSON para verificar se é compartilhamento de anime
      const parsedMessage = JSON.parse(msg.message);
      if (parsedMessage.type === 'anime_share') {
        return `
          <div class="flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2 mb-4">
            ${!isMine ? `<img src="${avatar}" alt="${user?.username}" class="w-6 h-6 rounded-full object-cover">` : ''}
            <div class="max-w-[80%] ${messageClasses} bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg overflow-hidden">
              <div class="flex items-center gap-3 p-3">
                <img src="${parsedMessage.coverImage}" 
                     alt="${parsedMessage.animeTitle}" 
                     class="w-12 h-16 object-cover rounded">
                <div class="flex-1 text-white">
                  <p class="text-sm font-medium">${parsedMessage.message}</p>
                  <a href="animes.html?anime=${encodeURIComponent(parsedMessage.animeTitle)}" 
                     class="text-xs text-purple-100 hover:text-white mt-1 inline-block
                            transition-colors duration-200">
                    Ver anime →
                  </a>
                </div>
              </div>
              <div class="px-3 py-1 bg-black/20">
                <span class="text-xs text-purple-100">
                  ${new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            ${isMine ? `<img src="${avatar}" alt="${user?.username}" class="w-6 h-6 rounded-full object-cover">` : ''}
          </div>
        `;
      }
    } catch (e) {
      console.error(e);
    }

    // Mensagem normal de texto
    return `
      <div class="flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2">
        ${!isMine ? `
          <img src="${avatar}" 
               alt="${user?.username || 'User'}" 
               class="w-6 h-6 rounded-full object-cover">
        ` : ''}
        <div class="max-w-[70%] ${messageClasses} bg-purple-500 text-white rounded-lg p-2 break-words">
          <p class="text-sm">${msg.message}</p>
          <span class="text-xs text-purple-100 block mt-1">
            ${new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
        ${isMine ? `
          <img src="${avatar}" 
               alt="${user?.username || 'User'}" 
               class="w-6 h-6 rounded-full object-cover">
        ` : ''}
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}


/**
 * Envia uma mensagem do remetente para o destinatário no chat.
 * @param {Event} event - O evento do formulário
 * @param {string} senderId - ID do usuário que envia a mensagem
 * @param {string} receiverId - ID do usuário que recebe a mensagem
 */
function sendMessage(event, senderId, receiverId) {
  event.preventDefault();
  const input = event.target.querySelector('input');
  const message = input.value.trim();

  if (!message) return;

  const chat = new Chat();
  chat.sendMessage(senderId, receiverId, message);

  loadChatMessages(senderId, receiverId);
  input.value = '';
}