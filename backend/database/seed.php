<?php

declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Database/Connection.php';
require __DIR__ . '/../src/Models/User.php';

use App\Database\Connection;
use App\Models\User;

// Um usuário padrão por papel, para permitir testar o controle de acesso
// (AuthMiddleware::exigirPapel) e demonstrar as páginas /gerente e /admin.
// Senhas simples de MVP acadêmico: troque antes de qualquer uso real.
$usuariosPadrao = [
    ['nome' => 'Cliente Demo', 'email' => 'cliente@compia.com.br', 'senha' => 'Cliente123!', 'papel' => 'cliente'],
    ['nome' => 'Gerente Demo', 'email' => 'gerente@compia.com.br', 'senha' => 'Gerente123!', 'papel' => 'gerente'],
    ['nome' => 'Admin Demo', 'email' => 'admin@compia.com.br', 'senha' => 'Admin123!', 'papel' => 'admin'],
];

Connection::get();

foreach ($usuariosPadrao as $dados) {
    if (User::buscarPorEmail($dados['email'])) {
        echo "Já existe: {$dados['email']}" . PHP_EOL;
        continue;
    }

    User::criar($dados['nome'], $dados['email'], $dados['senha'], $dados['papel']);
    echo "Criado: {$dados['email']} ({$dados['papel']})" . PHP_EOL;
}

echo 'Seed concluído.' . PHP_EOL;
