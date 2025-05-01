// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB55iTvI1h9kZq-TZHskxREJVqZk35-sKQ",
  authDomain: "animu-c107c.firebaseapp.com",
  projectId: "animu-c107c",
  storageBucket: "animu-c107c.firebasestorage.app",
  messagingSenderId: "1034762107992",
  appId: "1:1034762107992:web:229ac293339355b9949e2d"
};

// Verifica se o Firebase já foi inicializado para evitar inicialização múltipla
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
else firebase.app(); // Usa o app já inicializado

// Exporta referências de serviços para uso em outros arquivos
const auth = firebase.auth();
const db = firebase.firestore();

// Configuração do provedor de autenticação do Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ativa a persistência para funcionar offline
db.enablePersistence().catch((err) => {
  console.error("Erro ao ativar persistência:", err.code);
});

// Função para verificar a conexão com o Firebase
async function checkFirebaseConnection() {
  try {
    const docRef = db.collection('test-connection').doc('test');
    await docRef.set({timestamp: firebase.firestore.FieldValue.serverTimestamp()});
    console.log('Conectado com sucesso ao Firebase');
    return true;
  } catch (error) {
    console.error('Erro na conexão com o Firebase:', error);
    if (error.code === 'unavailable') console.log('O dispositivo está offline. Os dados serão sincronizados quando a conexão for restabelecida.');
    else alert('Erro ao conectar com o banco de dados. Por favor, verifique sua conexão de internet.');
    return false;
  }
}

// Verifica a conexão ao carregar a página
window.addEventListener('DOMContentLoaded', checkFirebaseConnection);

// Disponibiliza uma função global para debug do Firebase
window.testFirebaseConnection = checkFirebaseConnection;