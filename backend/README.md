# Backend COMPIA

Implementação da arquitetura descrita em `arquitetura-login-roles-compia.md`: autenticação por sessão nativa do PHP e controle de acesso por papel, com log de atividades. Inclui o catálogo (fonte de verdade da loja), gestão de pedidos, cálculo de frete (ViaCEP + simulação por peso/região) e pagamento via Mercado Pago (cartão + PIX).

**O frontend React está conectado de verdade a este backend** - inclusive a vitrine: Home, Catálogo e Página de Produto leem de `GET /livros`, então o que o Gerente cadastra no painel aparece na loja. Veja `.env.example` na raiz do projeto para configurar a Public Key do Mercado Pago no lado do frontend.

## Papéis

| Papel | O que pode fazer |
|---|---|
| `cliente` | Comprar, ver os próprios pedidos e downloads. |
| `gerente` | Tudo do cliente + catálogo (produtos, categorias, tags, estoque) e pedidos (ver, acompanhar, mudar status, ver dados do cliente). |
| `admin` | Tudo do gerente + usuários e papéis, configurações do sistema, logs de atividade, exclusão e estorno de pedidos, relatórios de vendas. |

`admin` é superconjunto de `gerente`: as rotas `/gerencia/*` aceitam os dois papéis, e só o que é exclusivo do admin exige `admin`.

> Os papéis `vendedor` e `editor` foram unificados em `gerente`. As rotas antigas do frontend (`/vendedor`, `/editor`) redirecionam para `/gerente`.

## Requisitos

- Docker Engine + Docker Compose (ou Podman + `podman compose`, que usa a mesma sintaxe - foi o que validamos ao construir isso)
- Uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers) com credenciais de **sandbox/teste** (Public Key + Access Token) para testar pagamento

Tudo roda em container: PHP 8.3 com `pdo_mysql` (`Dockerfile`) e MySQL 8 (`docker-compose.yml`). Não precisa instalar PHP nem MySQL na máquina.

## Subindo o ambiente

```bash
cd backend
cp .env.example .env
# edite .env e preencha MP_ACCESS_TOKEN com seu Access Token de TESTE do Mercado Pago
# (os valores de DB_* já vêm certos para o docker-compose)

docker compose up -d --build --wait
# (Podman: podman compose up -d --build --wait)
```

**Não omita o `--wait`.** No primeiro boot o MySQL leva cerca de 40s para ficar
utilizável: o entrypoint da imagem inicializa o data dir, sobe um servidor
temporário só de socket para aplicar o `schema.sql`, derruba esse servidor e só
então sobe o definitivo. Durante boa parte disso o container já aparece como
`Up` no `docker compose ps`, mas recusa conexões - e qualquer comando executado
aí falha com:

```
ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)
```

O `--wait` segura o terminal até o healthcheck do serviço `db` ficar verde, e o
container `app` também só inicia depois disso (`condition: service_healthy`).
Se isso acontecer mesmo assim, não há nada a consertar: espere e repita.

Isso sobe dois containers:

- **db** - MySQL 8, cria o banco `compia_loja` e aplica `database/init/schema.sql` automaticamente na primeira vez que o volume é criado (é o mecanismo padrão de `/docker-entrypoint-initdb.d` da imagem oficial do MySQL). Se você editar o schema depois, isso só é reaplicado derrubando o volume (`docker compose down -v`).
- **app** - PHP embutido servindo `public/`, já com `pdo_mysql` instalado, em `http://localhost:8000`.

Confirme que as tabelas foram criadas (esperado: `itens_pedido`, `livros`, `logs_atividade`, `pagamentos`, `pedidos`, `usuarios`):

```bash
docker compose exec db mysql -uroot -proot compia_loja -e "SHOW TABLES;"
```

## Populando os dados iniciais

```bash
docker compose exec app php database/seed.php         # 1 usuário por papel
docker compose exec app php database/seed_livros.php  # categorias, tags e os 21 livros
```

Ambos idempotentes (pode rodar de novo sem duplicar).

| E-mail | Senha | Papel |
|---|---|---|
| cliente@compia.com.br | Cliente123! | cliente |
| gerente@compia.com.br | Gerente123! | gerente |
| admin@compia.com.br | Admin123! | admin |

Senhas de MVP acadêmico - trocar antes de qualquer uso real.

A carga inicial do catálogo vem de `database/seed_data.php`, que foi **gerado** a partir de
`src/app/data/mock.ts`. Depois do primeiro seed, a fonte de verdade passa a ser a tabela `livros`,
editável pelo painel do Gerente - editar o arquivo de seed não muda mais a loja.

### Já tem um banco com dados de antes?

O schema mudou (papéis unificados, catálogo completo, tabelas novas). Se você não se importa em
perder os dados, `docker compose down -v && docker compose up -d --wait` recria tudo do zero.
Para preservar pedidos existentes, rode a migração:

```bash
docker compose exec app php database/migrate_gerente.php
docker compose exec app php database/seed_livros.php
```

Ela converte `vendedor`/`editor` em `gerente`, cria as tabelas novas e adiciona as colunas que
faltam em `livros`. É idempotente.

## Rodando o frontend junto

```bash
# na raiz do projeto (não em backend/)
cp .env.example .env
# preencha VITE_MP_PUBLIC_KEY com sua Public Key de TESTE do Mercado Pago
npm run dev
```

O `vite.config.ts` já tem um proxy de `/api` para `http://localhost:8000`, então basta abrir o site normalmente - login, carrinho, checkout, frete e pagamento vão todos falar com este backend.

## Testando o backend isoladamente (sem o frontend)

```bash
curl -i http://localhost:8000/api/me   # 401, ainda não logado

curl -i -c cookies.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@compia.com.br","senha":"Admin123!"}'

curl -i -b cookies.txt http://localhost:8000/api/me            # 200
curl -i -b cookies.txt http://localhost:8000/api/admin/usuarios # 200, lista os usuários

# catálogo público (é o que a vitrine consome)
curl -s http://localhost:8000/api/livros | head -c 300

# controle de acesso: logado como cliente, isto deve dar 403
curl -i -b cookies_cliente.txt http://localhost:8000/api/gerencia/livros

# frete (ViaCEP + peso dos itens)
curl -i -X POST http://localhost:8000/api/frete/calcular \
  -H "Content-Type: application/json" \
  -d '{"cep":"01310-100","itens":[{"livro_id":"ai-001","formato":"Físico","quantidade":1}]}'
```

Endpoints disponíveis (prefixo `/api` quando acessados pelo frontend via proxy; direto em `http://localhost:8000` sem prefixo funciona igual):

**Públicas**
- `POST /login`, `POST /registro`, `POST /logout`, `GET /me`
- `GET /livros`, `GET /livros/{id}`, `GET /categorias` - é daqui que a vitrine lê
- `POST /frete/calcular` - `{ cep, itens: [{livro_id, formato, quantidade}] }`

**Requer login (cliente)**
- `POST /pedidos` (cria), `GET /pedidos` (meus pedidos), `GET /pedidos/{id}`
- `POST /pagamentos/cartao`, `POST /pagamentos/pix`, `GET /pagamentos/{id}/status`

**Papéis `gerente` e `admin`**
- `GET|POST /gerencia/livros`, `PUT|DELETE /gerencia/livros/{id}`, `PATCH /gerencia/livros/{id}/estoque`
- `POST /gerencia/categorias`, `PUT|DELETE /gerencia/categorias/{id}`
- `GET|POST /gerencia/tags`, `DELETE /gerencia/tags/{id}`
- `GET /gerencia/pedidos`, `PATCH /gerencia/pedidos/{id}/status`, `GET /gerencia/metricas`

**Só `admin`**
- `GET /admin/usuarios`, `PATCH /admin/usuarios/{id}/status`, `PATCH /admin/usuarios/{id}/papel`
- `DELETE /admin/pedidos/{id}`, `POST /admin/pedidos/{id}/estorno`
- `GET|PUT /admin/configuracoes`, `GET /admin/relatorios`, `GET /admin/logs`

### Detalhes que valem saber

- **Excluir produto é híbrido.** Livro que já aparece em algum pedido não pode ser apagado (a FK
  impediria e o histórico de vendas se perderia): ele é desativado (`ativo = 0`, some da loja) e a
  API responde `{"modo": "desativado"}`. Livro nunca vendido é removido de fato (`"excluido"`).
- **Estoque é debitado só quando o pagamento é aprovado**, não na criação do pedido - senão um
  carrinho abandonado seguraria estoque para sempre. A disponibilidade é conferida na criação
  (422 se faltar). O estorno devolve os itens ao estoque.
- **Configurações de frete são reais.** `frete_base`, `frete_preco_kg`, `frete_limiar_gratis`,
  `frete_multiplicador_expressa` e `frete_origem_uf` ficam na tabela `configuracoes` e alimentam o
  `FreteCalculator` - mudar em `/admin` muda o frete cobrado no checkout na hora.
- **Segredo não vai para o banco.** O `MP_ACCESS_TOKEN` vive só em `backend/.env`; a tela de
  configurações mostra apenas se ele está presente e se é de teste ou de produção.

## Testando pagamento de verdade

1. No [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel), pegue as credenciais de **teste** (começam com `TEST-`) da sua aplicação.
2. Para cartão: use um [cartão de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing) da sua própria conta (os números são específicos de cada conta sandbox). Nome do titular `APRO` força aprovação; `OTHE` força rejeição - útil para testar os dois caminhos.
3. Para PIX: o QR gerado é real, mas aprovar o pagamento em sandbox geralmente exige o simulador de pagamentos do próprio painel do Mercado Pago (não existe um "clique único" fora dele).

Este projeto não usa webhooks (exigiriam uma URL pública) - o status do PIX é obtido por *polling* (`GET /pagamentos/{id}/status`) a cada poucos segundos enquanto o QR está na tela.

## Parando / limpando

```bash
docker compose down       # para os containers, mantém os dados do MySQL
docker compose down -v    # para e apaga também o volume do banco (próximo up reaplica o schema do zero)
```

## Desenvolvimento (hot reload do PHP)

O `docker-compose.yml` monta `.:/app`, então qualquer alteração nos arquivos PHP do host já reflete no container na próxima requisição, **desde que seu Docker suporte bind mounts ao vivo** (alguns ambientes de container sandboxed tiram uma cópia estática no momento da criação - se uma alteração não aparecer, rode `docker compose up -d --force-recreate app`). Só é preciso `--build` de novo se você mexer no `Dockerfile`.
