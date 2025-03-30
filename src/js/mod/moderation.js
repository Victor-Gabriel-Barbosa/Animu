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
    forbiddenWords: [],
    partialCensoring: true, // Habilita censura parcial
    censorCharacter: '•' // Caractere usado para censura
  }
};

/**
 * Classe responsável pela moderação de conteúdo baseada em palavras proibidas
 */
class ContentModerator {
  // Verifica se o texto contém palavras proibidas
  static containsForbiddenWords(text) {
    if (!text || !MODERATION_CONFIG.moderation.forbiddenWords.length) return false;
    
    return MODERATION_CONFIG.moderation.forbiddenWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(text);
    });
  }
  
  // Identifica e retorna spans de palavras proibidas no texto
  static identifyForbiddenWordSpans(text) {
    const spans = [];
    
    if (!text || !MODERATION_CONFIG.moderation.forbiddenWords.length) return spans;
    
    MODERATION_CONFIG.moderation.forbiddenWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        spans.push({
          begin: match.index,
          end: match.index + match[0].length,
          word: match[0]
        });
      }
    });
    
    return spans;
  }
  
  // Censura apenas partes específicas do texto
  static censorTextPartially(text, spans) {
    if (!spans || spans.length === 0) return text;
    
    // Ordena os spans de trás para frente para não afetar os índices
    const sortedSpans = [...spans].sort((a, b) => b.begin - a.begin);
    
    let censoredText = text;
    const censorChar = MODERATION_CONFIG.moderation.censorCharacter;
    
    for (const span of sortedSpans) {
      const { begin, end } = span;
      const replacement = censorChar.repeat(end - begin);
      censoredText = censoredText.substring(0, begin) + replacement + censoredText.substring(end);
    }
    
    return censoredText;
  }
}

/**
 * Classe responsável por formatar e sanitizar o texto dos posts
 * Inclui funções para censura, formatação Markdown e emojis
 */
class TextFormatter {
  static async format(text) {
    // Primeiro formata menções, markdown e emojis
    let formattedText = this.formatMentions(text);
    formattedText = this.formatMarkdown(formattedText);
    formattedText = this.formatEmojis(formattedText);
    
    // Censura palavras proibidas
    formattedText = this.censorText(formattedText);
    
    return formattedText;
  }

  // Censura palavras proibidas com '•'
  static censorText(text) {
    let censoredText = text;
    MODERATION_CONFIG.moderation.forbiddenWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
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

    // Checando por palavras proibidas
    const hasForbiddenWords = ContentModerator.containsForbiddenWords(plainContent);
    
    if (hasForbiddenWords) {
      if (MODERATION_CONFIG.moderation.partialCensoring) {
        const spans = ContentModerator.identifyForbiddenWordSpans(plainContent);
        const censoredText = ContentModerator.censorTextPartially(plainContent, spans);
        return { isValid: true, censoredText, wasCensored: true };
      } else throw new Error(`O ${type} contém palavras inapropriadas.`);
    }

    return { isValid: true, censoredText: plainContent, wasCensored: false };
  }

  // Valida as tags do conteúdo
  static async validateTags(tags) {
    if (!Array.isArray(tags)) return [];

    const validatedTags = [];
    
    for (const tag of tags) {
      try {
        const result = await this.validateContent(tag, 'tag');
        // Limpa caracteres especiais
        const cleanedTag = result.censoredText ? result.censoredText.replace(/[^a-zA-Z0-9\*]/g, '') : 
                                               tag.replace(/[^a-zA-Z0-9\*]/g, '');
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
    const response = await fetch('src/assets/badwords.json');
    const data = await response.json();
    MODERATION_CONFIG.moderation.forbiddenWords = data.palavroes;
    console.log(`Carregados ${data.palavroes.length} termos para moderação`);
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