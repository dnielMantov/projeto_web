<?php

declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Database/Connection.php';

use App\Database\Connection;

// Migra uma base que já existe (com pedidos que você não quer perder) para o
// schema novo: papéis unificados em 'gerente' e as colunas/tabelas de catálogo.
//
// Quem não se importa em perder os dados pode simplesmente rodar
// `docker compose down -v && docker compose up -d --wait`, que o schema.sql
// novo é aplicado do zero. Este script existe para o outro caso.
//
// Idempotente: rodar de novo não quebra nada.

$pdo = Connection::get();

function jaTem(PDO $pdo, string $tabela, string $coluna): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c'
    );
    $stmt->execute(['t' => $tabela, 'c' => $coluna]);
    return (int) $stmt->fetchColumn() > 0;
}

function tabelaExiste(PDO $pdo, string $tabela): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = :t'
    );
    $stmt->execute(['t' => $tabela]);
    return (int) $stmt->fetchColumn() > 0;
}

// 1. Papéis -------------------------------------------------------------
// A ordem importa: primeiro alargamos o ENUM para caber 'gerente', depois
// convertemos as linhas, e só então removemos os valores antigos.
$pdo->exec(
    "ALTER TABLE usuarios MODIFY papel
     ENUM('cliente','vendedor','editor','gerente','admin') NOT NULL DEFAULT 'cliente'"
);
$convertidos = $pdo->exec("UPDATE usuarios SET papel = 'gerente' WHERE papel IN ('vendedor','editor')");
$pdo->exec(
    "ALTER TABLE usuarios MODIFY papel
     ENUM('cliente','gerente','admin') NOT NULL DEFAULT 'cliente'"
);
echo "Papéis: {$convertidos} usuário(s) convertido(s) para 'gerente'.\n";

// 2. Tabelas novas ------------------------------------------------------
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS categorias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      descricao VARCHAR(255) NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#06b6d4',
      imagem_url VARCHAR(500) NULL,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS configuracoes (
      chave VARCHAR(60) PRIMARY KEY,
      valor TEXT NULL,
      atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);
// tags/livro_tags existiram numa versão anterior do schema; o site não usa
// mais tags, então uma base antiga que já tenha essas tabelas as perde aqui.
$pdo->exec('DROP TABLE IF EXISTS livro_tags');
$pdo->exec('DROP TABLE IF EXISTS tags');
echo "Tabelas categorias/configuracoes garantidas (tags removida, se existia).\n";

// 3. Colunas novas em livros -------------------------------------------
$colunas = [
    'autor' => "VARCHAR(150) NOT NULL DEFAULT ''",
    'categoria_id' => 'INT NULL',
    'descricao' => 'TEXT NULL',
    'capa_url' => 'VARCHAR(500) NULL',
    'cor_capa' => "VARCHAR(20) NOT NULL DEFAULT '#0369a1'",
    'estoque' => 'INT NOT NULL DEFAULT 0',
    'paginas' => 'INT NULL',
    'publicado_em' => 'VARCHAR(20) NULL',
    'destaque' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'mais_vendido' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'lancamento' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'avaliacao' => 'DECIMAL(2,1) NULL',
    'num_avaliacoes' => 'INT NULL',
    'atualizado_em' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
];
$adicionadas = 0;
foreach ($colunas as $nome => $definicao) {
    if (!jaTem($pdo, 'livros', $nome)) {
        $pdo->exec("ALTER TABLE livros ADD COLUMN {$nome} {$definicao}");
        $adicionadas++;
    }
}
if (!jaTem($pdo, 'livros', 'categoria_id_fk_ok')) {
    // A FK só pode ser criada depois da coluna existir; ignoramos se já existe.
    try {
        $pdo->exec(
            'ALTER TABLE livros ADD CONSTRAINT fk_livros_categoria
             FOREIGN KEY (categoria_id) REFERENCES categorias(id)'
        );
    } catch (\PDOException $e) {
        // 1826/1022 = constraint duplicada; qualquer outro erro deve aparecer.
        if (!in_array($e->errorInfo[1] ?? 0, [1005, 1022, 1826], true)) {
            throw $e;
        }
    }
}
echo "Livros: {$adicionadas} coluna(s) adicionada(s).\n";

// 4. Limpeza do sentinela "999 = ilimitado" ------------------------------
// Uma convenção antiga usava estoque=999 para representar "ilimitado" em
// livros só de e-book. Isso inflava a soma de estoque do painel (4 livros
// de e-book já somavam quase 4000, mascarando o estoque físico real de
// pouco mais de 200 unidades). E-book não tem estoque físico, então o
// valor correto é 0; a soma do painel já ignora o formato E-book à parte.
$corrigidos = $pdo->exec("UPDATE livros SET estoque = 0 WHERE formatos = 'E-book' AND estoque = 999");
echo "Estoque: {$corrigidos} livro(s) de e-book com sentinela 999 corrigido(s) para 0.\n";

echo "Migração concluída. Rode database/seed_livros.php para popular o catálogo.\n";
