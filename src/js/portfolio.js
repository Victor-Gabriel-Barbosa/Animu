// Script para animação dos cartões
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se os elementos estão visíveis na tela
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1
  });

  // Observar todos os cartões de desenvolvedores
  document.querySelectorAll('.developer-card').forEach(card => {
    observer.observe(card);
  });

  // Validar formulário
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      let isValid = true;

      form.querySelectorAll('input, textarea').forEach(input => {
        if (!input.validity.valid) {
          input.classList.add('is-invalid');
          isValid = false;
        } else {
          input.classList.remove('is-invalid');
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });

    // Remover classe de erro ao modificar o campo
    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', function() {
        if (this.validity.valid) {
          this.classList.remove('is-invalid');
        }
      });
    });
  }
});