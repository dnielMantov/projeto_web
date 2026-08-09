<?php

namespace App\Auth;

class AuthMiddleware
{
    /** Garante que existe uma sessão ativa. Interrompe a requisição com 401 se não houver. */
    public static function exigirAutenticacao(): void
    {
        if (!isset($_SESSION['usuario_id'])) {
            http_response_code(401);
            echo json_encode(['erro' => 'Não autenticado.']);
            exit;
        }
    }

    /**
     * Garante que o usuário autenticado tem um dos papéis permitidos.
     *
     * @param string[] $papeisPermitidos
     */
    public static function exigirPapel(array $papeisPermitidos): void
    {
        self::exigirAutenticacao();

        if (!in_array($_SESSION['papel'], $papeisPermitidos, true)) {
            http_response_code(403);
            echo json_encode(['erro' => 'Acesso negado para este papel.']);
            exit;
        }
    }
}
