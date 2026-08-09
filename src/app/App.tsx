import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
