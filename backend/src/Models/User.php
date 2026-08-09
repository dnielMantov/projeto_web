<?php

namespace App\Models;

use App\Database\Connection;

class User
{
    public const PAPEIS = ['cliente', 'gerente', 'admin'];

    /** Papéis que podem operar a loja (catálogo e pedidos). */
    public const PAPEIS_GERENCIA = ['gerente', 'admin'];

    public static function buscarPorEmail(string $email): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $usuario = $stmt->fetch();
        return $usuario ?: null;
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $usuario = $stmt->fetch();
        return $usuario ?: null;
    }

    public static function listarTodos(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios ORDER BY criado_em DESC');
        return $stmt->fetchAll();
    }

    public static function criar(string $nome, string $email, string $senha, string $papel = 'cliente'): int
    {
        if (!in_array($papel, self::PAPEIS, true)) {
            throw new \InvalidArgumentException("Papel inválido: {$papel}");
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (:nome, :email, :senha_hash, :papel)'
        );
        $stmt->execute([
            'nome' => $nome,
            'email' => $email,
            'senha_hash' => password_hash($senha, PASSWORD_BCRYPT),
            'papel' => $papel,
        ]);

        return (int) $pdo->lastInsertId();
    }

    public static function definirPapel(int $id, string $papel): void
    {
        if (!in_array($papel, self::PAPEIS, true)) {
            throw new \InvalidArgumentException("Papel inválido: {$papel}");
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare('UPDATE usuarios SET papel = :papel WHERE id = :id');
        $stmt->execute(['papel' => $papel, 'id' => $id]);
    }

    public static function contarPorPapel(string $papel): int
    {
        $stmt = Connection::get()->prepare('SELECT COUNT(*) FROM usuarios WHERE papel = :papel AND ativo = 1');
        $stmt->execute(['papel' => $papel]);
        return (int) $stmt->fetchColumn();
    }

    public static function definirAtivo(int $id, bool $ativo): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('UPDATE usuarios SET ativo = :ativo WHERE id = :id');
        $stmt->execute(['ativo' => $ativo ? 1 : 0, 'id' => $id]);
    }

    /** Remove o hash de senha antes de qualquer resposta da API. */
    public static function sanitizar(array $usuario): array
    {
        unset($usuario['senha_hash']);
        return $usuario;
    }
}
