# 🎌 Animu - Plataforma de Comunidade Anime

Bem-vindo ao **Animu**, uma plataforma completa para a comunidade otaku compartilhar e descobrir animes! 🚀

## 📖 Sobre o Projeto

O **Animu** é uma plataforma web onde fãs de animes podem se reunir para compartilhar opiniões, avaliar títulos e participar de discussões sobre seus animes favoritos. Nossa missão é criar um espaço interativo, dinâmico e acolhedor para a comunidade otaku.

## 🌐 Demo
Acesse o projeto: https://victor-gabriel-barbosa.github.io/Animu/

## ✨ Funcionalidades Principais

- 📝 **Sistema de autenticação completo**
  - Cadastro e login de usuários
  - Autenticação com Google
  - Validação segura de senhas
  - Persistência de sessão

- 🎭 **Perfis personalizados**
  - Avatares únicos por usuário
  - Lista de animes favoritos
  - Histórico de visualizações
  - Sistema de amizades

- ⭐ **Gerenciamento de animes**
  - Cadastro e avaliação de animes
  - Categorização por gêneros
  - Sistema de recomendações
  - Importação e exportação de dados

- 💬 **Comunicação e interação social**
  - Fórum de discussão por categorias
  - Sistema de chat entre usuários
  - Comentários em reviews
  - Reações e curtidas

- 📰 **Sistema de notícias**
  - Publicação e edição de notícias
  - Categorização de conteúdo
  - Sistema de comentários

- 🔍 **Busca e descoberta de conteúdo**
  - Pesquisa avançada
  - Filtros por categoria
  - Recomendações personalizadas

## 🛠 Tecnologias e Arquitetura

### Frontend
- **HTML5** - Estruturação do conteúdo
- **CSS3** - Estilização responsiva com design moderno
- **JavaScript** - Interatividade e lógica de cliente
- **jQuery** - Manipulação do DOM e requisições AJAX

### Backend e Persistência
- **Firebase Firestore** - Banco de dados NoSQL em nuvem
- **Firebase Authentication** - Sistema de autenticação seguro
- **Firebase Storage** - Armazenamento de imagens e arquivos

### Recursos Adicionais
- **Persistência offline** - Funcionalidade mesmo sem conexão
- **Sincronização automática** - Atualização quando conexão é restabelecida
- **Design responsivo** - Adaptação para diferentes dispositivos
- **Otimização de performance** - Caching eficiente de dados

## 📚 Estrutura do Projeto

```
📁 src/
  📁 js/
    📁 admin/ - Painel administrativo
    📁 db/ - Gerenciadores de dados e Firebase
    📁 mods/ - Módulos reutilizáveis
    📁 pages/ - Scripts específicos de páginas
    📁 shared/ - Componentes compartilhados
  📁 css/ - Estilos por componente e página
  📁 assets/ - Recursos estáticos
```

## 🔐 Recursos de Segurança

- Validação de força de senha
- Proteção contra tentativas excessivas de login
- Hash seguro de senhas (SHA-256)
- Moderação de conteúdo com filtro de palavras impróprias
- Permissões de usuário baseadas em funções

## 🔄 Persistência e Sincronização

O Animu implementa um sistema resiliente de gerenciamento de dados:

- **Modo offline** - Armazenamento local usando localStorage
- **Sincronização** - Atualização automática dos dados locais com o Firestore
- **Fallback** - Sistema de backup para operações que falham quando offline

## 🚀 Como Contribuir

Quer ajudar a melhorar o **Animu**? Siga estes passos:

1. Faça um **fork** deste repositório
2. Crie uma nova branch com sua feature:
   ```bash
   git checkout -b minha-feature
   ```
3. Faça commit das suas alterações:
   ```bash
   git commit -m "Adiciona minha feature"
   ```
4. Envie para o seu repositório remoto:
   ```bash
   git push origin minha-feature
   ```
5. Abra um **Pull Request** para análise

### Áreas para Contribuição
- Melhorias na interface do usuário
- Otimização de performance
- Novas funcionalidades
- Correção de bugs
- Tradução para outros idiomas

## 📱 Compatibilidade

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Android (Chrome), iOS (Safari)
- **Responsividade**: Design adaptativo para diferentes tamanhos de tela

## 📜 Licença

Este projeto está licenciado sob a **MIT License**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Equipe

O Animu é mantido por uma equipe dedicada de desenvolvedores apaixonados por animes e tecnologia.

## 📬 Contato

Se tiver dúvidas, sugestões ou encontrar bugs, fique à vontade para **abrir uma issue** ou entrar em contato!

---

**Última atualização:** 2 de maio de 2025
