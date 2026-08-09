<?php

namespace App\Payments;

use App\Models\ActivityLog;
use App\Models\Livro;
use App\Models\Pagamento;
use App\Models\Pedido;
use App\Support\Uuid;

class PagamentoController
{
    private const FORMATOS_COM_ESTOQUE = ['Físico', 'Kit'];

    /**
     * Marca o pedido como pago e debita o estoque - uma única vez.
     *
     * O polling do PIX chama consultarStatus a cada 3s, então isto precisa ser
     * idempotente: relemos o pedido do banco e só agimos na transição
     * aguardando_pagamento -> pago. Sem essa guarda, o estoque seria debitado
     * a cada tick do polling.
     */
    private static function confirmarPagamento(int $pedidoId): void
    {
        $pedido = Pedido::buscarPorId($pedidoId);
        if (!$pedido || $pedido['status'] !== 'aguardando_pagamento') {
            return;
        }

        Pedido::atualizarStatus($pedidoId, 'pago');
        self::moverEstoque($pedido, -1);
    }

    /** $sinal = -1 debita (venda confirmada), +1 devolve (estorno/cancelamento). */
    private static function moverEstoque(array $pedido, int $sinal): void
    {
        foreach ($pedido['itens'] ?? [] as $item) {
            if (in_array($item['formato'], self::FORMATOS_COM_ESTOQUE, true)) {
                Livro::ajustarEstoque((string) $item['livro_id'], $sinal * (int) $item['quantidade']);
            }
        }
    }

    public static function criarCartao(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $pedido = self::carregarPedidoDoUsuario((int) ($dados['pedido_id'] ?? 0));
        if (!$pedido) {
            return;
        }

        $idempotencyKey = Uuid::v4();

        try {
            $resultado = MercadoPagoClient::criarPagamentoCartao(
                (string) ($dados['card_token'] ?? ''),
                (string) ($dados['payment_method_id'] ?? ''),
                (int) ($dados['installments'] ?? 1),
                (float) $pedido['total'],
                (string) ($dados['email'] ?? ''),
                (string) ($dados['cpf'] ?? ''),
                $idempotencyKey
            );
        } catch (\Throwable $e) {
            http_response_code(502);
            echo json_encode(['erro' => 'Falha ao processar pagamento com o Mercado Pago.']);
            return;
        }

        $pagamentoId = Pagamento::criar(
            $pedido['id'],
            'cartao',
            (float) $pedido['total'],
            $idempotencyKey,
            $resultado['id'],
            $resultado['status'],
            $resultado['status_detail']
        );

        if ($resultado['status'] === 'approved') {
            self::confirmarPagamento((int) $pedido['id']);
        }

        echo json_encode([
            'id' => $pagamentoId,
            'status' => $resultado['status'],
            'status_detail' => $resultado['status_detail'],
        ]);
    }

    public static function criarPix(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $pedido = self::carregarPedidoDoUsuario((int) ($dados['pedido_id'] ?? 0));
        if (!$pedido) {
            return;
        }

        $idempotencyKey = Uuid::v4();

        try {
            $resultado = MercadoPagoClient::criarPagamentoPix(
                (float) $pedido['total'],
                (string) ($dados['email'] ?? ''),
                (string) ($dados['nome_completo'] ?? ''),
                (string) ($dados['cpf'] ?? ''),
                $idempotencyKey
            );
        } catch (\Throwable $e) {
            http_response_code(502);
            echo json_encode(['erro' => 'Falha ao gerar PIX com o Mercado Pago.']);
            return;
        }

        $pagamentoId = Pagamento::criar(
            $pedido['id'],
            'pix',
            (float) $pedido['total'],
            $idempotencyKey,
            $resultado['id'],
            $resultado['status'],
            $resultado['status_detail'],
            $resultado['qr_code'],
            $resultado['qr_code_base64']
        );

        echo json_encode([
            'id' => $pagamentoId,
            'status' => $resultado['status'],
            'status_detail' => $resultado['status_detail'],
            'qr_code' => $resultado['qr_code'],
            'qr_code_base64' => $resultado['qr_code_base64'],
        ]);
    }

    public static function consultarStatus(int $pagamentoId): void
    {
        $pagamento = Pagamento::buscarPorId($pagamentoId);
        if (!$pagamento) {
            http_response_code(404);
            echo json_encode(['erro' => 'Pagamento não encontrado.']);
            return;
        }

        $pedido = Pedido::buscarPorId((int) $pagamento['pedido_id']);
        if (!$pedido || (int) $pedido['usuario_id'] !== (int) $_SESSION['usuario_id']) {
            http_response_code(403);
            echo json_encode(['erro' => 'Acesso negado.']);
            return;
        }

        if (!$pagamento['mp_payment_id']) {
            echo json_encode(['status' => $pagamento['status'], 'status_detail' => $pagamento['status_detail'], 'pedido_status' => $pedido['status']]);
            return;
        }

        try {
            $resultado = MercadoPagoClient::consultarPagamento($pagamento['mp_payment_id']);
        } catch (\Throwable $e) {
            echo json_encode(['status' => $pagamento['status'], 'status_detail' => $pagamento['status_detail'], 'pedido_status' => $pedido['status']]);
            return;
        }

        if ($resultado['status'] !== $pagamento['status']) {
            Pagamento::atualizarStatus($pagamentoId, $resultado['status'], $resultado['status_detail']);
            if ($resultado['status'] === 'approved') {
                self::confirmarPagamento((int) $pedido['id']);
                $pedido['status'] = 'pago';
            }
        }

        echo json_encode([
            'status' => $resultado['status'],
            'status_detail' => $resultado['status_detail'],
            'pedido_status' => $pedido['status'],
        ]);
    }

    /**
     * Estorno pelo painel do admin: devolve o dinheiro no Mercado Pago,
     * cancela o pedido e recoloca os itens no estoque.
     */
    public static function estornar(int $pedidoId): void
    {
        $pedido = Pedido::buscarPorId($pedidoId);
        if (!$pedido) {
            http_response_code(404);
            echo json_encode(['erro' => 'Pedido não encontrado.']);
            return;
        }
        if ($pedido['status'] === 'cancelado') {
            http_response_code(409);
            echo json_encode(['erro' => 'Este pedido já está cancelado.']);
            return;
        }

        $pagamento = Pagamento::buscarPorPedido($pedidoId);
        if (!$pagamento || !$pagamento['mp_payment_id']) {
            http_response_code(409);
            echo json_encode(['erro' => 'Este pedido não tem um pagamento registrado no Mercado Pago para estornar.']);
            return;
        }

        try {
            MercadoPagoClient::estornar((string) $pagamento['mp_payment_id']);
        } catch (\Throwable $e) {
            http_response_code(502);
            echo json_encode([
                'erro' => 'O Mercado Pago recusou o estorno: ' . $e->getMessage(),
            ]);
            return;
        }

        Pagamento::atualizarStatus((int) $pagamento['id'], 'refunded', 'refunded_by_admin');

        // Só devolve ao estoque o que chegou a ser debitado (pedido já pago).
        if ($pedido['status'] !== 'aguardando_pagamento') {
            self::moverEstoque($pedido, +1);
        }
        Pedido::atualizarStatus($pedidoId, 'cancelado');

        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'estornou_pedido', 'pedido', $pedidoId);

        echo json_encode(['ok' => true, 'pedido' => Pedido::buscarPorId($pedidoId)]);
    }

    private static function carregarPedidoDoUsuario(int $pedidoId): ?array
    {
        $pedido = Pedido::buscarPorId($pedidoId);
        if (!$pedido || (int) $pedido['usuario_id'] !== (int) $_SESSION['usuario_id']) {
            http_response_code(403);
            echo json_encode(['erro' => 'Acesso negado.']);
            return null;
        }
        if ($pedido['status'] !== 'aguardando_pagamento') {
            http_response_code(409);
            echo json_encode(['erro' => 'Este pedido já não está aguardando pagamento.']);
            return null;
        }
        return $pedido;
    }
}
