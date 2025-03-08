/**
 * Configurações globais da aplicação
 */
const CONFIG = {
  // Configurações da Google Perspective API
  perspectiveAPI: {
    apiKey: 'SUA_CHAVE_API_AQUI', // Substitua pela sua chave da API
    endpoint: 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
    threshold: {
      TOXICITY: 0.7,
      SEVERE_TOXICITY: 0.5,
      IDENTITY_ATTACK: 0.7,
      INSULT: 0.7,
      PROFANITY: 0.8
    }
  }
};
