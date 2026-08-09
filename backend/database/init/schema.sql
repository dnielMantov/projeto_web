CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('cliente', 'gerente', 'admin') NOT NULL DEFAULT 'cliente',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS logs_atividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(50) NOT NULL,
  entidade_id INT NULL,
  detalhes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(255) NULL,
  cor VARCHAR(20) NOT NULL DEFAULT '#06b6d4',
  imagem_url VARCHAR(500) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Catálogo completo: esta tabela é a fonte de verdade da vitrine (a loja lê
-- daqui via GET /livros) e o que o painel do Gerente edita.
CREATE TABLE IF NOT EXISTS livros (
  id VARCHAR(20) PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL DEFAULT '',
  categoria_id INT NULL,
  descricao TEXT NULL,
  preco_fisico DECIMAL(10,2) NULL,
  preco_ebook DECIMAL(10,2) NULL,
  peso_gramas INT NOT NULL DEFAULT 0,
  formatos VARCHAR(100) NOT NULL,
  capa_url VARCHAR(500) NULL,
  cor_capa VARCHAR(20) NOT NULL DEFAULT '#0369a1',
  estoque INT NOT NULL DEFAULT 0,
  paginas INT NULL,
  publicado_em VARCHAR(20) NULL,
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  mais_vendido TINYINT(1) NOT NULL DEFAULT 0,
  lancamento TINYINT(1) NOT NULL DEFAULT 0,
  avaliacao DECIMAL(2,1) NULL,
  num_avaliacoes INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_livros_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajustes editáveis pelo admin (parâmetros de frete, gateway ativo).
-- Segredos (Access Token do Mercado Pago) NÃO moram aqui: ficam no .env.
CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(60) PRIMARY KEY,
  valor TEXT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  status ENUM('aguardando_pagamento', 'pago', 'processando', 'enviado', 'entregue', 'cancelado') NOT NULL DEFAULT 'aguardando_pagamento',
  metodo_entrega ENUM('padrao', 'expressa', 'retirada', 'download') NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  frete_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete_prazo_min INT NULL,
  frete_prazo_max INT NULL,
  total DECIMAL(10,2) NOT NULL,
  nome_destinatario VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  telefone VARCHAR(20) NULL,
  cep VARCHAR(9) NULL,
  logradouro VARCHAR(200) NULL,
  numero VARCHAR(20) NULL,
  complemento VARCHAR(100) NULL,
  cidade VARCHAR(100) NULL,
  uf CHAR(2) NULL,
  codigo_rastreio VARCHAR(30) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS itens_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  livro_id VARCHAR(20) NOT NULL,
  titulo_snapshot VARCHAR(200) NOT NULL,
  formato VARCHAR(10) NOT NULL, -- 'Físico' | 'E-book' | 'Kit' (VARCHAR e nao ENUM: o script de init do MySQL corrompe acentos em labels de ENUM)
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_itens_pedido_livro FOREIGN KEY (livro_id) REFERENCES livros(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  mp_payment_id VARCHAR(50) NULL,
  metodo ENUM('cartao', 'pix') NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(60) NULL,
  valor DECIMAL(10,2) NOT NULL,
  qr_code TEXT NULL,
  qr_code_base64 LONGTEXT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
