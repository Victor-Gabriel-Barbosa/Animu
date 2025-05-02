/**
 * Classe responsável por gerenciar dados de usuários no Firestore,
 * fornecendo uma camada de abstração para operações de CRUD
 */
class UserManager {
  constructor() {
    this.db = firebase.firestore();
    this.usersCollection = this.db.collection('users');
    
    // Flag para controlar disponibilidade do Firestore
    this.isFirestoreAvailable = true;
    
    // Verifica conexão no início
    this.checkConnection();
  }

  // Verifica a conexão com o Firebase usando a função centralizada
  async checkConnection() {
    try {
      const isConnected = await window.testFirebaseConnection();
      this.isFirestoreAvailable = isConnected;
      
      if (!isConnected) {
        console.warn('Firebase indisponível para UserManager, usando localStorage como fallback');
      }
      
      return isConnected;
    } catch (error) {
      console.error('Erro ao verificar conexão do Firebase:', error);
      this.isFirestoreAvailable = false;
      return false;
    }
  }

  // Carrega usuários do Firestore
  async loadUsers() {
    try {
      const snapshot = await this.usersCollection.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao carregar usuários do Firebase:", error);

      // Fallback para localStorage se o Firebase falhar
      return JSON.parse(localStorage.getItem('animuUsers') || '[]');
    }
  }

  // Salva um usuário no Firestore
  async saveUser(user) {
    try {
      // Cria uma cópia do objeto para não modificar o original
      const userToSave = { ...user };
      
      // Garante que as datas são armazenadas corretamente
      if (!userToSave.createdAt) {
        userToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        userToSave.createdAtClient = new Date().toISOString();
      }
      
      // Registra a data da última atualização
      userToSave.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      // Se o usuário já tem ID, atualiza o documento existente
      if (userToSave.id && userToSave.id.length > 0) await this.usersCollection.doc(userToSave.id).set(userToSave);
      else {
        // Caso contrário, cria novo documento com ID gerado pelo Firestore
        const docRef = await this.usersCollection.add(userToSave);
        userToSave.id = docRef.id;
      }
      
      return userToSave;
    } catch (error) {
      console.error("Erro ao salvar usuário no Firebase:", error);
      throw error;
    }
  }

  // Encontra usuário por username ou email no Firestore
  async findUser(identifier) {
    try {
      // Busca por username
      let snapshot = await this.usersCollection.where('username', '==', identifier).get();
      
      // Se não encontrou por username, busca por email
      if (snapshot.empty) snapshot = await this.usersCollection.where('email', '==', identifier).get();
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          ...userData
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      throw error;
    }
  }

  // Encontra usuário por email
  async findUserByEmail(email) {
    try {
      const snapshot = await this.usersCollection.where('email', '==', email).get();
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          ...userData
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      throw error;
    }
  }

  // Atualiza dados de um usuário
  async updateUser(userId, userData) {
    try {
      // Registra a data da última atualização
      const dataToUpdate = {
        ...userData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await this.usersCollection.doc(userId).update(dataToUpdate);
      
      // Retorna o usuário atualizado
      return await this.getUserById(userId);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  }

  // Obtém um usuário por ID
  async getUserById(userId) {
    try {
      const doc = await this.usersCollection.doc(userId).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      throw error;
    }
  }

  // Migra dados do localStorage para o Firebase
  async migrateLocalStorageToFirebase() {
    try {
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      if (localUsers.length === 0) return;

      // Para cada usuário no localStorage
      for (const user of localUsers) {
        // Verifica se o usuário já existe no Firestore
        const existingUser = await this.findUser(user.username);
        if (!existingUser) {
          // Se não existir, salva no Firestore com timestamp
          await this.saveUser({
            ...user,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAtClient: user.createdAt || new Date().toISOString()
          });
        }
      }
      
      console.log('Migração de usuários para o Firebase concluída');
    } catch (error) {
      console.error('Erro na migração de usuários para o Firebase:', error);
    }
  }

  // Verifica usuário ou e-mail existente no Firestore
  async checkUserExists(username, email) {
    try {
      const usernameSnapshot = await this.usersCollection.where('username', '==', username).get();
      const emailSnapshot = await this.usersCollection.where('email', '==', email).get();

      return {
        usernameExists: !usernameSnapshot.empty,
        emailExists: !emailSnapshot.empty
      };
    } catch (error) {
      console.error("Erro ao verificar usuário existente:", error);
      throw error;
    }
  }

  // Gerencia os favoritos de um usuário
  async toggleAnimeFavorite(userId, animeTitle) {
    try {
      // Busca o documento do usuário
      const userRef = this.usersCollection.doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) throw new Error(`Usuário com ID ${userId} não encontrado`);
      
      const userData = userDoc.data();
      let favoriteAnimes = userData.favoriteAnimes || [];
      
      // Verifica se o anime já está nos favoritos
      const isFavorited = favoriteAnimes.includes(animeTitle);
      
      // Atualiza a lista de favoritos
      if (isFavorited) favoriteAnimes = favoriteAnimes.filter(title => title !== animeTitle);
      else favoriteAnimes.push(animeTitle);
      
      // Atualiza o documento do usuário no Firestore
      await userRef.update({
        favoriteAnimes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Atualiza o localStorage para manter consistência
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const userIndex = localUsers.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        localUsers[userIndex].favoriteAnimes = favoriteAnimes;
        localStorage.setItem('animuUsers', JSON.stringify(localUsers));
      }
      
      // Atualiza o cache após a operação
      this.updateFavoriteCache(userId, animeTitle, !isFavorited);
      
      console.log(`Anime ${animeTitle} ${!isFavorited ? 'adicionado aos' : 'removido dos'} favoritos do usuário ${userId}`);
      
      return {
        success: true,
        isFavorited: !isFavorited,
        favoriteAnimes
      };
    } catch (error) {
      console.error("Erro ao atualizar favoritos do usuário:", error);
      return { success: false, error: error.message };
    }
  }

  // Verifica se um anime está na lista de favoritos do usuário
  async isAnimeFavorited(userId, animeTitle) {
    try {
      // Primeiro verifica se existe em cache da sessão atual
      const cachedResult = this.getCachedFavoriteStatus(userId, animeTitle);
      if (cachedResult !== null) return cachedResult;
      
      // Se não encontrou em cache, busca do Firestore
      const userDoc = await this.usersCollection.doc(userId).get();
      if (!userDoc.exists) return false;
      
      const userData = userDoc.data();
      const isFavorited = userData.favoriteAnimes?.includes(animeTitle) || false;
      
      // Atualiza o cache para acessos futuros
      this.updateFavoriteCache(userId, animeTitle, isFavorited);
      
      return isFavorited;
    } catch (error) {
      console.error("Erro ao verificar anime favorito:", error);
      
      // Fallback para localStorage
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const user = localUsers.find(u => u.id === userId);
      return user?.favoriteAnimes?.includes(animeTitle) || false;
    }
  }

  // Método auxiliar para gerenciar cache de favoritos
  getCachedFavoriteStatus(userId, animeTitle) {
    try {
      const favoritesCache = JSON.parse(localStorage.getItem('favoriteStatusCache') || '{}');
      const userCache = favoritesCache[userId];
      
      if (userCache && userCache.hasOwnProperty(animeTitle)) {
        // Verifica se o cache não expirou (15 minutos)
        const cacheTime = userCache[animeTitle].timestamp || 0;
        const now = Date.now();
        if (now - cacheTime < 15 * 60 * 1000) return userCache[animeTitle].status;
      }
      return null; // Cache não encontrado ou expirado
    } catch (e) {
      console.warn('Erro ao acessar cache de favoritos:', e);
      return null;
    }
  }

  // Atualiza o cache de status de favoritos
  updateFavoriteCache(userId, animeTitle, status) {
    try {
      const favoritesCache = JSON.parse(localStorage.getItem('favoriteStatusCache') || '{}');
      
      if (!favoritesCache[userId]) favoritesCache[userId] = {};
      
      favoritesCache[userId][animeTitle] = {
        status: status,
        timestamp: Date.now()
      };
      
      localStorage.setItem('favoriteStatusCache', JSON.stringify(favoritesCache));
    } catch (e) {
      console.warn('Erro ao atualizar cache de favoritos:', e);
    }
  }
  
  // Atualiza o cache de favoritos para todos os animes
  async updateFavoritesCache(userId) {
    try {
      const userDoc = await this.usersCollection.doc(userId).get();
      if (!userDoc.exists) return;
      
      const userData = userDoc.data();
      const favoriteAnimes = userData.favoriteAnimes || [];
      
      // Atualiza o localStorage para manter consistência
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const userIndex = localUsers.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        localUsers[userIndex].favoriteAnimes = favoriteAnimes;
        localStorage.setItem('animuUsers', JSON.stringify(localUsers));
      }
      
      // Limpa e atualiza o cache de status
      const favoritesCache = JSON.parse(localStorage.getItem('favoriteStatusCache') || '{}');
      favoritesCache[userId] = {};
      
      // Preenche o cache com o status atual
      const now = Date.now();
      favoriteAnimes.forEach(title => {
        favoritesCache[userId][title] = {
          status: true,
          timestamp: now
        };
      });
      
      localStorage.setItem('favoriteStatusCache', JSON.stringify(favoritesCache));
      
      return favoriteAnimes;
    } catch (error) {
      console.error("Erro ao atualizar cache de favoritos:", error);
      return null;
    }
  }

  // Atualiza o avatar do usuário
  async updateUserAvatar(userId, newAvatarUrl) {
    try {
      // Busca o documento do usuário
      const userRef = this.usersCollection.doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) throw new Error(`Usuário com ID ${userId} não encontrado`);
      
      // Atualiza o avatar no Firestore
      await userRef.update({
        avatar: newAvatarUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Atualiza também no localStorage se existir
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      if (userSession && userSession.userId === userId) {
        userSession.avatar = newAvatarUrl;
        localStorage.setItem('userSession', JSON.stringify(userSession));
      }
      
      // Atualiza o localStorage de usuários se existir
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const userIndex = localUsers.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        localUsers[userIndex].avatar = newAvatarUrl;
        localStorage.setItem('animuUsers', JSON.stringify(localUsers));
      }
      
      console.log(`Avatar do usuário ${userId} atualizado com sucesso`);
      
      return {
        success: true,
        newAvatar: newAvatarUrl
      };
    } catch (error) {
      console.error("Erro ao atualizar avatar do usuário:", error);
      return { success: false, error: error.message };
    }
  }

  // Recupera o avatar de um usuário pelo ID
  async getUserAvatar(userId) {
    try {
      // Verifica primeiro na sessão do usuário (se for o usuário atual)
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      if (userSession && userSession.userId === userId && userSession.avatar) {
        return userSession.avatar;
      }
      
      // Se não encontrou na sessão ou não é o usuário atual, busca no Firestore
      const userDoc = await this.usersCollection.doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData.avatar || null;
      }
      
      // Fallback para localStorage
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const localUser = localUsers.find(user => user.id === userId);
      
      return localUser?.avatar || null;
    } catch (error) {
      console.error("Erro ao recuperar avatar do usuário:", error);
      return null;
    }
  }
}

// Exporta a classe para uso em outros arquivos
window.UserManager = UserManager;