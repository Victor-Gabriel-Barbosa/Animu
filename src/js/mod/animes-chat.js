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

  // Construtor para inicializar estilos de votação
  constructor() {
    this.addVoteButtonStyles();
    this.initListeners();
  }

  // Método para inicializar os event listeners
  initListeners() {
    // Inicializa listeners globais
    $(document).on('input', '#rating-slider', (e) => {
      this.updateRatingEmoji($(e.target).val());
    });
    
    $(document).on('input', '#rating-display', (e) => {
      let value = parseFloat($(e.target).val());
      
      // Valida o valor
      if (isNaN(value)) value = 0;
      if (value < 0) value = 0;
      if (value > 10) value = 10;
      
      // Multiplica por 10 para a escala do slider
      this.updateRatingEmoji(value * 10, false);
    });
    
    // Formata o valor quando o input perde o foco
    $(document).on('blur', '#rating-display', (e) => {
      let value = parseFloat($(e.target).val() || 0);
      $(e.target).val((Math.round(value * 10) / 10).toFixed(1));
    });
  }

  // Adiciona estilos CSS para os botões de votação
  addVoteButtonStyles() {
    const styleId = 'vote-button-styles';
    if ($('#' + styleId).length) return;
    
    $('<style>', {
      id: styleId,
      html: `
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
      `
    }).appendTo('head');
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

      const sliderRating = $('#rating-slider').val() / 10;

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
        
        // Atualiza a interface imediatamente removendo o elemento
        $(`[data-comment-id="${commentId}"]`).remove();
        
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

  // Método para indicador de carregamento nos botões de voto
  setVoteButtonLoading(commentId, voteType, isLoading) {
    const $button = $(`[data-comment-id="${commentId}"] .vote-btn-${voteType}`);
    
    if ($button.length) {
      $button.toggleClass('loading', isLoading);
      $button.prop('disabled', isLoading);
    }
  }

  // Método para atualizar apenas um comentário específico no DOM
  updateCommentInUI(commentId, updatedComment) {
    const $commentElement = $(`[data-comment-id="${commentId}"]`);
    if (!$commentElement.length) return;
    
    // Atualiza os contadores de likes/dislikes
    $commentElement.find('.like-count').text(updatedComment.likes?.length || 0);
    $commentElement.find('.dislike-count').text(updatedComment.dislikes?.length || 0);
    
    // Atualiza o estado dos botões para o usuário atual
    const currentUser = JSON.parse(localStorage.getItem('userSession'))?.username;
    
    $commentElement.find('.vote-btn-like')
      .toggleClass('active', updatedComment.likes?.includes(currentUser) || false);
    
    $commentElement.find('.vote-btn-dislike')
      .toggleClass('active', updatedComment.dislikes?.includes(currentUser) || false);
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
    const $commentDiv = $(`[data-comment-id="${commentId}"]`);
    const $commentText = $commentDiv.find('.comment-text');
    const $commentRating = $commentDiv.find('.comment-rating');
    const $editForm = $commentDiv.find('.edit-form');

    if ($editForm.length) {
      $commentText.show();
      $commentRating.show();
      $editForm.remove();
    } else {
      const currentText = $commentText.text();
      const currentRating = parseFloat($commentDiv.attr('data-rating')) * 10;

      $commentText.hide();
      $commentRating.hide();

      const $form = $('<form>', {
        class: 'edit-form mt-2',
        html: `
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
            <button type="button" class="btn-cancel-edit btn-action btn-cancel order-2 sm:order-1 w-full py-2 text-sm">
              <span class="flex items-center justify-center gap-2">
                <i class="fi fi-br-circle-xmark"></i>
                Cancelar
              </span>
            </button>
          </div>
        `
      });

      $commentText.after($form);

      // Inicializa o contador de caracteres
      const $textarea = $form.find('textarea');
      const $counter = $form.find(`#edit-comment-count-${commentId}`);
      $counter.text(`${$textarea.val().length}/${AnimeChat.MAX_COMMENT_LENGTH}`);

      // Adicionar evento ao textarea para contar caracteres
      $textarea.on('input', () => {
        $counter.text(`${$textarea.val().length}/${AnimeChat.MAX_COMMENT_LENGTH}`);
      });

      // Inicializa o slider e input de avaliação na edição
      const $editSlider = $form.find('#edit-rating-slider');
      const $editInput = $form.find('#edit-rating-display');

      $editSlider.on('input', (e) => {
        this.updateEditRatingDisplay($(e.target).val());
      });

      $editInput.on('input', (e) => {
        let value = parseFloat($(e.target).val());

        // Valida o valor
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        if (value > 10) value = 10;

        // Multiplica por 10 para a escala do slider
        this.updateEditRatingDisplay(value * 10, false);
      });

      // Formata o valor quando o input perde o foco
      $editInput.on('blur', (e) => {
        let value = parseFloat($(e.target).val() || 0);
        $(e.target).val((Math.round(value * 10) / 10).toFixed(1));
      });

      this.updateEditRatingDisplay(currentRating);

      // Evento de cancelamento
      $form.find('.btn-cancel-edit').on('click', () => {
        this.toggleEditMode(commentId);
      });

      // Evento de submissão do formulário
      $form.on('submit', async (e) => {
        e.preventDefault();
        const newText = $form.find('textarea').val().trim();
        const newRating = parseFloat($form.find('#edit-rating-slider').val()) / 10;

        if (newText) {
          const animeTitle = new URLSearchParams(window.location.search).get('anime');
          
          // Adiciona estado de carregamento ao botão
          const $submitButton = $(e.target).find('button[type="submit"]');
          const originalText = $submitButton.html();
          $submitButton.prop('disabled', true);
          $submitButton.html('<span class="animate-spin mr-2">⏳</span> Salvando...');
          
          try {
            const result = await this.editComment(decodeURIComponent(animeTitle), commentId, newText, newRating);
            if (result) this.updateCommentsList(decodeURIComponent(animeTitle));
          } catch (error) {
            console.error('Erro ao editar comentário:', error);
            alert('Ocorreu um erro ao editar seu comentário. Por favor, tente novamente.');
          } finally {
            // Restaura o botão original (mesmo que não seja mais visível)
            $submitButton.prop('disabled', false);
            $submitButton.html(originalText);
          }
        }
      });
    }
  }

  // Atualiza interface visual da avaliação durante edição
  updateEditRatingDisplay(value, updateInput = true) {
    const $emoji = $('#edit-rating-emoji');
    const $display = $('#edit-rating-display');
    const $slider = $('#edit-rating-slider');
    const rating = value / 10;

    // Adiciona classe de animação
    $emoji.removeClass('animate');
    void $emoji[0].offsetWidth;
    $emoji.addClass('animate');

    // Define o emoji baseado no valor usando a propriedade estática
    $emoji.text(AnimeChat.EMOJI_RANGES.find(range => value <= range.max).emoji);

    // Atualiza os valores
    if (updateInput && $display.length) $display.val(rating.toFixed(1));
    if (!updateInput && $slider.length) $slider.val(Math.round(value));
  }

  // Renderiza comentário individual com controles de moderação
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
    const comments = await this.loadComments(animeTitle);
    const $commentsList = $('#comments-list');

    if (!comments || comments.length === 0) {
      $commentsList.html(`
        <p class="text-center">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      `);
      return;
    }

    $commentsList.html(comments.map(comment => this.renderComment(comment, animeTitle)).join(''));
  }

  // Gerenciamento de exibição de avaliações
  updateRatingDisplay(value) {
    $('#rating-display').text(parseFloat(value).toFixed(1));
  }

  // Atualiza emoji da avaliação baseado no valor do slider
  updateRatingEmoji(value, updateInput = true) {
    const $emoji = $('#rating-emoji');
    const $display = $('#rating-display');
    const $slider = $('#rating-slider');
    const rating = parseFloat(value) / 10;

    // Adiciona classe de animação
    $emoji.removeClass('animate');
    void $emoji[0].offsetWidth;
    $emoji.addClass('animate');

    // Define o emoji baseado no valor usando a propriedade estática
    $emoji.text(AnimeChat.EMOJI_RANGES.find(range => value <= range.max).emoji);

    // Atualiza os valores com precisão de uma casa decimal
    if (updateInput && $display.length) $display.val(rating.toFixed(1));
    if (!updateInput && $slider.length) $slider.val(Math.round(value));
  }

  // Atualiza contador de caracteres
  updateCharCount(textarea, counterId) {
    $(`#${counterId}`).text(`${$(textarea).val().length}/${AnimeChat.MAX_COMMENT_LENGTH}`);
  }

  // Atualiza as estatísticas do anime em tempo real
  updateAnimeStats(animeTitle) {
    // Seleciona os elementos de estatísticas
    const $scoreElement = $('.stat-item:nth-child(1) .stat-value');
    const $favoritesElement = $('.stat-item:nth-child(2) .stat-value');
    const $commentsElement = $('.stat-item:nth-child(3) .stat-value');
    
    if (!$scoreElement.length || !$favoritesElement.length || !$commentsElement.length) return;

    // Obtém os dados atualizados
    const animes = JSON.parse(localStorage.getItem('animeData')) || [];
    const anime = animes.find(a => a.primaryTitle === animeTitle);
    const comments = (JSON.parse(localStorage.getItem('animeComments')) || {})[animeTitle] || [];
    const favoritesCount = countAnimeFavorites(animeTitle);
    
    // Atualiza os valores na interface
    if (anime) $scoreElement.text(Number(anime.score).toFixed(1));
    $favoritesElement.text(favoritesCount);
    $commentsElement.text(comments.length);
  }
}

// Exporta a classe AnimeChat para uso em outros módulos
window.AnimeChat = AnimeChat;