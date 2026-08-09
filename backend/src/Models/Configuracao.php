<?php

namespace App\Models;

use App\Database\Connection;

class Configuracao
{
    /**
     * Chaves aceitas e seus defaults. Funciona como whitelist: nada fora
     * daqui é gravado, e o valor default é o que vale enquanto o admin não
     * mexer na tela de configurações.
     */
    public const PADROES = [
        'frete_base' => '8.00',
        'frete_preco_kg' => '3.50',
        'frete_limiar_gratis' => '199.00',
        'frete_multiplicador_expressa' => '1.75',
        'frete_origem_uf' => 'SP',
        'gateway_ativo' => 'mercadopago',
        'loja_nome' => 'COMPIA Editora',
    ];

    /** @var array<string,string>|null cache por requisição */
    private static ?array $cache = null;

    /** @return array<string,string> todas as chaves, com os defaults preenchidos */
    public static function obterTodas(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $valores = self::PADROES;
        $pdo = Connection::get();
        foreach ($pdo->query('SELECT chave, valor FROM configuracoes')->fetchAll() as $linha) {
            if (array_key_exists($linha['chave'], $valores)) {
                $valores[$linha['chave']] = (string) $linha['valor'];
            }
        }

        return self::$cache = $valores;
    }

    public static function obter(string $chave): string
    {
        return self::obterTodas()[$chave] ?? '';
    }

    public static function obterFloat(string $chave): float
    {
        return (float) self::obter($chave);
    }

    public static function definir(string $chave, string $valor): void
    {
        if (!array_key_exists($chave, self::PADROES)) {
            throw new \InvalidArgumentException("Configuração desconhecida: {$chave}");
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'INSERT INTO configuracoes (chave, valor) VALUES (:chave, :valor)
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)'
        );
        $stmt->execute(['chave' => $chave, 'valor' => $valor]);

        self::$cache = null;
    }
}
