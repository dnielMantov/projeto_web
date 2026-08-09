<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class Pedido
{
    public static function criar(int $usuarioId, array $dados): int
    {
        $pdo = Connection::get();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO pedidos (
                    usuario_id, metodo_entrega, subtotal, frete_valor, frete_prazo_min, frete_prazo_max, total,
                    nome_destinatario, cpf, telefone, cep, logradouro, numero, complemento, cidade, uf
                ) VALUES (
                    :usuario_id, :metodo_entrega, :subtotal, :frete_valor, :frete_prazo_min, :frete_prazo_max, :total,
                    :nome_destinatario, :cpf, :telefone, :cep, :logradouro, :numero, :complemento, :cidade, :uf
                )'
            );
            $stmt->execute([
                'usuario_id' => $usuarioId,
                'metodo_entrega' => $dados['metodo_entrega'],
                'subtotal' => $dados['subtotal'],
                'frete_valor' => $dados['frete_valor'],
                'frete_prazo_min' => $dados['frete_prazo_min'],
                'frete_prazo_max' => $dados['frete_prazo_max'],
                'total' => $dados['total'],
                'nome_destinatario' => $dados['nome_destinatario'],
                'cpf' => $dados['cpf'],
                'telefone' => $dados['telefone'],
                'cep' => $dados['cep'],
                'logradouro' => $dados['logradouro'],
                'numero' => $dados['numero'],
                'complemento' => $dados['complemento'],
                'cidade' => $dados['cidade'],
                'uf' => $dados['uf'],
            ]);

            $pedidoId = (int) $pdo->lastInsertId();

            $stmtItem = $pdo->prepare(
                'INSERT INTO itens_pedido (pedido_id, livro_id, titulo_snapshot, formato, quantidade, preco_unitario)
                 VALUES (:pedido_id, :livro_id, :titulo_snapshot, :formato, :quantidade, :preco_unitario)'
            );
            foreach ($dados['itens'] as $item) {
                $stmtItem->execute([
                    'pedido_id' => $pedidoId,
                    'livro_id' => $item['livro_id'],
                    'titulo_snapshot' => $item['titulo_snapshot'],
                    'formato' => $item['formato'],
                    'quantidade' => $item['quantidade'],
                    'preco_unitario' => $item['preco_unitario'],
                ]);
            }

            $pdo->commit();
            return $pedidoId;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $pedido = $stmt->fetch();
        if (!$pedido) {
            return null;
        }
        $pedido['itens'] = self::buscarItens($id);
        return $pedido;
    }

    public static function listarPorUsuario(int $usuarioId): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE usuario_id = :usuario_id ORDER BY criado_em DESC');
        $stmt->execute(['usuario_id' => $usuarioId]);
        $pedidos = $stmt->fetchAll();

        foreach ($pedidos as &$pedido) {
            $pedido['itens'] = self::buscarItens((int) $pedido['id']);
        }
        return $pedidos;
    }

    public const STATUS = [
        'aguardando_pagamento', 'pago', 'processando', 'enviado', 'entregue', 'cancelado',
    ];

    /**
     * Visão da gerência: todos os pedidos, com os dados do cliente (o enunciado
     * pede "visualizar dados de clientes relacionados aos pedidos").
     *
     * @param array{status?:string, busca?:string} $filtros
     */
    public static function listarTodos(array $filtros = []): array
    {
        $where = [];
        $params = [];

        if (!empty($filtros['status']) && in_array($filtros['status'], self::STATUS, true)) {
            $where[] = 'p.status = :status';
            $params['status'] = $filtros['status'];
        }
        if (!empty($filtros['busca'])) {
            $where[] = '(u.nome LIKE :busca OR u.email LIKE :busca OR p.nome_destinatario LIKE :busca OR p.id = :busca_id)';
            $params['busca'] = '%' . $filtros['busca'] . '%';
            $params['busca_id'] = (int) $filtros['busca'];
        }

        $sql = 'SELECT p.*, u.nome AS cliente_nome, u.email AS cliente_email
                FROM pedidos p
                JOIN usuarios u ON u.id = p.usuario_id';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY p.criado_em DESC LIMIT 200';

        $stmt = Connection::get()->prepare($sql);
        $stmt->execute($params);
        $pedidos = $stmt->fetchAll();

        foreach ($pedidos as &$pedido) {
            $pedido['itens'] = self::buscarItens((int) $pedido['id']);
        }
        return $pedidos;
    }

    /** Remove o pedido e o que depende dele (FKs impedem apagar só a linha pai). */
    public static function excluir(int $id): void
    {
        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            foreach (['pagamentos', 'itens_pedido'] as $tabela) {
                $stmt = $pdo->prepare("DELETE FROM {$tabela} WHERE pedido_id = :id");
                $stmt->execute(['id' => $id]);
            }
            $stmt = $pdo->prepare('DELETE FROM pedidos WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** @return array<string,int> quantidade de pedidos por status */
    public static function contarPorStatus(): array
    {
        $contagem = array_fill_keys(self::STATUS, 0);
        $stmt = Connection::get()->query('SELECT status, COUNT(*) AS total FROM pedidos GROUP BY status');
        foreach ($stmt->fetchAll() as $linha) {
            $contagem[$linha['status']] = (int) $linha['total'];
        }
        return $contagem;
    }

    public static function atualizarStatus(int $id, string $status, ?string $codigoRastreio = null): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'UPDATE pedidos SET status = :status, codigo_rastreio = COALESCE(:codigo_rastreio, codigo_rastreio) WHERE id = :id'
        );
        $stmt->execute(['status' => $status, 'codigo_rastreio' => $codigoRastreio, 'id' => $id]);
    }

    private static function buscarItens(int $pedidoId): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT * FROM itens_pedido WHERE pedido_id = :pedido_id');
        $stmt->execute(['pedido_id' => $pedidoId]);
        return $stmt->fetchAll();
    }
}
