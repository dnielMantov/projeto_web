import { createContext, useCallback, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { Book, CartItem, Format } from '../data/catalog';

export interface CartToast {
  id: number;
  title: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (book: Book, format: Format, quantity?: number) => void;
  removeItem: (bookId: string, format: Format) => void;
  updateQuantity: (bookId: string, format: Format, quantity: number) => void;
  clearCart: () => void;
  /** Incrementa a cada addItem - o header observa isto para disparar o "bump" do ícone. */
  bumpToken: number;
  /** No máximo 3 popups visíveis ao mesmo tempo; o resto espera na fila. */
  toasts: CartToast[];
}

const CartContext = createContext<CartContextValue | null>(null);

const MAX_TOASTS_VISIVEIS = 3;
const DURACAO_TOAST_MS = 2000;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('compia-cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [bumpToken, setBumpToken] = useState(0);
  const [toasts, setToasts] = useState<CartToast[]>([]);
  const toastIdRef = useRef(0);
  const toastQueueRef = useRef<CartToast[]>([]);

  useEffect(() => {
    localStorage.setItem('compia-cart', JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const price = i.format === 'E-book' ? (i.book.price.ebook ?? 0) : (i.book.price.physical ?? 0);
    return sum + price * i.quantity;
  }, 0);

  const scheduleToastRemoval = useCallback((id: number) => {
    setTimeout(() => {
      setToasts((prev) => {
        const restantes = prev.filter((t) => t.id !== id);
        // Libera espaço para o próximo da fila assim que um slot esvazia,
        // criando o efeito cascata pedido (máx. 3 ao mesmo tempo).
        if (toastQueueRef.current.length > 0 && restantes.length < MAX_TOASTS_VISIVEIS) {
          const proximo = toastQueueRef.current.shift()!;
          scheduleToastRemoval(proximo.id);
          return [...restantes, proximo];
        }
        return restantes;
      });
    }, DURACAO_TOAST_MS);
  }, []);

  const pushToast = useCallback((title: string) => {
    const toast: CartToast = { id: toastIdRef.current++, title };
    setToasts((prev) => {
      if (prev.length >= MAX_TOASTS_VISIVEIS) {
        toastQueueRef.current.push(toast);
        return prev;
      }
      scheduleToastRemoval(toast.id);
      return [...prev, toast];
    });
  }, [scheduleToastRemoval]);

  function addItem(book: Book, format: Format, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.book.id === book.id && i.format === format);
      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id && i.format === format ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { book, format, quantity }];
    });
    setBumpToken((t) => t + 1);
    pushToast(book.title);
  }

  function removeItem(bookId: string, format: Format) {
    setItems((prev) => prev.filter((i) => !(i.book.id === bookId && i.format === format)));
  }

  function updateQuantity(bookId: string, format: Format, quantity: number) {
    if (quantity <= 0) {
      removeItem(bookId, format);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.book.id === bookId && i.format === format ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, bumpToken, toasts }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
