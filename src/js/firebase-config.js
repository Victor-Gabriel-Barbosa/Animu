// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB55iTvI1h9kZq-TZHskxREJVqZk35-sKQ",
  authDomain: "animu-c107c.firebaseapp.com",
  projectId: "animu-c107c",
  storageBucket: "animu-c107c.firebasestorage.app",
  messagingSenderId: "1034762107992",
  appId: "1:1034762107992:web:229ac293339355b9949e2d"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Exporta referências de serviços para uso em outros arquivos
const auth = firebase.auth();
const db = firebase.firestore();

// Função para verificar a conexão com o Firebase
async function verificarConexaoFirebase() {
  try {
    await db.collection('test-connection').doc('test').set({timestamp: firebase.firestore.FieldValue.serverTimestamp()});
    console.log('Conectado com sucesso ao Firebase');
    return true;
  } catch (error) {
    console.error('Erro na conexão com o Firebase:', error);
    alert('Erro ao conectar com o banco de dados. Por favor, verifique sua conexão de internet.');
    return false;
  }
}

// Verifica a conexão ao carregar a página
verificarConexaoFirebase();
