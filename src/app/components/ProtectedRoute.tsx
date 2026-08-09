import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Role } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

// Só evita mostrar telas que o papel do usuário não deveria ver. A checagem que
// realmente protege os dados vive no backend (AuthMiddleware::exigirPapel).
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, authLoading } = useAuth();

  // Evita expulsar um usuário legítimo durante o round-trip inicial de /me
  // (ex: dar refresh direto numa rota protegida).
  if (authLoading) {
    return null;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/minha-conta" replace />;
  }

  return <>{children}</>;
}
