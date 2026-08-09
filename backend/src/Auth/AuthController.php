<?php

namespace App\Auth;

use App\Models\User;

class AuthController
{
    public static function login(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = trim((string) ($dados['email'] ?? ''));
        $senha = (string) ($dados['senha'] ?? '');

        if ($email === '' || $senha === '') {
            http_response_code(400);
            echo json_encode(['erro' => 'Informe e-mail e senha.']);
            return;
        }

        $usuario = User::buscarPorEmail($email);

        if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
            http_response_code(401);
            echo json_encode(['erro' => 'E-mail ou senha inválidos.']);
            return;
        }

        if (!(bool) $usuario['ativo']) {
            http_response_code(403);
            echo json_encode(['erro' => 'Esta conta está desativada.']);
            return;
        }

        session_regenerate_id(true);
        $_SESSION['usuario_id'] = (int) $usuario['id'];
        $_SESSION['papel'] = $usuario['papel'];

        echo json_encode(['usuario' => User::sanitizar($usuario)]);
    }

    public static function registrar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $nome = trim((string) ($dados['nome'] ?? ''));
        $email = trim((string) ($dados['email'] ?? ''));
        $senha = (string) ($dados['senha'] ?? '');

        if ($nome === '' || $senha === '' || !str_contains($email, '@')) {
            http_response_code(400);
            echo json_encode(['erro' => 'Preencha nome, e-mail e senha corretamente.']);
            return;
        }

        if (User::buscarPorEmail($email)) {
            http_response_code(409);
            echo json_encode(['erro' => 'E-mail já cadastrado.']);
            return;
        }

        // O papel nunca vem do cliente: todo novo cadastro é 'cliente'.
        $usuarioId = User::criar($nome, $email, $senha, 'cliente');
        $usuario = User::buscarPorId($usuarioId);

        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $usuarioId;
        $_SESSION['papel'] = 'cliente';

        http_response_code(201);
        echo json_encode(['usuario' => User::sanitizar($usuario)]);
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
        echo json_encode(['ok' => true]);
    }

    public static function me(): void
    {
        AuthMiddleware::exigirAutenticacao();

        $usuario = User::buscarPorId((int) $_SESSION['usuario_id']);
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['erro' => 'Não autenticado.']);
            return;
        }

        echo json_encode(['usuario' => User::sanitizar($usuario)]);
    }
}
