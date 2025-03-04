// Variáveis auxiliares
let currentAnimeId = null;
let alternativeTitles = [];
let genres = [];
let producers = [];
let licensors = [];
let isFormSaving = false;

// Variáveis para armazenar os dados da Staff
let staffMembers = [];

// Armazena os valores iniciais dos campos quando o formulário é aberto
let initialFormState = null;

// Verifica se o usuário é admin ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session?.isAdmin) {
    window.location.href = 'index.html';
    return;
  }
  loadAnimesList();
  setupDropZone('coverImageDropzone', 'coverImageInput', 'coverImage', 'coverImagePreview', handleImageDrop);
  setupDropZone('trailerDropzone', 'trailerInput', 'trailerUrl', 'trailerPreview', handleVideoDrop);
  setupMediaRemoval();
  initializeCategorySelector();
  setupDateInput();
  updateFormProgress();

  // Adiciona alerta ao tentar sair da página
  window.addEventListener('beforeunload', function (e) {
    const form = document.getElementById('animeForm');
    if (form && isFormDirty(form)) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});

// Carrega lista de animes
function loadAnimesList() {
  const animes = JSON.parse(localStorage.getItem('animeData')) || [];
  const tbody = document.getElementById('animesList');

  tbody.innerHTML = animes.map((anime, index) => `
    <tr>
      <td>
        <img src="${anime.coverImage}" alt="${anime.primaryTitle}" class="h-20 w-14 object-cover rounded">
      </td>
      <td>
        <div class="text-sm font-medium">${anime.primaryTitle}</div>
        <div class="text-sm text-gray-500">${anime.alternativeTitles[0]?.title || ''}</div>
      </td>
      <td>
        ${anime.episodes || 'N/A'}
      </td>
      <td>
        <span class="px-2 py-1 rounded-full ${getStatusClass(anime.status)}">
          ${anime.status || 'N/A'}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" title="Editar" onclick="editAnime(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-action btn-delete" title="Remover" onclick="deleteAnime(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Retorna classe CSS baseada no status do anime
function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'em exibição': return 'bg-green-100 text-green-800';
    case 'finalizado': return 'bg-blue-100 text-blue-800';
    case 'anunciado': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Mostra formulário para adicionar/editar anime
function showAnimeForm() {
  const modalContent = document.querySelector('.admin-form-container');
  const modal = document.getElementById('animeModal');
  modal.classList.remove('hidden');

  // Reseta a posição de rolagem do formulário
  if (modalContent) modalContent.scrollTop = 0;

  if (!currentAnimeId) {
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Anime';
    document.getElementById('animeForm').reset();

    // Limpa arrays
    alternativeTitles = [];
    genres = [];
    producers = [];
    licensors = [];
    staffMembers = [];

    // Limpa os previews e valores dos campos de imagem e trailer
    const coverPreview = document.getElementById('coverImagePreview');
    const coverPrompt = coverPreview.previousElementSibling;
    const removeCoverBtn = document.getElementById('removeCoverImage');

    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    removeCoverBtn.classList.add('hidden');
    document.getElementById('coverImage').value = '';

    const trailerPreview = document.getElementById('trailerPreview');
    const trailerPrompt = trailerPreview.previousElementSibling;
    const removeTrailerBtn = document.getElementById('removeTrailer');

    trailerPreview.innerHTML = '';
    trailerPreview.classList.add('hidden');
    trailerPrompt.classList.remove('hidden');
    removeTrailerBtn.classList.add('hidden');
    document.getElementById('trailerUrl').value = '';

    // Atualiza todas as listas
    updateAlternativeTitlesList();
    updateGenresList();
    updateProducersList();
    updateLicensorsList();
    updateStaffList();
  }

  // Captura o estado inicial do formulário após o preenchimento
  setTimeout(() => { 
    initialFormState = getFormState(); 
  }, 100);
}

// Fecha formulário
function closeAnimeForm() {
  const form = document.getElementById('animeForm');

  // Não mostra o alerta se estiver salvando
  if ((!isFormSaving && isFormDirty(form)) && !confirm('Existem alterações não salvas. Deseja realmente sair?')) return;

  // Reseta a posição do scroll do formulário
  const modalContent = document.querySelector('.modal-content-scroll');
  if (modalContent) modalContent.scrollTop = 0;

  document.getElementById('animeModal').classList.add('hidden');
  currentAnimeId = null;
  isFormSaving = false; // Reseta a flag
}

// Adiciona título alternativo à lista
function addAlternativeTitle() {
  const titleInput = document.getElementById('altTitle');
  const typeSelect = document.getElementById('altTitleType');

  if (titleInput.value.trim()) {
    alternativeTitles.push({
      title: titleInput.value.trim(),
      type: typeSelect.value
    });
    titleInput.value = '';
    updateAlternativeTitlesList();
  }
}

// Atualiza lista visual de títulos alternativos
function updateAlternativeTitlesList() {
  const container = document.getElementById('altTitlesList');
  container.innerHTML = alternativeTitles.map((title, index) => `
    <div class="tag">
      <span>${title.title} (${title.type})</span>
      <button type="button" onclick="removeAlternativeTitle(${index})" class="tag-remove">
        ✕
      </button>
    </div>
  `).join('');
}

// Remove título alternativo
function removeAlternativeTitle(index) {
  alternativeTitles.splice(index, 1);
  updateAlternativeTitlesList();
}

// Adiciona gênero à lista
function addGenre() {
  const input = document.getElementById('genreInput');
  const genre = input.value.trim();

  if (!genre) {
    alert('Por favor, selecione uma categoria.');
    return;
  }

  if (!genres.includes(genre)) {
    genres.push(genre);
    input.value = ''; // Limpa o select
    updateGenresList();
  }
}

// Atualiza lista visual de gêneros
function updateGenresList() {
  const container = document.getElementById('genresList');
  container.innerHTML = genres.map((genre, index) => `
    <div class="tag">
      <span>${genre}</span>
      <button type="button" onclick="removeGenre(${index})" class="tag-remove">
        ✕
      </button>
    </div>
  `).join('');
}

// Remove gênero
function removeGenre(index) {
  genres.splice(index, 1);
  updateGenresList();
}

// Inicializa o seletor de categorias
function initializeCategorySelector() {
  const categoryDisplay = new CategoryDisplay();
  const categories = categoryDisplay.getCategories();
  const genreInput = document.getElementById('genreInput');

  // Transforma o input em um select
  const select = document.createElement('select');
  select.id = 'genreInput';
  select.className = 'flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white';

  // Adiciona opção padrão
  select.innerHTML = `
    <option value="">Selecione uma categoria...</option>
    ${categories.map(category => `
      <option value="${category.name}">
        ${category.icon} ${category.name}
      </option>
    `).join('')}
  `;

  // Substitui o input pelo select
  genreInput.parentNode.replaceChild(select, genreInput);
}

// Adiciona produtor ao array
function addProducer() {
  const input = document.getElementById('producerInput');
  const producer = input.value.trim();

  if (producer && !producers.includes(producer)) {
    producers.push(producer);
    input.value = '';
    updateProducersList();
  }
}

// Atualiza lista visual de produtores
function updateProducersList() {
  const container = document.getElementById('producersList');
  container.innerHTML = producers.map((producer, index) => `
    <div class="tag">
      <span>
        ${producer}
        <button type="button" onclick="removeProducer(${index})" class="tag-remove">
          ✕
        </button>
      </span>
    </div>
  `).join('');
}

// Remove produtor do array
function removeProducer(index) {
  producers.splice(index, 1);
  updateProducersList();
}

// Adiciona licenciante ao array
function addLicensor() {
  const input = document.getElementById('licensorInput');
  const licensor = input.value.trim();

  if (licensor && !licensors.includes(licensor)) {
    licensors.push(licensor);
    input.value = '';
    updateLicensorsList();
  }
}

// Atualiza lista visual de licenciador
function updateLicensorsList() {
  const container = document.getElementById('licensorsList');
  container.innerHTML = licensors.map((licensor, index) => `
    <div class="tag">
      <span>${licensor}
        <button type="button" onclick="removeLicensor(${index})" class="tag-remove">
          ✕
        </button>
      </span>
    </div>
  `).join('');
}

// Remove licenciador do array
function removeLicensor(index) {
  licensors.splice(index, 1);
  updateLicensorsList();
}

// Carrega dados do anime para edição
function editAnime(index) {
  try {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const anime = animes[index];
    if (!anime) throw new Error('Anime não encontrado');

    currentAnimeId = index;
    showAnimeForm();

    // Configura temporizador para garantir que o modal esteja visível
    setTimeout(() => {
      // Preenche campos básicos
      document.getElementById('primaryTitle').value = anime.primaryTitle || '';
      document.getElementById('coverImage').value = anime.coverImage || '';
      document.getElementById('synopsis').value = anime.synopsis || '';
      document.getElementById('episodes').value = anime.episodes || '';
      document.getElementById('episodeDuration').value = anime.episodeDuration || '';
      document.getElementById('status').value = anime.status || 'Em Exibição';
      document.getElementById('ageRating').value = anime.ageRating || 'Livre';
      document.getElementById('seasonPeriod').value = anime.season?.period || 'inverno';

      // Formata a data para o formato yyyy-MM-dd
      const releaseDate = anime.releaseDate ? new Date(anime.releaseDate).toISOString().split('T')[0] : '';
      document.getElementById('releaseDate').value = releaseDate;

      document.getElementById('studio').value = anime.studio || '';
      document.getElementById('source').value = anime.source || '';
      document.getElementById('trailerUrl').value = anime.trailerUrl || '';

      // Reseta e preenche arrays
      alternativeTitles = Array.isArray(anime.alternativeTitles) ? [...anime.alternativeTitles] : [];
      genres = Array.isArray(anime.genres) ? [...anime.genres] : [];
      producers = Array.isArray(anime.producers) ? [...anime.producers] : [];
      licensors = Array.isArray(anime.licensors) ? [...anime.licensors] : [];
      staffMembers = anime.staff || [];

      // Atualiza todas as listas visuais
      updateAlternativeTitlesList();
      updateGenresList();
      updateProducersList();
      updateLicensorsList();
      updateStaffList();

      // Atualiza previews de mídia
      updateMediaPreviews(anime);

    }, 100);

  } catch (error) {
    console.error('Erro ao editar anime:', error);
    alert('Erro ao carregar dados do anime para edição.');
  }
}

// Salva anime (novo ou editado)
document.getElementById('animeForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  isFormSaving = true; // Define a flag antes de salvar

  try {
    // Validações básicas
    const primaryTitle = document.getElementById('primaryTitle').value.trim();
    const coverImage = document.getElementById('coverImage').value.trim();
    const synopsis = document.getElementById('synopsis').value.trim();
    const episodes = document.getElementById('episodes').value.trim();
    const episodeDuration = document.getElementById('episodeDuration').value.trim();
    const studio = document.getElementById('studio').value.trim();
    const source = document.getElementById('source').value;
    const releaseDate = document.getElementById('releaseDate').value;

    // Validação de campos obrigatórios
    if (!primaryTitle || !synopsis || !episodes || !episodeDuration || !studio || !source) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação de gêneros
    if (genres.length === 0) {
      alert('Por favor, adicione pelo menos um gênero.');
      return;
    }

    // Validação de imagem de capa
    if (!coverImage) {
      alert('Por favor, adicione uma imagem de capa.');
      return;
    }

    // Validação de data de lançamento
    if (!releaseDate) {
      alert('Por favor, selecione uma data de lançamento.');
      return;
    }

    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const now = new Date().toISOString();

    // Comprime imagem se existir
    let processedCoverImage = coverImage;
    if (coverImage.startsWith('data:image')) processedCoverImage = await compressImage(coverImage, 800, 0.7);

    // Formata os dados
    const formData = {
      primaryTitle,
      coverImage: processedCoverImage,
      synopsis,
      alternativeTitles: [...alternativeTitles],
      episodes: Math.max(0, parseInt(document.getElementById('episodes').value) || 0),
      episodeDuration: Math.max(0, parseInt(document.getElementById('episodeDuration').value) || 0),
      status: document.getElementById('status').value,
      ageRating: document.getElementById('ageRating').value,
      season: {
        period: document.getElementById('seasonPeriod').value,
        year: new Date(releaseDate).getFullYear()
      },
      releaseDate: releaseDate,
      genres: [...genres],
      studio: document.getElementById('studio').value.trim(),
      source: document.getElementById('source').value,
      producers: [...producers],
      licensors: [...licensors],
      staff: [...staffMembers],
      trailerUrl: document.getElementById('trailerUrl').value.trim(),
      updatedAt: now
    };

    let updatedAnimes = [];
    if (currentAnimeId !== null) {
      const existingAnime = animes[currentAnimeId];
      if (!existingAnime) throw new Error('Anime não encontrado');

      updatedAnimes = [...animes];
      updatedAnimes[currentAnimeId] = {
        ...existingAnime,
        ...formData,
        score: existingAnime.score || 0,
        popularity: existingAnime.popularity || 0,
        comments: existingAnime.comments || [],
        createdAt: existingAnime.createdAt
      };
    } else {
      updatedAnimes = [...animes, {
        ...formData,
        createdAt: now,
        comments: [],
        score: 0,
        popularity: 0
      }];
    }

    // Verifica espaço disponível
    if (!checkStorageQuota(updatedAnimes)) throw new Error('Limite de armazenamento excedido. Tente remover alguns animes antigos.');

    localStorage.setItem('animeData', JSON.stringify(updatedAnimes));
    closeAnimeForm();
    loadAnimesList();
    alert('Anime salvo com sucesso!');

  } catch (error) {
    console.error('Erro ao salvar anime:', error);
    alert(`Erro ao salvar o anime: ${error.message}`);
    isFormSaving = false; // Reseta a flag em caso de erro
  }
});

// Exclui anime e seus comentários
function deleteAnime(index) {
  if (confirm('Tem certeza que deseja excluir este anime? Todos os comentários associados também serão excluídos.')) {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const animeToDelete = animes[index];

    // Remove o anime do array de animes
    animes.splice(index, 1);
    localStorage.setItem('animeData', JSON.stringify(animes));

    // Remove os comentários associados ao anime
    const comments = JSON.parse(localStorage.getItem('animeComments')) || {};
    if (comments[animeToDelete.primaryTitle]) {
      delete comments[animeToDelete.primaryTitle];
      localStorage.setItem('animeComments', JSON.stringify(comments));
    }

    // Atualiza a lista de animes na interface
    loadAnimesList();
  }
}

// Exporta dados dos animes
function exportAnimes() {
  const animes = localStorage.getItem('animeData');
  const blob = new Blob([animes], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'animes_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Importa dados dos animes
function importAnimes(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const animes = JSON.parse(e.target.result);
        if (Array.isArray(animes)) {
          localStorage.setItem('animeData', JSON.stringify(animes));
          loadAnimesList();
          alert('Dados importados com sucesso!');
        } else throw new Error('Formato inválido');
      } catch (error) {
        alert('Erro ao importar dados. Verifique se o arquivo está no formato correto.');
      }
    };
    reader.readAsText(file);
  }
}

/**
 * Configura uma área de arrastar e soltar (drop zone) para manipular arquivos e URLs.
 * 
 * @param {string} dropzoneId - ID do elemento HTML que servirá como zona de arrastar e soltar
 * @param {string} inputId - ID do input de arquivo associado
 * @param {string} urlInputId - ID do input que armazenará a URL
 * @param {string} previewId - ID do elemento que mostrará a prévia
 * @param {Function} dropHandler - Função que manipula o arquivo/URL quando solto na zona
 */
function setupDropZone(dropzoneId, inputId, urlInputId, previewId, dropHandler) {
  const dropZone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(inputId);
  const urlInput = document.getElementById(urlInputId);

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  // Previne comportamento padrão de arrastar e soltar
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => { 
      dropZone.classList.add('drag-over'); 
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => { 
      dropZone.classList.remove('drag-over'); 
    });
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });

  // Adiciona suporte para drag and drop de texto (URLs)
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const dt = e.dataTransfer;
    const file = dt.files[0];

    // Verifica se é um arquivo ou texto (URL)
    if (file) dropHandler(file, urlInput, document.getElementById(previewId));
    else {
      // Tenta pegar o texto arrastado (URL)
      const text = dt.getData('text');
      if (text) {
        // Se for o dropzone do MAL
        if (dropzoneId === 'malUrlDropzone') {
          document.getElementById('malUrl').value = text;
          return;
        }
        dropHandler(text, urlInput, document.getElementById(previewId));
      }
    }
  });

  // Adiciona suporte para colar URLs
  dropZone.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text) {
      // Se for o dropzone do MAL
      if (dropzoneId === 'malUrlDropzone') {
        document.getElementById('malUrl').value = text;
        return;
      }
      dropHandler(text, urlInput, document.getElementById(previewId));
    }
  });

  dropZone.addEventListener('click', () => { 
    fileInput.click(); 
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) dropHandler(file, urlInput, document.getElementById(previewId));
  });
}

/**
 * Processa e comprime uma imagem quando ela é arrastada/soltada, exibindo preview
 * 
 * @param {File} file - O arquivo de imagem a ser processado
 * @param {HTMLInputElement} urlInput - Input onde será armazenada a URL da imagem em base64
 * @param {HTMLImageElement} previewElement - Elemento de imagem onde será exibido o preview
 * @returns {Promise<void>}
 * @throws {Error} Lança erro se houver falha no processamento da imagem
 */
async function handleImageDrop(file, urlInput, previewElement) {
  if (!file.type?.startsWith('image/')) {
    alert('Por favor, selecione apenas arquivos de imagem.');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onloadend = async () => {
      // Comprime imagem antes de salvar
      const compressedImage = await compressImage(reader.result);

      previewElement.src = compressedImage;
      previewElement.classList.remove('hidden');
      previewElement.previousElementSibling.classList.add('hidden');
      document.getElementById('removeCoverImage').classList.remove('hidden');
      urlInput.value = compressedImage;
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    alert('Erro ao processar a imagem. Tente novamente.');
  }
}

/**
 * Manipula o upload de vídeo, seja por arquivo ou URL do YouTube
 * 
 * @param {(File|string)} file - O arquivo de vídeo ou URL do YouTube a ser processado
 * @param {HTMLInputElement} urlInput - O elemento de input que contém ou receberá a URL
 * @param {HTMLElement} previewElement - O elemento onde o preview do vídeo será exibido
 * @returns {void}
 */
function handleVideoDrop(file, urlInput, previewElement) {
  // Se for um arquivo de vídeo
  if (file instanceof File && file.type.startsWith('video/')) {
    handleVideoFile(file, urlInput, previewElement);
    return;
  }

  // Se for uma URL
  let url = typeof file === 'string' ? file : '';
  if (url) handleYoutubeUrl(url, urlInput, previewElement);
}

/**
 * Processa um arquivo de vídeo, exibindo uma prévia e armazenando seu conteúdo
 * 
 * @param {File} file - O arquivo de vídeo a ser processado
 * @param {HTMLInputElement} urlInput - O elemento de input onde será armazenada a URL do vídeo
 * @param {HTMLElement} previewElement - O elemento onde será exibida a prévia do vídeo
 * @throws {Error} Lança um erro se houver falha no processamento do vídeo
 * @returns {void}
 */
function handleVideoFile(file, urlInput, previewElement) {
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      previewElement.innerHTML = `
        <video controls class="max-h-48 mx-auto">
          <source src="${reader.result}" type="${file.type}">
          Seu navegador não suporta a tag de vídeo.
        </video>
      `;
      previewElement.classList.remove('hidden');
      previewElement.previousElementSibling.classList.add('hidden');
      document.getElementById('removeTrailer').classList.remove('hidden');
      urlInput.value = reader.result;
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Erro ao processar vídeo:', error);
    alert('Erro ao processar o vídeo. Tente novamente.');
  }
}

/**
 * Processa e valida uma URL do YouTube, gerando uma visualização incorporada do vídeo
 * @param {string} url - A URL do vídeo do YouTube a ser processada
 * @param {HTMLInputElement} urlInput - Elemento de input que contém a URL
 * @param {HTMLElement} previewElement - Elemento onde será exibida a prévia do vídeo
 * @throws {alert} - Exibe um alerta se a URL for inválida
 * @returns {void}
 */
function handleYoutubeUrl(url, urlInput, previewElement) {
  const videoId = extractYouTubeId(url); // Atualizado para usar o mesmo nome
  if (videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    previewElement.innerHTML = `
      <iframe
        width="280"
        height="157"
        src="${embedUrl}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
    previewElement.classList.remove('hidden');
    previewElement.previousElementSibling.classList.add('hidden');
    document.getElementById('removeTrailer').classList.remove('hidden');
    urlInput.value = embedUrl;
  } else alert('URL do YouTube inválida. Por favor, verifique a URL e tente novamente.');
}

// Extrai o ID de um vídeo do YouTube a partir de uma URL
function extractYouTubeId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/ // ID direto do YouTube
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

document.getElementById('trailerUrl').addEventListener('input', function (e) {
  const url = e.target.value.trim();
  if (url) handleYoutubeUrl(url, e.target, document.getElementById('trailerPreview'));
});

// Setup para remover imagem de capa
function setupMediaRemoval() {
  const removeCoverBtn = document.getElementById('removeCoverImage');
  removeCoverBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const coverPreview = document.getElementById('coverImagePreview');
    const coverPrompt = document.getElementById('coverImageDropzone').querySelector('.drop-zone-prompt');
    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    removeCoverBtn.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    document.getElementById('coverImage').value = '';
    document.getElementById('coverImageInput').value = '';
  });

  // Setup para remover trailer - Atualizado
  const removeTrailerBtn = document.getElementById('removeTrailer');
  removeTrailerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const trailerPreview = document.getElementById('trailerPreview');
    const trailerDropzone = document.getElementById('trailerDropzone');
    const trailerContent = trailerDropzone.querySelector('.drop-zone-content');

    // Limpa o preview e esconde
    trailerPreview.innerHTML = '';
    trailerPreview.classList.add('hidden');

    // Mostra o conteúdo original
    trailerContent.classList.remove('hidden');

    // Esconde o botão de remover
    removeTrailerBtn.classList.add('hidden');

    // Limpa os campos de input
    document.getElementById('trailerUrl').value = '';
    document.getElementById('trailerInput').value = '';
    document.getElementById('trailerUrlInput').value = '';
  });
}

// Atualiza os previews da capa e trailer do anime no formulário
function updateMediaPreviews(anime) {
  // Preview da imagem de capa
  const coverPreview = document.getElementById('coverImagePreview');
  const coverPrompt = coverPreview.previousElementSibling;
  const removeCoverBtn = document.getElementById('removeCoverImage');

  if (anime.coverImage && anime.coverImage.trim()) {
    coverPreview.src = anime.coverImage;
    coverPreview.classList.remove('hidden');
    coverPrompt.classList.add('hidden');
    removeCoverBtn.classList.remove('hidden');
  } else {
    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    removeCoverBtn.classList.add('hidden');
  }

  // Preview do trailer
  const trailerPreview = document.getElementById('trailerPreview');
  const trailerPrompt = trailerPreview.previousElementSibling;
  const removeTrailerBtn = document.getElementById('removeTrailer');

  if (anime.trailerUrl && anime.trailerUrl.trim()) {
    let trailerContent = '';
    if (anime.trailerUrl.includes('data:video')) trailerContent = `<video controls class="max-h-48 mx-auto"><source src="${anime.trailerUrl}"></video>`;
    else {
      const videoId = extractYouTubeId(anime.trailerUrl);
      if (videoId) {
        trailerContent = `<iframe width="280" height="157" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      }
    }

    if (trailerContent) {
      trailerPreview.innerHTML = trailerContent;
      trailerPreview.classList.remove('hidden');
      trailerPrompt.classList.add('hidden');
      removeTrailerBtn.classList.remove('hidden');
    } else {
      trailerPreview.innerHTML = '';
      trailerPreview.classList.add('hidden');
      trailerPrompt.classList.remove('hidden');
      removeTrailerBtn.classList.add('hidden');
    }
  } else {
    trailerPreview.innerHTML = '';
    trailerPreview.classList.add('hidden');
    trailerPrompt.classList.remove('hidden');
    removeTrailerBtn.classList.add('hidden');
  }
}

// Comprime imagem antes de salvar
async function compressImage(imageDataUrl, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.floor(height * (maxWidth / width));
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = imageDataUrl;
  });
}

// Verifica e gerencia espaço no localStorage
function checkStorageQuota(data) {
  const totalSpace = 5 * 1024 * 1024; // 5MB (aproximado para localStorage)
  const currentData = JSON.stringify(data);
  const requiredSpace = currentData.length * 2; // Em bytes

  if (requiredSpace > totalSpace) throw new Error('Tamanho dos dados excede o limite permitido');

  try {
    // Teste de escrita
    localStorage.setItem('quotaTest', currentData);
    localStorage.removeItem('quotaTest');
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') return false;
    throw e;
  }
}


// Configura o campo de entrada de data com a data atual como máxima e padrão
function setupDateInput() {
  const dateInput = document.getElementById('releaseDate');
  const today = new Date().toISOString().split('T')[0];
  dateInput.max = today; // Impede seleção de datas futuras

  // Define a data padrão para hoje se não houver data selecionada
  if (!dateInput.value) dateInput.value = today;
}

// Limpa todos os campos do formulário
function clearAnimeForm() {
  if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
    document.getElementById('animeForm').reset();

    // Limpa arrays
    alternativeTitles = [];
    genres = [];
    producers = [];
    licensors = [];

    // Limpa previews e valores dos campos de imagem e trailer
    const coverPreview = document.getElementById('coverImagePreview');
    const coverPrompt = coverPreview.previousElementSibling;
    const removeCoverBtn = document.getElementById('removeCoverImage');

    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    removeCoverBtn.classList.add('hidden');
    document.getElementById('coverImage').value = '';

    const trailerPreview = document.getElementById('trailerPreview');
    const trailerPrompt = trailerPreview.previousElementSibling;
    const removeTrailerBtn = document.getElementById('removeTrailer');

    trailerPreview.innerHTML = '';
    trailerPreview.classList.add('hidden');
    trailerPrompt.classList.remove('hidden');
    removeTrailerBtn.classList.add('hidden');
    document.getElementById('trailerUrl').value = '';

    // Atualiza todas as listas
    updateAlternativeTitlesList();
    updateGenresList();
    updateProducersList();
    updateLicensorsList();
  }
}

// Atualiza a barra de progresso do formulário
function updateFormProgress() {
  const form = document.getElementById('animeForm');
  const requiredFields = form.querySelectorAll('[required]');
  const coverImage = document.getElementById('coverImage');
  const totalFields = requiredFields.length + 2;
  let filledFields = 0;

  // Verifica campos obrigatórios
  requiredFields.forEach(field => { 
    if (field.value.trim() !== '') filledFields++; 
  });

  // Verifica se há pelo menos um gênero
  if (genres.length > 0) filledFields++;

  // Verifica se há imagem de capa
  if (coverImage.value.trim() !== '') filledFields++;

  const progress = (filledFields / totalFields) * 100;
  const progressBar = document.getElementById('formProgress');

  // Atualiza a largura da barra
  progressBar.style.width = `${progress}%`;

  // Atualiza a cor baseado no progresso
  if (progress < 33) progressBar.style.background = 'var(--error-color, #EF4444)';
  else if (progress < 66) progressBar.style.background = 'var(--warning-color, #F59E0B)';
  else progressBar.style.background = 'var(--success-color, #10B981)';
}

// Adiciona listeners para todos os eventos que podem modificar o formulário
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('animeForm');

  // Monitora mudanças em inputs, textareas e selects
  form.querySelectorAll('input, textarea, select').forEach(element => {
    element.addEventListener('input', updateFormProgress);
    element.addEventListener('change', updateFormProgress);
  });

  // Monitora mudanças nos arrays de dados
  const originalPush = Array.prototype.push;
  const arrays = [alternativeTitles, genres, producers, licensors];

  arrays.forEach(array => {
    array.push = function (...args) {
      originalPush.apply(this, args);
      updateFormProgress();
    };
  });

  // Adiciona listeners para os botões de remoção
  const removeButtons = ['removeCoverImage', 'removeTrailer'];
  removeButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', updateFormProgress);
  });

  // Atualização inicial
  updateFormProgress();
});

// Traduz status do inglês para português
function translateStatus(status) {
  const statusMap = {
    'Currently Airing': 'Em Exibição',
    'Finished Airing': 'Finalizado',
    'Not yet aired': 'Anunciado'
  };
  return statusMap[status] || status;
}

// Traduz gêneros do inglês para português
function translateGenre(genre) {
  const genreMap = {
    'Action': 'Ação',
    'Adventure': 'Aventura',
    'Comedy': 'Comédia',
    'Drama': 'Drama',
    'Fantasy': 'Fantasia',
    'Science Fiction': 'Ficção Científica',
    'Romance': 'Romance',
    'Slice of Life': 'Slice of Life',
    'Sports': 'Esportes',
    'Supernatural': 'Sobrenatural'
  };
  return genreMap[genre] || genre;
}

// Adiciona validação em tempo real
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('animeForm');
  const inputs = form.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    input.addEventListener('input', updateFormProgress);

    // Adiciona validação visual
    input.addEventListener('blur', () => {
      if (input.hasAttribute('required')) {
        if (!input.value.trim()) input.classList.add('border-red-500');
        else {
          input.classList.remove('border-red-500');
          input.classList.add('border-green-500');
        }
      }
    });
  });

  // Habilita arrastar e soltar para imagens e vídeos
  enableDragAndDrop('coverImageDropzone', 'coverImage', 'image/*');
  enableDragAndDrop('trailerDropzone', 'trailerUrl', 'video/*');
});

// Configuração de drag and drop para arquivos
function enableDragAndDrop(dropzoneId, inputId, acceptedTypes) {
  const dropzone = document.getElementById(dropzoneId);

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => { 
    dropzone.classList.remove('dragover'); 
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type.match(acceptedTypes)) handleFileUpload(file, inputId);
  });
}

// Processa o upload de arquivos e atualiza a visualização
function handleFileUpload(file, inputId) {
  console.log(`Upload do arquivo ${file.name} para o campo ${inputId}`);
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById(inputId).value = e.target.result;
    updatePreview(inputId);
  };
  reader.readAsDataURL(file);
}

// Atualiza a prévia da imagem de capa do anime
function updateCoverImagePreview() {
  const coverImage = document.getElementById('coverImage').value;
  const coverPreview = document.getElementById('coverImagePreview');
  const coverPrompt = coverPreview.previousElementSibling;
  const removeCoverBtn = document.getElementById('removeCoverImage');

  if (coverImage) {
    coverPreview.src = coverImage;
    coverPreview.classList.remove('hidden');
    coverPrompt.classList.add('hidden');
    removeCoverBtn.classList.remove('hidden');
  } else {
    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    removeCoverBtn.classList.add('hidden');
  }
}


// Preenche automaticamente os dados do anime a partir da URL do MyAnimeList
async function autoFillFromMal() {
  const malUrl = document.getElementById('malUrl').value;
  const animeId = malUrl.match(/anime\/(\d+)/)?.[1];

  if (!animeId) {
    alert('URL do MyAnimeList inválida');
    return;
  }

  try {
    // Busca dados básicos do anime
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
    const data = await response.json();
    const anime = data.data;

    // Busca dados da staff
    const staffResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/staff`);
    const staffData = await staffResponse.json();
    
    // Preenche os campos automaticamente
    document.getElementById('primaryTitle').value = anime.title;
    document.getElementById('coverImage').value = anime.images.jpg.large_image_url;
    document.getElementById('synopsis').value = anime.synopsis;
    document.getElementById('episodes').value = anime.episodes;
    document.getElementById('episodeDuration').value = anime.duration?.match(/\d+/)?.[0] || '';
    document.getElementById('status').value = translateStatus(anime.status);
    document.getElementById('studio').value = anime.studios[0]?.name || '';

    // Determina a fonte original
    let source = translateSource(anime.source);
    document.getElementById('source').value = source;

    // Preenche produtores
    producers = [];
    anime.producers.forEach(producer => { 
      if (producer.name) producers.push(producer.name); 
    });
    updateProducersList();

    // Preenche licenciadores
    licensors = [];
    anime.licensors.forEach(licensor => { 
      if (licensor.name) licensors.push(licensor.name); 
    });
    updateLicensorsList();

    // Preenche o trailer se disponível
    if (anime.trailer?.youtube_id) {
      const trailerUrl = `https://www.youtube.com/embed/${anime.trailer.youtube_id}`;
      document.getElementById('trailerUrl').value = trailerUrl;
      handleYoutubeUrl(trailerUrl, document.getElementById('trailerUrl'), document.getElementById('trailerPreview'));
    }

    // Adiciona títulos alternativos
    alternativeTitles = [];
    if (anime.title_japanese) alternativeTitles.push({ title: anime.title_japanese, type: 'japonês' });
    if (anime.title_english && anime.title_english !== anime.title) alternativeTitles.push({ title: anime.title_english, type: 'inglês' });
    updateAlternativeTitlesList();

    // Limpa gêneros existentes antes de adicionar novos
    genres = [];
    updateGenresList();

    // Adiciona gêneros
    anime.genres.forEach(genre => {
      const translatedGenre = translateGenre(genre.name);
      if (!genres.includes(translatedGenre)) genres.push(translatedGenre);
    });
    updateGenresList();

    // Preenche a data de lançamento
    if (anime.aired?.from) {
      const releaseDate = new Date(anime.aired.from).toISOString().split('T')[0];
      document.getElementById('releaseDate').value = releaseDate;
    }

    // Limpa e preenche dados da staff
    staffMembers = [];
    
    // Processa dados da staff
    staffData.data.forEach(member => {
      // Mapeia as posições para os roles disponíveis
      const roleMapping = {
        'Director': 'director',
        'Series Composition': 'writer',
        'Music': 'composer',
        'Animation Director': 'animator',
        'Character Design': 'designer',
        'Producer': 'producer'
      };

      // Para cada posição do membro
      member.positions.forEach(position => {
        const mappedRole = roleMapping[position];
        if (mappedRole) {
          // Verifica se já existe para evitar duplicatas
          const exists = staffMembers.some(existing => 
            existing.name === member.person.name && 
            existing.role === mappedRole
          );

          if (!exists) {
            staffMembers.push({
              name: member.person.name,
              role: mappedRole,
              roleLabel: document.getElementById('staffRole')
                .querySelector(`option[value="${mappedRole}"]`).text
            });
          }
        }
      });
    });

    // Atualiza a lista visual da staff
    updateStaffList();

    // Atualiza previews
    updateCoverImagePreview();
    updateFormProgress();

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    alert('Erro ao buscar dados do anime. Tente novamente mais tarde.');
  }
}

// Converte o tipo de fonte do anime para um formato padronizado
function translateSource(source) {
  const sourceMap = {
    'Manga': 'Manga',
    'Light Novel': 'Light Novel',
    'Original': 'Original',
    'Visual Novel': 'Visual Novel',
    'Game': 'Game',
    'Other': 'Outro',
    'Novel': 'Light Novel',
    'Web manga': 'Manga',
    '4-koma manga': 'Manga',
    'Book': 'Outro',
    'Picture book': 'Outro',
    'Card game': 'Game',
    'Mixed media': 'Outro'
  };
  return sourceMap[source] || 'Outro';
}

// Converte o rating internacional para o formato brasileiro de classificação indicativa
function translateRating(rating) {
  const ratingMap = {
    'G - All Ages': 'Livre',
    'PG - Children': '10+',
    'PG-13 - Teens 13 or older': '12+',
    'R - 17+ (violence & profanity)': '16+',
    'R+ - Mild Nudity': '16+',
    'Rx - Hentai': '18+'
  };
  return ratingMap[rating] || 'Livre';
}

// Traduz a estação do ano do inglês para português
function translateSeason(season) {
  const seasonMap = {
    'winter': 'inverno',
    'spring': 'primavera',
    'summer': 'verão',
    'fall': 'outono'
  };
  return seasonMap[season?.toLowerCase()] || 'inverno';
}

// Adiciona um evento de entrada direta para o campo malUrl
document.addEventListener('DOMContentLoaded', function () {
  const malUrlInput = document.getElementById('malUrl');
  if (malUrlInput) {
    malUrlInput.addEventListener('input', function (e) {
      const url = e.target.value.trim();
      if (url && !url.startsWith('https://myanimelist.net/anime/')) {
        // Tenta extrair e formatar a URL do MAL
        const malId = url.match(/(?:anime\/)?(\d+)/)?.[1];
        if (malId) e.target.value = `https://myanimelist.net/anime/${malId}`;
      }
    });
  }
});

// Traduz a sinopse usando a API do Google Translate
async function translateSynopsis() {
  const synopsisElement = document.getElementById('synopsis');
  const text = synopsisElement.value.trim();

  if (!text) {
    alert('Por favor, insira um texto para traduzir.');
    return;
  }

  try {
    // Mostra feedback visual de que está traduzindo
    synopsisElement.disabled = true;
    const originalText = synopsisElement.value;
    synopsisElement.value = 'Traduzindo...';

    // Divide o texto em partes menores
    const chunks = splitTextIntoChunks(text, 450); // Limite de 450 caracteres por chunk
    let translatedText = '';

    // Traduz cada parte e combina os resultados
    for (const chunk of chunks) {
      const translatedChunk = await translateText(chunk, 'pt');
      translatedText += translatedChunk + ' ';
      // Atualiza o progresso na interface
      synopsisElement.value = 'Traduzindo... ' +
        Math.round((chunks.indexOf(chunk) + 1) / chunks.length * 100) + '%';
    }

    // Remove espaços extras e atualiza o campo
    synopsisElement.value = translatedText.trim();

    // Adiciona botão para desfazer a tradução
    const undoButton = document.createElement('button');
    undoButton.className = 'absolute top-2 right-9 p-1 bg-gray-600 text-white rounded hover:bg-gray-700';
    undoButton.title = 'Desfazer tradução';
    undoButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
      </svg>
    `;
    undoButton.onclick = () => {
      synopsisElement.value = originalText;
      undoButton.remove();
    };

    // Adiciona o botão após o botão de traduzir
    const container = synopsisElement.parentElement;
    const translateButton = container.querySelector('button');
    container.insertBefore(undoButton, translateButton);

  } catch (error) {
    console.error('Erro ao traduzir:', error);
    alert('Erro ao traduzir o texto. Por favor, tente novamente mais tarde.');
    synopsisElement.value = text; // Restaura o texto original em caso de erro
  } finally {
    synopsisElement.disabled = false;
  }
}

/**
 * Divide um texto em partes menores, mantendo sentenças completas.
 * @param {string} text - O texto a ser dividido
 * @param {number} maxLength - Tamanho máximo de cada parte
 * @returns {string[]} Array com as partes do texto dividido
 */
function splitTextIntoChunks(text, maxLength) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) currentChunk += sentence;
    else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}


/**
 * Traduz um texto do inglês para o idioma de destino usando a API MyMemory.
 * @param {string} text - O texto em inglês para ser traduzido
 * @param {string} targetLang - O código do idioma de destino (ex: 'pt', 'es', 'fr')
 * @returns {Promise<string>} O texto traduzido
 * @throws {Error} Se houver erro na tradução
 */
async function translateText(text, targetLang) {
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData.translatedText) {
      // Adiciona um pequeno atraso para evitar sobrecarga da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data.responseData.translatedText;
    } else throw new Error(data.responseDetails || 'Erro na tradução');
  } catch (error) {
    console.error('Erro na tradução:', error);
    throw error;
  }
}

// Detecta o idioma do texto
function detectLanguage(text) {
  // Lista de palavras comuns em japonês (caracteres específicos)
  const japanesePattern = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

  // Lista de palavras comuns em português
  const portugueseWords = /\b(e|ou|mas|porque|que|quando|onde|como|se|para|com|em|no|na|os|as|um|uma)\b/i;

  if (japanesePattern.test(text)) return 'ja';
  if (portugueseWords.test(text)) return 'pt';
  return 'en'; // Assume inglês como padrão
}

// Atualiza a visualização de acordo com o tipo de mídia
function updatePreview(inputId) {
  const input = document.getElementById(inputId);
  const preview = input.id === 'coverImage' ?
    document.getElementById('coverImagePreview') :
    document.getElementById('trailerPreview');
  const prompt = preview.previousElementSibling;
  const removeBtn = input.id === 'coverImage' ?
    document.getElementById('removeCoverImage') :
    document.getElementById('removeTrailer');

  if (!input.value) {
    preview.src = '';
    preview.innerHTML = '';
    preview.classList.add('hidden');
    prompt.classList.remove('hidden');
    removeBtn.classList.add('hidden');
    return;
  }

  if (input.id === 'coverImage') {
    preview.src = input.value;
    preview.classList.remove('hidden');
    prompt.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  } else if (input.id === 'trailerUrl') {
    const videoId = extractYouTubeId(input.value);
    if (videoId) {
      preview.innerHTML = `
        <iframe
          width="280"
          height="157"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
      preview.classList.remove('hidden');
      prompt.classList.add('hidden');
      removeBtn.classList.remove('hidden');
    }
  }
}

// Verifica se o formulário foi modificado
function isFormDirty(_form) {
  // Verifica se o modal está visível
  if (document.getElementById('animeModal').classList.contains('hidden')) return false;

  // Se não houver estado inicial, não considera como modificado
  if (!initialFormState) return false;

  // Compara o estado atual com o estado inicial
  const currentState = getFormState();
  return currentState !== initialFormState;
}

// Captura o estado atual do formulário
function getFormState() {
  const form = document.getElementById('animeForm');
  const state = {
    inputs: {},
    arrays: {
      alternativeTitles: [...alternativeTitles],
      genres: [...genres],
      producers: [...producers],
      licensors: [...licensors],
      staff: [...staffMembers]
    },
    media: {
      coverImage: document.getElementById('coverImage').value,
      trailerUrl: document.getElementById('trailerUrl').value
    }
  };

  // Captura valores dos campos
  form.querySelectorAll('input, textarea, select').forEach(input => {
    if (input.type !== 'file' && !input.classList.contains('hidden')) state.inputs[input.id] = input.value.trim();
  });

  return JSON.stringify(state);
}

// Adiciona membro da Staff
function addStaffMember() {
  const input = document.getElementById('staffInput');
  const roleSelect = document.getElementById('staffRole');
  
  const name = input.value.trim();
  const role = roleSelect.value;
  const roleLabel = roleSelect.options[roleSelect.selectedIndex].text;

  if (!name) return;

  // Verifica se já existe esta pessoa com esta função
  const exists = staffMembers.some(member => 
    member.name.toLowerCase() === name.toLowerCase() && 
    member.role === role
  );

  if (exists) {
    alert('Este membro já foi adicionado com esta função.');
    return;
  }

  staffMembers.push({
    name: name,
    role: role,
    roleLabel: roleLabel
  });

  input.value = '';
  updateStaffList();
}

// Remove membro da Staff
function removeStaffMember(index) {
  staffMembers.splice(index, 1);
  updateStaffList();
}

// Atualiza lista visual da Staff
function updateStaffList() {
  const container = document.getElementById('staffList');
  
  // Agrupa membros por função
  const groupedStaff = staffMembers.reduce((groups, member) => {
    if (!groups[member.role]) groups[member.role] = [];
    groups[member.role].push(member);
    return groups;
  }, {});

  // Gera o HTML com os membros agrupados
  const html = Object.entries(groupedStaff).map(([role, members]) => {
    const roleLabel = members[0].roleLabel;
    return `
      <div class="w-full">
        <h4 class="text-sm font-medium text-gray-700 mb-2">${roleLabel}</h4>
        <div class="flex flex-wrap gap-2">
          ${members.map((member, index) => `
            <div class="tag bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-2">
              <span>${member.name}</span>
              <button type="button" 
                onclick="removeStaffMember(${staffMembers.findIndex(m => m === member)})" 
                class="text-purple-600 hover:text-purple-800"
              >✕</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('<div class="border-t my-2"></div>');

  container.innerHTML = html || '<p class="text-sm text-gray-500">Nenhum membro da staff adicionado</p>';
}

// Modifique a função showAnimeForm para incluir a limpeza da staff
function showAnimeForm() {
  const modalContent = document.querySelector('.admin-form-container');
  const modal = document.getElementById('animeModal');
  modal.classList.remove('hidden');

  // Reseta a posição de rolagem do formulário
  if (modalContent) modalContent.scrollTop = 0;

  if (!currentAnimeId) {
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Anime';
    document.getElementById('animeForm').reset();

    // Limpa arrays
    alternativeTitles = [];
    genres = [];
    producers = [];
    licensors = [];
    staffMembers = [];

    // Limpa os previews e valores dos campos de imagem e trailer
    const coverPreview = document.getElementById('coverImagePreview');
    const coverPrompt = coverPreview.previousElementSibling;
    const removeCoverBtn = document.getElementById('removeCoverImage');

    coverPreview.src = '';
    coverPreview.classList.add('hidden');
    coverPrompt.classList.remove('hidden');
    removeCoverBtn.classList.add('hidden');
    document.getElementById('coverImage').value = '';

    const trailerPreview = document.getElementById('trailerPreview');
    const trailerPrompt = trailerPreview.previousElementSibling;
    const removeTrailerBtn = document.getElementById('removeTrailer');

    trailerPreview.innerHTML = '';
    trailerPreview.classList.add('hidden');
    trailerPrompt.classList.remove('hidden');
    removeTrailerBtn.classList.add('hidden');
    document.getElementById('trailerUrl').value = '';

    // Atualiza todas as listas
    updateAlternativeTitlesList();
    updateGenresList();
    updateProducersList();
    updateLicensorsList();
    updateStaffList();
  }

  // Captura o estado inicial do formulário após o preenchimento
  setTimeout(() => { 
    initialFormState = getFormState(); 
  }, 100);
}

// Modifique a função editAnime para carregar os dados da staff
function editAnime(index) {
  try {
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const anime = animes[index];
    if (!anime) throw new Error('Anime não encontrado');

    currentAnimeId = index;
    showAnimeForm();

    // Configura temporizador para garantir que o modal esteja visível
    setTimeout(() => {
      // Preenche campos básicos
      document.getElementById('primaryTitle').value = anime.primaryTitle || '';
      document.getElementById('coverImage').value = anime.coverImage || '';
      document.getElementById('synopsis').value = anime.synopsis || '';
      document.getElementById('episodes').value = anime.episodes || '';
      document.getElementById('episodeDuration').value = anime.episodeDuration || '';
      document.getElementById('status').value = anime.status || 'Em Exibição';
      document.getElementById('ageRating').value = anime.ageRating || 'Livre';
      document.getElementById('seasonPeriod').value = anime.season?.period || 'inverno';

      // Formata a data para o formato yyyy-MM-dd
      const releaseDate = anime.releaseDate ? new Date(anime.releaseDate).toISOString().split('T')[0] : '';
      document.getElementById('releaseDate').value = releaseDate;

      document.getElementById('studio').value = anime.studio || '';
      document.getElementById('source').value = anime.source || '';
      document.getElementById('trailerUrl').value = anime.trailerUrl || '';

      // Reseta e preenche arrays
      alternativeTitles = Array.isArray(anime.alternativeTitles) ? [...anime.alternativeTitles] : [];
      genres = Array.isArray(anime.genres) ? [...anime.genres] : [];
      producers = Array.isArray(anime.producers) ? [...anime.producers] : [];
      licensors = Array.isArray(anime.licensors) ? [...anime.licensors] : [];
      staffMembers = anime.staff || [];

      // Atualiza todas as listas visuais
      updateAlternativeTitlesList();
      updateGenresList();
      updateProducersList();
      updateLicensorsList();
      updateStaffList();

      // Atualiza previews de mídia
      updateMediaPreviews(anime);

    }, 100);

  } catch (error) {
    console.error('Erro ao editar anime:', error);
    alert('Erro ao carregar dados do anime para edição.');
  }
}