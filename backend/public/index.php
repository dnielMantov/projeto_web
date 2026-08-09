<?php

declare(strict_types=1);

ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
if (($_SERVER['HTTPS'] ?? '') !== '') {
    ini_set('session.cookie_secure', '1');
}
session_start();

header('Content-Type: application/json; charset=utf-8');

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = dirname(__DIR__) . '/src/' . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Admin\ConfiguracaoController;
use App\Admin\RelatorioController;
use App\Auth\AuthController;
use App\Auth\AuthMiddleware;
use App\Catalogo\CategoriaController;
use App\Catalogo\LivroController;
use App\Models\ActivityLog;
use App\Models\User;
use App\Shipping\FreteController;
use App\Pedidos\PedidoController;
use App\Payments\PagamentoController;

// Ids de livro são slugs (ex: 'ai-001'), não inteiros.
const ID_LIVRO = '[A-Za-z0-9._-]+';

$metodo = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
// Remove o prefixo /api para que as rotas abaixo fiquem legíveis (ex: /login em vez de /api/login).
$uri = preg_replace('#^/api#', '', $path, 1);
$uri = $uri === '' ? '/' : $uri;

try {
    if ($metodo === 'POST' && $uri === '/login') {
        AuthController::login();
    } elseif ($metodo === 'POST' && $uri === '/registro') {
        AuthController::registrar();
    } elseif ($metodo === 'POST' && $uri === '/frete/calcular') {
        FreteController::calcular();

    // ------------------------------------------------ catálogo público (vitrine)
    } elseif ($metodo === 'GET' && $uri === '/livros') {
        LivroController::listarPublico();
    } elseif ($metodo === 'GET' && preg_match('#^/livros/(' . ID_LIVRO . ')$#', $uri, $match)) {
        LivroController::buscarPublico($match[1]);
    } elseif ($metodo === 'GET' && $uri === '/categorias') {
        CategoriaController::listar();

    } elseif ($metodo === 'POST' && $uri === '/pedidos') {
        AuthMiddleware::exigirAutenticacao();
        PedidoController::criar();
    } elseif ($metodo === 'GET' && $uri === '/pedidos') {
        AuthMiddleware::exigirAutenticacao();
        PedidoController::listarMeus();
    } elseif ($metodo === 'GET' && preg_match('#^/pedidos/(\d+)$#', $uri, $match)) {
        AuthMiddleware::exigirAutenticacao();
        PedidoController::buscarUm((int) $match[1]);
    } elseif ($metodo === 'POST' && $uri === '/pagamentos/cartao') {
        AuthMiddleware::exigirAutenticacao();
        PagamentoController::criarCartao();
    } elseif ($metodo === 'POST' && $uri === '/pagamentos/pix') {
        AuthMiddleware::exigirAutenticacao();
        PagamentoController::criarPix();
    } elseif ($metodo === 'GET' && preg_match('#^/pagamentos/(\d+)/status$#', $uri, $match)) {
        AuthMiddleware::exigirAutenticacao();
        PagamentoController::consultarStatus((int) $match[1]);
    } elseif ($metodo === 'POST' && $uri === '/logout') {
        AuthController::logout();
    } elseif ($metodo === 'GET' && $uri === '/me') {
        AuthController::me();
    } elseif ($metodo === 'GET' && $uri === '/admin/usuarios') {
        AuthMiddleware::exigirPapel(['admin']);
        echo json_encode(['usuarios' => User::listarTodos()]);
    } elseif ($metodo === 'PATCH' && preg_match('#^/admin/usuarios/(\d+)/status$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(['admin']);
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $ativo = (bool) ($dados['ativo'] ?? true);
        $usuarioId = (int) $match[1];

        User::definirAtivo($usuarioId, $ativo);
        ActivityLog::registrar(
            (int) $_SESSION['usuario_id'],
            $ativo ? 'ativou_usuario' : 'desativou_usuario',
            'usuario',
            $usuarioId
        );

        echo json_encode(['ok' => true]);
    } elseif ($metodo === 'GET' && $uri === '/admin/logs') {
        AuthMiddleware::exigirPapel(['admin']);
        echo json_encode(['logs' => ActivityLog::listarRecentes()]);

    // ------------------------------------------ gerência (papéis gerente e admin)
    } elseif ($metodo === 'GET' && $uri === '/gerencia/livros') {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        LivroController::listarGerencia();
    } elseif ($metodo === 'POST' && $uri === '/gerencia/livros') {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        LivroController::criar();
    } elseif ($metodo === 'PUT' && preg_match('#^/gerencia/livros/(' . ID_LIVRO . ')$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        LivroController::atualizar($match[1]);
    } elseif ($metodo === 'DELETE' && preg_match('#^/gerencia/livros/(' . ID_LIVRO . ')$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        LivroController::excluir($match[1]);
    } elseif ($metodo === 'PATCH' && preg_match('#^/gerencia/livros/(' . ID_LIVRO . ')/estoque$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        LivroController::atualizarEstoque($match[1]);

    } elseif ($metodo === 'POST' && $uri === '/gerencia/categorias') {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        CategoriaController::criar();
    } elseif ($metodo === 'PUT' && preg_match('#^/gerencia/categorias/(\d+)$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        CategoriaController::atualizar((int) $match[1]);
    } elseif ($metodo === 'DELETE' && preg_match('#^/gerencia/categorias/(\d+)$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        CategoriaController::excluir((int) $match[1]);

    } elseif ($metodo === 'GET' && $uri === '/gerencia/pedidos') {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        PedidoController::listarGerencia();
    } elseif ($metodo === 'PATCH' && preg_match('#^/gerencia/pedidos/(\d+)/status$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        PedidoController::atualizarStatus((int) $match[1]);
    } elseif ($metodo === 'GET' && $uri === '/gerencia/metricas') {
        AuthMiddleware::exigirPapel(User::PAPEIS_GERENCIA);
        PedidoController::metricas();

    // ------------------------------------------------------ exclusivo do admin
    } elseif ($metodo === 'PATCH' && preg_match('#^/admin/usuarios/(\d+)/papel$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(['admin']);
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $papel = (string) ($dados['papel'] ?? '');
        $usuarioId = (int) $match[1];

        if (!in_array($papel, User::PAPEIS, true)) {
            http_response_code(422);
            echo json_encode(['erro' => 'Papel inválido.']);
        } elseif ($usuarioId === (int) $_SESSION['usuario_id']) {
            // Sem isto, o último admin poderia se rebaixar e deixar o sistema
            // sem ninguém capaz de promover alguém de volta.
            http_response_code(409);
            echo json_encode(['erro' => 'Você não pode alterar o seu próprio papel.']);
        } else {
            User::definirPapel($usuarioId, $papel);
            ActivityLog::registrar((int) $_SESSION['usuario_id'], 'alterou_papel', 'usuario', $usuarioId, $papel);
            echo json_encode(['ok' => true]);
        }
    } elseif ($metodo === 'DELETE' && preg_match('#^/admin/pedidos/(\d+)$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(['admin']);
        PedidoController::excluir((int) $match[1]);
    } elseif ($metodo === 'POST' && preg_match('#^/admin/pedidos/(\d+)/estorno$#', $uri, $match)) {
        AuthMiddleware::exigirPapel(['admin']);
        PagamentoController::estornar((int) $match[1]);
    } elseif ($metodo === 'GET' && $uri === '/admin/configuracoes') {
        AuthMiddleware::exigirPapel(['admin']);
        ConfiguracaoController::listar();
    } elseif ($metodo === 'PUT' && $uri === '/admin/configuracoes') {
        AuthMiddleware::exigirPapel(['admin']);
        ConfiguracaoController::salvar();
    } elseif ($metodo === 'GET' && $uri === '/admin/relatorios') {
        AuthMiddleware::exigirPapel(['admin']);
        RelatorioController::resumo();
    } else {
        http_response_code(404);
        echo json_encode(['erro' => 'Rota não encontrada.']);
    }
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno.', 'detalhes' => $e->getMessage()]);
}
