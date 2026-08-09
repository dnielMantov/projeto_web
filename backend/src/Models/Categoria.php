<?php

namespace App\Models;

use App\Database\Connection;

class Categoria
{
    public static function listarTodas(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query(
            'SELECT c.*, (SELECT COUNT(*) FROM livros l WHERE l.categoria_id = c.id AND l.ativo = 1) AS total_livros
             FROM categorias c
             ORDER BY c.nome'
        );
        return $stmt->fetchAll();
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM categorias WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function buscarPorNome(string $nome): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM categorias WHERE nome = :nome LIMIT 1');
        $stmt->execute(['nome' => $nome]);
        return $stmt->fetch() ?: null;
    }

    /** Gera 'Inteligência Artificial' -> 'inteligencia-artificial'. */
    public static function gerarSlug(string $nome): string
    {
        $semAcento = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nome) ?: $nome;
        $slug = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $semAcento) ?? '');
        return trim($slug, '-');
    }

    public static function criar(string $nome, ?string $descricao, string $cor, ?string $imagemUrl): int
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'INSERT INTO categorias (nome, slug, descricao, cor, imagem_url)
             VALUES (:nome, :slug, :descricao, :cor, :imagem_url)'
        );
        $stmt->execute([
            'nome' => $nome,
            'slug' => self::gerarSlug($nome),
            'descricao' => $descricao,
            'cor' => $cor,
            'imagem_url' => $imagemUrl,
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function atualizar(int $id, string $nome, ?string $descricao, string $cor, ?string $imagemUrl): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'UPDATE categorias SET nome = :nome, slug = :slug, descricao = :descricao,
                    cor = :cor, imagem_url = :imagem_url
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'nome' => $nome,
            'slug' => self::gerarSlug($nome),
            'descricao' => $descricao,
            'cor' => $cor,
            'imagem_url' => $imagemUrl,
        ]);
    }

    public static function contarLivros(int $id): int
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM livros WHERE categoria_id = :id');
        $stmt->execute(['id' => $id]);
        return (int) $stmt->fetchColumn();
    }

    public static function excluir(int $id): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('DELETE FROM categorias WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
