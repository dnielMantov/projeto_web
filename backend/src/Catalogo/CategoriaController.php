<?php

namespace App\Catalogo;

use App\Models\ActivityLog;
use App\Models\Categoria;

class CategoriaController
{
    public static function listar(): void
    {
        echo json_encode(['categorias' => Categoria::listarTodas()]);
    }

    private static function lerCampos(array $dados): ?array
    {
        $nome = trim((string) ($dados['nome'] ?? ''));
        if ($nome === '') {
            http_response_code(422);
            echo json_encode(['erro' => 'Nome da categoria é obrigatório.']);
            return null;
        }

        return [
            'nome' => $nome,
            'descricao' => trim((string) ($dados['descricao'] ?? '')) ?: null,
            'cor' => trim((string) ($dados['cor'] ?? '')) ?: '#06b6d4',
            'imagem_url' => trim((string) ($dados['imagem_url'] ?? '')) ?: null,
        ];
    }

    public static function criar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $campos = self::lerCampos($dados);
        if ($campos === null) {
            return;
        }

        if (Categoria::buscarPorNome($campos['nome'])) {
            http_response_code(409);
            echo json_encode(['erro' => 'Já existe uma categoria com esse nome.']);
            return;
        }

        $id = Categoria::criar($campos['nome'], $campos['descricao'], $campos['cor'], $campos['imagem_url']);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'criou_categoria', 'categoria', $id, $campos['nome']);

        http_response_code(201);
        echo json_encode(Categoria::buscarPorId($id));
    }

    public static function atualizar(int $id): void
    {
        if (!Categoria::buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['erro' => 'Categoria não encontrada.']);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $campos = self::lerCampos($dados);
        if ($campos === null) {
            return;
        }

        $homonima = Categoria::buscarPorNome($campos['nome']);
        if ($homonima && (int) $homonima['id'] !== $id) {
            http_response_code(409);
            echo json_encode(['erro' => 'Já existe outra categoria com esse nome.']);
            return;
        }

        Categoria::atualizar($id, $campos['nome'], $campos['descricao'], $campos['cor'], $campos['imagem_url']);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'editou_categoria', 'categoria', $id, $campos['nome']);

        echo json_encode(Categoria::buscarPorId($id));
    }

    public static function excluir(int $id): void
    {
        $categoria = Categoria::buscarPorId($id);
        if (!$categoria) {
            http_response_code(404);
            echo json_encode(['erro' => 'Categoria não encontrada.']);
            return;
        }

        // A FK de livros.categoria_id recusaria a exclusão de qualquer forma;
        // aqui devolvemos um erro explicando, em vez de um 500 de constraint.
        $emUso = Categoria::contarLivros($id);
        if ($emUso > 0) {
            http_response_code(409);
            echo json_encode([
                'erro' => "Esta categoria tem {$emUso} livro(s). Mova-os para outra categoria antes de excluir.",
            ]);
            return;
        }

        Categoria::excluir($id);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'excluiu_categoria', 'categoria', $id, $categoria['nome']);

        echo json_encode(['ok' => true]);
    }
}
