<?php

/**
 * Página de Portfolio dos Desenvolvedores do Animu
 * 
 * Exibe informações sobre os desenvolvedores do site Animu,
 * mostrando suas habilidades, projetos e informações de contato.
 */

// Inclui o arquivo de gerenciamento dos desenvolvedores
require_once 'developers-manager.php';

// Obtém todos os desenvolvedores do banco de dados
$developers = getAllDevelopers();

// Verifica se é uma requisição para visualizar detalhes de um desenvolvedor específico
$singleDev = null;
if (isset($_GET['id'])) {
  $id = (int)$_GET['id'];
  $singleDev = getDeveloperById($id);

  // Se o desenvolvedor não existir, redireciona para a página principal
  if (!$singleDev) {
    header("Location: portfolio.php");
    exit;
  }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <!-- Meta tags e configurações básicas -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio dos Desenvolvedores - Animu</title>

  <!-- Bootstrap e Tailwind CSS e jQuery -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

  <!-- Importa fontes e ícones -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="src/css/animu.css">
  <link rel="stylesheet" href="src/css/navbar.css">
  <link rel="stylesheet" href="src/css/portfolio.css">
  <link rel="icon" href="src/assets/images/favicon/favicon.ico" type="image/x-icon">
</head>

<body>
  <!-- Cabeçalho da página -->
  <header class="portfolio-header">
    <div class="container">
      <h1 class="portfolio-title text-center">Equipe de Desenvolvedores</h1>
      <p class="portfolio-subtitle text-center">
        Conheça a equipe por trás do Animu, composta por desenvolvedores apaixonados por programação e animes
      </p>
    </div>
  </header>

  <!-- Conteúdo principal -->
  <main class="container py-4">
    <?php if ($singleDev): ?>
      <!-- Visualização detalhada de um desenvolvedor -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <a href="portfolio.php" class="d-flex align-items-center gap-2 text-decoration-none" style="color: var(--primary-color);">
          <i class="fi fi-rr-arrow-left"></i>
          <span>Voltar para a equipe</span>
        </a>
      </div>

      <div class="shadow-sm rounded-4 overflow-hidden">
        <div class="developer-header p-4 p-md-5">
          <img src="<?= htmlspecialchars($singleDev['photo']) ?>" alt="<?= htmlspecialchars($singleDev['name']) ?>"
            class="developer-avatar">
          <h2 class="developer-name text-white"><?= htmlspecialchars($singleDev['name']) ?></h2>
          <p class="developer-role"><?= htmlspecialchars($singleDev['role']) ?></p>
        </div>

        <div class="p-4 p-md-5">
          <div class="mb-4">
            <h3 class="fs-4 fw-semibold mb-3">Sobre</h3>
            <p class="developer-bio"><?= htmlspecialchars($singleDev['bio']) ?></p>
          </div>

          <?php if (!empty($singleDev['skills'])): ?>
            <div class="mb-4">
              <h3 class="fs-4 fw-semibold mb-3">Habilidades</h3>
              <div class="skill-tags">
                <?php foreach ($singleDev['skills'] as $skill): ?>
                  <span class="skill-tag"><?= htmlspecialchars($skill) ?></span>
                <?php endforeach; ?>
              </div>
            </div>
          <?php endif; ?>

          <?php if (!empty($singleDev['projects'])): ?>
            <div class="mb-4">
              <h3 class="fs-4 fw-semibold mb-3">Projetos</h3>
              <div class="row g-4">
                <?php foreach ($singleDev['projects'] as $project): ?>
                  <div class="col-md-6">
                    <div class="project-item">
                      <h4 class="project-title"><?= htmlspecialchars($project['name']) ?></h4>
                      <p class="project-description"><?= htmlspecialchars($project['description']) ?></p>
                      <?php if (!empty($project['link']) && $project['link'] != '#'): ?>
                        <a href="<?= htmlspecialchars($project['link']) ?>" class="project-link" target="_blank">
                          Ver projeto <i class="fi fi-rr-arrow-right"></i>
                        </a>
                      <?php endif; ?>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            </div>
          <?php endif; ?>

          <div>
            <h3 class="fs-4 fw-semibold mb-3">Contato</h3>
            <div class="d-flex flex-wrap gap-3">
              <?php if (!empty($singleDev['github'])): ?>
                <a href="<?= htmlspecialchars($singleDev['github']) ?>" class="social-link" target="_blank" title="GitHub">
                  <i class="fi fi-brands-github"></i>
                </a>
              <?php endif; ?>

              <?php if (!empty($singleDev['linkedin'])): ?>
                <a href="<?= htmlspecialchars($singleDev['linkedin']) ?>" class="social-link" target="_blank" title="LinkedIn">
                  <i class="fi fi-brands-linkedin"></i>
                </a>
              <?php endif; ?>

              <?php if (!empty($singleDev['email'])): ?>
                <a href="mailto:<?= htmlspecialchars($singleDev['email']) ?>" class="social-link" title="Email">
                  <i class="fi fi-sr-envelope"></i>
                </a>
              <?php endif; ?>

              <?php if (!empty($singleDev['instagram'])): ?>
                <a href="<?= htmlspecialchars($singleDev['instagram']) ?>" class="social-link" target="_blank" title="Instagram">
                  <i class="fi fi-brands-instagram"></i>
                </a>
              <?php endif; ?>

              <?php if (!empty($singleDev['website'])): ?>
                <a href="<?= htmlspecialchars($singleDev['website']) ?>" class="social-link" target="_blank" title="Website">
                  <i class="fi fi-sr-globe"></i>
                </a>
              <?php endif; ?>
            </div>
          </div>
        </div>
      </div>

    <?php else: ?>
      <!-- Visualização em grid de todos os desenvolvedores -->
      <?php if (empty($developers)): ?>
        <div class="text-center my-5">
          <div class="dev-loader">
            <span class="loader-circle"></span>
          </div>
          <p class="text-secondary">Carregando dados dos desenvolvedores...</p>
        </div>
      <?php else: ?>
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
          <?php foreach ($developers as $i => $dev): ?>
            <div class="col">
              <div class="developer-card animate-in" style="animation-delay: <?= $i * 0.1 ?>s">
                <div class="developer-header">
                  <img src="<?= htmlspecialchars($dev['photo']) ?>" alt="<?= htmlspecialchars($dev['name']) ?>"
                    class="developer-avatar">
                  <h2 class="developer-name text-white"><?= htmlspecialchars($dev['name']) ?></h2>
                  <p class="developer-role"><?= htmlspecialchars($dev['role']) ?></p>
                </div>
                <div class="developer-content">
                  <p class="developer-bio">
                    <?= htmlspecialchars(substr($dev['bio'], 0, 150)) . (strlen($dev['bio']) > 150 ? '...' : '') ?>
                  </p>

                  <?php if (!empty($dev['skills'])): ?>
                    <div class="developer-section">
                      <h3 class="developer-section-title">
                        <i class="fi fi-sr-code"></i>
                        Habilidades
                      </h3>
                      <div class="skill-tags">
                        <?php
                        $displaySkills = array_slice($dev['skills'], 0, 4);
                        foreach ($displaySkills as $skill):
                        ?>
                          <span class="skill-tag"><?= htmlspecialchars($skill) ?></span>
                        <?php endforeach; ?>

                        <?php if (count($dev['skills']) > 4): ?>
                          <span class="skill-tag">+<?= count($dev['skills']) - 4 ?></span>
                        <?php endif; ?>
                      </div>
                    </div>
                  <?php endif; ?>

                  <div class="social-links">
                    <?php if (!empty($dev['github'])): ?>
                      <a href="<?= htmlspecialchars($dev['github']) ?>" class="social-link" target="_blank" title="GitHub">
                        <i class="fi fi-brands-github"></i>
                      </a>
                    <?php endif; ?>

                    <?php if (!empty($dev['linkedin'])): ?>
                      <a href="<?= htmlspecialchars($dev['linkedin']) ?>" class="social-link" target="_blank" title="LinkedIn">
                        <i class="fi fi-brands-linkedin"></i>
                      </a>
                    <?php endif; ?>

                    <?php if (!empty($dev['email'])): ?>
                      <a href="mailto:<?= htmlspecialchars($dev['email']) ?>" class="social-link" title="Email">
                        <i class="fi fi-sr-envelope"></i>
                      </a>
                    <?php endif; ?>

                    <a href="portfolio.php?id=<?= $dev['id'] ?>" class="social-link" title="Ver mais">
                      <i class="fi fi-rr-user"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    <?php endif; ?>
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
  <script src="src/js/portfolio.js"></script>
</body>

</html>