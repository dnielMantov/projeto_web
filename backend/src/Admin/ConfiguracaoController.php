<?php

namespace App\Admin;

use App\Models\ActivityLog;
use App\Models\Configuracao;
use App\Support\Env;

class ConfiguracaoController
{
    /** Chaves numéricas e seus limites aceitáveis, para não gravar absurdo. */
    private const LIMITES = [
        'frete_base' => [0, 200],
        'frete_preco_kg' => [0, 100],
        'frete_limiar_gratis' => [0, 100000],
        'frete_multiplicador_expressa' => [1, 10],
    ];

    public static function listar(): void
    {
        Env::load();
        $accessToken = (string) ($_ENV['MP_ACCESS_TOKEN'] ?? '');

        echo json_encode([
            'configuracoes' => Configuracao::obterTodas(),
            'padroes' => Configuracao::PADROES,
            // O Access Token é secreto e mora no .env: só informamos se está
            // presente e se é de teste, nunca o valor em si.
            'gateway' => [
                'access_token_configurado' => $accessToken !== '',
                'ambiente' => str_starts_with($accessToken, 'TEST-') ? 'teste' : ($accessToken === '' ? 'ausente' : 'producao'),
            ],
        ]);
    }

    public static function salvar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $alteradas = [];

        foreach ($dados as $chave => $valor) {
            // Configuracao::definir já rejeita chave fora da whitelist, mas
            // filtramos aqui para responder 422 em vez de estourar exceção.
            if (!array_key_exists($chave, Configuracao::PADROES)) {
                continue;
            }

            if (isset(self::LIMITES[$chave])) {
                [$min, $max] = self::LIMITES[$chave];
                if (!is_numeric($valor) || (float) $valor < $min || (float) $valor > $max) {
                    http_response_code(422);
                    echo json_encode(['erro' => "Valor inválido para {$chave} (esperado entre {$min} e {$max})."]);
                    return;
                }
                $valor = number_format((float) $valor, 2, '.', '');
            }

            if ($chave === 'frete_origem_uf') {
                $valor = strtoupper(trim((string) $valor));
                if (!preg_match('/^[A-Z]{2}$/', $valor)) {
                    http_response_code(422);
                    echo json_encode(['erro' => 'UF de origem deve ter 2 letras (ex: SP).']);
                    return;
                }
            }

            Configuracao::definir($chave, (string) $valor);
            $alteradas[] = $chave;
        }

        if ($alteradas) {
            ActivityLog::registrar(
                (int) $_SESSION['usuario_id'],
                'alterou_configuracoes',
                'configuracao',
                null,
                implode(', ', $alteradas)
            );
        }

        echo json_encode(['ok' => true, 'alteradas' => $alteradas, 'configuracoes' => Configuracao::obterTodas()]);
    }
}
