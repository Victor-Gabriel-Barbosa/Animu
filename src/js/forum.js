// Array global para armazenar todos os tópicos do fórum
let forumTopics = [];

// Instância do gerenciador de fórum para operações no Firestore
const forumManager = new ForumManager();

// Elementos do DOM
const newTopicBtn = document.getElementById('new-topic-btn');
const newTopicModal = document.getElementById('new-topic-modal');
const newTopicForm = document.getElementById('new-topic-form');
const cancelTopicBtn = document.getElementById('cancel-topic');
const forumTopicsContainer = document.getElementById('forum-topics');

// Variável global para as opções da toolbar do editor
const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'header': [1, 2, false] }],
  ['link', 'image'],
  ['clean']
];

// Verifica se o usuário está logado
function isUserLoggedIn() {
  const session = localStorage.getItem('userSession');
  return session !== null;
}

// Obtém o nome do usuário logado
function getLoggedUsername() {
  const session = JSON.parse(localStorage.getItem('userSession'));
  return session ? session.username : null;
}

// Verifica se o usuário é admin
function isAdmin() {
  const session = JSON.parse(localStorage.getItem('userSession'));
  return session && session.isAdmin;
}

// Verifica se o usuário é o autor do comentário
function isAuthor(authorName) {
  const session = JSON.parse(localStorage.getItem('userSession'));
  return session && session.username === authorName;
}

// Configurações globais do fórum
const FORUM_CONFIG = {
  categories: [
    { id: 'geral', name: 'Geral', icon: '💭' },
    { id: 'reviews', name: 'Reviews', icon: '⭐' },
    { id: 'teorias', name: 'Teorias', icon: '🤔' },
    { id: 'noticias', name: 'Notícias', icon: '📰' },
    { id: 'recomendacoes', name: 'Recomendações', icon: '👍' }
  ],
  maxTitleLength: 100,
  maxContentLength: 2000,
  maxReplyLength: 500,
  maxTopicsPerUser: 5
};

// Define a classe ForumModerator que agora usa ContentValidator
class ForumModerator {
  static async validateContent(content, type = 'conteúdo') {
    return ContentValidator.validateContent(content, type);
  }

  static async validateTags(tags) {
    return ContentValidator.validateTags(tags);
  }

  static canUserPost() {
    return ContentValidator.canUserPost();
  }
}

// Fecha o modal
function closeModal() {
  newTopicModal.classList.add('hidden');
  newTopicForm.reset();
  // Limpa o editor Quill se estiver disponível
  if (quillEditor) quillEditor.root.innerHTML = '';
}

// Event Listeners
newTopicBtn?.addEventListener('click', () => {
  if (!isUserLoggedIn()) {
    alert('Você precisa estar logado para criar uma discussão!');
    window.location.href = 'signin.html';
    return;
  }
  newTopicModal.classList.remove('hidden');
  populateCategories();
});

// Fecha o modal com o X
document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);

// Fecha o modal com o botão Cancelar
document.getElementById('cancel-topic-btn')?.addEventListener('click', closeModal);

// Fecha o modal clicando fora dele
newTopicModal?.addEventListener('click', (e) => {
  if (e.target === newTopicModal) closeModal();
});

// Previne que cliques dentro do modal o fechem
newTopicModal?.querySelector('.new-topic-modal')?.addEventListener('click', (e) => {
  e.stopPropagation();
});

newTopicForm?.addEventListener('submit', addTopic);

// Renderiza as discussões com melhorias de responsividade
function renderTopics() {
  if (!forumTopicsContainer) return;

  const userId = isUserLoggedIn() ? JSON.parse(localStorage.getItem('userSession')).userId : null;

  // Adiciona filtros de categoria com melhor scroll horizontal em dispositivos móveis
  const categoryFilters = `
    <div class="category-filters mb-6 flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 snap-x snap-mandatory scrollbar-hide">
      <button class="category-filter px-4 py-2 rounded-full border transition-colors hover:bg-purple-700 whitespace-nowrap flex-shrink-0 snap-start"
              onclick="filterTopicsByCategory()">
        🔍 Todas
      </button>
      ${FORUM_CONFIG.categories.map(cat => `
        <button class="category-filter px-4 py-2 rounded-full border transition-colors hover:bg-purple-700 whitespace-nowrap flex-shrink-0 snap-start"
                data-category="${cat.id}"
                onclick="filterTopicsByCategory('${cat.id}')">
          ${cat.icon} ${cat.name}
        </button>
      `).join('')}
    </div>
  `;

  // Organiza tópicos por categoria
  const topicsByCategory = FORUM_CONFIG.categories.reduce((acc, cat) => {
    acc[cat.id] = forumTopics.filter(topic => topic.category === cat.id);
    return acc;
  }, {});

  forumTopicsContainer.innerHTML = categoryFilters + Object.entries(topicsByCategory)
    .map(([catId, topics]) => {
      const category = FORUM_CONFIG.categories.find(c => c.id === catId);
      return topics.length ? `
        <div class="category-section mb-8">
          <h3 class="text-2xl font-bold mb-4 px-1">${category.icon} ${category.name}</h3>
          ${topics.map(topic => renderTopicCard(topic, userId)).join('')}
        </div>
      ` : '';
    }).join('');

  // Adiciona event listeners para filtros
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', () => filterTopicsByCategory(btn.dataset.category));
  });
}

// Função para obter o avatar do usuário
function getUserAvatar(username) {
  const users = JSON.parse(localStorage.getItem('animuUsers') || '[]');
  const user = users.find(u => u.username === username);
  return user ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B5CF6&color=ffffff&size=100`;
}

// Atualiza a função renderReplies para incluir avatares
function renderReplies(replies, topicId, userId) {
  return replies.map(reply => `
    <div class="mb-3 overflow-hidden" id="reply-${reply.id}">
      <div class="flex items-start gap-2 sm:gap-3">
        <img class="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover"
             src="${getUserAvatar(reply.author)}"
             alt="${reply.author}">
        <div class="flex-1 min-w-0">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <p class="text-xs sm:text-sm">
              <span class="font-semibold">${reply.author}</span>
              em ${formatDate(reply.date)}
              ${reply.editedAt ? `<span class="text-xs">(editado)</span>` : ''}
            </p>
            <div class="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
              ${(isAuthor(reply.author) || isAdmin()) ? `
                <button onclick="editReply('${topicId}', '${reply.id}'); event.stopPropagation();" 
                        class="text-blue-600 hover:text-blue-800 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button onclick="deleteReply('${topicId}', '${reply.id}'); event.stopPropagation();"
                        class="text-red-600 hover:text-red-800 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              ` : ''}
              <button onclick="likeReply('${topicId}', '${reply.id}'); event.stopPropagation();"
                      class="text-xs sm:text-sm ${reply.likedBy && reply.likedBy.includes(userId) ? 'text-purple-600' : 'text-gray-400'} transition-colors p-1">
                ${reply.likes || 0} ❤️
              </button>
            </div>
          </div>
          <div class="reply-content overflow-hidden mt-1">
            <p class="break-words text-sm sm:text-base">${reply.content}</p>
          </div>
          <div class="reply-edit-form hidden">
            <form onsubmit="saveReplyEdit(event, '${topicId}', '${reply.id}')" 
                  class="flex flex-col sm:flex-row gap-2 mt-2">
              <div class="flex-1">
                <textarea class="w-full p-2 border rounded-lg text-sm"
                          maxlength="${FORUM_CONFIG.maxReplyLength}"
                          oninput="updateCharCount(this, 'reply-edit-count-${reply.id}')">${reply.content}</textarea>
                <small id="reply-edit-count-${reply.id}" 
                       class="text-right block mt-1 text-xs">0/${FORUM_CONFIG.maxReplyLength}</small>
              </div>
              <div class="flex sm:flex-col gap-2">
                <button type="submit" 
                        class="btn btn-primary text-sm py-1 px-3 flex-1">Salvar</button>
                <button type="button"
                        onclick="cancelReplyEdit('${reply.id}')" 
                        class="btn btn-cancel text-sm py-1 px-3 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Renderiza um card de tópico completo incluindo:
 * - Informações do autor
 * - Conteúdo do tópico
 * - Sistema de likes
 * - Respostas
 * - Formulário de edição
 * @param {Object} topic - Dados do tópico
 * @param {string} userId - ID do usuário atual
 */
function renderTopicCard(topic, userId) {
  const category = FORUM_CONFIG.categories.find(c => c.id === topic.category) || { icon: '💬', name: 'Geral' };

  return `
    <div class="card p-4 sm:p-6 mb-4 transform transition-all overflow-hidden rounded-lg shadow-sm hover:shadow-md" 
         id="topic-${topic.id}"
         onclick="incrementTopicViews('${topic.id}')">
      <div class="topic-content overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <!-- Avatar com tamanho adaptável -->
          <img class="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover flex-shrink-0"
               src="${getUserAvatar(topic.author)}"
               alt="${topic.author}">
          <div class="flex-1 min-w-0">
            <div class="flex flex-col gap-1 sm:gap-2">
              <div class="flex items-center gap-2">
                <span class="text-lg flex-shrink-0">${category.icon}</span>
                <h3 class="text-xl font-bold truncate">${topic.title}</h3>
              </div>
              <p class="text-sm">
                Por <span class="font-semibold">${topic.author}</span> 
                em ${formatDate(topic.date)}
                ${topic.editedAt ? `<span class="text-xs">(editado)</span>` : ''}
              </p>
            </div>
          </div>
          <!-- Botões de ação otimizados para mobile -->
          <div class="flex items-center justify-end gap-2 flex-shrink-0 mt-2 sm:mt-0">
            ${(isAuthor(topic.author) || isAdmin()) ? `
              <button onclick="editTopic('${topic.id}'); event.stopPropagation();" 
                      class="edit-topic-btn text-blue-600 hover:text-blue-800 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
              </button>
              <button onclick="deleteTopic('${topic.id}'); event.stopPropagation();" 
                      class="text-red-600 hover:text-red-800 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </button>
            ` : ''}
            <button onclick="likeTopic('${topic.id}'); event.stopPropagation();" 
                    class="like-button flex items-center gap-1 p-1 rounded-full ${topic.likedBy && topic.likedBy.includes(userId) ? 'text-purple-600' : 'text-gray-400'} transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
              </svg>
              ${topic.likes}
            </button>
          </div>
        </div>
        <p class="mt-3 mb-4 break-words topic-content">
          ${topic.content}
        </p>
      </div>

      <!-- Formulário de edição do tópico com melhoria de responsividade -->
      <div class="topic-edit-form hidden">
        <form onsubmit="saveTopicEdit(event, '${topic.id}')" class="space-y-4">
          <div>
            <input type="text" value="${topic.title}" 
                   class="w-full p-2 border rounded-lg text-xl font-bold mb-2"
                   maxlength="${FORUM_CONFIG.maxTitleLength}"
                   oninput="updateCharCount(this, 'edit-title-count-${topic.id}')">
            <small id="edit-title-count-${topic.id}" class="text-right block mt-1">
              ${topic.title.length}/${FORUM_CONFIG.maxTitleLength}
            </small>
          </div>
          <div>
            <!-- Substituindo textarea por div para o editor Quill -->
            <div id="edit-content-${topic.id}" class="w-full p-2 border rounded-lg min-h-[150px]"></div>
            <small id="edit-content-count-${topic.id}" class="text-right block mt-1">
              ${topic.content.length <= FORUM_CONFIG.maxContentLength ? topic.content.length : FORUM_CONFIG.maxContentLength}/${FORUM_CONFIG.maxContentLength}
            </small>
          </div>
          <div class="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onclick="cancelTopicEdit('${topic.id}')" 
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg order-2 sm:order-1">Cancelar</button>
            <button type="submit" 
                    class="btn btn-primary order-1 sm:order-2">Salvar</button>
          </div>
        </form>
      </div>
      
      <!-- Seção de respostas com melhor espaçamento para mobile -->
      <div class="ml-3 sm:ml-6 border-l-2 border-purple-600 pl-2 sm:pl-4 mt-4">
        ${renderReplies(topic.replies, topic.id, userId)}
      </div>
      
      <!-- Formulário de resposta responsivo -->
      ${isUserLoggedIn() ? `
        <div class="mt-4">
          <form onsubmit="addReply(event, '${topic.id}')" class="space-y-2">
            <div class="flex-1">
              <input type="text" 
                     placeholder="Adicione uma resposta..." 
                     maxlength="${FORUM_CONFIG.maxReplyLength}"
                     oninput="updateCharCount(this, 'reply-count-${topic.id}')"
                     class="w-full p-2 border rounded-lg">
              <small id="reply-count-${topic.id}" class="text-right block mt-1">0/${FORUM_CONFIG.maxReplyLength}</small>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="btn px-4 py-2">
                Responder
              </button>
            </div>
          </form>
        </div>
      ` : `
        <div class="mt-4 text-center py-2">
          <a href="signin.html" class="text-purple-600 hover:text-purple-700 font-medium">
            Faça login para participar da discussão
          </a>
        </div>
      `}
      
      <!-- Estatísticas do tópico com melhor layout mobile -->
      <div class="flex flex-wrap gap-2 mt-4 text-sm text-gray-600">
        <span class="badge">${topic.views || 0} 👀</span>
        <span class="badge">${topic.replies.length} 💬</span>
        <span class="badge">${topic.likes} 👍</span>
      </div>

      <!-- Sistema de tags com layout flexível -->
      <div class="flex flex-wrap gap-2 mt-2">
        ${(topic.tags || []).map(tag => `
          <span class="tag text-xs sm:text-sm">
            #${tag}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// Correção da função de edição de tópicos
function editTopic(topicId) {
  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic || (!isAuthor(topic.author) && !isAdmin())) return;

  const topicElement = document.getElementById(`topic-${topicId}`);
  if (!topicElement) return;

  const contentDiv = topicElement.querySelector('.topic-content');
  const editFormDiv = topicElement.querySelector('.topic-edit-form');

  // Torna visível o formulário de edição
  contentDiv.classList.add('hidden');
  editFormDiv.classList.remove('hidden');
  
  // Limpa manualmente qualquer instância anterior de Quill
  try {
    const editorElement = document.querySelector(`#edit-content-${topicId}`);
    if (editorElement) {
      // Remover qualquer toolbar anterior
      const prevToolbar = editorElement.previousSibling;
      if (prevToolbar && prevToolbar.classList.contains('ql-toolbar')) {
        prevToolbar.remove();
      }
      
      // Limpar o conteúdo para evitar duplicação
      editorElement.innerHTML = '';
    }
  } catch (error) {
    console.warn('Erro ao limpar editor anterior:', error);
  }
  
  // Inicializa o editor Quill com as opções de toolbar
  const editQuill = new Quill(`#edit-content-${topicId}`, {
    theme: 'snow',
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: 'Conteúdo do tópico...'
  });
  
  // Configura o conteúdo do editor com segurança
  setTimeout(() => {
    // Usando setTimeout para garantir que o editor esteja pronto
    editQuill.clipboard.dangerouslyPasteHTML(topic.content);
    
    // Adiciona evento para contar caracteres
    editQuill.on('text-change', function() {
      const text = editQuill.getText().trim();
      const charCount = document.getElementById(`edit-content-count-${topicId}`);
      if (charCount) {
        charCount.textContent = `${text.length}/${FORUM_CONFIG.maxContentLength}`;
        // Destaca em vermelho se estiver próximo do limite
        if (text.length > FORUM_CONFIG.maxContentLength * 0.9) charCount.classList.add('text-red-500');
        else charCount.classList.remove('text-red-500');
      }
    });
    
    // Inicializa contador com valor atual
    const text = editQuill.getText().trim();
    const charCount = document.getElementById(`edit-content-count-${topicId}`);
    if (charCount) {
      charCount.textContent = `${text.length}/${FORUM_CONFIG.maxContentLength}`;
    }
  }, 0);
}

// Atualizar também a função saveTopicEdit para usar corretamente o editor
async function saveTopicEdit(event, topicId) {
  event.preventDefault();

  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic) return;

  const form = event.target;
  const newTitle = form.querySelector('input').value.trim();
  
  // Obtém a instância do Quill corretamente
  const editQuill = Quill.find(document.querySelector(`#edit-content-${topicId}`));
  if (!editQuill) {
    console.error('Editor Quill não encontrado');
    return;
  }
  
  const newContent = editQuill.root.innerHTML;
  const plainContent = editQuill.getText().trim();

  if (plainContent.length > FORUM_CONFIG.maxContentLength) {
    alert(`O conteúdo excede o limite de ${FORUM_CONFIG.maxContentLength} caracteres.`);
    return;
  }

  try {
    // Valida o título e o conteúdo com suporte a censura parcial
    const [titleValidation, contentValidation] = await Promise.all([
      ForumModerator.validateContent(newTitle, 'título'),
      ForumModerator.validateContent(plainContent, 'conteúdo')
    ]);
    
    let notifyCensorship = false;
    let formattedTitle, formattedContent;
    
    // Aplica a censura ao título se necessário
    if (titleValidation.wasCensored) {
      formattedTitle = await TextFormatter.format(titleValidation.censoredText);
      notifyCensorship = true;
    } else {
      formattedTitle = await TextFormatter.format(newTitle);
    }
    
    // Aplica a censura ao conteúdo se necessário
    if (contentValidation.wasCensored) {
      // Atualiza o texto do editor com o conteúdo censurado
      editQuill.setText(contentValidation.censoredText);
      formattedContent = editQuill.root.innerHTML;
      notifyCensorship = true;
    } else {
      formattedContent = newContent;
    }
    
    // Prepara o objeto com os dados atualizados
    const updatedData = {
      title: formattedTitle,
      content: formattedContent
    };
    
    // Usa o ForumManager para atualizar o tópico
    await forumManager.updateTopic(topicId, updatedData);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    if (notifyCensorship) {
      alert('Alguns termos impróprios foram filtrados do seu conteúdo.');
    }
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error);
    alert(error.message || 'Não foi possível atualizar o tópico. Tente novamente.');
  }
}

// Melhorar também a função de cancelar edição para garantir limpeza adequada
function cancelTopicEdit(topicId) {
  const topicElement = document.getElementById(`topic-${topicId}`);
  if (!topicElement) return;

  const contentDiv = topicElement.querySelector('.topic-content');
  const editFormDiv = topicElement.querySelector('.topic-edit-form');

  // Abordagem corrigida para limpar o editor Quill
  try {
    // Primeiro, tentamos obter o editor usando o método find do Quill
    const editorElement = document.querySelector(`#edit-content-${topicId}`);
    if (editorElement) {
      // Se o editor existe, removemos a toolbar e o conteúdo manualmente
      const toolbarElement = editorElement.previousSibling;
      if (toolbarElement && toolbarElement.classList.contains('ql-toolbar')) {
        toolbarElement.remove();
      }
      
      // Limpamos o conteúdo do editor
      editorElement.innerHTML = '';
      
      // Removemos atributos de dados do Quill
      const attributes = Array.from(editorElement.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('data-')) {
          editorElement.removeAttribute(attr.name);
        }
      });
    }
  } catch (error) {
    console.warn('Erro ao limpar editor:', error);
    // Continua com a operação mesmo se houver erro na limpeza
  }

  // Restaura a visibilidade dos elementos originais
  contentDiv.classList.remove('hidden');
  editFormDiv.classList.add('hidden');
}

// Renderiza a lista de tópicos
function renderReplies(replies, topicId, userId) {
  return replies.map(reply => `
    <div class="mb-3 overflow-hidden" id="reply-${reply.id}">
      <div class="flex items-start gap-3">
        <img class="h-8 w-8 rounded-full object-cover"
             src="${getUserAvatar(reply.author)}"
             alt="${reply.author}">
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <p class="text-sm">
              <span class="font-semibold">${reply.author}</span>
              em ${formatDate(reply.date)}
              ${reply.editedAt ? `<span class="text-xs">(editado)</span>` : ''}
            </p>
            <div class="flex items-center gap-2">
              ${(isAuthor(reply.author) || isAdmin()) ? `
                <button onclick="editReply('${topicId}', '${reply.id}')" class="text-blue-600 hover:text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button onclick="deleteReply('${topicId}', '${reply.id}')" class="text-red-600 hover:text-red-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              ` : ''}
              <button onclick="likeReply('${topicId}', '${reply.id}')" 
                      class="text-sm ${reply.likedBy && reply.likedBy.includes(userId) ? 'text-purple-600' : 'text-gray-400'} transition-colors">
                ${reply.likes || 0} ❤️
              </button>
            </div>
          </div>
          <div class="reply-content overflow-hidden mt-1">
            <p class="break-words">${reply.content}</p>
          </div>
          <div class="reply-edit-form hidden">
            <form onsubmit="saveReplyEdit(event, '${topicId}', '${reply.id}')" class="flex gap-2 mt-2">
              <div class="flex-1">
                <textarea class="w-full p-2 border rounded-lg" 
                          maxlength="${FORUM_CONFIG.maxReplyLength}"
                          oninput="updateCharCount(this, 'reply-edit-count-${reply.id}')">${reply.content}</textarea>
                <small id="reply-edit-count-${reply.id}" class="text-right block mt-1">0/${FORUM_CONFIG.maxReplyLength}</small>
              </div>
              <div class="flex flex-col gap-2">
                <button type="submit" class="btn btn-primary order-1 md:order-2 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar
                  </span>
                </button>
                <button type="button" onclick="cancelReplyEdit('${reply.id}')" class="btn btn-cancel order-2 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Funções auxiliares
function formatDate(dateStr) {
  try {
    let date;
    
    // Verifica se é um objeto do Firestore timestamp
    if (dateStr && typeof dateStr === 'object' && dateStr.toDate) {
      date = dateStr.toDate();
    } 
    // Verifica se é um número (timestamp em milissegundos)
    else if (!isNaN(dateStr) && dateStr !== null) {
      date = new Date(Number(dateStr));
    }
    // Caso seja uma string ou outro formato
    else {
      date = new Date(dateStr);
    }
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Agora';
    }
    
    return date.toLocaleDateString('pt-BR', {
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

// Gerencia o sistema de likes dos tópico e verifica autenticação e atualiza contadores
async function likeTopic(topicId) {
  if (!isUserLoggedIn()) {
    alert('Você precisa estar logado para curtir!');
    window.location.href = 'signin.html';
    return;
  }

  const userId = JSON.parse(localStorage.getItem('userSession')).userId;
  
  try {
    // Usa o ForumManager para gerenciar o like
    const wasAdded = await forumManager.likeTopic(topicId, userId);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    // Feedback visual (opcional)
    const likeButton = document.querySelector(`#topic-${topicId} .like-button`);
    if (likeButton) {
      likeButton.classList.toggle('text-purple-600', wasAdded);
      likeButton.classList.toggle('text-gray-400', !wasAdded);
    }
  } catch (error) {
    console.error('Erro ao gerenciar like:', error);
    alert('Não foi possível processar sua ação. Tente novamente.');
  }
}

// Gerencia o sistema de likes das respostas e verifica autenticação e atualiza contadores
async function likeReply(topicId, replyId) {
  if (!isUserLoggedIn()) {
    alert('Você precisa estar logado para curtir!');
    window.location.href = 'signin.html';
    return;
  }

  const userId = JSON.parse(localStorage.getItem('userSession')).userId;
  
  try {
    // Usa o ForumManager para gerenciar o like na resposta
    const wasAdded = await forumManager.likeReply(topicId, replyId, userId);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    // Feedback visual (opcional)
    const likeButton = document.querySelector(`#reply-${replyId} .like-button`);
    if (likeButton) {
      likeButton.classList.toggle('text-purple-600', wasAdded);
      likeButton.classList.toggle('text-gray-400', !wasAdded);
    }
  } catch (error) {
    console.error('Erro ao gerenciar like na resposta:', error);
    alert('Não foi possível processar sua ação. Tente novamente.');
  }
}

// Adiciona uma resposta para um tópico
async function addReply(event, topicId) {
  event.preventDefault();

  if (!isUserLoggedIn()) {
    alert('Você precisa estar logado para responder!');
    window.location.href = 'signin.html';
    return;
  }

  const input = event.target.querySelector('input');
  const content = input.value.trim();

  if (content.length > FORUM_CONFIG.maxReplyLength) {
    alert(`A resposta deve ter no máximo ${FORUM_CONFIG.maxReplyLength} caracteres.`);
    return;
  }

  // Armazena o botão e seu texto original
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  
  try {
    // Mostra indicador de carregamento
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Analisando...';

    // Agora validateContent retorna um objeto com o texto censurado se necessário
    const validationResult = await ForumModerator.validateContent(content, 'resposta');

    // Usa o texto censurado se houve censura, ou formata o original
    let formattedContent;
    if (validationResult.wasCensored) formattedContent = await TextFormatter.format(validationResult.censoredText);
    else formattedContent = await TextFormatter.format(content);
    
    // Cria o objeto da resposta
    const replyData = {
      author: getLoggedUsername(),
      content: formattedContent,
    };
    
    // Usa o ForumManager para adicionar a resposta
    await forumManager.addReply(topicId, replyData);
    
    // Atualiza a interface
    await loadForumData();
    renderTopics();
    
    // Limpa o formulário
    input.value = '';
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    alert(error.message || 'Ocorreu um erro ao adicionar a resposta. Tente novamente.');
  } finally {
    // Garante que o botão seja restaurado em caso de erro
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

// Edição e remoção de tópicos
function editTopic(topicId) {
  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic || (!isAuthor(topic.author) && !isAdmin())) return;

  const topicElement = document.getElementById(`topic-${topicId}`);
  if (!topicElement) return;

  const contentDiv = topicElement.querySelector('.topic-content');
  const editFormDiv = topicElement.querySelector('.topic-edit-form');

  // Torna visível o formulário de edição
  contentDiv.classList.add('hidden');
  editFormDiv.classList.remove('hidden');
  
  // Limpa qualquer instância anterior do Quill
  const existingEditor = Quill.find(document.querySelector(`#edit-content-${topicId}`));
  if (existingEditor) {
    existingEditor.destroy();
  }
  
  // Inicializa o editor Quill com as opções de toolbar
  const editQuill = new Quill(`#edit-content-${topicId}`, {
    theme: 'snow',
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: 'Conteúdo do tópico...'
  });
  
  // Configura o conteúdo do editor com segurança
  editQuill.clipboard.dangerouslyPasteHTML(topic.content);
  
  // Adiciona evento para contar caracteres
  editQuill.on('text-change', function() {
    const text = editQuill.getText().trim();
    const charCount = document.getElementById(`edit-content-count-${topicId}`);
    if (charCount) {
      charCount.textContent = `${text.length}/${FORUM_CONFIG.maxContentLength}`;
      // Destaca em vermelho se estiver próximo do limite
      if (text.length > FORUM_CONFIG.maxContentLength * 0.9) charCount.classList.add('text-red-500');
      else charCount.classList.remove('text-red-500');
    }
  });
}

// Salva a edição de um tópico
async function saveTopicEdit(event, topicId) {
  event.preventDefault();

  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic) return;

  const form = event.target;
  const newTitle = form.querySelector('input').value.trim();
  
  // Obtém a instância do Quill corretamente
  const editQuill = Quill.find(document.querySelector(`#edit-content-${topicId}`));
  if (!editQuill) {
    console.error('Editor Quill não encontrado');
    return;
  }
  
  const newContent = editQuill.root.innerHTML;
  const plainContent = editQuill.getText().trim();

  if (plainContent.length > FORUM_CONFIG.maxContentLength) {
    alert(`O conteúdo excede o limite de ${FORUM_CONFIG.maxContentLength} caracteres.`);
    return;
  }

  try {
    // Valida o título e o conteúdo com suporte a censura parcial
    const [titleValidation, contentValidation] = await Promise.all([
      ForumModerator.validateContent(newTitle, 'título'),
      ForumModerator.validateContent(plainContent, 'conteúdo')
    ]);
    
    let notifyCensorship = false;
    let formattedTitle, formattedContent;
    
    // Aplica a censura ao título se necessário
    if (titleValidation.wasCensored) {
      formattedTitle = await TextFormatter.format(titleValidation.censoredText);
      notifyCensorship = true;
    } else {
      formattedTitle = await TextFormatter.format(newTitle);
    }
    
    // Aplica a censura ao conteúdo se necessário
    if (contentValidation.wasCensored) {
      // Atualiza o texto do editor com o conteúdo censurado
      editQuill.setText(contentValidation.censoredText);
      formattedContent = editQuill.root.innerHTML;
      notifyCensorship = true;
    } else {
      formattedContent = newContent;
    }
    
    // Prepara o objeto com os dados atualizados
    const updatedData = {
      title: formattedTitle,
      content: formattedContent
    };
    
    // Usa o ForumManager para atualizar o tópico
    await forumManager.updateTopic(topicId, updatedData);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    if (notifyCensorship) {
      alert('Alguns termos impróprios foram filtrados do seu conteúdo.');
    }
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error);
    alert(error.message || 'Não foi possível atualizar o tópico. Tente novamente.');
  }
}

// Melhorar também a função de cancelar edição para garantir limpeza adequada
function cancelTopicEdit(topicId) {
  const topicElement = document.getElementById(`topic-${topicId}`);
  if (!topicElement) return;

  const contentDiv = topicElement.querySelector('.topic-content');
  const editFormDiv = topicElement.querySelector('.topic-edit-form');

  // Abordagem corrigida para limpar o editor Quill
  try {
    // Primeiro, tentamos obter o editor usando o método find do Quill
    const editorElement = document.querySelector(`#edit-content-${topicId}`);
    if (editorElement) {
      // Se o editor existe, removemos a toolbar e o conteúdo manualmente
      const toolbarElement = editorElement.previousSibling;
      if (toolbarElement && toolbarElement.classList.contains('ql-toolbar')) {
        toolbarElement.remove();
      }
      
      // Limpamos o conteúdo do editor
      editorElement.innerHTML = '';
      
      // Removemos atributos de dados do Quill
      const attributes = Array.from(editorElement.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('data-')) {
          editorElement.removeAttribute(attr.name);
        }
      });
    }
  } catch (error) {
    console.warn('Erro ao limpar editor:', error);
    // Continua com a operação mesmo se houver erro na limpeza
  }

  // Restaura a visibilidade dos elementos originais
  contentDiv.classList.remove('hidden');
  editFormDiv.classList.add('hidden');
}

// Remove um tópico 
async function deleteTopic(topicId) {
  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic || (!isAuthor(topic.author) && !isAdmin())) return;

  if (confirm('Tem certeza que deseja excluir esta discussão? Todos os comentários serão removidos permanentemente.')) {
    try {
      // Usa o ForumManager para excluir o tópico
      await forumManager.deleteTopic(topicId);
      
      // Atualiza a lista de tópicos
      await loadForumData();
      renderTopics();
      
      // Feedback visual para o usuário
      alert('Tópico excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tópico:', error);
      alert(error.message || 'Ocorreu um erro ao tentar excluir o tópico. Por favor, tente novamente.');
    }
  }
}

// Edita uma resposta
function editReply(topicId, replyId) {
  const replyElement = document.getElementById(`reply-${replyId}`);
  if (!replyElement) {
    console.error(`Elemento de resposta não encontrado: reply-${replyId}`);
    return;
  }

  const contentDiv = replyElement.querySelector('.reply-content');
  const editFormDiv = replyElement.querySelector('.reply-edit-form');
  
  if (!contentDiv || !editFormDiv) {
    console.error('Elementos de conteúdo ou formulário de edição não encontrados');
    return;
  }

  // Muda a visibilidade dos elementos
  contentDiv.classList.add('hidden');
  editFormDiv.classList.remove('hidden');
  
  // Inicializa o contador de caracteres para a textarea
  const textarea = editFormDiv.querySelector('textarea');
  if (textarea) {
    updateCharCount(textarea, `reply-edit-count-${replyId}`);
  }
  
  // Armazenamos o ID do tópico como atributo de dados para uso posterior
  replyElement.dataset.topicId = topicId;
}

// Salva a edição de uma resposta
async function saveReplyEdit(event, topicId, replyId) {
  event.preventDefault();

  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic) return;

  const reply = topic.replies.find(r => r.id === replyId);
  if (!reply) return;

  const form = event.target;
  const newContent = form.querySelector('textarea').value.trim();

  if (newContent.length > FORUM_CONFIG.maxReplyLength) {
    alert(`A resposta deve ter no máximo ${FORUM_CONFIG.maxReplyLength} caracteres.`);
    return;
  }

  try {
    const validationResult = await ForumModerator.validateContent(newContent, 'resposta');
    
    // Usa o texto censurado se houve censura
    let formattedContent;
    if (validationResult.wasCensored) {
      formattedContent = await TextFormatter.format(validationResult.censoredText);
    } else {
      formattedContent = await TextFormatter.format(newContent);
    }
    
    // Prepara os dados da resposta atualizada
    const replyData = {
      content: formattedContent
    };
    
    // Usa o ForumManager para atualizar a resposta
    await forumManager.updateReply(topicId, replyId, replyData);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    if (validationResult.wasCensored) {
      alert('Alguns termos impróprios foram filtrados da sua resposta.');
    }
  } catch (error) {
    console.error('Erro ao atualizar resposta:', error);
    alert(error.message || 'Não foi possível atualizar a resposta. Tente novamente.');
  }
}

// Cancela a edição de uma resposta
function cancelReplyEdit(replyId) {
  const replyElement = document.getElementById(`reply-${replyId}`);
  if (!replyElement) return;

  const contentDiv = replyElement.querySelector('.reply-content');
  const editFormDiv = replyElement.querySelector('.reply-edit-form');
  
  if (!contentDiv || !editFormDiv) {
    console.error('Elementos de conteúdo ou formulário de edição não encontrados');
    return;
  }

  // Restaura a visibilidade original
  contentDiv.classList.remove('hidden');
  editFormDiv.classList.add('hidden');
}

// Remove uma resposta
async function deleteReply(topicId, replyId) {
  const topic = forumTopics.find(t => t.id === topicId);
  if (!topic) return;

  const reply = topic.replies.find(r => r.id === replyId);
  if (!reply || (!isAuthor(reply.author) && !isAdmin())) return;

  if (confirm('Tem certeza que deseja excluir esta resposta?')) {
    try {
      // Usa o ForumManager para excluir a resposta
      await forumManager.deleteReply(topicId, replyId);
      
      // Atualiza a lista de tópicos
      await loadForumData();
      renderTopics();
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      alert(error.message || 'Não foi possível excluir a resposta. Tente novamente.');
    }
  }
}

// Funções para gerenciamento de tópicos
async function addTopic(event) {
  event.preventDefault();

  if (!isUserLoggedIn()) {
    alert('Você precisa estar logado para criar tópicos.');
    window.location.href = 'signin.html';
    return;
  }

  const title = document.getElementById('topic-title').value.trim();
  const content = quillEditor.root.innerHTML;
  const plainContent = quillEditor.getText().trim();
  const category = document.getElementById('topic-category').value;
  const rawTags = document.getElementById('topic-tags').value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  if (!category) {
    alert('Por favor, selecione uma categoria.');
    return;
  }

  if (title.length > FORUM_CONFIG.maxTitleLength) {
    alert(`O título deve ter no máximo ${FORUM_CONFIG.maxTitleLength} caracteres.`);
    return;
  }

  if (plainContent.length > FORUM_CONFIG.maxContentLength) {
    alert(`O conteúdo deve ter no máximo ${FORUM_CONFIG.maxContentLength} caracteres.`);
    return;
  }

  // Obtém o botão de envio e seu texto original
  const submitBtn = newTopicForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
    // Mostra indicador de carregamento
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Analisando...';

    // Validamos título e conteúdo, agora com suporte a censura parcial
    const titleValidation = await ForumModerator.validateContent(title, 'título');
    const contentValidation = await ForumModerator.validateContent(plainContent, 'conteúdo');
    
    let notifyCensorship = false;

    // Valida e filtra tags impróprias
    const validatedTags = await ForumModerator.validateTags(rawTags);

    if (rawTags.length !== validatedTags.length) {
      alert('Algumas tags foram removidas por conterem conteúdo impróprio.');
    }

    // Formatamos o título, possivelmente censurado
    let formattedTitle;
    if (titleValidation.wasCensored) {
      formattedTitle = await TextFormatter.format(titleValidation.censoredText);
      notifyCensorship = true;
    } else {
      formattedTitle = await TextFormatter.format(title);
    }
    
    // Formata o conteúdo, possivelmente censurado
    let formattedContent;
    if (contentValidation.wasCensored) {
      quillEditor.setText(contentValidation.censoredText);
      formattedContent = quillEditor.root.innerHTML;
      notifyCensorship = true;
    } else {
      formattedContent = content;
    }

    // Prepara o objeto com os dados do novo tópico
    const topicData = {
      title: formattedTitle,
      content: formattedContent,
      category,
      tags: validatedTags,
      author: getLoggedUsername()
    };

    // Usa o ForumManager para criar o tópico
    await forumManager.createTopic(topicData);
    
    // Atualiza a lista de tópicos
    await loadForumData();
    renderTopics();
    
    // Fecha o modal e limpa o formulário
    closeModal();
    
    if (notifyCensorship) {
      alert('Alguns termos impróprios foram filtrados do seu conteúdo.');
    }
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    alert(error.message || 'Não foi possível criar o tópico. Tente novamente.');
  } finally {
    // Restaura o botão ao estado original sempre
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

// Função para preencher as opções de categorias
function populateCategories() {
  const categorySelect = document.getElementById('topic-category');
  if (!categorySelect) return;

  categorySelect.innerHTML = `
    <option value="">Selecione uma categoria</option>
    ${FORUM_CONFIG.categories.map(cat => `
      <option value="${cat.id}">${cat.icon} ${cat.name}</option>
    `).join('')}
  `;
}

/**
 * Carrega os tópicos do fórum usando o ForumManager
 * @param {string} categoryId - Opcional: filtra por categoria
 */
async function loadForumData(categoryId = null) {
  try {
    // Usa o ForumManager para obter os tópicos
    forumTopics = await forumManager.getAllTopics(categoryId);
  } catch (error) {
    console.error('Erro ao carregar dados do fórum:', error);
    alert('Não foi possível carregar os tópicos. Verifique sua conexão.');
    forumTopics = [];
  }
}

// Filtra tópicos por categoria com melhor UI responsiva
async function filterTopicsByCategory(categoryId) {
  // Remove a classe ativa de todos os botões
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.classList.remove('bg-purple-700', 'text-white');
  });

  // Adiciona classe ativa ao botão selecionado
  if (categoryId) {
    const selectedButton = document.querySelector(`[data-category="${categoryId}"]`);
    if (selectedButton) {
      selectedButton.classList.add('bg-purple-700', 'text-white');
      // Garante que o botão selecionado fique visível (scroll)
      selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  } else {
    // Se não houver categoria selecionada, seleciona o botão "Todas"
    const allButton = document.querySelector('.category-filter:not([data-category])');
    if (allButton) allButton.classList.add('bg-purple-700', 'text-white');
  }

  // Carrega tópicos com ou sem filtro de categoria
  await loadForumData(categoryId);
  renderTopics();
}

/**
 * Sistema de visualizações único por usuário
 * Incrementa contador apenas uma vez por hora
 */
async function incrementTopicViews(topicId) {
  if (!topicId) return;
  
  try {
    const userId = isUserLoggedIn() ? 
      JSON.parse(localStorage.getItem('userSession')).userId : 
      'anonymous';
    
    // Usa o ForumManager para incrementar visualização
    const wasIncremented = await forumManager.incrementTopicView(topicId, userId);
    
    // Se a visualização foi contabilizada, atualiza a lista de tópicos
    if (wasIncremented) {
      await loadForumData();
      renderTopics();
    }
  } catch (error) {
    console.error('Erro ao incrementar visualização:', error);
    // Silenciosamente falha - não é crítico para o usuário
  }
}

// Atualiza o contador de caracteres
function updateCharCount(input, counterId) {
  const counter = document.getElementById(counterId);
  const max = input.getAttribute('maxlength');
  counter.textContent = `${input.value.length}/${max}`;
}

// Carrega dados necessários e configura estado inicial do fórum
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carrega a lista de palavrões (mantido para compatibilidade)
    await loadBadWords();
    
    // Carrega os tópicos usando o ForumManager
    await loadForumData();
    
    // Inicialização do Quill
    initQuillEditor();
    
    // Renderiza tópicos e popula categorias
    renderTopics();
    populateCategories();
  } catch (error) {
    console.error('Erro ao inicializar o fórum:', error);
    alert('Houve um problema ao carregar o fórum. Por favor, atualize a página.');
  }
});

// Adiciona variável global para o editor
let quillEditor;

// Atualiza a função de inicialização do editor
function initQuillEditor() {
  quillEditor = new Quill('#topic-content', {
    theme: 'snow',
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: 'Escreva sua discussão aqui...'
  });

  quillEditor.on('text-change', function() {
    const text = quillEditor.getText().trim();
    const charCount = document.getElementById('content-char-count');
    if (charCount) {
      charCount.textContent = `${text.length}/${FORUM_CONFIG.maxContentLength}`;
      if (text.length > FORUM_CONFIG.maxContentLength * 0.9) charCount.classList.add('text-red-500');
      else charCount.classList.remove('text-red-500');
    }
  });
}