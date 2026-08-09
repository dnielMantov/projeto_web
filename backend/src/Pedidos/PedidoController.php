<?php

namespace App\Pedidos;

use App\Models\ActivityLog;
use App\Models\Livro;
use App\Models\Pedido;
use App\Models\User;
use App\Shipping\FreteCalculator;
use App\Shipping\ViaCepClient;

class PedidoController
{
    /** Formatos que consomem estoque físico (e-book é ilimitado). */
    private const FORMATOS_COM_ESTOQUE = ['Físico', 'Kit'];

    public static function criar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $itensRequest = is_array($dados['itens'] ?? null) ? $dados['itens'] : [];
        $metodoEntrega = (string) ($dados['metodo_entrega'] ?? '');

        if (empty($itensRequest) || !in_array($metodoEntrega, ['padrao', 'expressa', 'retirada', 'download'], true)) {
            http_response_code(400);
            echo json_encode(['erro' => 'Itens ou método de entrega inválidos.']);
            return;
        }
        if (trim((string) ($dados['nome'] ?? '')) === '' || trim((string) ($dados['cpf'] ?? '')) === '') {
            http_response_code(400);
            echo json_encode(['erro' => 'Nome e CPF são obrigatórios.']);
            return;
        }

        $livroIds = array_map(fn ($item) => (string) $item['livro_id'], $itensRequest);
        $livros = Livro::listarPorIds($livroIds);

        $subtotal = 0.0;
        $pesoTotalGramas = 0.0;
        $subtotalFisico = 0.0;
        $itensPedido = [];

        foreach ($itensRequest as $item) {
            $livro = $livros[$item['livro_id']] ?? null;
            if (!$livro) {
                http_response_code(422);
                echo json_encode(['erro' => "Livro não encontrado: {$item['livro_id']}"]);
                return;
            }

            $formato = (string) $item['formato'];
            $quantidade = max(1, (int) $item['quantidade']);
            $precoUnitario = $formato === 'E-book' ? (float) $livro['preco_ebook'] : (float) $livro['preco_fisico'];

            // Estoque é conferido aqui, mas só debitado quando o pagamento é
            // aprovado (ver PagamentoController) - senão carrinho abandonado
            // seguraria estoque para sempre.
            if (in_array($formato, self::FORMATOS_COM_ESTOQUE, true) && (int) $livro['estoque'] < $quantidade) {
                http_response_code(422);
                echo json_encode([
                    'erro' => "Estoque insuficiente para \"{$livro['titulo']}\": restam {$livro['estoque']} unidade(s).",
                ]);
                return;
            }

            $subtotal += $precoUnitario * $quantidade;
            if ($formato === 'Físico' || $formato === 'Kit') {
                $pesoTotalGramas += (float) $livro['peso_gramas'] * $quantidade;
                $subtotalFisico += $precoUnitario * $quantidade;
            }

            $itensPedido[] = [
                'livro_id' => $livro['id'],
                'titulo_snapshot' => $livro['titulo'],
                'formato' => $formato,
                'quantidade' => $quantidade,
                'preco_unitario' => $precoUnitario,
            ];
        }

        $freteValor = 0.0;
        $fretePrazoMin = null;
        $fretePrazoMax = null;
        $cidade = null;
        $uf = null;

        if ($metodoEntrega === 'padrao' || $metodoEntrega === 'expressa') {
            $endereco = ViaCepClient::consultarCep((string) ($dados['cep'] ?? ''));
            if (!$endereco) {
                http_response_code(422);
                echo json_encode(['erro' => 'CEP inválido ou não encontrado.']);
                return;
            }
            $cidade = $endereco['localidade'];
            $uf = $endereco['uf'];

            $resultadoFrete = FreteCalculator::calcular($pesoTotalGramas, $subtotalFisico, $uf);
            foreach ($resultadoFrete['opcoes'] as $opcao) {
                if ($opcao['tipo'] === $metodoEntrega) {
                    $freteValor = $opcao['valor'];
                    $fretePrazoMin = $opcao['prazoMinDias'];
                    $fretePrazoMax = $opcao['prazoMaxDias'];
                    break;
                }
            }
        }

        $total = round($subtotal + $freteValor, 2);

        $pedidoId = Pedido::criar((int) $_SESSION['usuario_id'], [
            'metodo_entrega' => $metodoEntrega,
            'subtotal' => round($subtotal, 2),
            'frete_valor' => $freteValor,
            'frete_prazo_min' => $fretePrazoMin,
            'frete_prazo_max' => $fretePrazoMax,
            'total' => $total,
            'nome_destinatario' => (string) $dados['nome'],
            'cpf' => (string) $dados['cpf'],
            'telefone' => $dados['telefone'] ?? null,
            'cep' => $dados['cep'] ?? null,
            'logradouro' => $dados['logradouro'] ?? null,
            'numero' => $dados['numero'] ?? null,
            'complemento' => $dados['complemento'] ?? null,
            'cidade' => $cidade,
            'uf' => $uf,
            'itens' => $itensPedido,
        ]);

        http_response_code(201);
        echo json_encode(Pedido::buscarPorId($pedidoId));
    }

    public static function listarMeus(): void
    {
        echo json_encode(['pedidos' => Pedido::listarPorUsuario((int) $_SESSION['usuario_id'])]);
    }

    public static function buscarUm(int $id): void
    {
        $pedido = Pedido::buscarPorId($id);
        if (!$pedido) {
            http_response_code(404);
            echo json_encode(['erro' => 'Pedido não encontrado.']);
            return;
        }

        $ehDono = (int) $pedido['usuario_id'] === (int) $_SESSION['usuario_id'];
        if (!$ehDono && !in_array($_SESSION['papel'], User::PAPEIS_GERENCIA, true)) {
            http_response_code(403);
            echo json_encode(['erro' => 'Acesso negado.']);
            return;
        }

        echo json_encode($pedido);
    }

    // ---------------------------------------------------------------- gerência

    public static function listarGerencia(): void
    {
        echo json_encode(['pedidos' => Pedido::listarTodos([
            'status' => $_GET['status'] ?? null,
            'busca' => trim((string) ($_GET['busca'] ?? '')),
        ])]);
    }

    public static function atualizarStatus(int $id): void
    {
        $pedido = Pedido::buscarPorId($id);
        if (!$pedido) {
            http_response_code(404);
            echo json_encode(['erro' => 'Pedido não encontrado.']);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = (string) ($dados['status'] ?? '');

        if (!in_array($status, Pedido::STATUS, true)) {
            http_response_code(422);
            echo json_encode(['erro' => 'Status inválido.']);
            return;
        }

        $codigoRastreio = trim((string) ($dados['codigo_rastreio'] ?? '')) ?: null;
        Pedido::atualizarStatus($id, $status, $codigoRastreio);
        ActivityLog::registrar(
            (int) $_SESSION['usuario_id'],
            'atualizou_status_pedido',
            'pedido',
            $id,
            "{$pedido['status']} => {$status}"
        );

        echo json_encode(Pedido::buscarPorId($id));
    }

    /** Exclusão definitiva, só para admin (ver rota). */
    public static function excluir(int $id): void
    {
        if (!Pedido::buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['erro' => 'Pedido não encontrado.']);
            return;
        }

        Pedido::excluir($id);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'excluiu_pedido', 'pedido', $id);

        echo json_encode(['ok' => true]);
    }

    /** KPIs operacionais do painel do gerente. */
    public static function metricas(): void
    {
        echo json_encode([
            'pedidos_por_status' => Pedido::contarPorStatus(),
            'livros_ativos' => Livro::contarAtivos(),
            'estoque_total' => Livro::somaEstoque(),
            'estoque_baixo' => Livro::estoqueBaixo(),
        ]);
    }
}
