/**
 * Configurações globais da aplicação
 */
const CONFIG = {
  // Configurações da Google Perspective API
  perspectiveAPI: {
    apiKey: 'AIzaSyAwCIcLXouCkm9stRAWIZkY0_bp5_sx-O8', 
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
