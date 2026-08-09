<?php

namespace App\Shipping;

class ViaCepClient
{
    /** @return array{cep:string,logradouro:string,bairro:string,localidade:string,uf:string}|null */
    public static function consultarCep(string $cep): ?array
    {
        $digits = preg_replace('/\D/', '', $cep) ?? '';
        if (strlen($digits) !== 8) {
            return null;
        }

        $ch = curl_init("https://viacep.com.br/ws/{$digits}/json/");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $erroCurl = curl_errno($ch);
        curl_close($ch);

        if ($erroCurl || $httpCode !== 200 || $response === false) {
            return null;
        }

        $dados = json_decode($response, true);
        if (!is_array($dados) || !empty($dados['erro'])) {
            return null;
        }

        return [
            'cep' => $dados['cep'] ?? $digits,
            'logradouro' => $dados['logradouro'] ?? '',
            'bairro' => $dados['bairro'] ?? '',
            'localidade' => $dados['localidade'] ?? '',
            'uf' => $dados['uf'] ?? '',
        ];
    }
}
