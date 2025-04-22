<?php

/**
 * Painel Administrativo de Gerenciamento de Desenvolvedores
 * 
 * Permite cadastrar, alterar e deletar os membros
 * da equipe de desenvolvimento que aparecem no portfolio
 */

// Inicia a sessão para autenticação
session_start();

// Inclui arquivos necessários
require_once './src/js/db/db-config.php';
require_once 'developers-manager.php';

// Flag para controlar mensagens de sucesso ou erro
$message = '';
$messageType = '';

// Verifica se o usuário está fazendo logout
if (isset($_GET['logout'])) {
  session_destroy();
  header('Location: ' . $_SERVER['PHP_SELF']);
  exit;
}

// Funções de manipulação de imagem
function uploadImage($file)
{
  $target_dir = "src/assets/images/developers/";

  // Cria o diretório se não existir
  if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
  }

  $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
  $new_filename = uniqid() . '.' . $file_extension;
  $target_file = $target_dir . $new_filename;

  // Verifica se é uma imagem válida
  $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
  if (!in_array($file_extension, $allowed_types)) {
    return [
      'success' => false,
      'message' => 'Apenas arquivos JPG, JPEG, PNG e GIF são permitidos.'
    ];
  }

  // Verifica o tamanho do arquivo (máx. 2MB)
  if ($file['size'] > 2000000) {
    return [
      'success' => false,
      'message' => 'O arquivo é muito grande. Tamanho máximo: 2MB.'
    ];
  }

  // Tenta fazer o upload
  if (move_uploaded_file($file['tmp_name'], $target_file)) {
    return [
      'success' => true,
      'file_path' => $target_file
    ];
  } else {
    return [
      'success' => false,
      'message' => 'Erro ao fazer upload da imagem.'
    ];
  }
}

// Adiciona desenvolvedor no banco de dados
if (isset($_POST['add_developer'])) {
  // Prepara os dados dos projetos
  $projects = [];
  if (!empty($_POST['project_names']) && is_array($_POST['project_names'])) {
    foreach ($_POST['project_names'] as $key => $name) {
      if (!empty($name)) {
        $projects[] = [
          'name' => $name,
          'description' => $_POST['project_descriptions'][$key] ?? '',
          'link' => $_POST['project_links'][$key] ?? '#'
        ];
      }
    }
  }

  // Prepara os dados do desenvolvedor
  $developer_data = [
    'name' => $_POST['name'] ?? '',
    'role' => $_POST['role'] ?? '',
    'bio' => $_POST['bio'] ?? '',
    'photo' => 'src/assets/images/default-avatar.jpg', // Valor padrão
    'github' => $_POST['github'] ?? '',
    'linkedin' => $_POST['linkedin'] ?? '',
    'email' => $_POST['email'] ?? '',
    'website' => $_POST['website'] ?? '',
    'instagram' => $_POST['instagram'] ?? '',
    'skills' => !empty($_POST['skills']) ? explode(',', $_POST['skills']) : [],
    'projects' => $projects
  ];

  // Verifica se foi enviada uma foto
  if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $upload_result = uploadImage($_FILES['photo']);
    if ($upload_result['success']) {
      $developer_data['photo'] = $upload_result['file_path'];
    } else {
      $message = $upload_result['message'];
      $messageType = 'error';
    }
  }

  // Validação básica
  if (empty($developer_data['name']) || empty($developer_data['role']) || empty($developer_data['bio'])) {
    $message = 'Os campos Nome, Cargo e Biografia são obrigatórios!';
    $messageType = 'error';
  } else {
    // Tenta adicionar o desenvolvedor
    $result = addDeveloper($developer_data);
    if ($result) {
      $message = 'Desenvolvedor adicionado com sucesso!';
      $messageType = 'success';
    } else {
      $message = 'Erro ao adicionar desenvolvedor.';
      $messageType = 'error';
    }
  }
}

// Processa edição de desenvolvedor
if (isset($_POST['edit_developer'])) {
  $id = (int)$_POST['developer_id'];

  // Preparar os dados dos projetos
  $projects = [];
  if (!empty($_POST['project_names']) && is_array($_POST['project_names'])) {
    foreach ($_POST['project_names'] as $key => $name) {
      if (!empty($name)) {
        $projects[] = [
          'name' => $name,
          'description' => $_POST['project_descriptions'][$key] ?? '',
          'link' => $_POST['project_links'][$key] ?? '#'
        ];
      }
    }
  }

  // Prepara os dados do desenvolvedor
  $developer_data = [
    'name' => $_POST['name'] ?? '',
    'role' => $_POST['role'] ?? '',
    'bio' => $_POST['bio'] ?? '',
    'github' => $_POST['github'] ?? '',
    'linkedin' => $_POST['linkedin'] ?? '',
    'email' => $_POST['email'] ?? '',
    'website' => $_POST['website'] ?? '',
    'instagram' => $_POST['instagram'] ?? '',
    'skills' => !empty($_POST['skills']) ? explode(',', $_POST['skills']) : [],
    'projects' => $projects
  ];

  // Recupera o desenvolvedor atual para manter a foto se não houver upload
  $current_dev = getDeveloperById($id);
  $developer_data['photo'] = $current_dev['photo'];

  // Verifica se foi enviada uma nova foto
  if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $upload_result = uploadImage($_FILES['photo']);
    if ($upload_result['success']) {
      $developer_data['photo'] = $upload_result['file_path'];

      // Remove a foto antiga se não for a padrão
      if ($current_dev['photo'] != 'src/assets/images/default-avatar.jpg' && file_exists($current_dev['photo'])) unlink($current_dev['photo']);
    } else {
      $message = $upload_result['message'];
      $messageType = 'error';
    }
  }

  // Valida os dados 
  if (empty($developer_data['name']) || empty($developer_data['role']) || empty($developer_data['bio'])) {
    $message = 'Os campos Nome, Cargo e Biografia são obrigatórios!';
    $messageType = 'error';
  } else {
    // Tenta atualizar o desenvolvedor
    $result = updateDeveloper($id, $developer_data);
    if ($result) {
      $message = 'Desenvolvedor atualizado com sucesso!';
      $messageType = 'success';
    } else {
      $message = 'Erro ao atualizar desenvolvedor.';
      $messageType = 'error';
    }
  }
}

// Processa exclusão de desenvolvedor
if (isset($_GET['delete'])) {
  $id = (int)$_GET['delete'];

  // Recupera o desenvolvedor para excluir a foto
  $developer = getDeveloperById($id);

  $result = deleteDeveloper($id);
  if ($result) {
    // Remove a foto se não for a padrão
    if ($developer['photo'] != 'src/assets/images/default-avatar.jpg' && file_exists($developer['photo'])) unlink($developer['photo']);

    $message = 'Desenvolvedor excluído com sucesso!';
    $messageType = 'success';
  } else {
    $message = 'Erro ao excluir desenvolvedor.';
    $messageType = 'error';
  }
}

// Carrega os desenvolvedores para exibir na lista
$developers = getAllDevelopers();

// Carrega um desenvolvedor específico para edição se necessário
$editDeveloper = null;
if (isset($_GET['edit'])) {
  $editId = (int)$_GET['edit'];
  $editDeveloper = getDeveloperById($editId);
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gerenciamento de Desenvolvedores - Animu</title>

  <!-- Bootstrap e Tailwind CSS e jQuery -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

  <!-- Script de verificação de administrador -->
  <script src="src/js/mod/animu-utils.js"></script>
  <script>
    // Verifica permissões de administrador
    (function() {
      if (!AnimuUtils.isUserAdmin()) {
        alert('Acesso negado. Esta página é restrita a administradores.');
        window.location.href = 'index.html';
      }
    })();
  </script>

  <!-- Importa fontes e ícones -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="src/css/animu.css">
  <link rel="stylesheet" href="src/css/navbar.css">
  <link rel="stylesheet" href="src/css/portfolio.css">
  <link rel="icon" href="src/assets/images/favicon/favicon.ico" type="image/x-icon">

  <style>
    .admin-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
      padding: 1rem 0;
      color: white;
    }
  </style>
</head>

<body>
  <header class="admin-header">
    <div class="container">
      <h1 class="fs-2 fw-bold text-white text-center">Portfólio</h1>
      <?php if ($_SESSION['admin_logged_in'] ?? false): ?>
        <div class="d-flex align-items-center gap-4">
          <a href="portfolio.php" class="text-white text-decoration-none" target="_blank">
            <i class="fi fi-rr-arrow-up-right-from-square me-1"></i>
            Ver Portfolio
          </a>
          <a href="?logout=1" class="text-white text-decoration-none">
            <i class="fi fi-rr-sign-out me-1"></i>
            Sair
          </a>
        </div>
      <?php endif; ?>
    </div>
  </header>

  <main class="container-fluid py-4">
    <!-- Painel Administrativo -->
    <?php if ($message): ?>
      <div class="alert <?= $messageType === 'error' ? 'alert-danger' : 'alert-success' ?>">
        <?= $message ?>
      </div>
    <?php endif; ?>

    <!-- Lista de Desenvolvedores -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card-body">
          <h2 class="fs-4 fw-bold mb-3 text-center">Desenvolvedores Cadastrados</h2>

          <?php if (empty($developers)): ?>
            <p class="text-center py-4 text-secondary">Nenhum desenvolvedor cadastrado.</p>
          <?php else: ?>
            <div class="table-responsive">
              <table class="">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Email</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($developers as $dev): ?>
                    <tr>
                      <td>
                        <img src="<?= htmlspecialchars($dev['photo']) ?>"
                          alt="<?= htmlspecialchars($dev['name']) ?>"
                          class="img-thumbnail rounded-circle"
                          style="width: 40px; height: 40px; object-fit: cover;">
                      </td>
                      <td><?= htmlspecialchars($dev['name']) ?></td>
                      <td><?= htmlspecialchars($dev['role']) ?></td>
                      <td><?= htmlspecialchars($dev['email']) ?></td>
                      <td>
                        <div class="action-buttons">
                          <a href="?edit=<?= $dev['id'] ?>" title="Editar Dev" class="btn-action btn-edit">
                            <i class="fi fi-bs-edit"></i>
                          </a>
                          <a href="?delete=<?= $dev['id'] ?>" title="Remover Dev" class="btn-action btn-delete"
                            onclick="return confirm('Tem certeza que deseja excluir este desenvolvedor?')">
                            <i class="fi fi-bs-trash"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- Formulário de Adição/Edição -->
    <div class="row">
      <div class="col-12">
        <div class="card-body">
          <h2 class="fs-4 fw-bold mb-3 mt-6 text-center">
            <?= $editDeveloper ? 'Editar Desenvolvedor' : 'Adicionar Desenvolvedor' ?>
          </h2>

          <form method="post" action="" enctype="multipart/form-data">
            <?php if ($editDeveloper): ?>
              <input type="hidden" name="developer_id" value="<?= $editDeveloper['id'] ?>">
            <?php endif; ?>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="name" class="form-label">Nome*</label>
                <input type="text" id="name" name="name" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['name']) : '' ?>" required>
              </div>

              <div class="col-md-6 mb-3">
                <label for="role" class="form-label">Cargo*</label>
                <input type="text" id="role" name="role" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['role']) : '' ?>" required>
              </div>
            </div>

            <div class="mb-3">
              <label for="bio" class="form-label">Biografia*</label>
              <textarea id="bio" name="bio" class="form-control" rows="4" required><?= $editDeveloper ? htmlspecialchars($editDeveloper['bio']) : '' ?></textarea>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Foto de Perfil</label>
                <?php if ($editDeveloper && $editDeveloper['photo']): ?>
                  <div class="mb-2">
                    <img src="<?= htmlspecialchars($editDeveloper['photo']) ?>" alt="Preview" class="avatar-preview">
                  </div>
                <?php endif; ?>
                <input type="file" id="photo" name="photo" class="form-control" accept="image/*">
                <small class="text-muted">Formatos suportados: JPG, JPEG, PNG, GIF. Tamanho máximo: 2MB.</small>
              </div>

              <div class="col-md-6 mb-3">
                <label for="skills" class="form-label">Habilidades</label>
                <input type="text" id="skills" name="skills" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars(implode(',', $editDeveloper['skills'] ?? [])) : '' ?>"
                  placeholder="HTML,CSS,JavaScript,PHP">
                <small class="text-muted">Separadas por vírgulas</small>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="github" class="form-label">GitHub</label>
                <input type="url" id="github" name="github" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['github']) : '' ?>"
                  placeholder="https://github.com/username">
              </div>

              <div class="col-md-6 mb-3">
                <label for="linkedin" class="form-label">LinkedIn</label>
                <input type="url" id="linkedin" name="linkedin" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['linkedin']) : '' ?>"
                  placeholder="https://linkedin.com/in/username">
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" id="email" name="email" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['email']) : '' ?>">
              </div>

              <div class="col-md-4 mb-3">
                <label for="website" class="form-label">Website</label>
                <input type="url" id="website" name="website" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['website']) : '' ?>">
              </div>

              <div class="col-md-4 mb-3">
                <label for="instagram" class="form-label">Instagram</label>
                <input type="url" id="instagram" name="instagram" class="form-control"
                  value="<?= $editDeveloper ? htmlspecialchars($editDeveloper['instagram']) : '' ?>"
                  placeholder="https://instagram.com/username">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Projetos</label>
              <div id="projects-container">
                <?php
                if ($editDeveloper && !empty($editDeveloper['projects'])):
                  foreach ($editDeveloper['projects'] as $index => $project):
                ?>
                    <div class="project-item">
                      <div class="mb-2">
                        <label class="form-label">Nome do Projeto</label>
                        <input type="text" name="project_names[]" class="form-control"
                          value="<?= htmlspecialchars($project['name']) ?>">
                      </div>
                      <div class="mb-2">
                        <label class="form-label">Descrição</label>
                        <input type="text" name="project_descriptions[]" class="form-control"
                          value="<?= htmlspecialchars($project['description']) ?>">
                      </div>
                      <div class="mb-2">
                        <label class="form-label">Link</label>
                        <input type="url" name="project_links[]" class="form-control"
                          value="<?= htmlspecialchars($project['link']) ?>">
                      </div>
                      <button type="button" class="btn-action btn-cancel btn-sm remove-project">
                        <span class="flex items-center justify-center gap-2">
                          <i class="fi fi-br-circle-xmark"></i>
                          Remover Projeto
                        </span>
                      </button>
                    </div>
                  <?php
                  endforeach;
                else:
                  ?>
                  <div class="project-item">
                    <div class="mb-2">
                      <label class="form-label">Nome do Projeto</label>
                      <input type="text" name="project_names[]" class="form-control">
                    </div>
                    <div class="mb-2">
                      <label class="form-label">Descrição</label>
                      <input type="text" name="project_descriptions[]" class="form-control">
                    </div>
                    <div class="mb-2">
                      <label class="form-label">Link</label>
                      <input type="url" name="project_links[]" class="form-control">
                    </div>
                    <button type="button" class="btn-action btn-cancel btn-sm remove-project">
                      <span class="flex items-center justify-center gap-2">
                        <i class="fi fi-br-circle-xmark"></i>
                        Remover Projeto
                      </span>
                    </button>
                  </div>
                <?php endif; ?>
              </div>
              <button type="button" id="add-project" class="btn-action btn-primary mt-2">
                <span class="flex items-center justify-center gap-2">
                  <i class="fi fi-br-checkbox"></i>
                  Adicionar Projeto
                </span>
              </button>
            </div>

            <div class="d-grid gap-2 mt-4">
              <button type="submit" name="<?= $editDeveloper ? 'edit_developer' : 'add_developer' ?>" class="btn-action btn-primary">
                <span class="flex items-center justify-center gap-2">
                  <i class="fi fi-br-checkbox"></i>
                  <?= $editDeveloper ? 'Salvar Alterações' : 'Adicionar Desenvolvedor' ?>
                </span>
              </button>

              <?php if ($editDeveloper): ?>
                <a href="<?= $_SERVER['PHP_SELF'] ?>" class="btn-action btn-cancel">Cancelar Edição</a>
              <?php endif; ?>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>

  <!-- Scripts do Firebase -->
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
  <script src="src/js/db/firebase-config.js"></script>
  <script src="src/js/db/users-manager.js"></script>

  <!-- Bootstrap Bundle com Popper JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Scripts personalizados -->
  <script src="src/js/animu.js"></script>
  <script src="src/js/mod/navbar.js"></script>
  <script src="src/js/admin/portfolio-admin.js"></script>
</body>

</html>