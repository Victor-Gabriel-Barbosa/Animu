<?php
/**
 * Configurações de conexão com o banco de dados MySQL
 * 
 * Arquivo responsável por estabelecer a conexão com o banco de dados
 * MySQL utilizado pelo sistema de portfolio de desenvolvedores do Animu
 */

// Definição das constantes de conexão
define('DB_HOST', 'localhost');  // Host do banco de dados
define('DB_USER', 'root');       // Usuário do banco de dados
define('DB_PASS', '');           // Senha do banco de dados 
define('DB_NAME', 'animu_db');   // Nome do banco de dados
define('DB_CHARSET', 'utf8mb4'); // Charset do banco de dados

/**
 * Estabelece conexão com o banco de dados MySQL
 * 
 * @return mysqli Objeto de conexão com o banco de dados
 * @throws Exception Se não for possível conectar ao banco de dados
 */
function getConnection() {
  // Cria uma nova conexão com MySQL
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  
  // Verifica se houve erro na conexão
  if ($conn->connect_error) throw new Exception("Falha na conexão com o banco de dados: " . $conn->connect_error);
  
  // Define o charset da conexão
  $conn->set_charset(DB_CHARSET);
  
  return $conn;
}

/**
 * Script para criar o banco de dados e as tabelas necessárias
 * 
 * Este script deve ser executado apenas uma vez para configurar o banco de dados
 */
function setupDatabase() {
  // Conecta ao servidor MySQL sem especificar um banco de dados
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
  
  if ($conn->connect_error) die("Erro na conexão: " . $conn->connect_error);
  
  // Cria o banco de dados se ele não existir
  $sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET " . DB_CHARSET . " COLLATE " . DB_CHARSET . "_unicode_ci";
  
  if ($conn->query($sql) === FALSE) die("Erro ao criar o banco de dados: " . $conn->error);
  
  // Seleciona o banco de dados
  $conn->select_db(DB_NAME);
  
  // Cria a tabela de desenvolvedores
  $sql = "CREATE TABLE IF NOT EXISTS developers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    bio TEXT NOT NULL,
    photo VARCHAR(255) DEFAULT 'src/assets/images/default-avatar.jpg',
    github VARCHAR(255),
    linkedin VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    instagram VARCHAR(255),
    skills TEXT,
    projects TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )";
  
  if ($conn->query($sql) === FALSE) die("Erro ao criar a tabela developers: " . $conn->error);
  
  echo "Banco de dados e tabelas criados com sucesso!";
  $conn->close();
}

?>