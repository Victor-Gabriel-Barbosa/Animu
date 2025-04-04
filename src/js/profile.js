// Inicializa o gerenciador de usuários para operações de usuário
const userManager = new UserManager();
// Inicializa o gerenciador de categorias
const categoryManager = new CategoryManager();
// Inicializa o gerenciador de chats para operações de chat
const chatManager = new ProfileChatManager();

document.addEventListener('DOMContentLoaded', async function () {
  // Obtém ID do usuário da URL se existir
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');

  // Verifica sessão ativa
  const sessionData = JSON.parse(localStorage.getItem('userSession'));
  if (!sessionData) {
    window.location.href = 'signin.html';
    return;
  }

  try {
    // Inicializa o gerenciador de categorias
    await categoryManager.initialize();
    
    // Carrega todos os usuários para referência
    const users = await userManager.loadUsers();
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
    } else {
      // Carrega o próprio perfil usando o userManager
      currentUser = await userManager.findUser(sessionData.username);
      if (!currentUser) {
        console.error('Usuário não encontrado');
        return;
      }
    }

    // Inicializa os dados do perfil
    initializeProfile(currentUser);
    loadStatistics(currentUser);
    loadAchievements(currentUser);
    loadFavoriteAnimes(currentUser);
    loadActivityTimeline(currentUser);
    setupEventListeners(currentUser, sessionData.userId === currentUser.id);
  } catch (error) {
    console.error("Erro ao carregar dados do perfil:", error);
  }
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

// Exibe informações básicas do perfil do usuário
function initializeProfile(user) {
  // Atualiza informações básicas
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('display-name').textContent = user.displayName || user.username;
  
  // Usa o formatador de data do UserManager para exibir a data de criação da conta
  const formattedDate = AnimuUtils.formatDate(user.createdAt);
  document.getElementById('profile-joined').textContent = `Membro desde: ${formattedDate}`;

  // Usa o avatar da sessão do usuário
  if (user.avatar) document.getElementById('profile-avatar').src = user.avatar;

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

  // Valores finais para as estatísticas
  const animeCount = user.watchedAnimes?.length || 0;
  const reviewCount = userComments.length + userTopics.length;
  const likeCount = userComments.reduce((sum, comment) => sum + (comment.likes?.length || 0), 0) + forumLikes;
  const favoriteCount = user.favoriteAnimes?.length || 0;

  // Anima os contadores para uma experiência mais envolvente
  animateCounter('stats-animes', animeCount);
  animateCounter('stats-reviews', reviewCount);
  animateCounter('stats-likes', likeCount);
  animateCounter('stats-favorites', favoriteCount);
  
  // Adiciona classes para indicar tendências (opcional)
  applyTrendIndicator('stats-animes', animeCount);
  applyTrendIndicator('stats-reviews', reviewCount);
  applyTrendIndicator('stats-likes', likeCount);
  applyTrendIndicator('stats-favorites', favoriteCount);
}

/**
 * Anima a contagem de um valor de 0 até o valor final
 * @param {string} elementId - ID do elemento HTML
 * @param {number} finalValue - Valor final a ser exibido
 */
function animateCounter(elementId, finalValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 1000; // duração da animação em ms
  const stepTime = 20; // tempo entre cada etapa da animação
  const initialValue = 0;
  const increment = finalValue / (duration / stepTime);
  
  let currentValue = initialValue;
  const counterAnimation = setInterval(() => {
    currentValue += increment;
    if (currentValue >= finalValue) {
      clearInterval(counterAnimation);
      element.textContent = finalValue;
    } else element.textContent = Math.floor(currentValue);
  }, stepTime);
}

/**
 * Aplica indicadores visuais baseados no valor da estatística
 * @param {string} elementId - ID do elemento HTML
 * @param {number} value - Valor da estatística
 */
function applyTrendIndicator(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Adiciona classes com base nos valores
  if (value > 50) element.classList.add('high-value');
  else if (value > 20) element.classList.add('medium-value');
  else element.classList.add('low-value');
  
  // Adiciona indicador de tendência apenas em telas maiores
  if (value > 30 && window.innerWidth > 480) {
    const trendIndicator = document.createElement('span');
    trendIndicator.className = 'trend-up ml-1 text-xs';
    trendIndicator.innerHTML = '↑';
    element.appendChild(trendIndicator);
  }
}

// Ajusta o layout das estatísticas baseado no tamanho da tela
function adjustStatisticsLayout() {
  const statsContainer = document.querySelector('.stats-container');
  if (!statsContainer) return;

  // Em telas pequenas, remove a classe grid e adiciona flexbox vertical
  if (window.innerWidth <= 480) {
    statsContainer.classList.remove('grid');
    statsContainer.classList.add('flex', 'flex-col');
  } else {
    statsContainer.classList.add('grid');
    statsContainer.classList.remove('flex', 'flex-col');
  }
}

// Verifica se o elemento está visível na tela para iniciar animações
function checkIfElementsInView() {
  const statsContainer = document.querySelector('.stats-container');
  if (!statsContainer) return;
  
  const rect = statsContainer.getBoundingClientRect();
  const isInView = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
  
  if (isInView) statsContainer.classList.add('animate-in');
}

// Adiciona o verificador de visibilidade ao evento de rolagem
document.addEventListener('DOMContentLoaded', function() {
  // Adiciona evento de rolagem para verificar visibilidade dos elementos
  window.addEventListener('scroll', checkIfElementsInView);
  // Verifica imediatamente após o carregamento
  checkIfElementsInView();
  // Verifica o layout imediatamente após o carregamento
  adjustStatisticsLayout();
  
  // Recalcula quando a janela for redimensionada
  window.addEventListener('resize', function() {
    adjustStatisticsLayout();
    
    // Remove e reaplica indicadores de tendência quando a tela mudar de tamanho
    const statsElements = ['stats-animes', 'stats-reviews', 'stats-likes', 'stats-favorites'];
    statsElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        // Guarda o valor atual
        const value = parseInt(element.textContent.replace(/[^\d]/g, ''), 10);
        
        // Remove possíveis spans de indicador
        const trendIndicator = element.querySelector('.trend-up');
        if (trendIndicator) {
          trendIndicator.remove();
        }
        
        // Reaplica o indicador adequado para o tamanho atual
        if (value > 30 && window.innerWidth > 480) {
          const newIndicator = document.createElement('span');
          newIndicator.className = 'trend-up ml-1 text-xs';
          newIndicator.innerHTML = '↑';
          element.appendChild(newIndicator);
        }
      }
    });
  });
});

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
              hover:bg-purple-800/30
              hover:shadow-purple-900/30
              hover:scale-102 transform
              group transition-all duration-200 ease-in-out">
        <img src="${anime.coverImage}" alt="${anime.primaryTitle}" 
             class="w-16 h-16 object-cover rounded-lg 
             hover:shadow-md transition-shadow duration-200">
        <div class="flex-1">
          <h3 class="font-semibold">${anime.primaryTitle}</h3>
          <div class="flex gap-2 mt-1">
            <span class="text-sm px-2 py-1 rounded text-white" style="background:var(--primary-color)">
              ⭐ ${anime.score || 'N/A'}
            </span>
            <span class="text-sm">${anime.status}</span>
          </div>
        </div>
        <button onclick="shareAnime(event, '${anime.primaryTitle}', '${anime.coverImage}')"
                class="p-2 w-10 h-10 flex items-center justify-center text-purple-600 hover:text-white 
                      hover:bg-purple-600 rounded-full transition-all duration-200"
                title="Compartilhar com amigos">
          <i class="fi fi-rr-share"></i>
        </button>
      </a>
    `;
  }).join('');
}

async function shareAnime(event, animeTitle, coverImage) {
  event.preventDefault();
  event.stopPropagation();

  try {
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    
    // Usa userManager para obter o usuário atual e seus amigos
    const users = await userManager.loadUsers();
    const currentUser = users.find(u => u.id === sessionData.userId);

    if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
      alert('Você precisa ter amigos para compartilhar animes!');
      return;
    }

    // Filtra apenas amigos válidos
    const friendsList = currentUser.friends
      .map(friendId => users.find(u => u.id === friendId))
      .filter(friend => friend); // remove undefined/null

    if (friendsList.length === 0) {
      alert('Não foi possível encontrar seus amigos. Tente novamente mais tarde.');
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
              ${friendsList.map(friend => `
                <label class="flex items-center gap-3 p-2 hover:bg-purple-600 hover:text-white rounded-lg">
                  <input type="checkbox" value="${friend.id}" 
                        class="w-4 h-4 text-purple-600 rounded border-gray-300">
                  <img src="${friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
                      class="w-8 h-8 rounded-full">
                  <span>${friend.displayName || friend.username}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button onclick="closeShareModal()" 
                    class="btn-action btn-cancel order-2 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
              <span class="flex items-center justify-center gap-2">
                <i class="fi fi-br-circle-xmark"></i>
                Cancelar
              </span>
            </button>
            <button onclick="confirmShare('${animeTitle}', '${coverImage}')" 
                    class="btn-action btn-primary order-1 md:order-3 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
              <span class="flex items-center justify-center gap-2">
                <i class="fi fi-br-checkbox"></i>
                Compartilhar
              </span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error("Erro ao compartilhar anime:", error);
    alert("Ocorreu um erro ao compartilhar o anime. Tente novamente mais tarde.");
  }
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
async function confirmShare(animeTitle, coverImage) {
  try {
    const selectedFriends = Array.from(document.querySelectorAll('#share-modal input[type="checkbox"]:checked')).map(cb => cb.value);

    if (selectedFriends.length === 0) {
      alert('Selecione pelo menos um amigo para compartilhar!');
      return;
    }

    const sessionData = JSON.parse(localStorage.getItem('userSession'));

    // Cria mensagem especial para compartilhamento de anime
    const message = {
      type: 'anime_share',
      animeTitle,
      coverImage,
      message: `Olha só este anime que legal: ${animeTitle}`
    };

    // Envia para cada amigo selecionado
    for (const friendId of selectedFriends) await chatManager.sendMessage(sessionData.userId, friendId, JSON.stringify(message));

    closeShareModal();

    // Mostra notificação de sucesso
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = `Anime compartilhado com ${selectedFriends.length} amigo(s)!`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  } catch (error) {
    console.error("Erro ao confirmar compartilhamento:", error);
    alert("Ocorreu um erro ao compartilhar o anime. Tente novamente mais tarde.");
    closeShareModal();
  }
}

/**
 * Atualiza avatar do usuário em todas as camadas de armazenamento
 * @param {string} avatar - URL/Base64 da imagem
 * @param {string} userId - ID do usuário
 */
async function changeAvatar(avatar, userId) {
  try {
    // Usa o método específico para atualizar avatar
    const result = await userManager.updateUserAvatar(userId, avatar);
    
    if (result.success) {
      // Atualiza a imagem na interface
      document.getElementById('profile-avatar').src = avatar;
      console.log("Avatar atualizado com sucesso!");
    } else {
      console.error("Erro ao atualizar avatar:", result.error);
    }
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
  }
}

// Inicializa seletor de gêneros para edição do perfil
async function setupGenreSelection() {
  try {
    // Carrega categorias usando o CategoryManager
    const categoriesResult = await categoryManager.loadCategories();
    let genres = [];
    
    if (categoriesResult.success && categoriesResult.data) {
      // Extrai os nomes das categorias
      genres = categoriesResult.data.map(category => category.name);
    } else {
      console.warn('Não foi possível carregar as categorias:', categoriesResult.message);
      // Tenta buscar do localStorage como fallback
      const localCategories = JSON.parse(localStorage.getItem('animuCategories')) || [];
      genres = localCategories.map(category => category.name);
    }

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
  } catch (error) {
    console.error('Erro ao carregar categorias para seleção de gêneros:', error);
    const genreContainer = document.getElementById('edit-genres');
    genreContainer.innerHTML = '<p class="text-red-500">Erro ao carregar categorias</p>';
  }
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
    editButton.addEventListener('click', async () => {
      editModal.classList.remove('hidden');
      editModal.classList.add('flex');

      // Preenche o formulário com dados atuais
      document.getElementById('edit-display-name').value = user.displayName || user.username;
      document.getElementById('edit-email').value = user.email;

      // Configura e marca os gêneros favoritos
      await setupGenreSelection();
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
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const displayName = document.getElementById('edit-display-name').value;
      const email = document.getElementById('edit-email').value;
      const selectedGenres = Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(checkbox => checkbox.value);
      const newAvatar = previewAvatar.src;

      try {
        // Atualiza os dados do usuário
        const updatedUser = {
          ...user,
          displayName,
          email,
          favoriteGenres: selectedGenres,
          avatar: newAvatar 
        };

        // Salva todos os dados de uma vez
        await userManager.saveUser(updatedUser);

        // Atualiza a página
        window.location.reload();
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        alert("Ocorreu um erro ao salvar as alterações. Por favor, tente novamente.");
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
async function initializeFriendSystem(currentUser) {
  try {
    await loadFriends(currentUser);
    await loadFriendRequests(currentUser);
    setupFriendSearchListener();

    // Adiciona o evento de click ao botão existente no HTML
    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) addFriendBtn.addEventListener('click', showAddFriendModal);
  } catch (error) {
    console.error("Erro ao inicializar sistema de amizades:", error);
  }
}

// Carrega e exibe a lista de amigos do usuário na interface
async function loadFriends(user) {
  const friendsList = document.getElementById('friends-list');
  const friends = user.friends || [];
  
  try {
    // Usa o UserManager para carregar todos os usuários
    const users = await userManager.loadUsers();

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
            
            <div class="flex items-center gap-2">
              <button onclick="openChat('${friend.id}')" 
                      class="action-btn text-purple-600 hover:text-purple-700"
                      title="Iniciar chat">
                <i class="fi fi-rr-comment-dots"></i>
              </button>
              
              <button onclick="removeFriend('${friend.id}')" 
                      class="action-btn text-red-600 hover:text-red-700"
                      title="Remover amigo">
                <i class="fi fi-bs-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Erro ao carregar amigos:", error);
    friendsList.innerHTML = '<p class="text-center text-red-500">Erro ao carregar lista de amigos</p>';
  }
}

// Carrega e exibe solicitações de amizade pendentes para um usuário
async function loadFriendRequests(user) {
  const requestsContainer = document.getElementById('friend-requests');
  const requests = user.friendRequests || [];
  
  try {
    // Usa o UserManager para carregar todos os usuários
    const users = await userManager.loadUsers();

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
  } catch (error) {
    console.error("Erro ao carregar solicitações de amizade:", error);
  }
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

    try {
      // Usa o UserManager para carregar os usuários
      const users = await userManager.loadUsers();
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
                `<button onclick="sendFriendRequest(event, '${user.id}')" 
                        class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors">
                  Adicionar
                </button>`
            }
            </div>
          `;
        }).join('') :
        '<div class="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum usuário encontrado</div>';
    } catch (error) {
      console.error("Erro na busca de amigos:", error);
      resultsContainer.innerHTML = '<div class="text-center text-red-500 py-8">Erro ao buscar usuários</div>';
    }
  }, 300));

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
}

// Envia pedido de amizade
async function sendFriendRequest(event, targetUserId) {
  try {
    // Carrega todos os usuários
    const users = await userManager.loadUsers();
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
    if (!targetUser.friendRequests) targetUser.friendRequests = [];

    // Adiciona a solicitação
    targetUser.friendRequests.push(currentUser.userId);
    
    // Salva as alterações no usuário alvo
    await userManager.saveUser(targetUser);

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
  } catch (error) {
    console.error("Erro ao enviar solicitação de amizade:", error);
    alert("Ocorreu um erro ao enviar a solicitação de amizade.");
  }
}

// Aceita uma solicitação de amizade e atualiza as listas de amigos dos usuários envolvidos
async function acceptFriendRequest(requesterId) {
  try {
    // Carrega todos os usuários
    const users = await userManager.loadUsers();
    const currentUser = JSON.parse(localStorage.getItem('userSession'));
    
    const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);
    const requesterIndex = users.findIndex(u => u.id === requesterId);

    if (currentUserIndex === -1 || requesterIndex === -1) return;

    // Obtém os objetos de usuário
    const currentUserData = users[currentUserIndex];
    const requesterData = users[requesterIndex];

    // Remove a solicitação e adiciona à lista de amigos de ambos
    currentUserData.friendRequests = currentUserData.friendRequests.filter(id => id !== requesterId);
    currentUserData.friends = currentUserData.friends || [];
    requesterData.friends = requesterData.friends || [];

    currentUserData.friends.push(requesterId);
    requesterData.friends.push(currentUser.userId);

    // Salva as alterações em ambos os usuários
    await userManager.saveUser(currentUserData);
    await userManager.saveUser(requesterData);
    
    window.location.reload();
  } catch (error) {
    console.error("Erro ao aceitar solicitação de amizade:", error);
    alert("Ocorreu um erro ao aceitar a solicitação de amizade.");
  }
}

// Rejeita uma solicitação de amizade removendo o ID do solicitante da lista de pedidos pendentes
async function rejectFriendRequest(requesterId) {
  try {
    // Carrega todos os usuários
    const users = await userManager.loadUsers();
    const currentUser = JSON.parse(localStorage.getItem('userSession'));
    const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);

    if (currentUserIndex === -1) return;

    // Obtém o objeto de usuário atualizado
    const currentUserData = users[currentUserIndex];

    // Remove a solicitação
    currentUserData.friendRequests = currentUserData.friendRequests.filter(id => id !== requesterId);
    
    // Salva as alterações
    await userManager.saveUser(currentUserData);
    
    loadFriendRequests(currentUserData);
  } catch (error) {
    console.error("Erro ao rejeitar solicitação de amizade:", error);
    alert("Ocorreu um erro ao rejeitar a solicitação de amizade.");
  }
}

// Remove um amigo da lista de amigos do usuário atual e da lista do amigo removido
async function removeFriend(friendId) {
  if (!confirm('Tem certeza que deseja remover este amigo?')) return;

  try {
    // Carrega todos os usuários
    const users = await userManager.loadUsers();
    const currentUser = JSON.parse(localStorage.getItem('userSession'));
    
    const currentUserIndex = users.findIndex(u => u.id === currentUser.userId);
    const friendIndex = users.findIndex(u => u.id === friendId);

    if (currentUserIndex === -1 || friendIndex === -1) return;

    // Obtém os objetos de usuário
    const currentUserData = users[currentUserIndex];
    const friendData = users[friendIndex];

    // Remove da lista de amigos de ambos os usuários
    currentUserData.friends = currentUserData.friends.filter(id => id !== friendId);
    friendData.friends = friendData.friends.filter(id => id !== currentUser.userId);

    // Salva as alterações em ambos os usuários
    await userManager.saveUser(currentUserData);
    await userManager.saveUser(friendData);
    
    window.location.reload();
  } catch (error) {
    console.error("Erro ao remover amigo:", error);
    alert("Ocorreu um erro ao remover o amigo.");
  }
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
async function openChat(friendId) {
  try {
    // Usa userManager para buscar os usuários em vez do localStorage
    const users = await userManager.loadUsers();
    const sessionData = JSON.parse(localStorage.getItem('userSession'));
    const friend = users.find(u => u.id === friendId);
    
    if (!friend) {
      console.error('Amigo não encontrado');
      return;
    }
    
    // Verifica se já existe uma janela de chat aberta
    const existingChat = document.querySelector(`#chat-${friendId}`);
    if (existingChat) {
      existingChat.querySelector('input').focus();
      return;
    }
    
    const chatWindow = document.createElement('div');
    chatWindow.id = `chat-${friendId}`;
    chatWindow.className = 'w-80 rounded-lg shadow-lg overflow-hidden chat-window';
    chatWindow.style.background = 'var(--background)';
    chatWindow.innerHTML = `
      <div class="flex items-center justify-between p-3 bg-purple-500 text-white">
        <div class="flex items-center gap-2">
          <img src="${friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
               alt="${friend.username}" 
               class="w-8 h-8 rounded-full">
          <span class="font-medium">${friend.displayName || friend.username}</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="minimizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Minimizar">
            <i class="fi fi-rr-window-minimize"></i>
          </button>
          <button onclick="maximizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Maximizar">
            <i class="fi fi-rr-expand"></i>
          </button>
          <button onclick="closeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Fechar">
            <i class="fi fi-rr-x"></i>
          </button>
        </div>
      </div>
      <div class="chat-body">
        <div class="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin" id="chat-messages-${friendId}">
          <!-- Mensagens serão inseridas aqui -->
        </div>
        <div class="p-3 border-t dark:border-gray-700">
          <form onsubmit="sendMessage(event, '${sessionData.userId}', '${friendId}')" class="flex gap-2">
            <input type="text" placeholder="Digite sua mensagem..." 
                   class="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
            <button type="submit" 
                    class="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <i class="fi fi-ss-paper-plane mt-1"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('chat-windows').appendChild(chatWindow);
    loadChatMessages(sessionData.userId, friendId);
  } catch (error) {
    console.error("Erro ao abrir chat:", error);
  }
}

/**
 * Maximiza a janela de chat para tela cheia
 * @param {string} friendId - ID do amigo no chat
 */
function maximizeChat(friendId) {
  const chatWindow = document.getElementById(`chat-${friendId}`);
  if (!chatWindow) return;
  
  // Adiciona classe para estilo de tela cheia
  chatWindow.classList.add('chat-maximized');
  // Remove classe de minimizado caso exista
  chatWindow.classList.remove('chat-minimized', 'chat-normal');
  
  // Atualiza os botões para mostrar opção de restaurar e minimizar
  const headerButtons = chatWindow.querySelector('.flex.items-center.gap-1');
  headerButtons.innerHTML = `
    <button onclick="minimizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Minimizar">
      <i class="fi fi-rr-window-minimize"></i>
    </button>
    <button onclick="restoreChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Restaurar">
      <i class="fi fi-rr-expand"></i>
    </button>
    <button onclick="closeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Fechar">
      <i class="fi fi-rr-x"></i>
    </button>
  `;
  
  // Ajusta a rolagem das mensagens
  const messagesContainer = document.getElementById(`chat-messages-${friendId}`);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Minimiza a janela de chat para mostrar apenas o cabeçalho
 * @param {string} friendId - ID do amigo no chat
 */
function minimizeChat(friendId) {
  const chatWindow = document.getElementById(`chat-${friendId}`);
  if (!chatWindow) return;
  
  // Se já está minimizado, restaura para normal
  if (chatWindow.classList.contains('chat-minimized')) {
    restoreChat(friendId);
    return;
  }
  
  // Adiciona classe para estilo minimizado
  chatWindow.classList.add('chat-minimized');
  // Remove outras classes de estado
  chatWindow.classList.remove('chat-maximized', 'chat-normal');
  
  // Atualiza os botões para mostrar opção de restaurar e maximizar
  const headerButtons = chatWindow.querySelector('.flex.items-center.gap-1');
  headerButtons.innerHTML = `
    <button onclick="restoreChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Restaurar">
      <i class="fi fi-rr-angle-down"></i>
    </button>
    <button onclick="maximizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Maximizar">
      <i class="fi fi-rr-expand"></i>
    </button>
    <button onclick="closeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Fechar">
      <i class="fi fi-rr-x"></i>
    </button>
  `;
}

/**
 * Restaura a janela de chat para o tamanho normal
 * @param {string} friendId - ID do amigo no chat
 */
function restoreChat(friendId) {
  const chatWindow = document.getElementById(`chat-${friendId}`);
  if (!chatWindow) return;
  
  // Adiciona classe para estilo normal
  chatWindow.classList.add('chat-normal');
  // Remove outras classes de estado
  chatWindow.classList.remove('chat-maximized', 'chat-minimized');
  
  // Atualiza os botões para mostrar opções padrão
  const headerButtons = chatWindow.querySelector('.flex.items-center.gap-1');
  headerButtons.innerHTML = `
    <button onclick="minimizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Minimizar">
      <i class="fi fi-rr-window-minimize"></i>
    </button>
    <button onclick="maximizeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Maximizar">
      <i class="fi fi-rr-expand"></i>
    </button>
    <button onclick="closeChat('${friendId}')" class="text-white hover:text-gray-200 transition-colors p-1" title="Fechar">
      <i class="fi fi-rr-x"></i>
    </button>
  `;
  
  // Ajusta a rolagem das mensagens
  const messagesContainer = document.getElementById(`chat-messages-${friendId}`);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Carrega e exibe as mensagens do chat entre dois usuários, incluindo suporte para compartilhamento de animes
 * @param {string|number} senderId - ID do usuário que está enviando as mensagens
 * @param {string|number} receiverId - ID do usuário que está recebendo as mensagens
 */
async function loadChatMessages(senderId, receiverId) {
  try {
    const messages = await chatManager.getMessages(senderId, receiverId); // Agora retorna Promise
    const container = document.getElementById(`chat-messages-${receiverId}`);
    
    // Usa userManager para obter usuários
    const users = await userManager.loadUsers();
    
    // Busca os dados dos usuários para os avatares
    const sender = users.find(u => u.id === senderId);
    const receiver = users.find(u => u.id === receiverId);

    container.innerHTML = messages.map(msg => {
      const isMine = msg.senderId === senderId;
      const user = isMine ? sender : receiver;
      const messageClasses = isMine ? 'ml-auto' : 'mr-auto';

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
        // Ignora erro, não é uma mensagem JSON
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
    
    // Configura listener em tempo real
    chatManager.listenToMessages(senderId, receiverId, updatedMessages => {
      if (updatedMessages.length > messages.length) {
        // Atualiza apenas se houver novas mensagens
        loadChatMessages(senderId, receiverId);
      }
    });
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
  }
}

/**
 * Envia uma mensagem do remetente para o destinatário no chat.
 * @param {Event} event - O evento do formulário
 * @param {string} senderId - ID do usuário que envia a mensagem
 * @param {string} receiverId - ID do usuário que recebe a mensagem
 */
async function sendMessage(event, senderId, receiverId) {
  event.preventDefault();
  const input = event.target.querySelector('input');
  const message = input.value.trim();

  if (!message) return;

  await chatManager.sendMessage(senderId, receiverId, message);

  // A função loadChatMessages será chamada pelo listener em tempo real
  // mas chamamos explicitamente para garantir atualização imediata
  await loadChatMessages(senderId, receiverId);
  input.value = '';
}

// Remove a janela de chat com um amigo específico
function closeChat(friendId) {
  const chatWindow = document.getElementById(`chat-${friendId}`);
  if (chatWindow) chatWindow.remove();
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