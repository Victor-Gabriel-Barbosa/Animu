/**
 * Gerenciador de notícias para área administrativa
 * Controla a criação, edição, exclusão e visualização de notícias
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!AnimuUtils.isUserAdmin()) return;

  // Elementos do DOM
  const modal = document.getElementById('news-modal');
  const form = document.getElementById('news-form');
  const addBtn = document.getElementById('add-news-btn');
  const closeBtn = document.querySelector('.modal-close');
  const cancelBtn = document.getElementById('cancel-btn');

  let editingId = null; // Armazena ID da notícia em edição
  let updateFormProgress;

  // Inicializa o gerenciador de notícias
  const newsManager = new NewsManager();

  // Carrega notícias existentes ao iniciar
  loadNews();

  // Inicializa editor de texto rico Quill com opções de formatação
  const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'header': [1, 2, false] }],
        ['link', 'image'],
        ['clean']
      ]
    },
    placeholder: 'Digite o conteúdo da notícia...'
  });

  // Adapta tema do editor de acordo com o tema da aplicação
  if (document.documentElement.classList.contains('dark')) {
    document.querySelector('.ql-toolbar').classList.add('dark');
    document.querySelector('.ql-container').classList.add('dark');
  }

  // Controla a barra de progresso do formulário
  updateFormProgress = function() {
    const progressBar = document.getElementById('formProgress');
    const requiredFields = ['title', 'category', 'summary', 'image'];
    const totalFields = requiredFields.length + 1; // +1 para conteúdo do editor
    let filledFields = 0;
    
    // Verifica campos obrigatórios preenchidos
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && field.value.trim()) filledFields++;
    });

    // Verifica conteúdo do editor
    const content = quill.root.innerHTML.trim();
    if (content && content !== '<p><br></p>') filledFields++;

    // Atualiza barra de progresso
    const progress = Math.round((filledFields / totalFields) * 100);
    progressBar.style.width = `${progress}%`;
    
    // Altera cor da barra conforme progresso
    if (progress < 33) progressBar.style.background = 'var(--error-color, #EF4444)';
    else if (progress < 66) progressBar.style.background = 'var(--warning-color, #F59E0B)';
    else progressBar.style.background = 'var(--success-color, #10B981)';
  };

  // Configura monitoramento de campos para atualizar progresso
  function setupFormProgress() {
    // Monitora campos de formulário
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', updateFormProgress);
      field.addEventListener('change', updateFormProgress);
    });

    // Monitora alterações no editor
    quill.on('text-change', updateFormProgress);

    // Inicializa barra de progresso
    updateFormProgress();
  }

  setupFormProgress();

  // Configuração de eventos principais
  addBtn.addEventListener('click', () => openModal());
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  form.addEventListener('submit', handleSubmit);

  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', clearForm);

  // Limpa todos os campos do formulário após confirmação
  function clearForm() {
    if (confirm('Tem certeza que deseja limpar todos os campos?')) {
      // Reseta formulário e editor
      document.getElementById('title').value = '';
      document.getElementById('category').value = '';
      document.getElementById('tags').value = '';
      document.getElementById('summary').value = '';
      quill.setContents([]);
      
      // Limpa a imagem e esconde preview
      document.getElementById('image').value = '';
      imagePreview.classList.add('hidden');
      imageDropZone.querySelector('.upload-area').classList.remove('hidden');
      
      // Reseta contador e barra de progresso
      summaryCounter.textContent = `0/${maxLength}`;
      summaryCounter.classList.remove('text-red-500');
      if (typeof updateFormProgress === 'function') updateFormProgress();
    }
  }

  // Carrega notícias usando o NewsManager e gera tabela com opções de gerenciamento
  async function loadNews() {
    try {
      const newsListElement = document.querySelector('.admin-news-list');
      newsListElement.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Carregando notícias...</p>
        </div>
      `;

      // Busca todas as notícias usando o NewsManager
      const news = await newsManager.getAllNews();
      
      // Exibe mensagem quando não há notícias
      if (!news || news.length === 0) {
        newsListElement.innerHTML = `
          <div class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Nenhuma notícia cadastrada</p>
          </div>
        `;
        return;
      }
      
      // Gera tabela de notícias com imagens e ações
      newsListElement.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${news.map(item => `
                <tr>
                  <td>
                    <div class="w-20 h-12 rounded overflow-hidden">
                      <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                    </div>
                  </td>
                  <td>
                    <div class="max-w-xs">
                      <p class="font-medium truncate">${item.title}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${item.summary}</p>
                    </div>
                  </td>
                  <td>
                    <span class="px-2 py-1 text-xs text-white bg-purple-100 dark:bg-purple-900 rounded-full">
                      ${item.category}
                    </span>
                  </td>
                  <td>${new Date(item.date).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <button class="btn-action btn-edit" title="Editar" data-id="${item.id}">
                        <i class="fi fi-bs-edit"></i>
                      </button>
                      <button class="btn-action btn-delete" title="Remover" data-id="${item.id}">
                        <i class="fi fi-bs-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      // Configura botões de ação para cada notícia
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editNews(btn.dataset.id));
      });
      
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteNews(btn.dataset.id));
      });
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      document.querySelector('.admin-news-list').innerHTML = `
        <div class="text-center py-8 text-red-500">
          <p>Erro ao carregar notícias. Por favor, tente novamente.</p>
        </div>
      `;
    }
  }
  
  /**
   * Abre modal para criar nova notícia ou editar existente
   * @param {Object|null} newsData - Dados da notícia para edição (null para nova)
   */
  function openModal(newsData = null) {
    modal.classList.remove('hidden');
    if (newsData) {
      // Modo de edição: preenche formulário com dados existentes
      editingId = newsData.id;
      document.getElementById('title').value = newsData.title;
      document.getElementById('category').value = newsData.category;
      document.getElementById('tags').value = newsData.tags.join(', ');
      document.getElementById('image').value = newsData.image;
      
      // Mostra preview da imagem existente
      if (newsData.image) {
        previewImage.src = newsData.image;
        imagePreview.classList.remove('hidden');
        imageDropZone.querySelector('.upload-area').classList.add('hidden');
      }
      
      document.getElementById('summary').value = newsData.summary;
      quill.clipboard.dangerouslyPasteHTML(newsData.content);
      document.getElementById('modal-title').textContent = 'Editar Notícia';
    } else {
      // Modo de criação: limpa formulário
      editingId = null;
      form.reset();
      imagePreview.classList.add('hidden');
      imageDropZone.querySelector('.upload-area').classList.remove('hidden');
      quill.setContents([]);
      document.getElementById('modal-title').textContent = 'Nova Notícia';
    }
    
    // Atualiza indicador de progresso
    if (typeof updateFormProgress === 'function') setTimeout(updateFormProgress, 100);
  }

  // Configuração do contador de caracteres para o campo de resumo
  const summaryInput = document.getElementById('summary');
  const summaryCounter = document.getElementById('summary-counter');
  const maxLength = 200;

  // Atualiza o contador de caracteres do resumo
  function updateSummaryCounter() {
    const currentLength = summaryInput.value.length;
    summaryCounter.textContent = `${currentLength}/${maxLength}`;
    
    // Destaca contador quando próximo do limite
    if (currentLength >= maxLength * 0.9) summaryCounter.classList.add('text-red-500');
    else summaryCounter.classList.remove('text-red-500');
  }

  summaryInput.addEventListener('input', updateSummaryCounter);

  // Fecha o modal e limpa o formulário
  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
    editingId = null;
    summaryCounter.textContent = `0/${maxLength}`;
    summaryCounter.classList.remove('text-red-500');
  }

  /**
   * Processa submissão do formulário e salva os dados
   * @param {Event} e - Evento de submissão
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Valida campos obrigatórios
    const requiredFields = ['title', 'category', 'summary', 'image'];
    const emptyFields = requiredFields.filter(field => !document.getElementById(field).value.trim());
    
    if (emptyFields.length > 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Valida conteúdo do editor
    const content = quill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
      alert('Por favor, preencha o conteúdo da notícia');
      return;
    }

    try {
      // Mostra loader ou feedback visual
      document.getElementById('save-btn').disabled = true;
      document.getElementById('save-btn').innerHTML = 'Salvando...';

      // Prepara objeto de dados da notícia
      const newsData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: document.getElementById('image').value,
        summary: document.getElementById('summary').value,
        content: content
      };

      // Usa o NewsManager para salvar a notícia
      await newsManager.saveNews(newsData, editingId);
      
      closeModal();
      loadNews();
      
      // Notifica outras páginas sobre a atualização (opcional)
      window.dispatchEvent(new Event('newsUpdated'));
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      alert('Erro ao salvar notícia. Por favor, tente novamente.');
    } finally {
      document.getElementById('save-btn').disabled = false;
      document.getElementById('save-btn').innerHTML = 'Salvar Notícia';
    }
  }

  // Abre modal com dados de uma notícia para edição
  async function editNews(id) {
    try {
      // Busca notícia pelo ID usando o NewsManager
      const newsData = await newsManager.getNewsById(id);
      
      if (newsData) openModal(newsData);
      else alert('Notícia não encontrada');
    } catch (error) {
      console.error('Erro ao recuperar notícia para edição:', error);
      alert('Erro ao carregar os dados da notícia');
    }
  }

  // Exclui notícia após confirmação
  async function deleteNews(id) {
    if (confirm('Tem certeza que deseja excluir esta notícia?')) {
      try {
        // Exclui notícia usando o NewsManager
        await newsManager.deleteNews(id);
        console.log('Notícia excluída com sucesso!');
        loadNews(); // Recarrega a lista
      } catch (error) {
        console.error('Erro ao excluir notícia:', error);
        alert('Erro ao excluir notícia. Por favor, tente novamente.');
      }
    }
  }

  // Elementos para gerenciamento de imagem
  const imageDropZone = document.getElementById('image-drop-zone');
  const imageFile = document.getElementById('image-file');
  const imagePreview = document.querySelector('.image-preview');
  const previewImage = document.getElementById('preview-image');
  const removeImageBtn = document.getElementById('remove-image');
  const imageInput = document.getElementById('image');

  // Configuração de eventos para área de upload de imagem
  imageDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageDropZone.classList.add('dragover');
  });

  imageDropZone.addEventListener('dragleave', () => {
    imageDropZone.classList.remove('dragover');
  });

  // Processa arquivo solto na área de upload
  imageDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    handleImageFile(e.dataTransfer.files[0]);
  });

  // Abre seletor de arquivo ao clicar na área
  imageDropZone.addEventListener('click', () => {
    imageFile.click();
  });

  // Processa arquivo selecionado
  imageFile.addEventListener('change', (e) => {
    handleImageFile(e.target.files[0]);
  });

  // Remove imagem selecionada
  removeImageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita ativação do clique no drop zone
    if (imageInput) {
      imageInput.value = '';
      imagePreview.classList.add('hidden');
      imageDropZone.querySelector('.upload-area').classList.remove('hidden');
      
      if (typeof updateFormProgress === 'function') updateFormProgress();
    }
  });

  /**
   * Converte arquivo de imagem para Base64 e exibe preview
   * @param {File} file - Arquivo de imagem selecionado
   */
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      document.getElementById('image').value = imageData;
      previewImage.src = imageData;
      imagePreview.classList.remove('hidden');
      imageDropZone.querySelector('.upload-area').classList.add('hidden');
      
      if (typeof updateFormProgress === 'function') updateFormProgress();
    };
    reader.readAsDataURL(file);
  }
});