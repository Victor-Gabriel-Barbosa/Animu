/**
 * Sistema de Moderação de Conteúdo
 * Utiliza Google Perspective API para detectar conteúdo tóxico
 */

// Configurações globais de moderação
const MODERATION_CONFIG = {
  maxContentLength: {
    comentário: 500,
    título: 100,
    conteúdo: 2000,
    resposta: 500,
    tag: 30
  },
  moderation: {
    usePerspectiveAPI: true, 
    fallbackToLocalModeration: true, // Se a API falhar, usa moderação local
    forbiddenWords: [] 
  }
};

/**
 * Classe responsável pela integração com o Google Perspective API
 * Analisa o texto quanto a toxicidade, insultos, etc.
 */
class ContentModerator {
  static async analyzeText(text) {
    try {
      if (!CONFIG.perspectiveAPI.apiKey || CONFIG.perspectiveAPI.apiKey === 'SUA_CHAVE_API_AQUI') {
        console.warn('Chave da API Perspective não configurada. Usando moderação local.');
        return { success: false, error: 'API_KEY_NOT_CONFIGURED' };
      }

      const response = await fetch(`${CONFIG.perspectiveAPI.endpoint}?key=${CONFIG.perspectiveAPI.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: { text: text },
          languages: ['pt'],
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {}
          }
        })
      });

      if (!response.ok) {
        console.error('Falha ao analisar texto com Perspective API:', await response.text());
        return { success: false, error: 'API_REQUEST_FAILED' };
      }

      const data = await response.json();
      const scores = {
        TOXICITY: data.attributeScores?.TOXICITY?.summaryScore?.value || 0,
        SEVERE_TOXICITY: data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value || 0,
        IDENTITY_ATTACK: data.attributeScores?.IDENTITY_ATTACK?.summaryScore?.value || 0,
        INSULT: data.attributeScores?.INSULT?.summaryScore?.value || 0,
        PROFANITY: data.attributeScores?.PROFANITY?.summaryScore?.value || 0
      };

      return { success: true, scores };
    } catch (error) {
      console.error('Erro ao analisar texto com Perspective API:', error);
      return { success: false, error: error.message };
    }
  }

  static shouldFlagContent(scores) {
    if (!scores) return false;
    
    return Object.keys(CONFIG.perspectiveAPI.threshold).some(attribute => {
      const score = scores[attribute];
      const threshold = CONFIG.perspectiveAPI.threshold[attribute];
      return score >= threshold;
    });
  }
}

/**
 * Classe responsável por formatar e sanitizar o texto dos posts
 * Inclui funções para censura, formatação Markdown e emojis
 */
class TextFormatter {
  static async format(text) {
    // Primeiro formatamos menções, markdown e emojis
    let formattedText = this.formatMentions(text);
    formattedText = this.formatMarkdown(formattedText);
    formattedText = this.formatEmojis(formattedText);
    
    // Se estiver usando a API, não precisamos censurar aqui
    // a validação completa é feita na clase ContentModerator
    if (!MODERATION_CONFIG.moderation.usePerspectiveAPI) formattedText = this.censorText(formattedText);
    
    return formattedText;
  }

  // Censura palavras proibidas com '•'
  static censorText(text) {
    let censoredText = text;
    MODERATION_CONFIG.moderation.forbiddenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      censoredText = censoredText.replace(regex, match => '•'.repeat(match.length));
    });
    return censoredText;
  }

  // Formata links do texto para abrir em uma nova aba
  static formatMentions(text) {
    return text.replace(/@(\w+)/g, '<a href="#user-$1" class="mention">@$1</a>');
  }

  // Formata Markdown em tags HTML para renderizar na interface
  static formatMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Negrito
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Itálico
    text = text.replace(/`(.*?)`/g, '<code>$1</code>'); // Código
    return text;
  }

  // Substitui códigos de emoji por emojis reais
  static formatEmojis(text) {
    const emojiMap = {
      ':)': '😊',
      ':(': '😢',
      ':D': '😀',
      '<3': '❤️',
      '>:(': '😡',
      ':O': '😲',
      ':P': '😛'
    };

    return text.replace(/:\)|:\(|:D|<3|>:\(|:O|:P/g, match => emojiMap[match]);
  }
}

/**
 * Classe que gerencia a moderação de conteúdo
 * Valida conteúdo, tags e permissões dos usuários
 */
class ContentValidator {
  static async validateContent(content, type = 'conteúdo') {
    const plainContent = content.replace(/<[^>]*>/g, '').trim();

    if (!plainContent) throw new Error(`O ${type} não pode estar vazio.`);

    const maxLength = MODERATION_CONFIG.maxContentLength[type];
    if (maxLength && plainContent.length > maxLength) throw new Error(`O ${type} excede o limite máximo de ${maxLength} caracteres.`);

    // Usando Perspective API para checar conteúdo impróprio
    if (MODERATION_CONFIG.moderation.usePerspectiveAPI) {
      const analysis = await ContentModerator.analyzeText(plainContent);
      
      if (analysis.success) {
        if (ContentModerator.shouldFlagContent(analysis.scores)) throw new Error(`O ${type} contém conteúdo impróprio ou ofensivo. Por favor, revise seu texto.`);
      } else if (MODERATION_CONFIG.moderation.fallbackToLocalModeration) {
        // Usar moderação local como fallback se a API falhar
        const hasForbiddenWords = MODERATION_CONFIG.moderation.forbiddenWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(plainContent);
        });

        if (hasForbiddenWords) throw new Error(`O ${type} contém palavras inapropriadas.`);
      }
    }

    return true;
  }

  // Valida as tags do conteúdo
  static async validateTags(tags) {
    if (!Array.isArray(tags)) return [];

    const validatedTags = [];
    
    for (const tag of tags) {
      try {
        await this.validateContent(tag, 'tag');
        // Limpa caracteres especiais
        const cleanedTag = tag.replace(/[^a-zA-Z0-9\*]/g, '');
        validatedTags.push(cleanedTag);
      } catch (error) {
        console.warn(`Tag "${tag}" inválida: ${error.message}`);
      }
    }
    
    return validatedTags;
  }

  // Verifica se o usuário está logado para postar
  static canUserPost() {
    return !!JSON.parse(localStorage.getItem('userSession'));
  }
}

// Função para carregar a lista de palavrões
async function loadBadWords() {
  try {
    const response = await fetch('src/data/badwords.json');
    const data = await response.json();
    MODERATION_CONFIG.moderation.forbiddenWords = data.palavroes;
    return data.palavroes;
  } catch (error) {
    console.error('Erro ao carregar lista de palavrões:', error);
    return [];
  }
}

// Inicializa o módulo de moderação carregando os recursos necessários
async function initModeration() {
  await loadBadWords();
  console.log('Sistema de moderação inicializado!');
}

// Inicializa o sistema automaticamente
initModeration();

// Exporta as classes e funções para uso em outros arquivos
window.ContentModerator = ContentModerator;
window.TextFormatter = TextFormatter;
window.ContentValidator = ContentValidator;