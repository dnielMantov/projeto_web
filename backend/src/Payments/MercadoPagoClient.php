<?php

namespace App\Payments;

use App\Support\Env;
use App\Support\Uuid;

class MercadoPagoClient
{
    private const BASE_URL = 'https://api.mercadopago.com';

    public static function criarPagamentoCartao(
        string $cardToken,
        string $paymentMethodId,
        int $installments,
        float $valor,
        string $email,
        string $cpf,
        string $idempotencyKey
    ): array {
        $resposta = self::request('POST', '/v1/payments', [
            'transaction_amount' => $valor,
            'token' => $cardToken,
            'description' => 'Pedido COMPIA Editora',
            'installments' => $installments,
            'payment_method_id' => $paymentMethodId,
            'payer' => [
                'email' => $email,
                'identification' => ['type' => 'CPF', 'number' => preg_replace('/\D/', '', $cpf)],
            ],
        ], $idempotencyKey);

        return [
            'id' => (string) ($resposta['id'] ?? ''),
            'status' => $resposta['status'] ?? 'unknown',
            'status_detail' => $resposta['status_detail'] ?? null,
        ];
    }

    public static function criarPagamentoPix(
        float $valor,
        string $email,
        string $nomeCompleto,
        string $cpf,
        string $idempotencyKey
    ): array {
        $partesNome = explode(' ', trim($nomeCompleto), 2);

        $resposta = self::request('POST', '/v1/payments', [
            'transaction_amount' => $valor,
            'description' => 'Pedido COMPIA Editora',
            'payment_method_id' => 'pix',
            'payer' => [
                'email' => $email,
                'first_name' => $partesNome[0] ?? $nomeCompleto,
                'last_name' => $partesNome[1] ?? '',
                'identification' => ['type' => 'CPF', 'number' => preg_replace('/\D/', '', $cpf)],
            ],
        ], $idempotencyKey);

        $dadosTransacao = $resposta['point_of_interaction']['transaction_data'] ?? [];

        return [
            'id' => (string) ($resposta['id'] ?? ''),
            'status' => $resposta['status'] ?? 'unknown',
            'status_detail' => $resposta['status_detail'] ?? null,
            'qr_code' => $dadosTransacao['qr_code'] ?? null,
            'qr_code_base64' => $dadosTransacao['qr_code_base64'] ?? null,
        ];
    }

    public static function consultarPagamento(string $mpPaymentId): array
    {
        $resposta = self::request('GET', "/v1/payments/{$mpPaymentId}", null, null);

        return [
            'id' => (string) ($resposta['id'] ?? ''),
            'status' => $resposta['status'] ?? 'unknown',
            'status_detail' => $resposta['status_detail'] ?? null,
        ];
    }

    /**
     * Estorna um pagamento aprovado. Sem $valor o estorno é total.
     * O Mercado Pago recusa estorno de pagamento que não esteja 'approved'.
     */
    public static function estornar(string $mpPaymentId, ?float $valor = null): array
    {
        $resposta = self::request(
            'POST',
            "/v1/payments/{$mpPaymentId}/refunds",
            $valor === null ? [] : ['amount' => $valor],
            Uuid::v4()
        );

        return [
            'id' => (string) ($resposta['id'] ?? ''),
            'status' => $resposta['status'] ?? 'unknown',
            'valor' => (float) ($resposta['amount'] ?? 0),
        ];
    }

    private static function request(string $method, string $path, ?array $body, ?string $idempotencyKey): array
    {
        Env::load();
        $accessToken = $_ENV['MP_ACCESS_TOKEN'] ?? '';

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
        ];
        if ($idempotencyKey !== null) {
            $headers[] = 'X-Idempotency-Key: ' . $idempotencyKey;
        }

        $ch = curl_init(self::BASE_URL . $path);
        $opcoes = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
        ];
        if ($body !== null) {
            $opcoes[CURLOPT_POSTFIELDS] = json_encode($body);
        }
        curl_setopt_array($ch, $opcoes);

        $resposta = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $erroCurl = curl_error($ch);
        curl_close($ch);

        if ($resposta === false) {
            throw new \RuntimeException("Falha ao comunicar com o Mercado Pago: {$erroCurl}");
        }

        $decodificado = json_decode($resposta, true);
        if (!is_array($decodificado)) {
            throw new \RuntimeException('Resposta inválida do Mercado Pago.');
        }

        if ($httpCode >= 400) {
            $mensagem = $decodificado['message'] ?? 'Erro desconhecido do Mercado Pago.';
            throw new \RuntimeException("Mercado Pago retornou HTTP {$httpCode}: {$mensagem}");
        }

        return $decodificado;
    }
}
