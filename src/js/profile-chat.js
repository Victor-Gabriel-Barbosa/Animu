/**
 * Chat - Gerencia conversas entre usuários da plataforma Animu
 * Armazena e recupera mensagens do localStorage
 */
class Chat {
  constructor() {
    // Inicializa mensagens do localStorage ou cria objeto vazio
    this.messages = JSON.parse(localStorage.getItem('animuChats')) || {};
  }

  /**
   * Envia uma mensagem entre dois usuários e persiste no localStorage
   * @param {string} senderId - ID do remetente
   * @param {string} receiverId - ID do destinatário
   * @param {string|object} message - Conteúdo da mensagem (texto ou objeto)
   * @returns {object} A mensagem criada com timestamp
   */
  sendMessage(senderId, receiverId, message) {
    const chatId = this.getChatId(senderId, receiverId);
    // Cria array de mensagens para o chat se não existir
    if (!this.messages[chatId]) this.messages[chatId] = [];

    let messageContent = message;

    const newMessage = {
      senderId,
      message: messageContent,
      timestamp: new Date().toISOString() // Registra data/hora da mensagem
    };

    // Adiciona ao histórico e salva no localStorage
    this.messages[chatId].push(newMessage);
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
    return newMessage;
  }

  /**
   * Recupera histórico de mensagens entre dois usuários
   * @param {string} senderId - ID do primeiro usuário
   * @param {string} receiverId - ID do segundo usuário
   * @returns {array} Lista de mensagens ou array vazio
   */
  getMessages(senderId, receiverId) {
    const chatId = this.getChatId(senderId, receiverId);
    return this.messages[chatId] || [];
  }

  /**
   * Gera ID único para identificar a conversa entre dois usuários
   * Ordena os IDs para garantir consistência independente da ordem dos parâmetros
   */
  getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('-');
  }
}