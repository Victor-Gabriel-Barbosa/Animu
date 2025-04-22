<?php

/**
 * Gerenciador de dados dos desenvolvedores
 * 
 * Este arquivo contém funções para gerenciar os dados dos desenvolvedores
 * do site Animu, incluindo operações de CRUD (Create, Read, Update, Delete)
 */

// Importa o arquivo de configuração do banco de dados
require_once './src/js/db/db-config.php';

/**
 * Obtém todos os desenvolvedores cadastrados
 * 
 * @return array Retorna um array com os dados de todos os desenvolvedores
 */
function getAllDevelopers()
{
  try {
    $conn = getConnection();
    $query = "SELECT * FROM developers ORDER BY name ASC";
    $result = $conn->query($query);

    $developers = [];
    if ($result->num_rows > 0) {
      while ($row = $result->fetch_assoc()) {
        // Converter strings JSON para arrays
        if ($row['skills']) {
          $row['skills'] = json_decode($row['skills'], true);
        }
        if ($row['projects']) {
          $row['projects'] = json_decode($row['projects'], true);
        }
        $developers[] = $row;
      }
    }

    $conn->close();
    return $developers;
  } catch (Exception $e) {
    error_log("Erro ao listar desenvolvedores: " . $e->getMessage());
    return [];
  }
}

/**
 * Obtém os dados de um desenvolvedor específico
 * 
 * @param int $id ID do desenvolvedor
 * @return array|null Dados do desenvolvedor ou null se não encontrado
 */
function getDeveloperById($id)
{
  try {
    $conn = getConnection();
    $query = "SELECT * FROM developers WHERE id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
      $developer = $result->fetch_assoc();

      // Converter strings JSON para arrays
      if ($developer['skills']) {
        $developer['skills'] = json_decode($developer['skills'], true);
      }
      if ($developer['projects']) {
        $developer['projects'] = json_decode($developer['projects'], true);
      }

      $stmt->close();
      $conn->close();
      return $developer;
    }

    $stmt->close();
    $conn->close();
    return null;
  } catch (Exception $e) {
    error_log("Erro ao buscar desenvolvedor: " . $e->getMessage());
    return null;
  }
}

/**
 * Adiciona um novo desenvolvedor
 * 
 * @param array $data Dados do desenvolvedor
 * @return int|bool ID do desenvolvedor inserido ou false em caso de erro
 */
function addDeveloper($data)
{
  try {
    // Prepara os campos JSON
    if (isset($data['skills']) && is_array($data['skills'])) {
      $data['skills'] = json_encode($data['skills']);
    } else {
      $data['skills'] = null;
    }

    if (isset($data['projects']) && is_array($data['projects'])) {
      $data['projects'] = json_encode($data['projects']);
    } else {
      $data['projects'] = null;
    }

    $conn = getConnection();
    $query = "INSERT INTO developers (name, role, bio, photo, github, linkedin, email, website, instagram, skills, projects) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($query);
    $stmt->bind_param(
      "sssssssssss",
      $data['name'],
      $data['role'],
      $data['bio'],
      $data['photo'],
      $data['github'],
      $data['linkedin'],
      $data['email'],
      $data['website'],
      $data['instagram'],
      $data['skills'],
      $data['projects']
    );

    $success = $stmt->execute();

    if ($success) {
      $newId = $conn->insert_id;
      $stmt->close();
      $conn->close();
      return $newId;
    } else {
      $stmt->close();
      $conn->close();
      return false;
    }
  } catch (Exception $e) {
    error_log("Erro ao adicionar desenvolvedor: " . $e->getMessage());
    return false;
  }
}

/**
 * Atualiza os dados de um desenvolvedor existente
 * 
 * @param int $id ID do desenvolvedor
 * @param array $data Novos dados do desenvolvedor
 * @return bool True em caso de sucesso, False em caso de erro
 */
function updateDeveloper($id, $data)
{
  try {
    // Prepara os campos JSON
    if (isset($data['skills']) && is_array($data['skills'])) {
      $data['skills'] = json_encode($data['skills']);
    }

    if (isset($data['projects']) && is_array($data['projects'])) {
      $data['projects'] = json_encode($data['projects']);
    }

    $conn = getConnection();
    $query = "UPDATE developers SET 
                  name = ?, 
                  role = ?, 
                  bio = ?, 
                  photo = ?,
                  github = ?,
                  linkedin = ?,
                  email = ?,
                  website = ?,
                  instagram = ?,
                  skills = ?,
                  projects = ?
                  WHERE id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param(
      "sssssssssssi",
      $data['name'],
      $data['role'],
      $data['bio'],
      $data['photo'],
      $data['github'],
      $data['linkedin'],
      $data['email'],
      $data['website'],
      $data['instagram'],
      $data['skills'],
      $data['projects'],
      $id
    );

    $success = $stmt->execute();
    $stmt->close();
    $conn->close();

    return $success;
  } catch (Exception $e) {
    error_log("Erro ao atualizar desenvolvedor: " . $e->getMessage());
    return false;
  }
}

/**
 * Remove um desenvolvedor do banco de dados
 * 
 * @param int $id ID do desenvolvedor
 * @return bool True em caso de sucesso, False em caso de erro
 */
function deleteDeveloper($id)
{
  try {
    $conn = getConnection();
    $query = "DELETE FROM developers WHERE id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    $success = $stmt->execute();
    $stmt->close();
    $conn->close();

    return $success;
  } catch (Exception $e) {
    error_log("Erro ao deletar desenvolvedor: " . $e->getMessage());
    return false;
  }
}

/**
 * Insere dados iniciais de exemplo para os desenvolvedores
 * Use esta função apenas uma vez para preencher o banco com dados iniciais
 */
function seedDevelopers()
{
  $developers = [
    [
      'name' => 'Victor Gabriel Barbosa',
      'role' => 'Desenvolvedor Full Stack',
      'bio' => 'Desenvolvedor apaixonado por programação e animes, responsável pela criação do Animu.',
      'photo' => 'src/assets/images/default-avatar.jpg',
      'github' => 'https://github.com/Victor-Gabriel-Barbosa',
      'linkedin' => '',
      'email' => 'victorgabrielbarbosa88@gmail.com',
      'website' => '',
      'instagram' => '',
      'skills' => json_encode(['HTML', 'CSS', 'JavaScript', 'Firebase', 'TailwindCSS']),
      'projects' => json_encode([
        [
          'name' => 'Animu',
          'description' => 'Plataforma de comunidade de animes',
          'link' => '#'
        ]
      ])
    ],
    [
      'name' => 'Guilherme Epifanio',
      'role' => 'Desenvolvedor Front-end',
      'bio' => 'Apaixonado por design de interfaces e experiência do usuário, com foco em criar interações agradáveis.',
      'photo' => 'src/assets/images/default-avatar.jpg',
      'github' => '',
      'linkedin' => '',
      'email' => 'guilhermeepifanio14@gmail.com',
      'website' => '',
      'instagram' => '',
      'skills' => json_encode(['HTML', 'CSS', 'JavaScript', 'UI/UX', 'TailwindCSS']),
      'projects' => json_encode([
        [
          'name' => 'Animu',
          'description' => 'Plataforma de comunidade de animes',
          'link' => '#'
        ]
      ])
    ]
  ];

  try {
    $conn = getConnection();

    // Verifica se já existem registros
    $result = $conn->query("SELECT COUNT(*) as count FROM developers");
    $row = $result->fetch_assoc();

    if ($row['count'] > 0) {
      echo "Já existem desenvolvedores cadastrados. O seeding não é necessário.";
      $conn->close();
      return;
    }

    foreach ($developers as $dev) {
      $query = "INSERT INTO developers (name, role, bio, photo, github, linkedin, email, website, instagram, skills, projects) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

      $stmt = $conn->prepare($query);
      $stmt->bind_param(
        "sssssssssss",
        $dev['name'],
        $dev['role'],
        $dev['bio'],
        $dev['photo'],
        $dev['github'],
        $dev['linkedin'],
        $dev['email'],
        $dev['website'],
        $dev['instagram'],
        $dev['skills'],
        $dev['projects']
      );

      $stmt->execute();
      $stmt->close();
    }

    $conn->close();
    echo "Dados de exemplo inseridos com sucesso!";
  } catch (Exception $e) {
    error_log("Erro ao inserir dados de exemplo: " . $e->getMessage());
    echo "Erro ao inserir dados de exemplo: " . $e->getMessage();
  }
}