<?php

namespace App\Admin;

use App\Database\Connection;
use App\Models\Livro;
use App\Models\Pedido;

class RelatorioController
{
    /** Pedidos que contam como venda concretizada. */
    private const STATUS_FATURADOS = "('pago','processando','enviado','entregue')";

    public static function resumo(): void
    {
        $pdo = Connection::get();

        $totais = $pdo->query(
            'SELECT COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS faturamento,
                    COALESCE(AVG(total),0) AS ticket_medio
             FROM pedidos WHERE status IN ' . self::STATUS_FATURADOS
        )->fetch();

        // Série dos últimos 30 dias, para o gráfico de linha.
        $vendasPorDia = $pdo->query(
            'SELECT DATE(criado_em) AS dia, COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS faturamento
             FROM pedidos
             WHERE status IN ' . self::STATUS_FATURADOS . '
               AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY DATE(criado_em)
             ORDER BY dia'
        )->fetchAll();

        $topLivros = $pdo->query(
            'SELECT i.livro_id, i.titulo_snapshot AS titulo,
                    SUM(i.quantidade) AS unidades,
                    SUM(i.quantidade * i.preco_unitario) AS receita
             FROM itens_pedido i
             JOIN pedidos p ON p.id = i.pedido_id
             WHERE p.status IN ' . self::STATUS_FATURADOS . '
             GROUP BY i.livro_id, i.titulo_snapshot
             ORDER BY unidades DESC
             LIMIT 5'
        )->fetchAll();

        $porCategoria = $pdo->query(
            'SELECT COALESCE(c.nome, "Sem categoria") AS categoria, c.cor,
                    SUM(i.quantidade) AS unidades,
                    SUM(i.quantidade * i.preco_unitario) AS receita
             FROM itens_pedido i
             JOIN pedidos p ON p.id = i.pedido_id
             LEFT JOIN livros l ON l.id = i.livro_id
             LEFT JOIN categorias c ON c.id = l.categoria_id
             WHERE p.status IN ' . self::STATUS_FATURADOS . '
             GROUP BY categoria, c.cor
             ORDER BY receita DESC'
        )->fetchAll();

        $clientes = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE papel = 'cliente'")->fetchColumn();

        echo json_encode([
            'faturamento' => (float) $totais['faturamento'],
            'pedidos_faturados' => (int) $totais['pedidos'],
            'ticket_medio' => (float) $totais['ticket_medio'],
            'clientes' => (int) $clientes,
            'estoque_total' => Livro::somaEstoque(),
            'pedidos_por_status' => Pedido::contarPorStatus(),
            'vendas_por_dia' => array_map(fn ($l) => [
                'dia' => $l['dia'],
                'pedidos' => (int) $l['pedidos'],
                'faturamento' => (float) $l['faturamento'],
            ], $vendasPorDia),
            'top_livros' => array_map(fn ($l) => [
                'livro_id' => $l['livro_id'],
                'titulo' => $l['titulo'],
                'unidades' => (int) $l['unidades'],
                'receita' => (float) $l['receita'],
            ], $topLivros),
            'por_categoria' => array_map(fn ($l) => [
                'categoria' => $l['categoria'],
                'cor' => $l['cor'] ?? '#64748b',
                'unidades' => (int) $l['unidades'],
                'receita' => (float) $l['receita'],
            ], $porCategoria),
        ]);
    }
}
