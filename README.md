# Web-Treino-Rotas

Um projeto de um sistema de anotações com autenticação de usuários, construído com Node.js, Express, Sequelize e Passport.js.

## Funcionalidades Principais (Atividades Obrigatórias)

1.  **CRUD de Anotações**: O sistema permite que usuários criem, leiam, atualizem e excluam (movendo para a lixeira) suas próprias anotações.
2.  **Autenticação de Usuários**: Implementado um sistema completo de login e cadastro, utilizando `passport-local` para a estratégia de autenticação e `express-session` para gerenciamento de sessões. As senhas são criptografadas com `bcryptjs` antes de serem salvas no banco de dados.
3.  **Associação de Anotações ao Usuário**: Cada anotação é diretamente associada ao usuário que a criou, garantindo que um usuário só possa ver e gerenciar suas próprias anotações. A verificação de propriedade é feita através do middleware `checkNoteOwnership`.
4.  **Middleware de Autenticação**: As rotas protegidas utilizam o middleware `isLoggedIn` para garantir que apenas usuários autenticados possam acessá-las.
5.  **Página de Detalhes da Anotação**: Cada anotação possui uma página de detalhes que exibe seu título e conteúdo completo.

## Desafios Adicionais Implementados

* **Lixeira (Soft Delete)**: Anotações não são excluídas permanentemente. Elas são movidas para uma lixeira (`status: 'deleted'`) e podem ser restauradas ou excluídas de forma definitiva a partir da página da lixeira.
* **Exclusão em Lote**: No dashboard, o usuário pode selecionar múltiplas anotações e movê-las para a lixeira de uma só vez.
* **Renderização de Markdown**: O conteúdo das anotações é escrito em Markdown e renderizado como HTML na página de detalhes, utilizando a biblioteca `markdown-it`.
* **Perfil do Usuário**: Uma página de perfil onde o usuário pode atualizar seu nome e pronome, além de ter a opção de deletar permanentemente sua conta.
* **Download de Anotações**: Na página de detalhes, há um botão para baixar a anotação como um arquivo de texto (`.txt`).
* **Banco de Dados com Sequelize**: Utilização do Sequelize como ORM para interagir com um banco de dados SQLite, com modelos bem definidos e associações (`User` e `Note`).
* **Melhorias na Experiência do Usuário (UX)**:
    * Redirecionamento automático de usuários já logados para o dashboard se tentarem acessar as páginas de login/cadastro (middleware `isLoggedOut`).
    * Feedback visual com mensagens de erro e sucesso nos formulários.
    * Estilização com CSS para uma interface mais agradável e responsiva.

## Tabela de Rotas do Projeto

| Verbo HTTP | Rota                     | Descrição                                                     | Autenticação | Arquivo de Rota |
| :--------- | :----------------------- | :-------------------------------------------------------------- | :----------- | :-------------- |
| `GET`      | `/`                      | Página inicial da aplicação.                                    | Não          | `index.js`      |
| `GET`      | `/register`              | Exibe o formulário de cadastro de novo usuário.                 | Não          | `index.js`      |
| `POST`     | `/register`              | Cria um novo usuário no banco de dados.                         | Não          | `index.js`      |
| `GET`      | `/login`                 | Exibe o formulário de login.                                    | Não          | `index.js`      |
| `POST`     | `/login`                 | Autentica o usuário e inicia uma sessão.                        | Não          | `index.js`      |
| `GET`      | `/logout`                | Encerra a sessão do usuário.                                    | **Sim** | `index.js`      |
| `GET`      | `/dashboard`             | Painel principal que lista as anotações ativas do usuário.      | **Sim** | `index.js`      |
| `GET`      | `/notes/create`          | Exibe o formulário para criar uma nova anotação.                | **Sim** | `notes.js`      |
| `POST`     | `/notes/create`          | Salva uma nova anotação no banco de dados.                      | **Sim** | `notes.js`      |
| `POST`     | `/notes/batch-delete`    | Move múltiplas anotações selecionadas para a lixeira.           | **Sim** | `notes.js`      |
| `GET`      | `/notes/:id`             | Exibe os detalhes de uma anotação específica.                   | **Sim** | `notes.js`      |
| `GET`      | `/notes/:id/edit`        | Exibe o formulário para editar uma anotação.                    | **Sim** | `notes.js`      |
| `POST`     | `/notes/:id/edit`        | Atualiza uma anotação existente.                                | **Sim** | `notes.js`      |
| `POST`     | `/notes/:id/delete`      | Move uma anotação específica para a lixeira (soft delete).      | **Sim** | `notes.js`      |
| `GET`      | `/notes/:id/download`    | Faz o download de uma anotação como arquivo .txt.               | **Sim** | `notes.js`      |
| `GET`      | `/users/profile`         | Exibe a página de perfil do usuário.                            | **Sim** | `users.js`      |
| `POST`     | `/users/profile`         | Atualiza as informações do perfil do usuário.                   | **Sim** | `users.js`      |
| `POST`     | `/users/profile/delete`  | Deleta permanentemente a conta do usuário e seus dados.         | **Sim** | `users.js`      |
| `GET`      | `/users/trash`           | Exibe a lixeira com as anotações excluídas.                     | **Sim** | `users.js`      |
| `POST`     | `/users/trash/:id/restore`| Restaura uma anotação da lixeira.                               | **Sim** | `users.js`      |
| `POST`     | `/users/trash/:id/delete` | Exclui permanentemente uma anotação da lixeira.                 | **Sim** | `users.js`      |
| `POST`     | `/users/trash/clear`     | Limpa a lixeira, excluindo permanentemente todas as anotações.  | **Sim** | `users.js`      |

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/joaozanelato/web-treino-rotas.git](https://github.com/joaozanelato/web-treino-rotas.git)
    ```
2.  **Entre na pasta do projeto:**
    ```bash
    cd web-treino-rotas
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Inicie o servidor:**
    ```bash
    npm start
    ```
5.  Abra o navegador e acesse `http://localhost:3000`.
