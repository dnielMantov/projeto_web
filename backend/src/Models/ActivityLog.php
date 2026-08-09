<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class ActivityLog
{
    public static function registrar(
        int $usuarioId,
        string $acao,
        string $entidade,
        ?int $entidadeId = null,
        ?string $detalhes = null
    ): void {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'INSERT INTO logs_atividade (usuario_id, acao, entidade, entidade_id, detalhes)
             VALUES (:usuario_id, :acao, :entidade, :entidade_id, :detalhes)'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'acao' => $acao,
            'entidade' => $entidade,
            'entidade_id' => $entidadeId,
            'detalhes' => $detalhes,
        ]);
    }

    public static function listarRecentes(int $limite = 50): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT l.*, u.nome AS usuario_nome
             FROM logs_atividade l
             JOIN usuarios u ON u.id = l.usuario_id
             ORDER BY l.criado_em DESC
             LIMIT :limite'
        );
        $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
