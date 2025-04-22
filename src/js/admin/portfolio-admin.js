// Script para adicionar e remover projetos
document.addEventListener('DOMContentLoaded', function() {
  // Adiciona projeto
  document.getElementById('add-project').addEventListener('click', function() {
    const container = document.getElementById('projects-container');
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project-item';
    projectDiv.innerHTML = `
      <div class="mb-2">
          <label class="form-label">Nome do Projeto</label>
          <input type="text" name="project_names[]" class="form-control">
      </div>
      <div class="mb-2">
          <label class="form-label">Descrição</label>
          <input type="text" name="project_descriptions[]" class="form-control">
      </div>
      <div class="mb-2">
          <label class="form-label">Link</label>
          <input type="url" name="project_links[]" class="form-control">
      </div>
      <button type="button" class="btn-action btn-cancel btn-sm remove-project">
        <span class="flex items-center justify-center gap-2">
          <i class="fi fi-br-circle-xmark"></i>
          Remover Projeto
        </span>
      </button>
    `;
    container.appendChild(projectDiv);

    // Atualizar eventos de remoção
    setupRemoveProjectHandlers();
  });

  // Configura eventos de remoção
  function setupRemoveProjectHandlers() {
    document.querySelectorAll('.remove-project').forEach(button => {
      button.addEventListener('click', function() {
        this.closest('.project-item').remove();
      });
    });
  }

  // Inicializar os eventos de remoção
  setupRemoveProjectHandlers();

  // Pré-visualização da imagem
  document.getElementById('photo')?.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        // Verifica se já existe uma previsualização
        let preview = document.querySelector('.avatar-preview');

        if (!preview) {
          // Cria um elemento de imagem para previsualização
          preview = document.createElement('img');
          preview.classList.add('avatar-preview');
          preview.alt = 'Preview';

          // Adiciona antes do input file
          const photoInput = document.getElementById('photo');
          photoInput.parentNode.insertBefore(preview, photoInput);
          photoInput.parentNode.insertBefore(document.createElement('div'), photoInput);
        }

        // Atualiza a fonte da imagem
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});