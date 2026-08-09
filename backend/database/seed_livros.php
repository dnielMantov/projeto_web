<?php

declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Database/Connection.php';
require __DIR__ . '/../src/Models/Livro.php';
require __DIR__ . '/../src/Models/Categoria.php';

use App\Database\Connection;
use App\Models\Categoria;
use App\Models\Livro;

// Carga inicial do catálogo (categorias e os 21 livros) a partir de
// database/seed_data.php, que foi gerado de src/app/data/mock.ts.
// Idempotente: o que já existe é pulado, então rodar de novo não duplica nada.

$dados = require __DIR__ . '/seed_data.php';

Connection::get();

$idsCategoria = [];
$novasCategorias = 0;
foreach ($dados['categorias'] as $categoria) {
    $existente = Categoria::buscarPorNome($categoria['nome']);
    if ($existente) {
        $idsCategoria[$categoria['nome']] = (int) $existente['id'];
        continue;
    }

    $idsCategoria[$categoria['nome']] = Categoria::criar(
        $categoria['nome'],
        $categoria['descricao'],
        $categoria['cor'],
        $categoria['imagem_url']
    );
    $novasCategorias++;
}
echo "Categorias: {$novasCategorias} criada(s), " . count($dados['categorias']) . " no total." . PHP_EOL;

$novosLivros = 0;
foreach ($dados['livros'] as $livro) {
    if (Livro::buscarPorId($livro['id'])) {
        echo "Já existe: {$livro['id']}" . PHP_EOL;
        continue;
    }

    $categoriaNome = $livro['categoria'];
    // 'tags' é um resquício do gerador de seed_data.php (que espelha o antigo
    // mock.ts) - o site não tem mais sistema de tags, então é só ignorado.
    unset($livro['tags'], $livro['categoria']);

    $id = $livro['id'];
    unset($livro['id']);
    $livro['categoria_id'] = $idsCategoria[$categoriaNome] ?? null;

    Livro::criar($id, $livro);

    echo "Criado: {$id} ({$livro['titulo']})" . PHP_EOL;
    $novosLivros++;
}

echo "Seed de livros concluído: {$novosLivros} criado(s)." . PHP_EOL;
