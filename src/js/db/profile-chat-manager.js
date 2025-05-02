/**
 * Gerencia conversas entre usuários da plataforma Animu
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

/**
 * Gerencia conversas entre usuários da plataforma Animu
 * Implementa armazenamento no Firestore com fallback para localStorage
 * Estende a classe Chat original
 */
class ProfileChatManager extends Chat {
  constructor() {
    super(); // Inicializa a classe base (Chat) com o localStorage
    
    // Obtém referência do Firestore do firebase-config.js
    this.db = firebase.firestore();
    this.chatsCollection = this.db.collection('profileChats');
    
    // Flag para rastrear disponibilidade do Firestore
    this.isFirestoreAvailable = true;
    
    // Verifica conexão com Firestore no início
    this.checkFirestoreConnection();
  }

  /**
   * Verifica se o Firestore está disponível usando a função centralizada
   * @returns {Promise<boolean>} true se estiver disponível, false caso contrário
   */
  async checkFirestoreConnection() {
    try {
      // Usa a função centralizada de firebase-config.js
      const isConnected = await window.testFirebaseConnection();
      this.isFirestoreAvailable = isConnected;
      return isConnected;
    } catch (error) {
      console.warn('Firestore indisponível, usando localStorage como fallback:', error);
      this.isFirestoreAvailable = false;
      return false;
    }
  }

  /**
   * Gera ID único para identificar a conversa entre dois usuários
   * Ordena os IDs para garantir consistência independente da ordem dos parâmetros
   */
  getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('-');
  }

  /**
   * Envia uma mensagem entre dois usuários, salva no Firestore com fallback para localStorage
   * @param {string} senderId - ID do remetente
   * @param {string} receiverId - ID do destinatário 
   * @param {string|object} message - Conteúdo da mensagem (texto ou objeto)
   * @returns {Promise<object>} A mensagem criada com timestamp
   */
  async sendMessage(senderId, receiverId, message) {
    const chatId = this.getChatId(senderId, receiverId);
    
    // Cria objeto de mensagem
    const newMessage = {
      senderId,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    if (this.isFirestoreAvailable) {
      try {
        // Tenta salvar no Firestore
        const docRef = await this.chatsCollection.doc(chatId).collection('messages').add({
          ...newMessage,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualiza o objeto com o ID do documento
        newMessage.id = docRef.id;
        
        // Atualiza também o localStorage para acesso offline
        this.updateLocalStorage(chatId, newMessage);
        
        return newMessage;
      } catch (error) {
        console.error('Erro ao salvar mensagem no Firestore:', error);
        this.isFirestoreAvailable = false;
        
        // Fallback para localStorage
        return this.saveToLocalStorage(chatId, newMessage);
      }
    } else {
      // Usa apenas localStorage se Firestore não estiver disponível
      return this.saveToLocalStorage(chatId, newMessage);
    }
  }
  
  /**
   * Salva mensagem apenas no localStorage (usado como fallback)
   * @param {string} chatId - ID da conversa
   * @param {object} message - Objeto de mensagem
   * @returns {object} A mensagem criada
   */
  saveToLocalStorage(chatId, message) {
    // Gera um ID único para a mensagem
    if (!message.id) {
      message.id = 'local_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 9);
    }
    
    // Cria array de mensagens para o chat se não existir
    if (!this.messages[chatId]) this.messages[chatId] = [];
    
    // Adiciona ao histórico e salva no localStorage
    this.messages[chatId].push(message);
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
    
    return message;
  }
  
  /**
   * Atualiza o localStorage com uma nova mensagem (para manter cópia local)
   * @param {string} chatId - ID da conversa
   * @param {object} message - Objeto de mensagem 
   */
  updateLocalStorage(chatId, message) {
    // Cria array de mensagens para o chat se não existir
    if (!this.messages[chatId]) this.messages[chatId] = [];
    
    // Adiciona ao histórico e salva no localStorage
    this.messages[chatId].push(message);
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
  }

  /**
   * Recupera histórico de mensagens entre dois usuários
   * Busca do Firestore e cai para localStorage se necessário
   * @param {string} senderId - ID do primeiro usuário
   * @param {string} receiverId - ID do segundo usuário
   * @returns {Promise<array>} Lista de mensagens ou array vazio
   */
  async getMessages(senderId, receiverId) {
    const chatId = this.getChatId(senderId, receiverId);
    
    if (this.isFirestoreAvailable) {
      try {
        // Tenta buscar do Firestore
        const snapshot = await this.chatsCollection.doc(chatId)
          .collection('messages')
          .orderBy('createdAt')
          .get();
        
        if (!snapshot.empty) {
          const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              senderId: data.senderId,
              message: data.message,
              timestamp: data.timestamp || new Date(data.createdAt?.toDate()).toISOString(),
              edited: data.edited || false,
              editedAt: data.editedAt ? new Date(data.editedAt.toDate()).toISOString() : null
            };
          });
          
          // Atualiza o localStorage com os dados do Firestore para uso offline
          this.messages[chatId] = messages;
          localStorage.setItem('animuChats', JSON.stringify(this.messages));
          
          return messages;
        }
        
        // Se não houver mensagens no Firestore, verifica no localStorage
        return this.messages[chatId] || [];
      } catch (error) {
        console.error('Erro ao buscar mensagens do Firestore:', error);
        this.isFirestoreAvailable = false;
        
        // Fallback para localStorage
        return this.messages[chatId] || [];
      }
    } else return this.messages[chatId] || []; // Usa o localStorage se Firestore não estiver disponível
  }
  
  /**
   * Sincroniza mensagens de todas as conversas do localStorage para o Firestore
   * Útil quando a conexão é restabelecida após período offline
   * @returns {Promise<boolean>} true se sincronização ocorreu com sucesso
   */
  async syncLocalToFirestore() {
    if (!this.isFirestoreAvailable) {
      await this.checkFirestoreConnection();
      if (!this.isFirestoreAvailable) return false;
    }
    
    try {
      // Itera por todas as conversas salvas no localStorage
      const batch = this.db.batch();
      let operationsCount = 0;
      let batchCount = 0;
      
      for (const [chatId, messages] of Object.entries(this.messages)) {
        // Pula se não houver mensagens
        if (!messages || !messages.length) continue;
        
        // Verifica mensagens já existentes no Firestore para evitar duplicações
        const existingMsgs = await this.chatsCollection.doc(chatId)
          .collection('messages')
          .get();
        
        const existingTimestamps = new Set();
        existingMsgs.forEach(doc => {
          const data = doc.data();
          if (data.timestamp) existingTimestamps.add(data.timestamp);
        });
        
        // Adiciona apenas mensagens que não existem ainda no Firestore
        for (const message of messages) {
          if (!existingTimestamps.has(message.timestamp)) {
            const docRef = this.chatsCollection.doc(chatId)
              .collection('messages')
              .doc();
              
            batch.set(docRef, {
              ...message,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            operationsCount++;
            
            // Firestore suporta até 500 operações por batch
            if (operationsCount >= 450) {
              await batch.commit();
              batch = this.db.batch();
              operationsCount = 0;
              batchCount++;
            }
          }
        }
      }
      
      // Commit final se houver operações pendentes
      if (operationsCount > 0) {
        await batch.commit();
        batchCount++;
      }
      
      console.log(`Sincronização completa: ${batchCount} batches processados`);
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar mensagens com Firestore:', error);
      this.isFirestoreAvailable = false;
      return false;
    }
  }
  
  /**
   * Escuta por mudanças em tempo real na conversa entre dois usuários
   * @param {string} senderId - ID do primeiro usuário
   * @param {string} receiverId - ID do segundo usuário
   * @param {Function} callback - Função chamada quando há mudanças
   * @returns {Function} Função para cancelar a escuta
   */
  listenToMessages(senderId, receiverId, callback) {
    if (!this.isFirestoreAvailable) {
      console.warn('Firestore indisponível, não é possível escutar mudanças em tempo real');
      return () => {}; // Função vazia para cancelar escuta
    }
    
    const chatId = this.getChatId(senderId, receiverId);
    
    // Cria listener para mudanças na coleção de mensagens
    const unsubscribe = this.chatsCollection.doc(chatId)
      .collection('messages')
      .orderBy('createdAt')
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            message: data.message,
            timestamp: data.timestamp || new Date(data.createdAt?.toDate()).toISOString(),
            edited: data.edited || false,
            editedAt: data.editedAt ? new Date(data.editedAt.toDate()).toISOString() : null
          };
        });
        
        // Atualiza localStorage
        this.messages[chatId] = messages;
        localStorage.setItem('animuChats', JSON.stringify(this.messages));
        
        // Notifica o callback
        callback(messages);
      }, error => {
        console.error('Erro ao escutar mudanças no chat:', error);
        this.isFirestoreAvailable = false;
      });
      
    return unsubscribe;
  }

  /**
   * Edita uma mensagem existente
   * @param {string} senderId - ID do remetente
   * @param {string} receiverId - ID do destinatário
   * @param {string} messageId - ID da mensagem
   * @param {string} newContent - Novo texto da mensagem
   * @returns {Promise<boolean>} true se a edição foi bem sucedida
   */
  async editMessage(senderId, receiverId, messageId, newContent) {
    const chatId = this.getChatId(senderId, receiverId);
    
    if (this.isFirestoreAvailable) {
      try {
        // Verifica se o usuário é o autor da mensagem
        const messageRef = this.chatsCollection.doc(chatId)
          .collection('messages')
          .doc(messageId);
          
        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) throw new Error('Mensagem não encontrada');
        
        const messageData = messageDoc.data();
        if (messageData.senderId !== senderId) throw new Error('Apenas o remetente pode editar a mensagem');
        
        // Atualiza a mensagem no Firestore
        await messageRef.update({
          message: newContent,
          edited: true,
          editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualiza no localStorage
        if (this.messages[chatId]) {
          const index = this.messages[chatId].findIndex(m => m.id === messageId);
          if (index !== -1) {
            this.messages[chatId][index].message = newContent;
            this.messages[chatId][index].edited = true;
            this.messages[chatId][index].editedAt = new Date().toISOString();
            localStorage.setItem('animuChats', JSON.stringify(this.messages));
          }
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao editar mensagem no Firestore:', error);
        this.isFirestoreAvailable = false;
        
        // Fallback para localStorage
        return this.editMessageInLocalStorage(chatId, messageId, senderId, newContent);
      }
    } else {
      // Apenas localStorage
      return this.editMessageInLocalStorage(chatId, messageId, senderId, newContent);
    }
  }
  
  /**
   * Edita uma mensagem existente no localStorage
   * @param {string} chatId - ID da conversa
   * @param {string} messageId - ID da mensagem
   * @param {string} senderId - ID do remetente
   * @param {string} newContent - Novo texto da mensagem
   * @returns {boolean} true se a edição foi bem sucedida
   */
  editMessageInLocalStorage(chatId, messageId, senderId, newContent) {
    if (!this.messages[chatId]) return false;
    
    const index = this.messages[chatId].findIndex(m => m.id === messageId);
    if (index === -1) return false;
    
    // Verifica se o usuário é o autor da mensagem
    if (this.messages[chatId][index].senderId !== senderId) return false;
    
    // Atualiza a mensagem
    this.messages[chatId][index].message = newContent;
    this.messages[chatId][index].edited = true;
    this.messages[chatId][index].editedAt = new Date().toISOString();
    
    // Salva no localStorage
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
    return true;
  }

  /**
   * Exclui uma mensagem existente
   * @param {string} senderId - ID do remetente
   * @param {string} receiverId - ID do destinatário
   * @param {string} messageId - ID da mensagem
   * @returns {Promise<boolean>} true se a exclusão foi bem sucedida
   */
  async deleteMessage(senderId, receiverId, messageId) {
    const chatId = this.getChatId(senderId, receiverId);
    
    if (this.isFirestoreAvailable) {
      try {
        // Verifica se o usuário é o autor da mensagem
        const messageRef = this.chatsCollection.doc(chatId)
          .collection('messages')
          .doc(messageId);
          
        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) throw new Error('Mensagem não encontrada');
        
        const messageData = messageDoc.data();
        if (messageData.senderId !== senderId) throw new Error('Apenas o remetente pode excluir a mensagem');
        
        // Exclui a mensagem no Firestore
        await messageRef.delete();
        
        // Exclui no localStorage
        if (this.messages[chatId]) {
          this.messages[chatId] = this.messages[chatId].filter(m => m.id !== messageId);
          localStorage.setItem('animuChats', JSON.stringify(this.messages));
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao excluir mensagem no Firestore:', error);
        this.isFirestoreAvailable = false;
        
        // Fallback para localStorage
        return this.deleteMessageFromLocalStorage(chatId, messageId, senderId);
      }
    } else {
      // Apenas localStorage
      return this.deleteMessageFromLocalStorage(chatId, messageId, senderId);
    }
  }
  
  /**
   * Exclui uma mensagem existente no localStorage
   * @param {string} chatId - ID da conversa
   * @param {string} messageId - ID da mensagem
   * @param {string} senderId - ID do remetente
   * @returns {boolean} true se a exclusão foi bem sucedida
   */
  deleteMessageFromLocalStorage(chatId, messageId, senderId) {
    if (!this.messages[chatId]) return false;
    
    // Verifica se o usuário é o autor da mensagem
    const message = this.messages[chatId].find(m => m.id === messageId);
    if (!message || message.senderId !== senderId) return false;
    
    // Filtrar a mensagem a ser excluída
    this.messages[chatId] = this.messages[chatId].filter(m => m.id !== messageId);
    
    // Salvar no localStorage
    localStorage.setItem('animuChats', JSON.stringify(this.messages));
    return true;
  }
}

// Exporta a classe para uso em outros módulos
window.ProfileChatManager = ProfileChatManager;