# Documentação do Painel Admin

## Visão Geral

O painel admin do portfólio SENAI permite gerenciar projetos por ano, categoria e trimestre, com autenticação via token do GitHub. Toda a persistência é feita diretamente no repositório remoto, garantindo versionamento e histórico das alterações.

---

## Como Funciona

### 1. Acesso e Autenticação

- O painel é acessado pela rota `/admin` ([src/App.jsx](src/App.jsx)).
- O usuário deve informar um GitHub Personal Access Token (PAT) com permissão de leitura e escrita em "Contents".
- O token é validado via API do GitHub e armazenado apenas em `sessionStorage` (descartado ao fechar o navegador).

### 2. Dashboard Principal

- Após login, exibe:
  - Listagem de projetos filtráveis por ano, categoria e trimestre.
  - Botão para adicionar novo projeto.
  - Edição e remoção de projetos existentes.
  - Gerenciamento de anos (criar/remover).
- Todos os dados são carregados dos arquivos JSON em `assets/data/{ano}/{categoria}.json`.
- Imagens são armazenadas em `assets/images/{ano}/{trimestre}tri/{categoria}/uploads/`.

### 3. Fluxos Principais

- **Adicionar/Editar Projeto:**
  - Formulário com campos obrigatórios (título, ano, categoria, trimestre, habilidades, imagens).
  - Upload de imagens direto para o repositório via API do GitHub.
  - Salva/atualiza o projeto no arquivo JSON correspondente.
- **Remover Projeto:**
  - Confirmação antes de excluir.
  - Remove o projeto do arquivo JSON e faz commit no repositório.
- **Gerenciar Anos:**
  - Adicionar: cria arquivos JSON vazios para cada categoria.
  - Remover: exclui todos os arquivos do ano selecionado.
- **Filtros:**
  - Permite filtrar projetos por ano, categoria e trimestre.

### 4. Persistência e Integração

- Todas as operações de CRUD e upload são feitas via API do GitHub, com commits automáticos.
- Funções principais: `githubRequest`, `fetchJsonFile`, `saveJsonFile`, `deleteJsonFile`, `uploadImage` ([src/pages/AdminPage.jsx](src/pages/AdminPage.jsx)).

### 5. Validações

- Ano novo deve ter 4 dígitos e não pode repetir.
- Campos obrigatórios validados no formulário.
- Token inválido impede acesso.
- Feedback visual para erros e sucesso (toasts).

---

## Arquitetura de Dados

- **Projetos:**
  - Armazenados em arquivos JSON por ano e categoria.
  - Estrutura: id, título, descrição, habilidades, imagens, link, ano, categoria, trimestre, sortKey.
- **Imagens:**
  - URLs salvas no array `images` de cada projeto.
  - Upload gera caminho único por projeto e data.

---

## Riscos e Limitações

- **Alto impacto:**
  - Token expira ou perde permissão → painel fica inutilizável.
  - Falha na API do GitHub impede qualquer operação.
  - Qualquer token válido com permissão total acessa o admin (sem autenticação granular).
  - Não há logs/auditoria de alterações.
- **Médio impacto:**
  - Não há confirmação para sobrescrever imagens com mesmo nome.
  - Não há rollback em caso de erro parcial ao salvar múltiplos arquivos.
  - Não há controle de concorrência (dois admins podem sobrescrever dados).
- **Baixo impacto:**
  - UI não mostra loading global para todas operações.
  - Não há paginação para muitos projetos/anos.
  - Mensagens de erro podem ser genéricas.

---

## Melhorias Prioritárias

1. **Alto**
   - Implementar refresh automático do token ou aviso de expiração.
   - Adicionar logs/auditoria de alterações.
   - Permitir autenticação granular (escopos, múltiplos usuários).
   - Tratar erros de API de forma mais robusta (retry, rollback).
2. **Médio**
   - Confirmação ao sobrescrever/remover imagens.
   - Lock otimista/pessimista para evitar sobrescrita concorrente.
   - Melhor feedback visual para operações longas.
3. **Baixo**
   - Paginação ou busca para grandes volumes de projetos.
   - Mensagens de erro mais detalhadas.

---

## Comandos de Execução/Teste

- `npm run dev` — Executa o projeto em modo desenvolvimento.
- `npm run build` — Gera build de produção.
- `npm run preview` — Visualiza build de produção localmente.

---

## Referências de Código

- [src/pages/AdminPage.jsx](src/pages/AdminPage.jsx): painel admin, autenticação, dashboard, CRUD, upload.
- [src/App.jsx](src/App.jsx): rota `/admin`.
- [package.json](package.json): scripts e dependências.

---

## Observações Finais

- O painel depende totalmente da estrutura e permissões do repositório GitHub.
- Recomenda-se definir política de segurança para uso do token.
- Não há testes automatizados para o fluxo admin.

---

_Documentação gerada automaticamente em 24/03/2026. Atualize conforme evoluções do código._
