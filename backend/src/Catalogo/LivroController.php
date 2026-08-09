<?php

namespace App\Catalogo;

use App\Models\ActivityLog;
use App\Models\Livro;

class LivroController
{
    private const FORMATOS_VALIDOS = ['Físico', 'E-book', 'Kit'];

    /**
     * Sem page/per_page: devolve o catálogo inteiro (usado pelo CatalogContext
     * para alimentar Home/Categorias/Produto de uma vez). Com page/per_page:
     * pesquisa, filtra, ordena e pagina no banco - usado pela grade do
     * /catalogo, cuja página muda o resultado sem recarregar o site inteiro.
     */
    public static function listarPublico(): void
    {
        if (!isset($_GET['page']) && !isset($_GET['per_page'])) {
            echo json_encode(['livros' => Livro::listarPublicos()]);
            return;
        }

        $pagina = max(1, (int) ($_GET['page'] ?? 1));
        $porPagina = max(1, min(48, (int) ($_GET['per_page'] ?? 12)));

        $resultado = Livro::listarPublicosPaginado($pagina, $porPagina, [
            'busca' => (string) ($_GET['q'] ?? ''),
            'categoria' => (string) ($_GET['categoria'] ?? ''),
            'formato' => (string) ($_GET['formato'] ?? ''),
            'preco_min' => isset($_GET['preco_min']) && $_GET['preco_min'] !== '' ? (float) $_GET['preco_min'] : null,
            'preco_max' => isset($_GET['preco_max']) && $_GET['preco_max'] !== '' ? (float) $_GET['preco_max'] : null,
            'ordenar' => (string) ($_GET['ordenar'] ?? 'relevancia'),
        ]);

        echo json_encode([
            'livros' => $resultado['livros'],
            'total' => $resultado['total'],
            'page' => $pagina,
            'per_page' => $porPagina,
        ]);
    }

    public static function buscarPublico(string $id): void
    {
        $livro = Livro::buscarPorId($id);
        if (!$livro || !$livro['ativo']) {
            http_response_code(404);
            echo json_encode(['erro' => 'Livro não encontrado.']);
            return;
        }
        echo json_encode($livro);
    }

    public static function listarGerencia(): void
    {
        echo json_encode(['livros' => Livro::listarTodos()]);
    }

    /**
     * Lê e valida o corpo da requisição. Retorna null (e já respondeu com o
     * erro) quando algo está inválido.
     */
    private static function lerCampos(array $dados, bool $exigirTodos): ?array
    {
        $formatos = array_values(array_filter(
            array_map('strval', (array) ($dados['formatos'] ?? [])),
            fn ($f) => in_array($f, self::FORMATOS_VALIDOS, true)
        ));

        if ($exigirTodos) {
            if (trim((string) ($dados['titulo'] ?? '')) === '') {
                http_response_code(422);
                echo json_encode(['erro' => 'Título é obrigatório.']);
                return null;
            }
            if (empty($formatos)) {
                http_response_code(422);
                echo json_encode(['erro' => 'Escolha ao menos um formato (Físico, E-book ou Kit).']);
                return null;
            }
        }

        $precoFisico = $dados['preco_fisico'] === null || $dados['preco_fisico'] === ''
            ? null : (float) $dados['preco_fisico'];
        $precoEbook = $dados['preco_ebook'] === null || $dados['preco_ebook'] === ''
            ? null : (float) $dados['preco_ebook'];

        // Um formato sem preço deixaria o livro comprável por R$ 0,00.
        if (in_array('Físico', $formatos, true) || in_array('Kit', $formatos, true)) {
            if ($precoFisico === null || $precoFisico <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'Formato físico/kit exige um preço maior que zero.']);
                return null;
            }
        }
        if (in_array('E-book', $formatos, true) && ($precoEbook === null || $precoEbook <= 0)) {
            http_response_code(422);
            echo json_encode(['erro' => 'Formato e-book exige um preço maior que zero.']);
            return null;
        }

        return [
            'titulo' => trim((string) $dados['titulo']),
            'autor' => trim((string) ($dados['autor'] ?? '')),
            'categoria_id' => empty($dados['categoria_id']) ? null : (int) $dados['categoria_id'],
            'descricao' => (string) ($dados['descricao'] ?? ''),
            'preco_fisico' => $precoFisico,
            'preco_ebook' => $precoEbook,
            'peso_gramas' => max(0, (int) ($dados['peso_gramas'] ?? 0)),
            'formatos' => implode(',', $formatos),
            'capa_url' => trim((string) ($dados['capa_url'] ?? '')) ?: null,
            'cor_capa' => trim((string) ($dados['cor_capa'] ?? '')) ?: '#0369a1',
            'estoque' => max(0, (int) ($dados['estoque'] ?? 0)),
            'paginas' => empty($dados['paginas']) ? null : (int) $dados['paginas'],
            'publicado_em' => trim((string) ($dados['publicado_em'] ?? '')) ?: null,
            'destaque' => !empty($dados['destaque']) ? 1 : 0,
            'mais_vendido' => !empty($dados['mais_vendido']) ? 1 : 0,
            'lancamento' => !empty($dados['lancamento']) ? 1 : 0,
            'ativo' => array_key_exists('ativo', $dados) ? (!empty($dados['ativo']) ? 1 : 0) : 1,
        ];
    }

    /** Gera um id legível e único a partir do título (ex: 'criptografia-quantica'). */
    private static function gerarId(string $titulo): string
    {
        $semAcento = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $titulo) ?: $titulo;
        $base = trim(strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $semAcento) ?? ''), '-');
        $base = substr($base ?: 'livro', 0, 14);

        $id = $base;
        $sufixo = 1;
        while (Livro::buscarPorId($id)) {
            $id = substr($base, 0, 14 - strlen((string) $sufixo) - 1) . '-' . $sufixo;
            $sufixo++;
        }
        return $id;
    }

    public static function criar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $campos = self::lerCampos($dados, true);
        if ($campos === null) {
            return;
        }

        $id = trim((string) ($dados['id'] ?? '')) ?: self::gerarId($campos['titulo']);
        if (Livro::buscarPorId($id)) {
            http_response_code(409);
            echo json_encode(['erro' => "Já existe um livro com o id '{$id}'."]);
            return;
        }

        Livro::criar($id, $campos);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'criou_livro', 'livro', null, $id);

        http_response_code(201);
        echo json_encode(Livro::buscarPorId($id));
    }

    public static function atualizar(string $id): void
    {
        if (!Livro::buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['erro' => 'Livro não encontrado.']);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $campos = self::lerCampos($dados, true);
        if ($campos === null) {
            return;
        }

        Livro::atualizar($id, $campos);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'editou_livro', 'livro', null, $id);

        echo json_encode(Livro::buscarPorId($id));
    }

    /**
     * Livro que já foi vendido não pode ser apagado: a FK de itens_pedido
     * impediria, e apagar destruiria o histórico. Nesse caso ele é desativado
     * (some da loja, continua nos pedidos antigos).
     */
    public static function excluir(string $id): void
    {
        if (!Livro::buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['erro' => 'Livro não encontrado.']);
            return;
        }

        if (Livro::jaFoiVendido($id)) {
            Livro::atualizar($id, ['ativo' => 0]);
            ActivityLog::registrar((int) $_SESSION['usuario_id'], 'desativou_livro', 'livro', null, $id);
            echo json_encode([
                'modo' => 'desativado',
                'mensagem' => 'Este livro já tem pedidos, então foi desativado (sai da loja) em vez de excluído, para preservar o histórico de vendas.',
            ]);
            return;
        }

        Livro::excluir($id);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'excluiu_livro', 'livro', null, $id);
        echo json_encode(['modo' => 'excluido', 'mensagem' => 'Livro excluído.']);
    }

    public static function atualizarEstoque(string $id): void
    {
        if (!Livro::buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['erro' => 'Livro não encontrado.']);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $estoque = max(0, (int) ($dados['estoque'] ?? 0));

        Livro::definirEstoque($id, $estoque);
        ActivityLog::registrar((int) $_SESSION['usuario_id'], 'ajustou_estoque', 'livro', null, "{$id} => {$estoque}");

        echo json_encode(Livro::buscarPorId($id));
    }
}
