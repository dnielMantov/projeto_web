<?php

namespace App\Shipping;

use App\Models\Configuracao;

class FreteCalculator
{
    private const UFS_REGIONAL = ['RJ', 'MG', 'ES'];
    private const PESO_MINIMO_KG = 0.3;

    private const MULTIPLICADOR_REGIAO = ['local' => 1.0, 'regional' => 1.3, 'nacional' => 1.8];

    private const PRAZOS_PADRAO = ['local' => [1, 3], 'regional' => [3, 5], 'nacional' => [5, 10]];
    private const PRAZOS_EXPRESSA = ['local' => [1, 1], 'regional' => [2, 3], 'nacional' => [4, 6]];

    /**
     * Os parâmetros de preço vêm da tabela `configuracoes` (editável pelo admin
     * em /admin > Configurações). Configuracao::PADROES guarda os valores
     * originais, usados enquanto ninguém alterou nada.
     */
    public static function limiarFreteGratis(): float
    {
        return Configuracao::obterFloat('frete_limiar_gratis');
    }

    public static function classificarRegiao(string $uf): string
    {
        if ($uf === strtoupper(Configuracao::obter('frete_origem_uf'))) {
            return 'local';
        }
        if (in_array($uf, self::UFS_REGIONAL, true)) {
            return 'regional';
        }
        return 'nacional';
    }

    /** @return array{regiao:string, opcoes: array<int, array{tipo:string,valor:float,prazoMinDias:int,prazoMaxDias:int,gratis:bool}>} */
    public static function calcular(float $pesoTotalGramas, float $subtotalFisico, string $ufDestino): array
    {
        $regiao = self::classificarRegiao($ufDestino);
        $pesoKg = max($pesoTotalGramas / 1000, self::PESO_MINIMO_KG);
        $multiplicadorRegiao = self::MULTIPLICADOR_REGIAO[$regiao];

        $base = Configuracao::obterFloat('frete_base')
            + $pesoKg * Configuracao::obterFloat('frete_preco_kg') * $multiplicadorRegiao;
        $valorPadrao = round($base, 2);
        $valorExpressa = round($base * Configuracao::obterFloat('frete_multiplicador_expressa'), 2);

        $gratisPadrao = $subtotalFisico >= self::limiarFreteGratis();

        [$prazoPadraoMin, $prazoPadraoMax] = self::PRAZOS_PADRAO[$regiao];
        [$prazoExpressaMin, $prazoExpressaMax] = self::PRAZOS_EXPRESSA[$regiao];

        return [
            'regiao' => $regiao,
            'opcoes' => [
                [
                    'tipo' => 'padrao',
                    'valor' => $gratisPadrao ? 0.0 : $valorPadrao,
                    'prazoMinDias' => $prazoPadraoMin,
                    'prazoMaxDias' => $prazoPadraoMax,
                    'gratis' => $gratisPadrao,
                ],
                [
                    'tipo' => 'expressa',
                    'valor' => $valorExpressa,
                    'prazoMinDias' => $prazoExpressaMin,
                    'prazoMaxDias' => $prazoExpressaMax,
                    'gratis' => false,
                ],
            ],
        ];
    }
}
