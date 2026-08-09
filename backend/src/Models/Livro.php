<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class Livro
{
    /** Colunas gravadas por criar()/atualizar(). */
    private const CAMPOS = [
        'titulo', 'autor', 'categoria_id', 'descricao', 'preco_fisico', 'preco_ebook',
        'peso_gramas', 'formatos', 'capa_url', 'cor_capa', 'estoque', 'paginas',
        'publicado_em', 'destaque', 'mais_vendido', 'lancamento',
        'avaliacao', 'num_avaliacoes', 'ativo',
    ];

    private const SELECT_BASE =
        'SELECT l.*, c.nome AS categoria_nome, c.cor AS categoria_cor
         FROM livros l
         LEFT JOIN categorias c ON c.id = l.categoria_id';

    /** Normaliza os tipos numéricos/booleanos vindos do banco (tudo chega como string). */
    private static function hidratar(array $livro): array
    {
        foreach (['preco_fisico', 'preco_ebook', 'avaliacao'] as $campo) {
            $livro[$campo] = $livro[$campo] === null ? null : (float) $livro[$campo];
        }
        foreach (['peso_gramas', 'estoque', 'paginas', 'num_avaliacoes', 'categoria_id'] as $campo) {
            $livro[$campo] = $livro[$campo] === null ? null : (int) $livro[$campo];
        }
        foreach (['destaque', 'mais_vendido', 'lancamento', 'ativo'] as $campo) {
            $livro[$campo] = (bool) $livro[$campo];
        }

        return $livro;
    }

    /** Catálogo público: só o que está ativo. */
    public static function listarPublicos(): array
    {
        $pdo = Connection::get();
        // Desempate por id: o seed cria todos no mesmo segundo, e sem isso a
        // ordem da vitrine mudaria a cada consulta.
        $stmt = $pdo->query(self::SELECT_BASE . ' WHERE l.ativo = 1 ORDER BY l.criado_em, l.id');
        return array_map([self::class, 'hidratar'], $stmt->fetchAll());
    }

    /**
     * Catálogo público com busca, filtros, ordenação e paginação reais no
     * banco - usado pela grade do /catalogo (o carregamento inicial da
     * vitrine inteira continua vindo de listarPublicos()).
     *
     * @param array{busca?:string, categoria?:string, formato?:string, preco_min?:?float, preco_max?:?float, ordenar?:string} $filtros
     * @return array{livros: array, total: int}
     */
    public static function listarPublicosPaginado(int $pagina, int $porPagina, array $filtros): array
    {
        $pdo = Connection::get();
        $where = ['l.ativo = 1'];
        $params = [];

        $busca = trim((string) ($filtros['busca'] ?? ''));
        if ($busca !== '') {
            // Named placeholders não podem se repetir numa mesma query quando
            // PDO::ATTR_EMULATE_PREPARES está desligado (prepare nativo do
            // MySQL) - por isso um :busca diferente para cada LIKE, todos com
            // o mesmo valor.
            $where[] = '(l.titulo LIKE :busca1 OR l.autor LIKE :busca2 OR c.nome LIKE :busca3)';
            $params['busca1'] = $params['busca2'] = $params['busca3'] = "%{$busca}%";
        }

        $categorias = array_filter(array_map('trim', explode(',', (string) ($filtros['categoria'] ?? ''))));
        if (!empty($categorias)) {
            $chaves = [];
            foreach (array_values($categorias) as $i => $nome) {
                $chave = "cat{$i}";
                $chaves[] = ":{$chave}";
                $params[$chave] = $nome;
            }
            $where[] = 'c.nome IN (' . implode(',', $chaves) . ')';
        }

        $formatos = array_filter(array_map('trim', explode(',', (string) ($filtros['formato'] ?? ''))));
        if (!empty($formatos)) {
            $condicoes = [];
            foreach (array_values($formatos) as $i => $fmt) {
                $chave = "fmt{$i}";
                $condicoes[] = "l.formatos LIKE :{$chave}";
                $params[$chave] = "%{$fmt}%";
            }
            $where[] = '(' . implode(' OR ', $condicoes) . ')';
        }

        // Mesma regra do frontend: preço efetivo é o físico, com o e-book como
        // alternativa quando o livro não tem versão física.
        $precoEfetivo = 'COALESCE(l.preco_fisico, l.preco_ebook, 0)';
        if (($filtros['preco_min'] ?? null) !== null) {
            $where[] = "{$precoEfetivo} >= :preco_min";
            $params['preco_min'] = (float) $filtros['preco_min'];
        }
        if (($filtros['preco_max'] ?? null) !== null) {
            $where[] = "{$precoEfetivo} <= :preco_max";
            $params['preco_max'] = (float) $filtros['preco_max'];
        }

        $whereSql = implode(' AND ', $where);

        $sqlTotal = "SELECT COUNT(*)
                     FROM livros l
                     LEFT JOIN categorias c ON c.id = l.categoria_id
                     WHERE {$whereSql}";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = (int) $stmtTotal->fetchColumn();

        $ordem = match ($filtros['ordenar'] ?? 'relevancia') {
            'menor-preco' => "{$precoEfetivo} ASC",
            'maior-preco' => "{$precoEfetivo} DESC",
            'mais-recentes' => 'l.publicado_em DESC, l.id ASC',
            'bestseller' => 'l.mais_vendido DESC, l.criado_em ASC, l.id ASC',
            'new' => 'l.lancamento DESC, l.criado_em ASC, l.id ASC',
            default => 'l.criado_em ASC, l.id ASC',
        };

        $sql = self::SELECT_BASE . " WHERE {$whereSql} ORDER BY {$ordem} LIMIT :limite OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $chave => $valor) {
            $stmt->bindValue($chave, $valor);
        }
        $stmt->bindValue('limite', $porPagina, PDO::PARAM_INT);
        $stmt->bindValue('offset', ($pagina - 1) * $porPagina, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'livros' => array_map([self::class, 'hidratar'], $stmt->fetchAll()),
            'total' => $total,
        ];
    }

    /** Visão da gerência: inclui inativos. */
    public static function listarTodos(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query(self::SELECT_BASE . ' ORDER BY l.criado_em DESC, l.id');
        return array_map([self::class, 'hidratar'], $stmt->fetchAll());
    }

    public static function buscarPorId(string $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(self::SELECT_BASE . ' WHERE l.id = :id');
        $stmt->execute(['id' => $id]);
        $livro = $stmt->fetch();
        return $livro ? self::hidratar($livro) : null;
    }

    /** @return array<string, array> livros indexados por id */
    public static function listarPorIds(array $ids): array
    {
        $ids = array_values(array_unique($ids));
        if (empty($ids)) {
            return [];
        }

        $pdo = Connection::get();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT * FROM livros WHERE id IN ({$placeholders})");
        $stmt->execute($ids);

        $porId = [];
        foreach ($stmt->fetchAll() as $livro) {
            $porId[$livro['id']] = $livro;
        }
        return $porId;
    }

    public static function criar(string $id, array $dados): void
    {
        $pdo = Connection::get();
        $colunas = array_values(array_filter(self::CAMPOS, fn ($c) => array_key_exists($c, $dados)));

        $sql = 'INSERT INTO livros (id, ' . implode(', ', $colunas) . ')
                VALUES (:id, :' . implode(', :', $colunas) . ')';
        $stmt = $pdo->prepare($sql);

        $params = ['id' => $id];
        foreach ($colunas as $coluna) {
            $params[$coluna] = $dados[$coluna];
        }
        $stmt->execute($params);
    }

    public static function atualizar(string $id, array $dados): void
    {
        $colunas = array_values(array_filter(self::CAMPOS, fn ($c) => array_key_exists($c, $dados)));
        if (empty($colunas)) {
            return;
        }

        $sets = implode(', ', array_map(fn ($c) => "{$c} = :{$c}", $colunas));
        $stmt = Connection::get()->prepare("UPDATE livros SET {$sets} WHERE id = :id");

        $params = ['id' => $id];
        foreach ($colunas as $coluna) {
            $params[$coluna] = $dados[$coluna];
        }
        $stmt->execute($params);
    }

    public static function jaFoiVendido(string $id): bool
    {
        $stmt = Connection::get()->prepare('SELECT COUNT(*) FROM itens_pedido WHERE livro_id = :id');
        $stmt->execute(['id' => $id]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public static function excluir(string $id): void
    {
        $stmt = Connection::get()->prepare('DELETE FROM livros WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public static function definirEstoque(string $id, int $estoque): void
    {
        $stmt = Connection::get()->prepare('UPDATE livros SET estoque = :estoque WHERE id = :id');
        $stmt->execute(['estoque' => max(0, $estoque), 'id' => $id]);
    }

    /**
     * Soma $delta ao estoque (negativo debita). GREATEST evita estoque negativo
     * caso duas confirmações de pagamento cheguem juntas.
     */
    public static function ajustarEstoque(string $id, int $delta): void
    {
        $stmt = Connection::get()->prepare(
            'UPDATE livros SET estoque = GREATEST(0, estoque + :delta) WHERE id = :id'
        );
        $stmt->execute(['delta' => $delta, 'id' => $id]);
    }

    public static function contarAtivos(): int
    {
        return (int) Connection::get()->query('SELECT COUNT(*) FROM livros WHERE ativo = 1')->fetchColumn();
    }

    /**
     * Soma do estoque físico de todos os livros ativos - card de "estoque total" da
     * visão geral. E-book é excluído: não tem estoque físico, então o campo não
     * representa uma quantidade real para esse formato (ver estoqueBaixo()).
     */
    public static function somaEstoque(): int
    {
        $stmt = Connection::get()->prepare(
            "SELECT COALESCE(SUM(estoque), 0) FROM livros WHERE ativo = 1 AND formatos <> :somente_ebook"
        );
        $stmt->bindValue(':somente_ebook', 'E-book');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /** Livros ativos com estoque baixo, para o alerta do painel do gerente. */
    public static function estoqueBaixo(int $limite = 5): array
    {
        $stmt = Connection::get()->prepare(
            'SELECT id, titulo, estoque FROM livros
             WHERE ativo = 1 AND formatos <> :somente_ebook AND estoque <= :limite
             ORDER BY estoque ASC'
        );
        $stmt->bindValue(':somente_ebook', 'E-book');
        $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
