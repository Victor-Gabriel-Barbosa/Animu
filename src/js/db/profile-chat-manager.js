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
   * Verifica se o Firestore está disponível
   * @returns {Promise<boolean>} true se estiver disponível, false caso contrário
   */
  async checkFirestoreConnection() {
    try {
      // Tenta acessar o Firestore com um timeout
      const connectionTestPromise = this.db.collection('connection_test').doc('test').get();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
      
      await Promise.race([connectionTestPromise, timeoutPromise]);
      this.isFirestoreAvailable = true;
      return true;
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
    
    // Criar objeto de mensagem
    const newMessage = {
      senderId,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    if (this.isFirestoreAvailable) {
      try {
        // Tenta salvar no Firestore
        await this.chatsCollection.doc(chatId).collection('messages').add({
          ...newMessage,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
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
      // Usar apenas localStorage se Firestore não estiver disponível
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
              timestamp: data.timestamp || new Date(data.createdAt?.toDate()).toISOString()
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
            timestamp: data.timestamp || new Date(data.createdAt?.toDate()).toISOString()
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
}

// Exporta a classe para uso em outros módulos
window.ProfileChatManager = ProfileChatManager;