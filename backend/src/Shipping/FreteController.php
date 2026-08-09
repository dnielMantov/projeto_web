<?php

namespace App\Shipping;

use App\Models\Livro;

class FreteController
{
    public static function calcular(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $cep = trim((string) ($dados['cep'] ?? ''));
        $itens = is_array($dados['itens'] ?? null) ? $dados['itens'] : [];

        if ($cep === '' || empty($itens)) {
            http_response_code(400);
            echo json_encode(['erro' => 'Informe o CEP e ao menos um item.']);
            return;
        }

        $endereco = ViaCepClient::consultarCep($cep);
        if (!$endereco) {
            http_response_code(422);
            echo json_encode(['erro' => 'CEP inválido ou não encontrado.']);
            return;
        }

        $livroIds = array_map(fn ($item) => (string) $item['livro_id'], $itens);
        $livros = Livro::listarPorIds($livroIds);

        $pesoTotalGramas = 0.0;
        $subtotalFisico = 0.0;

        foreach ($itens as $item) {
            $livro = $livros[$item['livro_id']] ?? null;
            if (!$livro) {
                continue;
            }
            $formato = (string) $item['formato'];
            $quantidade = max(1, (int) $item['quantidade']);

            if ($formato === 'Físico' || $formato === 'Kit') {
                $pesoTotalGramas += (float) $livro['peso_gramas'] * $quantidade;
                $subtotalFisico += (float) $livro['preco_fisico'] * $quantidade;
            }
        }

        $resultado = FreteCalculator::calcular($pesoTotalGramas, $subtotalFisico, $endereco['uf']);

        echo json_encode([
            'cep' => $endereco['cep'],
            'cidade' => $endereco['localidade'],
            'uf' => $endereco['uf'],
            'regiao' => $resultado['regiao'],
            'opcoes' => $resultado['opcoes'],
        ]);
    }
}
