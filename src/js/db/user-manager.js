class UserManager {
  constructor() {
    this.usersCollection = db.collection('users');
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
      if (userToSave.id && userToSave.id.length > 0) {
        await this.usersCollection.doc(userToSave.id).set(userToSave);
      } else {
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

  // Encontrar usuário por username ou email no Firestore
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

  // Migração de dados do localStorage para o Firebase
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
  
  // Formata uma data do Firestore para exibição
  formatFirestoreDate(firestoreDate, format = 'pt-BR') {
    if (!firestoreDate) return 'Data desconhecida';
    
    let date;
    
    // Verifica se é um timestamp do Firestore
    if (firestoreDate.toDate && typeof firestoreDate.toDate === 'function') date = firestoreDate.toDate();
    else if (firestoreDate.seconds) date = new Date(firestoreDate.seconds * 1000); // Verifica se é um objeto timestamp com segundos/nanossegundos
    else if (typeof firestoreDate === 'string') date = new Date(firestoreDate); // Verifica se é uma string ISO
    else date = new Date(); // Fallback para data atual
    
    // Formata para exibição
    return date.toLocaleDateString(format, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      const userDoc = await this.usersCollection.doc(userId).get();
      if (!userDoc.exists) return false;
      
      const userData = userDoc.data();
      return userData.favoriteAnimes?.includes(animeTitle) || false;
    } catch (error) {
      console.error("Erro ao verificar anime favorito:", error);
      
      // Fallback para localStorage
      const localUsers = JSON.parse(localStorage.getItem('animuUsers') || '[]');
      const user = localUsers.find(u => u.id === userId);
      return user?.favoriteAnimes?.includes(animeTitle) || false;
    }
  }
}
