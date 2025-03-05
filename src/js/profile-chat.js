// Classe de gerenciamento do Chat entre usuários
class Chat {
  constructor() {
    this.messages = JSON.parse(localStorage.getItem('animuChats')) || {};
  }

  sendMessage(senderId, receiverId, message) {
    const chatId = this.getChatId(senderId, receiverId);
    if (!this.messages[chatId]) this.messages[chatId] = [];

    let messageContent;
    try {
      // Verifica se é uma mensagem especial (objeto JSON)
      messageContent = message;
    } catch (e) {
      // Mensagem normal de texto
      messageContent = message;
    }

    const newMessage = {
      senderId,
      message: messageContent,
      timestamp: new Date().toISOString()
    };

    this.messages[chatId].push(newMessage);
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
    return newMessage;
  }

  getMessages(senderId, receiverId) {
    const chatId = this.getChatId(senderId, receiverId);
    return this.messages[chatId] || [];
  }

  getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('-');
  }
}