import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PAPEIS_GERENCIA } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CustomerPage from './pages/CustomerPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';

// Os painéis carregam sob demanda: só eles usam recharts, que sozinho dobraria
// o bundle da vitrine se viesse no chunk principal.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GerentePage = lazy(() => import('./pages/GerentePage'));

function CarregandoPainel() {
  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', color: '#64748b', padding: '5rem', textAlign: 'center' }}>
      Carregando painel...
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'catalogo', Component: CatalogPage },
      { path: 'categorias', Component: CategoriesPage },
      { path: 'produto/:id', Component: ProductPage },
      { path: 'carrinho', Component: CartPage },
      { path: 'checkout', Component: CheckoutPage },
      { path: 'minha-conta', Component: CustomerPage },
      { path: 'sobre', Component: AboutPage },
      { path: 'privacidade', Component: PrivacyPage },
      { path: 'termos', Component: TermsPage },
      { path: 'contato', Component: ContactPage },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<CarregandoPainel />}>
              <AdminPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'gerente',
        element: (
          <ProtectedRoute allowedRoles={PAPEIS_GERENCIA}>
            <Suspense fallback={<CarregandoPainel />}>
              <GerentePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Os papéis vendedor e editor viraram um só (gerente); estas rotas
      // continuam existindo para não quebrar links antigos.
      { path: 'editor', element: <Navigate to="/gerente" replace /> },
      { path: 'vendedor', element: <Navigate to="/gerente" replace /> },
    ],
  },
]);
