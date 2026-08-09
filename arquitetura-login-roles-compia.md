# Arquitetura de Login e Controle de Acesso por Papéis (Roles) - MVP COMPIA

Documento de especificação técnica para implementação via Claude Code. Escopo: autenticação e autorização por perfil (cliente, vendedor, editor, admin), com registro de logs de atividade. Projeto acadêmico (MVP), então a solução deve ser simples, leve e sem dependências pesadas, mas seguindo boas práticas de segurança.

## 1. Contexto do projeto

- Stack: PHP 8+ (backend/API), MySQL/MariaDB (banco de dados), HTTPS.
- Frontend e backend vivem no mesmo repositório Git (monorepo) e são servidos pela mesma origem (mesmo domínio), o que simplifica a comunicação entre eles e evita problemas de CORS.
- Por ser um MVP acadêmico, a prioridade é ter uma solução funcional, segura nos pontos essenciais (senha, SQL injection, sessão) e fácil de entender/apresentar, sem a complexidade de soluções corporativas (sem OAuth externo, sem microserviços de autenticação, sem filas).

## 2. Decisão arquitetural: autenticação por sessão (não JWT)

Como front e back estão na mesma origem, a recomendação é usar autenticação baseada em sessão nativa do PHP (`$_SESSION`), em vez de JWT.

Motivo: JWT existe para resolver o problema de autenticação entre domínios diferentes ou serviços desacoplados. Aqui não existe esse problema, então sessão é mais simples de implementar, mais fácil de revogar (basta destruir a sessão no servidor) e reduz a superfície de erros comuns de projetos acadêmicos com JWT (armazenar token em localStorage exposto a XSS, esquecer de validar expiração, etc).

O cookie de sessão deve ser configurado com as flags:
- `HttpOnly` (JavaScript não consegue ler o cookie, mitigando XSS)
- `Secure` (cookie só trafega em HTTPS)
- `SameSite=Strict` ou `Lax` (mitiga CSRF básico)

## 3. Estrutura de diretórios sugerida (monorepo)

```
compia-loja/
├── backend/
│   ├── public/
│   │   └── index.php          # front controller, roteamento da API
│   ├── src/
│   │   ├── Auth/
│   │   │   ├── AuthController.php
│   │   │   └── AuthMiddleware.php   # verifica sessão e papel
│   │   ├── Database/
│   │   │   └── Connection.php       # conexão PDO
│   │   └── Models/
│   │       ├── User.php
│   │       └── ActivityLog.php
│   ├── database/
│   │   └── schema.sql
│   └── .env                    # credenciais do banco, não versionado
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # bloqueia rota conforme papel
│   │   └── ...
│   └── build/                  # gerado no deploy, servido pelo PHP
└── README.md
```

O PHP serve tanto a API (`/api/*`) quanto os arquivos estáticos do React já buildado (`/frontend/build`), então em produção existe apenas um servidor e uma origem.

## 4. Modelagem do banco de dados

### Tabela `usuarios`

| Campo | Tipo | Observação |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | |
| nome | VARCHAR(150) | |
| email | VARCHAR(150), UNIQUE | usado como login |
| senha_hash | VARCHAR(255) | gerado com `password_hash()`, nunca a senha em texto puro |
| papel | ENUM('cliente','vendedor','editor','admin') | define o nível de acesso |
| ativo | TINYINT(1), DEFAULT 1 | permite desativar conta sem excluir |
| criado_em | DATETIME, DEFAULT CURRENT_TIMESTAMP | |

Justificativa de usar `ENUM` em vez de uma tabela `papeis` separada: como o conjunto de papéis é fixo e pequeno (4 valores, definidos no documento do projeto), uma tabela de relacionamento many-to-many seria complexidade desnecessária para o escopo do MVP. Isso pode ser revisto se o projeto crescer e precisar de permissões granulares por ação.

### Tabela `logs_atividade`

| Campo | Tipo | Observação |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | |
| usuario_id | INT, FK -> usuarios.id | quem executou a ação |
| acao | VARCHAR(100) | ex: "criou_produto", "editou_pedido", "excluiu_produto" |
| entidade | VARCHAR(50) | ex: "produto", "pedido" |
| entidade_id | INT, NULLABLE | id do registro afetado |
| detalhes | TEXT, NULLABLE | descrição livre ou JSON com dados antes/depois |
| criado_em | DATETIME, DEFAULT CURRENT_TIMESTAMP | |

## 5. Fluxo de autenticação

1. Usuário envia e-mail e senha para `POST /api/login`.
2. Backend busca o usuário pelo e-mail (via PDO com *prepared statement*, nunca concatenação de string na query).
3. Backend valida a senha com `password_verify($senha, $senha_hash)`.
4. Se válido, o backend inicia a sessão (`session_start()`), grava `$_SESSION['usuario_id']` e `$_SESSION['papel']`, e devolve ao frontend apenas os dados públicos do usuário (nome, papel), nunca o hash da senha.
5. O React guarda esses dados públicos no estado da aplicação (não precisa de token manual, o cookie de sessão já é enviado automaticamente pelo navegador em cada requisição, desde que configurado `credentials: 'include'` no fetch).
6. `POST /api/logout` destrói a sessão no servidor (`session_destroy()`).

## 6. Controle de acesso por papel

### No backend (camada que realmente protege)

Um middleware (`AuthMiddleware.php`) é chamado antes de qualquer rota sensível. Ele:
1. Verifica se existe sessão ativa (`$_SESSION['usuario_id']` presente). Se não, retorna HTTP 401.
2. Verifica se o papel salvo na sessão está na lista de papéis permitidos para aquela rota. Se não, retorna HTTP 403.

Exemplo de uso conceitual nas rotas:
- `GET /api/produtos` → pública, qualquer visitante acessa.
- `POST /api/produtos` → exige papel `editor` ou `admin`.
- `DELETE /api/pedidos/{id}` → exige papel `admin`.
- `GET /api/admin/usuarios` → exige papel `admin`.

Essa é a camada que garante segurança de verdade, porque nenhuma requisição passa sem essa checagem no servidor, independente do que a interface mostra.

### No frontend (camada de experiência, não de segurança)

Um componente `ProtectedRoute` recebe a lista de papéis permitidos e o papel do usuário logado (vindo do estado da aplicação, obtido no login). Se o papel não bate, redireciona para uma página de acesso negado ou para a home. Isso serve só para não mostrar telas que o usuário não deveria ver, mas não substitui a checagem do backend, que é a que realmente impede a ação.

## 7. Registro de logs de atividade

Toda ação de escrita (criar, editar, excluir) feita por `vendedor`, `editor` ou `admin` deve, após ser concluída com sucesso, inserir uma linha na tabela `logs_atividade` com o id do usuário autenticado (disponível em `$_SESSION['usuario_id']`), a ação realizada e a entidade afetada. Essa gravação pode ficar centralizada em um método reutilizável (ex: `ActivityLog::registrar($usuarioId, $acao, $entidade, $entidadeId, $detalhes)`) chamado dentro dos controllers, evitando repetir a lógica em cada endpoint.

## 8. Checklist de segurança essencial (mesmo em MVP)

- Senhas sempre com `password_hash()` (bcrypt), nunca MD5, SHA1 ou texto puro.
- Todas as queries usando PDO com *prepared statements* (proteção contra SQL injection).
- HTTPS obrigatório (redirecionar HTTP para HTTPS no servidor).
- Cookies de sessão com `HttpOnly`, `Secure` e `SameSite`.
- Validar o papel no backend em toda rota sensível, nunca confiar apenas na interface.
- Nunca devolver o `senha_hash` em nenhuma resposta da API.
- Variáveis sensíveis (credenciais do banco, etc) em `.env`, fora do controle de versão.
