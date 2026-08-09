<?php

namespace App\Models;

use App\Database\Connection;

class Pagamento
{
    public static function criar(
        int $pedidoId,
        string $metodo,
        float $valor,
        string $idempotencyKey,
        ?string $mpPaymentId,
        string $status,
        ?string $statusDetail,
        ?string $qrCode = null,
        ?string $qrCodeBase64 = null
    ): int {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'INSERT INTO pagamentos (
                pedido_id, mp_payment_id, metodo, status, status_detail, valor, qr_code, qr_code_base64, idempotency_key
            ) VALUES (
                :pedido_id, :mp_payment_id, :metodo, :status, :status_detail, :valor, :qr_code, :qr_code_base64, :idempotency_key
            )'
        );
        $stmt->execute([
            'pedido_id' => $pedidoId,
            'mp_payment_id' => $mpPaymentId,
            'metodo' => $metodo,
            'status' => $status,
            'status_detail' => $statusDetail,
            'valor' => $valor,
            'qr_code' => $qrCode,
            'qr_code_base64' => $qrCodeBase64,
            'idempotency_key' => $idempotencyKey,
        ]);

        return (int) $pdo->lastInsertId();
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM pagamentos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $pagamento = $stmt->fetch();
        return $pagamento ?: null;
    }

    public static function buscarPorPedido(int $pedidoId): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM pagamentos WHERE pedido_id = :pedido_id ORDER BY criado_em DESC LIMIT 1');
        $stmt->execute(['pedido_id' => $pedidoId]);
        $pagamento = $stmt->fetch();
        return $pagamento ?: null;
    }

    public static function atualizarStatus(int $id, string $status, ?string $statusDetail): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('UPDATE pagamentos SET status = :status, status_detail = :status_detail WHERE id = :id');
        $stmt->execute(['status' => $status, 'status_detail' => $statusDetail, 'id' => $id]);
    }
}
