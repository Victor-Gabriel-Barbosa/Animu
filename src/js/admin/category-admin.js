// Classe para gerenciamento de categorias
class CategoryAdmin {
  constructor() {
    // Adiciona variáveis para controlar o estado do formulário
    this.initialFormState = null;
    this.isFormSaving = false;
    this.firebaseLoaded = false; // Controla se já carregamos do Firebase
    
    // Inicializa o gerenciador de Firestore
    this.categoryFirestore = new CategoryManager();

    this.setupFormVisibility();
    this.loadCategoriesFromFirebase(); // Carrega categorias do Firebase primeiro
    this.updateStatistics();

    // Adiciona o event listener para atualização de categorias
    window.addEventListener('categoriesUpdated', () => { 
      this.loadCategories(); 
      this.updateStatistics();
    });

    // Adiciona event listener para fechar o modal com Esc
    document.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape') this.closeModal(); 
    });

    // Fecha o modal ao clicar fora dele
    document.getElementById('category-modal').addEventListener('click', (e) => {
      if (e.target.id === 'category-modal') this.closeModal();
    }, { passive: true }); // Adiciona passive: true para melhor performance

    // Adiciona alerta ao tentar sair da página com alterações não salvas
    window.addEventListener('beforeunload', (e) => {
      if (this.isFormDirty()) {
        e.preventDefault();
        return 'Há alterações não salvas. Deseja realmente sair?';
      }
    });
  }

  generateForm() {
    return `
      <!-- Guia rápido -->
      <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
        <h3 class="text-sm font-semibold mb-2">Dicas de preenchimento:</h3>
        <ul class="text-sm space-y-1">
          <li>• Escolha um nome claro e descritivo para a categoria</li>
          <li>• Selecione um emoji que represente bem o conteúdo</li>
          <li>• Use cores que combinem entre si para o gradiente</li>
        </ul>
      </div>

      <form id="category-form" class="space-y-6">
        <!-- Grid responsivo ajustado -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          <!-- Coluna esquerda -->
          <div class="space-y-4 lg:space-y-6">
            <!-- Nome da categoria com contador -->
            <div class="form-group">
              <label for="category-name" class="block text-sm font-medium mb-1">
                Nome da Categoria <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input type="text" id="category-name" required maxlength="30"
                  class="w-full p-2 sm:p-3 border rounded text-sm sm:text-base"
                  placeholder="Ex: Ação, Comédia, etc">
                <small class="text-right block mt-1 text-gray-500">
                  <span id="name-count">0</span>/30
                </small>
              </div>
            </div>

            <!-- Tipo de categoria -->
            <div class="form-group">
              <label class="block text-sm font-medium mb-1">
                Tipo de Categoria
              </label>
              <div class="flex gap-4">
                <label class="inline-flex items-center">
                  <input type="radio" name="category-type" value="main" checked>
                  <span class="ml-2">Principal</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="category-type" value="sub">
                  <span class="ml-2">Subcategoria</span>
                </label>
              </div>
            </div>

            <!-- Ícone com seletor de emojis -->
            <div class="form-group">
              <label for="category-icon" class="block text-sm font-medium mb-1">
                Ícone (emoji) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input type="text" id="category-icon" required
                  class="w-full p-2 sm:p-3 border rounded text-sm sm:text-base"
                  placeholder="Clique para escolher">
                <button type="button" id="emoji-picker-btn"
                  class="absolute right-2 top-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                  😊
                </button>
              </div>
              <div id="emoji-picker" class="hidden mt-2 p-2 border rounded-lg shadow-lg">
                <!-- Emojis serão inseridos via JavaScript -->
              </div>
            </div>
          </div>

          <!-- Coluna direita -->
          <div class="space-y-4 lg:space-y-6">
            <!-- Cores do gradiente -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label for="gradient-start" class="block text-sm font-medium mb-1">
                  Cor Inicial
                </label>
                <div class="flex items-center gap-2">
                  <input type="color" id="gradient-start" required value="#6366F1">
                  <input type="text" id="gradient-start-hex" 
                    class="w-28 p-2 border rounded text-sm sm:text-base" 
                    value="#6366F1">
                </div>
              </div>

              <div class="form-group">
                <label for="gradient-end" class="block text-sm font-medium mb-1">
                  Cor Final
                </label>
                <div class="flex items-center gap-2">
                  <input type="color" id="gradient-end" required value="#8B5CF6">
                  <input type="text" id="gradient-end-hex" 
                    class="w-28 p-2 border rounded text-sm sm:text-base" 
                    value="#8B5CF6">
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="form-group">
              <label class="block text-sm font-medium mb-1">Preview:</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="mb-2 text-xs text-gray-500">Modo Claro</p>
                  <div id="category-preview-light" class="category-card bg-white">
                    <div class="category-icon"></div>
                    <h3 class="text-lg font-semibold"></h3>
                    <p class="text-sm text-gray-600"></p>
                    <span class="anime-count">0 animes</span>
                  </div>
                </div>
                <div>
                  <p class="mb-2 text-xs text-gray-500">Modo Escuro</p>
                  <div id="category-preview-dark" class="category-card bg-gray-800">
                    <div class="category-icon"></div>
                    <h3 class="text-lg font-semibold"></h3>
                    <p class="text-sm text-gray-600"></p>
                    <span class="anime-count">0 animes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Descrição com contador - Full width -->
        <div class="w-full mt-6">
          <label for="category-description" class="block text-sm font-medium mb-1">
            Descrição <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <textarea id="category-description" required maxlength="100" rows="3"
              class="w-full p-2 sm:p-3 border rounded text-sm sm:text-base resize-none"
              placeholder="Descreva brevemente o tipo de conteúdo desta categoria"></textarea>
            <small class="text-right block mt-1 text-gray-500">
              <span id="desc-count">0</span>/100
            </small>
          </div>
        </div>

        <!-- Botões -->
        <div class="flex flex-col md:flex-row gap-3 mt-6">
          <button type="button" onclick="categoryManager.clearForm()" 
            class="btn-action btn-secondary order-3 md:order-1 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
            <span class="flex items-center justify-center gap-2">
              <i class="fi fi-bs-trash"></i>
              Limpar
            </span>
          </button>
          <button type="button" onclick="categoryManager.closeModal()" 
            class="btn-action btn-cancel order-2 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
            <span class="flex items-center justify-center gap-2">
              <i class="fi fi-br-circle-xmark"></i>
              Cancelar
            </span>
          </button>
          <button type="submit" 
            class="btn-action btn-primary order-1 md:order-3 flex-1 w-full py-3 md:py-2 text-sm md:text-base">
            <span class="flex items-center justify-center gap-2">
              <i class="fi fi-br-checkbox"></i>
              Adicionar Categoria
            </span>
          </button>
        </div>
      </form>
    `;
  }

  setupFormVisibility() {
    const modal = document.getElementById('category-modal');
    const formContainer = document.getElementById('category-form-container');
    const showFormButton = document.getElementById('btn-show-form');

    // Mostra o modal ao clicar no botão
    showFormButton.addEventListener('click', () => {
      formContainer.innerHTML = this.generateForm();
      modal.classList.remove('hidden');

      // Inicializa todos os componentes do formulário
      this.initializeForm();
      this.setupPreviewUpdates();
      this.setupEmojiPicker();
      this.setupColorInputs();
      this.setupCharacterCounters();
      this.setupProgressTracking();

      // Captura o estado inicial do formulário após o preenchimento
      setTimeout(() => { 
        this.initialFormState = this.getFormState(); 
      }, 100);

      // Configura o botão cancelar
      const cancelButton = document.getElementById('btn-cancel');
      if (cancelButton) cancelButton.addEventListener('click', () => this.closeModal());
    });
  }

  closeModal() {
    // Verifica se há mudanças não salvas
    if ((!this.isFormSaving && this.isFormDirty()) && !confirm('Existem alterações não salvas. Deseja realmente sair?')) return;

    const modal = document.getElementById('category-modal');
    const formContainer = document.getElementById('category-form-container');

    modal.classList.add('hidden');
    formContainer.innerHTML = '';
    
    // Restaura o scroll da página
    document.body.style.overflow = '';
  }

  initializeForm() {
    const form = document.getElementById('category-form');
    if (form) form.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  setupPreviewUpdates() {
    ['category-name', 'category-icon', 'category-description', 'gradient-start', 'gradient-end'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.addEventListener('input', () => this.updatePreview());
    });
  }

  // Preenche o picker com emojis comuns e gerencia eventos de clique.
  setupEmojiPicker() {
    const commonEmojis = ['⚔️', '🎭', '😄', '🔮', '🤖', '💝', '👻', '🎮', '🌟', '🎬', '🎨', '🎵', '👊', '🏃', '💫', '🌍'];
    const picker = document.getElementById('emoji-picker');
    const pickerBtn = document.getElementById('emoji-picker-btn');
    const iconInput = document.getElementById('category-icon');

    if (picker && pickerBtn) {
      // Preenche o seletor de emojis
      picker.innerHTML = commonEmojis.map(emoji => `
        <button type="button" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
          ${emoji}
        </button>
      `).join('');

      // Toggle do picker
      pickerBtn.addEventListener('click', () => { 
        picker.classList.toggle('hidden'); 
      });

      // Seleciona emoji
      picker.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          iconInput.value = e.target.textContent.trim();
          picker.classList.add('hidden');
          this.updatePreview();
        }
      });

      // Fecha picker ao clicar fora
      document.addEventListener('click', (e) => { 
        if (!picker.contains(e.target) && !pickerBtn.contains(e.target)) picker.classList.add('hidden'); 
      });
    }
  }

  setupColorInputs() {
    ['start', 'end'].forEach(type => {
      const colorInput = document.getElementById(`gradient-${type}`);
      const hexInput = document.getElementById(`gradient-${type}-hex`);

      if (colorInput && hexInput) {
        // Atualiza hex quando color muda
        colorInput.addEventListener('input', () => {
          const color = colorInput.value.toUpperCase();
          hexInput.value = color;
          hexInput.style.background = color;
          hexInput.style.color = this.getContrastColor(color);
          this.updatePreview();
        });

        // Atualiza color quando hex muda
        hexInput.addEventListener('input', (e) => {
          let value = e.target.value;

          // Adiciona # se não existir
          if (value[0] !== '#') {
            value = '#' + value;
            hexInput.value = value;
          }

          // Valida o formato hex
          if (/^#[0-9A-F]{6}$/i.test(value)) {
            colorInput.value = value;
            hexInput.style.background = value;
            hexInput.style.color = this.getContrastColor(value);
            hexInput.classList.remove('error');
            this.updatePreview();
          } else hexInput.classList.add('error');
        });

        // Corrige valor ao perder foco
        hexInput.addEventListener('blur', () => {
          if (hexInput.classList.contains('error')) {
            hexInput.value = colorInput.value;
            hexInput.style.background = colorInput.value;
            hexInput.style.color = this.getContrastColor(colorInput.value);
            hexInput.classList.remove('error');
          }
        });

        // Inicializa estilos
        const initialColor = colorInput.value;
        hexInput.style.background = initialColor;
        hexInput.style.color = this.getContrastColor(initialColor);
      }
    });
  }

  // Calcula a cor contrastante (preto ou branco) para uma cor hexadecimal fornecida
  getContrastColor(hexcolor) {
    // Remove o # se existir
    hexcolor = hexcolor.replace('#', '');

    // Converte para RGB
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Calcula a luminância relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retorna branco para cores escuras e preto para cores claras
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  setupCharacterCounters() {
    // Contador para nome
    const nameInput = document.getElementById('category-name');
    const nameCount = document.getElementById('name-count');
    if (nameInput && nameCount) {
      this.setupCounter(nameInput, nameCount, 30);
    }

    // Contador para descrição
    const descInput = document.getElementById('category-description');
    const descCount = document.getElementById('desc-count');
    if (descInput && descCount) this.setupCounter(descInput, descCount, 100);
  }

  setupCounter(input, counter, max) {
    const updateCount = () => {
      const count = input.value.length;
      counter.textContent = count;
      counter.style.color = count === max ? 'red' : '';
    };

    input.addEventListener('input', updateCount);
    updateCount(); // Inicializa contador
  }

  updatePreview() {
    const name = document.getElementById('category-name').value;
    const icon = document.getElementById('category-icon').value;
    const description = document.getElementById('category-description').value;
    const gradientStart = document.getElementById('gradient-start').value;
    const gradientEnd = document.getElementById('gradient-end').value;
    const isSubcategory = document.querySelector('input[name="category-type"]:checked').value === 'sub';

    // Atualiza preview modo claro
    this.updatePreviewElement('light', { name, icon, description, gradientStart, gradientEnd, isSubcategory });

    // Atualiza preview modo escuro
    this.updatePreviewElement('dark', { name, icon, description, gradientStart, gradientEnd, isSubcategory });
  }

  updatePreviewElement(mode, { name, icon, description, gradientStart, gradientEnd, isSubcategory }) {
    const preview = document.getElementById(`category-preview-${mode}`);
    if (!preview) return;

    preview.style.background = `linear-gradient(45deg, ${gradientStart}, ${gradientEnd})`;
    preview.querySelector('.category-icon').textContent = icon;
    preview.querySelector('h3').textContent = name;
    preview.querySelector('p').textContent = description;

    // Ajusta estilo baseado no tipo
    if (isSubcategory) {
      preview.classList.add('subcategory-preview');
      preview.style.width = '200px';
      preview.style.padding = '0.5rem 1rem';
    } else {
      preview.classList.remove('subcategory-preview');
      preview.style.width = '100%';
      preview.style.padding = '2rem';
    }
  }

  // Gerencia o envio do formulário de categoria, validando os dados e salvando/atualizando no sistema
  async handleFormSubmit(e) {
    e.preventDefault();
    this.isFormSaving = true; // Define a flag antes de salvar

    // Captura todos os valores necessários antes de qualquer operação
    const form = e.target;
    const editingId = parseInt(form.dataset.editingId);
    const categoryData = {
      id: editingId || Date.now(),
      name: form.querySelector('#category-name')?.value.trim() || '',
      icon: form.querySelector('#category-icon')?.value.trim() || '',
      description: form.querySelector('#category-description')?.value.trim() || '',
      isSubcategory: form.querySelector('input[name="category-type"]:checked')?.value === 'sub',
      gradient: {
        start: form.querySelector('#gradient-start')?.value || '#6366F1',
        end: form.querySelector('#gradient-end')?.value || '#8B5CF6'
      }
    };

    // Validação dos dados obrigatórios
    if (!categoryData.name || !categoryData.icon || !categoryData.description) {
      this.isFormSaving = false;
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingId) {
        await this.updateCategory(categoryData);
        alert('Categoria atualizada com sucesso!');
      } else {
        await this.saveCategory(categoryData);
        alert('Categoria adicionada com sucesso!');
      }

      // Fecha o modal após salvar
      this.closeModal();
      this.loadCategories();
    } catch (error) {
      alert(error.message);
      this.isFormSaving = false; // Reseta a flag em caso de erro
    }
  }

  // Salva uma nova categoria no localStorage e atualiza a interface
  async saveCategory(categoryData) {
    try {
      // Utiliza o CategoryManager para adicionar categoria
      const result = await this.categoryFirestore.addCategory(categoryData);
      
      if (result.success) {
        // Atualiza a lista de categorias na página
        this.loadCategories();

        // Força a atualização da página de categorias se ela estiver aberta em outra aba
        window.dispatchEvent(new Event('categoriesUpdated'));
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      throw new Error('Erro ao salvar categoria: ' + error.message);
    }
  }

  // Atualiza uma categoria existente na lista de categoria
  async updateCategory(categoryData) {
    try {
      // Utiliza o CategoryManager para atualizar categoria
      const result = await this.categoryFirestore.updateCategory(categoryData);
      
      if (result.success) {
        window.dispatchEvent(new Event('categoriesUpdated'));
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      throw new Error('Erro ao atualizar categoria: ' + error.message);
    }
  }

  getCategories() {
    return JSON.parse(localStorage.getItem('animuCategories')) || [];
  }

  loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    const categories = this.getCategories();

    if (categoriesList) {
      // Renderiza tabela apenas se houver categorias
      if (categories.length === 0) {
        categoriesList.innerHTML = `
          <div class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Nenhuma categoria cadastrada</p>
          </div>
        `;
        return;
      }

      categoriesList.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map((category) => `
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl"
                        style="background: linear-gradient(45deg, ${category.gradient.start}, ${category.gradient.end})">
                        ${category.icon}
                      </div>
                      <span class="font-medium">${category.name}</span>
                    </div>
                  </td>
                  <td>
                    ${category.isSubcategory ?
                      '<span class="px-2 py-1 text-xs text-white bg-purple-100 dark:bg-purple-900 rounded-full">Subcategoria</span>' :
                      '<span class="px-2 py-1 text-xs text-white bg-blue-100 dark:bg-blue-900 rounded-full">Principal</span>'}
                  </td>
                  <td>
                    ${category.description}
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-action btn-edit" title="Editar" onclick="categoryManager.editCategory(${category.id})">
                        <i class="fi fi-bs-edit"></i>
                      </button>
                      <button class="btn-action btn-delete" title="Remover" onclick="categoryManager.deleteCategory(${category.id})">
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
    }
    this.updateStatistics(); // Adiciona chamada após carregar/modificar categorias
  }

  // Abre um modal e preenche um formulário para editar uma categoria existente
  async editCategory(categoryId) {
    const categories = this.getCategories();
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) return;

    // Mostra o modal e bloqueia o scroll da página
    const modal = document.getElementById('category-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Primeiro, gera o formulário
    const formContainer = document.getElementById('category-form-container');
    const showFormButton = document.getElementById('btn-show-form');

    // Primeiro, gera o formulário
    formContainer.innerHTML = this.generateForm();
    formContainer.classList.remove('hidden');
    showFormButton.classList.add('hidden');

    // Inicializa os componentes do formulário
    this.initializeForm();
    this.setupPreviewUpdates();
    this.setupEmojiPicker();
    this.setupColorInputs();
    this.setupCharacterCounters();

    // Adiciona evento ao botão cancelar
    const cancelButton = document.getElementById('btn-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        formContainer.innerHTML = '';
        formContainer.classList.add('hidden');
        showFormButton.classList.remove('hidden');
      });
    }

    // Agora preenche o formulário com os dados da categoria
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-icon').value = category.icon;
    document.getElementById('category-description').value = category.description;
    document.getElementById('gradient-start').value = category.gradient.start;
    document.getElementById('gradient-end').value = category.gradient.end;
    document.getElementById('gradient-start-hex').value = category.gradient.start;
    document.getElementById('gradient-end-hex').value = category.gradient.end;

    // Define o tipo de categoria
    const radioButtons = document.querySelectorAll('input[name="category-type"]');
    for (const radio of radioButtons) radio.checked = (radio.value === 'sub') === category.isSubcategory;

    // Atualiza preview
    this.updatePreview();

    // Muda o botão de submit para modo de edição
    const form = document.getElementById('category-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Salvar Alterações';
    submitBtn.classList.add('editing');

    // Adiciona o ID da categoria sendo editada ao formulário
    form.dataset.editingId = categoryId;

    // Scroll suave até o formulário
    formContainer.scrollIntoView({ behavior: 'smooth' });

    // Após preencher o formulário com os dados da categoria
    this.updateFormProgress();
  }

  // Exclui uma categoria do sistema após confirmação do usuário
  async deleteCategory(categoryId) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      // Utiliza o CategoryManager para excluir categoria
      const result = await this.categoryFirestore.deleteCategory(categoryId);
      
      if (result.success) {
        // Recarrega a lista de categorias
        this.loadCategories();
        alert('Categoria excluída com sucesso!');
      } else {
        alert('Erro ao excluir categoria: ' + result.message);
      }
    } catch (error) {
      alert('Erro ao excluir categoria: ' + error.message);
    }
    this.updateStatistics(); // Adiciona chamada após deletar
  }

  // Limpa o formulário
  clearForm() {
    if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
      document.getElementById('category-form').reset();
      this.updatePreview();
      document.getElementById('name-count').textContent = '0';
      document.getElementById('desc-count').textContent = '0';
      this.updateFormProgress();
    }
  }

  updateFormProgress() {
    const form = document.getElementById('category-form');
    if (!form) return;

    // Define os campos obrigatórios e seus valores padrão
    const requiredFields = {
      'category-name': '',
      'category-icon': '',
      'category-description': ''
    };

    // Verifica cada campo obrigatório
    let filledFields = 0;
    const totalFields = Object.keys(requiredFields).length;

    Object.entries(requiredFields).forEach(([fieldId, defaultValue]) => {
      const field = document.getElementById(fieldId);
      if (field && field.value.trim() !== defaultValue) filledFields++;
    });

    // Calcula o progresso
    const progress = (filledFields / totalFields) * 100;

    // Atualiza a barra de progresso
    const progressBar = document.getElementById('formProgress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;

      // Atualiza a cor baseado no progresso
      if (progress < 33) progressBar.style.background = 'var(--error-color, #EF4444)';
      else if (progress < 66) progressBar.style.background = 'var(--warning-color, #F59E0B)';
      else progressBar.style.background = 'var(--success-color, #10B981)';
    }
  }

  setupProgressTracking() {
    const form = document.getElementById('category-form');
    if (!form) return;

    // Monitora mudanças em todos os campos do formulário
    const fields = form.querySelectorAll('input, textarea');
    fields.forEach(field => {
      field.addEventListener('input', () => this.updateFormProgress());
      field.addEventListener('change', () => this.updateFormProgress());
    });

    // Atualização inicial do progresso
    this.updateFormProgress();
  }

  // Verifica se o formulário foi modificado
  isFormDirty() {
    const modal = document.getElementById('category-modal');

    // Se o modal estiver fechado, não considera como modificado
    if (modal.classList.contains('hidden')) return false;

    // Se não houver estado inicial, não considera como modificado
    if (!this.initialFormState) return false;

    // Compara o estado atual com o estado inicial
    const currentState = this.getFormState();
    return currentState !== this.initialFormState;
  }

  // Captura o estado atual do formulário
  getFormState() {
    const form = document.getElementById('category-form');
    if (!form) return null;

    const state = {
      inputs: {},
      mediaFields: {
        gradientStart: document.getElementById('gradient-start')?.value,
        gradientEnd: document.getElementById('gradient-end')?.value
      }
    };

    // Captura valores dos campos
    form.querySelectorAll('input, textarea, select').forEach(input => {
      if (input.type !== 'color' && !input.classList.contains('hidden')) state.inputs[input.id] = input.value.trim();
    });

    // Captura o tipo de categoria selecionado
    const categoryType = form.querySelector('input[name="category-type"]:checked');
    if (categoryType) state.inputs.categoryType = categoryType.value;

    return JSON.stringify(state);
  }

  // Adiciona este novo método
  async updateStatistics() {
    try {
      // Utiliza o CategoryManager para obter estatísticas
      const result = await this.categoryFirestore.getCategoryStats();
      
      if (result.success) {
        const { stats } = result;
        
        // Atualiza total de categorias
        const totalElement = document.getElementById('total-categories');
        if (totalElement) totalElement.textContent = stats.total;
        
        // Atualiza categorias principais
        const mainElement = document.getElementById('main-categories');
        if (mainElement) mainElement.textContent = stats.main;
        
        // Atualiza subcategorias
        const subElement = document.getElementById('sub-categories');
        if (subElement) subElement.textContent = stats.sub;
      } else {
        // Fallback para cálculo local se houver erro
        const categories = this.getCategories();
        
        // Atualiza total de categorias
        const totalElement = document.getElementById('total-categories');
        if (totalElement) totalElement.textContent = categories.length;
        
        // Conta categorias principais
        const mainCount = categories.filter(cat => !cat.isSubcategory).length;
        const mainElement = document.getElementById('main-categories');
        if (mainElement) mainElement.textContent = mainCount;
        
        // Conta subcategorias
        const subCount = categories.filter(cat => cat.isSubcategory).length;
        const subElement = document.getElementById('sub-categories');
        if (subElement) subElement.textContent = subCount;
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      // Fallback para método antigo em caso de erro
      const categories = this.getCategories();
      const totalElement = document.getElementById('total-categories');
      if (totalElement) totalElement.textContent = categories.length;
      
      const mainCount = categories.filter(cat => !cat.isSubcategory).length;
      const mainElement = document.getElementById('main-categories');
      if (mainElement) mainElement.textContent = mainCount;
      
      const subCount = categories.filter(cat => cat.isSubcategory).length;
      const subElement = document.getElementById('sub-categories');
      if (subElement) subElement.textContent = subCount;
    }
  }

  // Carrega categorias do Firebase
  async loadCategoriesFromFirebase() {
    try {
      console.log('Tentando carregar categorias do Firebase...');
      
      // Utiliza o CategoryManager para carregar categorias
      const result = await this.categoryFirestore.loadCategories();
      
      if (result.success) {
        console.log('Categorias carregadas com sucesso do Firebase:', result.data.length);
        this.firebaseLoaded = true;
        this.loadCategories(); // Atualiza a interface
      } else {
        console.log('Nenhuma categoria encontrada no Firebase, usando dados locais');
        const localCategories = this.getCategories();
        
        if (localCategories && localCategories.length > 0) {
          console.log('Dados locais encontrados, salvando no Firebase...');
          this.firebaseLoaded = true;
          await this.categoryFirestore.saveCategories(localCategories);
        }
        
        this.loadCategories(); // Carrega do localStorage se não houver no Firebase
      }
    } catch (error) {
      console.error('Erro ao carregar categorias do Firebase:', error);
      this.loadCategories(); // Em caso de erro, carrega do localStorage
    }
  }

  // Salva categorias no Firebase
  async saveCategoriesOnFirebase() {
    try {
      console.log('Tentando salvar categorias no Firebase...');
      const categories = this.getCategories();
      
      if (!categories || categories.length === 0) {
        console.warn('Nenhuma categoria para salvar no Firebase');
        return;
      }
      
      // Utiliza o CategoryManager para salvar categorias
      const result = await this.categoryFirestore.saveCategories(categories);
      
      if (result.success) {
        console.log('Categorias salvas no Firebase com sucesso:', categories.length, 'categorias');
        this.firebaseLoaded = true;  // Marca como carregado após salvar com sucesso
        
        // Dispara evento personalizado para notificar que as categorias foram atualizadas
        window.dispatchEvent(new CustomEvent('categoriesSaved', { 
          detail: { count: categories.length }
        }));
      } else {
        console.error('Erro ao salvar no Firebase:', result.message);
      }
    } catch (error) {
      console.error('Erro ao salvar categorias no Firebase:', error);
      alert(`Erro ao salvar no Firebase: ${error.message}. Verifique o console para mais detalhes.`);
    }
  }
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se o usuário tem permissão de admin
  const manager = new CategoryAdmin();
  if (AnimuUtils.isUserAdmin()) window.categoryManager = manager; // Torna acessível globalmente para os event handlers
});