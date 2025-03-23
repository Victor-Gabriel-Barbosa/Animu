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
    forbiddenWords: [],
    partialCensoring: true, // Habilita censura parcial
    censorCharacter: '•' // Caractere usado para censura
  },
  perspectiveAPI: {
    apiKey: 'AIzaSyAwCIcLXouCkm9stRAWIZkY0_bp5_sx-O8',
    endpoint: 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
    threshold: {
      TOXICITY: 0.7,
      SEVERE_TOXICITY: 0.5,
      IDENTITY_ATTACK: 0.6,
      INSULT: 0.6,
      PROFANITY: 0.6
    }
  }
};

/**
 * Classe responsável pela integração com o Google Perspective API
 * Analisa o texto quanto a toxicidade, insultos, etc.
 */
class ContentModerator {
  static async analyzeText(text) {
    try {
      if (!MODERATION_CONFIG.perspectiveAPI.apiKey || MODERATION_CONFIG.perspectiveAPI.apiKey === 'SUA_CHAVE_API_AQUI') {
        console.warn('Chave da API Perspective não configurada. Usando moderação local.');
        return { success: false, error: 'API_KEY_NOT_CONFIGURED' };
      }

      const response = await fetch(`${MODERATION_CONFIG.perspectiveAPI.endpoint}?key=${MODERATION_CONFIG.perspectiveAPI.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: { text: text },
          languages: ['pt'],
          requestedAttributes: {
            TOXICITY: { spanAnnotations: true },
            SEVERE_TOXICITY: { spanAnnotations: true },
            IDENTITY_ATTACK: { spanAnnotations: true },
            INSULT: { spanAnnotations: true },
            PROFANITY: { spanAnnotations: true }
          },
          spanAnnotations: true
        })
      });

      if (!response.ok) {
        console.error('Falha ao analisar texto com Perspective API:', await response.text());
        return { success: false, error: 'API_REQUEST_FAILED' };
      }

      const data = await response.json();
      
      // Extrai scores gerais
      const scores = {
        TOXICITY: data.attributeScores?.TOXICITY?.summaryScore?.value || 0,
        SEVERE_TOXICITY: data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value || 0,
        IDENTITY_ATTACK: data.attributeScores?.IDENTITY_ATTACK?.summaryScore?.value || 0,
        INSULT: data.attributeScores?.INSULT?.summaryScore?.value || 0,
        PROFANITY: data.attributeScores?.PROFANITY?.summaryScore?.value || 0
      };
      
      // Extrai spans problemáticos
      const spans = [];
      
      // Para cada atributo, verifica os spans anotados
      Object.keys(MODERATION_CONFIG.perspectiveAPI.threshold).forEach(attribute => {
        if (!data.attributeScores?.[attribute]?.spanScores) return;
        
        data.attributeScores[attribute].spanScores.forEach(span => {
          const spanScore = span.score?.value || 0;
          const threshold = MODERATION_CONFIG.perspectiveAPI.threshold[attribute];
          
          // Se o score do span é maior que o threshold, marca para censura
          if (spanScore >= threshold) {
            spans.push({
              begin: span.begin,
              end: span.end,
              score: spanScore,
              attribute
            });
          }
        });
      });
      
      return { success: true, scores, spans };
    } catch (error) {
      console.error('Erro ao analisar texto com Perspective API:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Verifica se o conteúdo deve ser sinalizado para censura
  static shouldFlagContent(scores) {
    if (!scores) return false;
    
    return Object.keys(MODERATION_CONFIG.perspectiveAPI.threshold).some(attribute => {
      const score = scores[attribute];
      const threshold = MODERATION_CONFIG.perspectiveAPI.threshold[attribute];
      return score >= threshold;
    });
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
    
    // Se estiver usando a API, não precisa censurar aqui
    // a validação completa é feita na classe ContentModerator
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
        const hasProblemContent = ContentModerator.shouldFlagContent(analysis.scores);
        
        if (hasProblemContent) {
          // Se a censura parcial está habilitada, censura apenas as partes problemáticas
          if (MODERATION_CONFIG.moderation.partialCensoring && analysis.spans && analysis.spans.length > 0) {
            const censoredText = ContentModerator.censorTextPartially(plainContent, analysis.spans);
            return { isValid: true, censoredText, wasCensored: true };
          } else throw new Error(`O ${type} contém conteúdo impróprio ou ofensivo. Por favor, revise seu texto.`); // Caso contrário, rejeita o conteúdo
        }
      } else if (MODERATION_CONFIG.moderation.fallbackToLocalModeration) {
        // Usa moderação local como fallback se a API falhar
        const hasForbiddenWords = MODERATION_CONFIG.moderation.forbiddenWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(plainContent);
        });

        if (hasForbiddenWords) {
          if (MODERATION_CONFIG.moderation.partialCensoring) {
            const censoredText = TextFormatter.censorText(plainContent);
            return { isValid: true, censoredText, wasCensored: true };
          } else throw new Error(`O ${type} contém palavras inapropriadas.`);
        }
      }
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