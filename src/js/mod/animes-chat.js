/**
 * Classe do sistema de comentários de animes
 * Gerencia comentários, avaliações e moderação de comentários
 */
class AnimeChat {
  static MAX_COMMENT_LENGTH = 500; // Limite de 500 caracteres para comentários
  
  // Define os emojis de avaliação como propriedade estática
  static EMOJI_RANGES = [
    { max: 0, emoji: '😶' },
    { max: 20, emoji: '😭' },
    { max: 40, emoji: '☹️' },
    { max: 60, emoji: '😐' },
    { max: 80, emoji: '😊' },
    { max: Infinity, emoji: '🤩' }
  ];

  // Novo construtor para inicializar estilos de votação
  constructor() {
    this.addVoteButtonStyles();
  }

  // Adiciona estilos CSS para os botões de votação
  addVoteButtonStyles() {
    const styleId = 'vote-button-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vote-btn.loading {
        opacity: 0.7;
        pointer-events: none;
        position: relative;
      }
      
      .vote-btn.loading::after {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        top: calc(50% - 5px);
        left: calc(50% - 5px);
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Gerenciamento de sistema de comentários
  async loadComments(animeTitle) {
    try {
      // Usa o método do AnimeManager para buscar comentários
      return await animeManager.getCommentsByAnimeTitle(animeTitle);
    } catch (e) {
      console.warn('Erro ao carregar comentários:', e);
      return [];
    }
  }

  // Verifica limite de um comentário por usuário (exceto admin)
  async hasUserAlreadyCommented(animeTitle, username) {
    try {
      const comments = await animeManager.getCommentsByAnimeTitle(animeTitle);
      return comments.some(comment => comment.username === username);
    } catch (e) {
      console.error('Erro ao verificar comentário existente:', e);
      return false;
    }
  }

  // Salva comentário com validação e moderação
  async saveComment(animeTitle, commentText) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('userSession'));
      if (!currentUser) {
        alert('Você precisa estar logado para comentar!');
        return null;
      }

      // Verifica se o usuário é admin
      const isAdmin = currentUser.isAdmin || false;

      // Se não for admin, verifica se já comentou
      if (!isAdmin && await this.hasUserAlreadyCommented(animeTitle, currentUser.username)) {
        alert('Você já fez um comentário neste anime. Apenas administradores podem fazer múltiplos comentários.');
        return null;
      }

      // Verifica o tamanho do comentário
      if (commentText.length > AnimeChat.MAX_COMMENT_LENGTH) {
        alert(`O comentário deve ter no máximo ${AnimeChat.MAX_COMMENT_LENGTH} caracteres.`);
        return null;
      }

      // Valida o conteúdo usando o ContentValidator com suporte a censura parcial
      const validationResult = await ContentValidator.validateContent(commentText, 'comentário');
      
      // Determina qual texto usar (censurado ou original)
      const textToUse = validationResult.wasCensored ? validationResult.censoredText : commentText;

      const sliderRating = document.getElementById('rating-slider').value / 10;

      // Formata o texto usando await para obter o resultado formatado
      const formattedText = await TextFormatter.format(textToUse);

      const commentData = {
        text: formattedText,
        rating: sliderRating,
        username: currentUser.username
      };

      // Usa o método do AnimeManager para adicionar o comentário
      const newComment = await animeManager.addComment(animeTitle, commentData);
      
      // Atualiza as estatísticas em tempo real
      this.updateAnimeStats(animeTitle);

      return newComment;
    } catch (e) {
      console.error('Erro ao salvar comentário:', e);
      alert(e.message || 'Ocorreu um erro ao enviar o comentário');
      return null;
    }
  }

  // Atualiza score médio do anime baseado nos comentários
  async updateAnimeRating(animeTitle) {
    try {
      // Usa o método do AnimeManager para atualizar a média de avaliação
      const newRating = await animeManager.updateAnimeAverageRating(animeTitle);
      
      // Atualiza as estatísticas em tempo real
      this.updateAnimeStats(animeTitle);
      
      return newRating;
    } catch (e) {
      console.error('Erro ao atualizar avaliação:', e);
      return 0;
    }
  }

  // Renderiza as estrelas
  renderStars(rating) {
    const starsTotal = 10;
    const fillPercentage = (rating / starsTotal) * 100;

    return `
      <div class="rating-display">
        <div class="stars-container">
          <div class="stars-empty">
            ${Array(starsTotal).fill('').map(() => '<i>★</i>').join('')}
          </div>
          <div class="stars-filled" style="width: ${fillPercentage}%">
            ${Array(starsTotal).fill('').map(() => '<i>★</i>').join('')}
          </div>
        </div>
        <span class="rating-number">${rating.toFixed(1)}</span>
      </div>
    `;
  }

  /**
   * Sistema de moderação de comentários
   * @param {string} animeTitle - Título do anime
   * @param {string} commentId - ID do comentário a ser excluído
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteComment(animeTitle, commentId) {
    try {
      if (!commentId) {
        console.error('ID do comentário não fornecido');
        return false;
      }
      
      // Tenta excluir o comentário
      const result = await animeManager.deleteComment(commentId);
      
      if (result) {
        console.log(`Comentário ID ${commentId} excluído com sucesso`);
        
        // Atualiza a interface imediatamente removendo o elemento DOM
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) commentElement.remove();
        
        // Atualiza as estatísticas do anime
        this.updateAnimeStats(animeTitle);
      
        return true;
      } else {
        console.error(`Falha ao excluir comentário ID ${commentId}`);
        return false;
      }
    } catch (e) {
      console.error('Erro ao deletar comentário:', e);
      alert('Não foi possível excluir o comentário. Por favor, tente novamente mais tarde.');
      return false;
    }
  }

  // Sistema de votação em comentários - versão atualizada
  async voteComment(animeTitle, commentId, voteType) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
      if (!currentUser) {
        alert('Você precisa estar logado para votar!');
        return false;
      }

      // Mostra indicador de carregamento
      this.setVoteButtonLoading(commentId, voteType, true);

      // Usa o método do AnimeManager para votar no comentário
      const result = await animeManager.voteComment(commentId, currentUser, voteType);
      
      // Atualiza a UI apenas para este comentário específico
      this.updateCommentInUI(commentId, result.comment);
      
      // Atualiza as estatísticas em tempo real
      this.updateAnimeStats(animeTitle);
      
      // Remove indicador de carregamento
      this.setVoteButtonLoading(commentId, voteType, false);
      
      return true;
    } catch (e) {
      console.error('Erro ao votar:', e);
      
      // Remove indicador de carregamento em caso de erro
      this.setVoteButtonLoading(commentId, voteType, false);
      
      return false;
    }
  }

  // Novo método para indicador de carregamento nos botões de voto
  setVoteButtonLoading(commentId, voteType, isLoading) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;
    
    const button = commentElement.querySelector(`.vote-btn-${voteType}`);
    if (button) {
      button.classList.toggle('loading', isLoading);
      button.disabled = isLoading;
    }
  }

  // Novo método para atualizar apenas um comentário específico no DOM
  updateCommentInUI(commentId, updatedComment) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;
    
    // Atualiza os contadores de likes/dislikes
    const likesCount = commentElement.querySelector('.like-count');
    const dislikesCount = commentElement.querySelector('.dislike-count');
    
    if (likesCount) likesCount.textContent = updatedComment.likes?.length || 0;
    if (dislikesCount) dislikesCount.textContent = updatedComment.dislikes?.length || 0;
    
    // Atualiza o estado dos botões para o usuário atual
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    const likeButton = commentElement.querySelector('.vote-btn-like');
    const dislikeButton = commentElement.querySelector('.vote-btn-dislike');
    
    if (likeButton) {
      likeButton.classList.toggle('active', updatedComment.likes?.includes(currentUser) || false);
    }
    
    if (dislikeButton) {
      dislikeButton.classList.toggle('active', updatedComment.dislikes?.includes(currentUser) || false);
    }
  }

  // Verifica voto existente do usuário em um comentário
  getUserVote(likes = [], dislikes = []) {
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    if (!currentUser) return null;

    if (likes.includes(currentUser)) return 'like';
    if (dislikes.includes(currentUser)) return 'dislike';
    return null;
  }

  // Sistema de edição de comentários com validação
  async editComment(animeTitle, commentId, newText, newRating) {
    try {
      // Verifica se o usuário atual é o dono do comentário
      const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
      if (!currentUser) return false;

      // Valida o conteúdo usando o ContentValidator com suporte a censura parcial
      const validationResult = await ContentValidator.validateContent(newText, 'comentário');
      
      // Determina qual texto usar (censurado ou original)
      const textToUse = validationResult.wasCensored ? validationResult.censoredText : newText;
      
      // Formata o texto usando await para obter o resultado formatado
      const formattedText = await TextFormatter.format(textToUse);
      
      // Usa o método do AnimeManager para atualizar o comentário
      const result = await animeManager.updateComment(commentId, {
        text: formattedText,
        rating: newRating
      });
      
      if (result) this.updateAnimeStats(animeTitle); // Atualiza as estatísticas em tempo real
      
      return true;
    } catch (e) {
      console.error('Erro ao editar comentário:', e);
      alert(e.message || 'Ocorreu um erro ao editar o comentário');
      return false;
    }
  }

  // Interface de edição de comentários
  toggleEditMode(commentId) {
    const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
    const commentText = commentDiv.querySelector('.comment-text');
    const commentRating = commentDiv.querySelector('.comment-rating');
    const editForm = commentDiv.querySelector('.edit-form');

    if (editForm) {
      commentText.style.display = 'block';
      commentRating.style.display = 'block';
      editForm.remove();
    } else {
      const currentText = commentText.textContent;
      const currentRating = parseFloat(commentDiv.getAttribute('data-rating')) * 10;

      commentText.style.display = 'none';
      commentRating.style.display = 'none';

      const form = document.createElement('form');
      form.className = 'edit-form mt-2';
      form.innerHTML = `
        <div class="rating-container mb-4">
          <p class="mb-2 font-semibold">
            Sua avaliação: 
            <span class="rating-number-input">
              <input type="number" 
                     id="edit-rating-display"
                     class="text-purple-600 ml-2 w-16 text-center" 
                     min="0" 
                     max="10" 
                     step="0.1" 
                     value="${(currentRating / 10).toFixed(1)}">
            </span>
          </p>
          <div class="rating-slider-container">
            <input type="range" 
                   id="edit-rating-slider" 
                   min="0" 
                   max="100" 
                   value="${currentRating}"
                   class="rating-slider"
                   step="1">
            <div class="rating-emoji-container">
              <span id="edit-rating-emoji" class="rating-emoji">😊</span>
            </div>
          </div>
        </div>
        <div class="relative">
          <textarea 
            class="w-full p-2 border rounded resize-none dark:bg-gray-800"
            maxlength="${AnimeChat.MAX_COMMENT_LENGTH}"
            oninput="animeChat.updateCharCount(this, 'edit-comment-count-${commentId}')"
          >${currentText}</textarea>
          <small id="edit-comment-count-${commentId}" class="text-right block mt-1">0/${AnimeChat.MAX_COMMENT_LENGTH}</small>
        </div>
        <div class="flex gap-2 mt-2">
          <button type="submit" class="btn-action btn-primary order-1 sm:order-2 w-full py-2 text-sm">
            <span class="flex items-center justify-center gap-2">
              <i class="fi fi-br-checkbox"></i>
              Salvar
            </span>
          </button>
          <button type="button" onclick="animeChat.toggleEditMode('${commentId}')" class="btn-action btn-cancel order-2 sm:order-1 w-full py-2 text-sm">
            <span class="flex items-center justify-center gap-2">
              <i class="fi fi-br-circle-xmark"></i>
              Cancelar
            </span>
          </button>
        </div>
      `;

      commentText.insertAdjacentElement('afterend', form);

      // Inicializa o slider e input de avaliação na edição
      const editSlider = form.querySelector('#edit-rating-slider');
      const editInput = form.querySelector('#edit-rating-display');

      editSlider.addEventListener('input', function () {
        animeChat.updateEditRatingDisplay(this.value);
      });

      editInput.addEventListener('input', function () {
        let value = parseFloat(this.value);

        // Valida o valor
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        if (value > 10) value = 10;

        // Multiplica por 10 para a escala do slider
        animeChat.updateEditRatingDisplay(value * 10, false);
      });

      // Formata o valor quando o input perde o foco
      editInput.addEventListener('blur', function () {
        let value = parseFloat(this.value || 0);
        this.value = (Math.round(value * 10) / 10).toFixed(1);
      });

      animeChat.updateEditRatingDisplay(currentRating);

      // Atualiza contador inicial
      const textarea = form.querySelector('textarea');
      const counter = form.querySelector(`#edit-comment-count-${commentId}`);
      counter.textContent = `${textarea.value.length}/${AnimeChat.MAX_COMMENT_LENGTH}`;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newText = form.querySelector('textarea').value.trim();
        const newRating = parseFloat(form.querySelector('#edit-rating-slider').value) / 10;

        if (newText) {
          const animeTitle = new URLSearchParams(window.location.search).get('anime');
          
          // Adiciona estado de carregamento ao botão
          const submitButton = e.target.querySelector('button[type="submit"]');
          const originalText = submitButton.textContent;
          submitButton.disabled = true;
          submitButton.innerHTML = '<span class="animate-spin mr-2">⏳</span> Salvando...';
          
          try {
            const result = await animeChat.editComment(decodeURIComponent(animeTitle), commentId, newText, newRating);
            if (result) animeChat.updateCommentsList(decodeURIComponent(animeTitle));
          } catch (error) {
            console.error('Erro ao editar comentário:', error);
            alert('Ocorreu um erro ao editar seu comentário. Por favor, tente novamente.');
          } finally {
            // Restaura o botão original (mesmo que não seja mais visível)
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        }
      });
    }
  }

  // Atualiza interface visual da avaliação durante edição
  updateEditRatingDisplay(value, updateInput = true) {
    const emoji = document.getElementById('edit-rating-emoji');
    const display = document.getElementById('edit-rating-display');
    const slider = document.getElementById('edit-rating-slider');
    const rating = value / 10;

    // Adiciona classe de animação
    emoji.classList.remove('animate');
    void emoji.offsetWidth;
    emoji.classList.add('animate');

    // Define o emoji baseado no valor usando a propriedade estática
    emoji.textContent = AnimeChat.EMOJI_RANGES.find(range => value <= range.max).emoji;

    // Atualiza os valores
    if (updateInput && display) display.value = rating.toFixed(1);
    if (!updateInput && slider) slider.value = Math.round(value);
  }

  // Renderiza comentário individual com controles de moderação (atualizado)
  renderComment(comment, animeTitle) {
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    const isCommentOwner = currentUser === comment.username;
    const userVote = this.getUserVote(comment.likes, comment.dislikes);
    const isAdmin = AnimuUtils.isUserAdmin();
    const canDelete = isCommentOwner || isAdmin;

    return `
      <div class="comment p-4 rounded-lg" data-comment-id="${comment.id}" data-rating="${comment.rating}">
        <div class="flex items-start gap-3">
          <img class="h-10 w-10 rounded-full object-cover"
               src="${AnimuUtils.getAuthorAvatar(comment.username)}"
               alt="${comment.username}">
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <strong class="text-purple-600">${comment.username}</strong>
                <div class="comment-rating">${this.renderStars(comment.rating)}</div>
                <span class="text-sm text-gray-500">${AnimuUtils.formatDate(comment.timestamp)}</span>
              </div>
              <div class="action-buttons">
                ${isCommentOwner ? `
                  <button class="btn-action btn-edit" 
                          onclick="animeChat.toggleEditMode('${comment.id}')"
                          title="Editar comentário">
                    <i class="fi fi-bs-edit"></i>
                  </button>
                ` : ''}
                ${canDelete ? `
                  <button 
                    class="btn-action btn-delete"
                    onclick="if(confirm('Deseja realmente excluir este comentário?')) { 
                      animeChat.deleteComment('${animeTitle}', '${comment.id}'); 
                      animeChat.updateCommentsList('${animeTitle}');
                    }"
                    title="${isAdmin && !isCommentOwner ? 'Excluir como administrador' : 'Excluir comentário'}"
                  >
                    <i class="fi fi-bs-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>
            <p class="comment-text mt-2">${comment.text}</p>
            ${comment.edited ? `
              <small class="text-gray-500 italic">
                (editado em ${AnimuUtils.formatDate(comment.editedAt)})
              </small>
            ` : ''}
            <div class="vote-buttons mt-2">
              <button 
                class="vote-btn vote-btn-like ${userVote === 'like' ? 'active' : ''}"
                onclick="animeChat.voteComment('${animeTitle}', '${comment.id}', 'like')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 10v12" />
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                <span class="vote-count like-count">${comment.likes?.length || 0}</span>
              </button>
              <button 
                class="vote-btn vote-btn-dislike ${userVote === 'dislike' ? 'active' : ''}"
                onclick="animeChat.voteComment('${animeTitle}', '${comment.id}', 'dislike')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 14V2" />
                  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                </svg>
                <span class="vote-count dislike-count">${comment.dislikes?.length || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Atualiza lista completa de comentários
  async updateCommentsList(animeTitle) {
    const commentsList = document.getElementById('comments-list');
    const comments = await this.loadComments(animeTitle);

    if (!comments || comments.length === 0) {
      commentsList.innerHTML = `
        <p class="text-center">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      `;
      return;
    }

    commentsList.innerHTML = comments.map(comment => this.renderComment(comment, animeTitle)).join('');
  }

  // Gerenciamento de exibição de avaliações
  updateRatingDisplay(value) {
    const display = document.getElementById('rating-display');
    if (display) display.textContent = parseFloat(value).toFixed(1);
  }

  // Atualiza emoji da avaliação baseado no valor do slider
  updateRatingEmoji(value, updateInput = true) {
    const emoji = document.getElementById('rating-emoji');
    const display = document.getElementById('rating-display');
    const slider = document.getElementById('rating-slider');
    const rating = parseFloat(value) / 10;

    // Adiciona classe de animação
    emoji.classList.remove('animate');
    void emoji.offsetWidth;
    emoji.classList.add('animate');

    // Define o emoji baseado no valor usando a propriedade estática
    emoji.textContent = AnimeChat.EMOJI_RANGES.find(range => value <= range.max).emoji;

    // Atualiza os valores com precisão de uma casa decimal
    if (updateInput && display) display.value = rating.toFixed(1);
    if (!updateInput && slider) slider.value = Math.round(value);
  }

  // Atualiza contador de caracteres
  updateCharCount(textarea, counterId) {
    const counter = document.getElementById(counterId);
    if (counter) counter.textContent = `${textarea.value.length}/${AnimeChat.MAX_COMMENT_LENGTH}`;
  }

  // Atualiza as estatísticas do anime em tempo real
  updateAnimeStats(animeTitle) {
    // Seleciona os elementos de estatísticas
    const scoreElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const favoritesElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
    const commentsElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
    
    if (!scoreElement || !favoritesElement || !commentsElement) return;

    // Obtém os dados atualizados
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const anime = animes.find(a => a.primaryTitle === animeTitle);
    const comments = (JSON.parse(localStorage.getItem('animeComments')) || {})[animeTitle] || [];
    const favoritesCount = countAnimeFavorites(animeTitle);
    
    // Atualiza os valores na interface
    if (anime) scoreElement.textContent = Number(anime.score).toFixed(1);
    favoritesElement.textContent = favoritesCount;
    commentsElement.textContent = comments.length;
  }
}

// Exporta a classe AnimeChat para uso em outros módulos
window.AnimeChat = AnimeChat;