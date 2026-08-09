import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { Book, Category, CategoryMeta } from '../data/catalog';
import { CategoriaApi, LivroApi, mapCategoriaToMeta, mapLivroToBook } from '../types/livro';

interface CatalogContextValue {
  books: Book[];
  categories: Category[];
  categoryMeta: Record<Category, CategoryMeta>;
  loading: boolean;
  error: string;
  getBookById: (id: string) => Book | undefined;
  getRelatedBooks: (book: Book, count?: number) => Book[];
  /** Recarrega da API - chamado pelo painel depois de mexer no catálogo. */
  reload: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categoriasApi, setCategoriasApi] = useState<CategoriaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [livros, categorias] = await Promise.all([
        apiFetch<{ livros: LivroApi[] }>('/livros'),
        apiFetch<{ categorias: CategoriaApi[] }>('/categorias'),
      ]);
      setBooks(livros.livros.map(mapLivroToBook));
      setCategoriasApi(categorias.categorias);
      setError('');
    } catch {
      setError('Não foi possível carregar o catálogo. Verifique se o backend está no ar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const categoryMeta = useMemo(() => {
    const meta: Record<Category, CategoryMeta> = {};
    for (const categoria of categoriasApi) {
      meta[categoria.nome] = mapCategoriaToMeta(categoria);
    }
    return meta;
  }, [categoriasApi]);

  const categories = useMemo(() => categoriasApi.map((c) => c.nome), [categoriasApi]);

  const getBookById = useCallback((id: string) => books.find((b) => b.id === id), [books]);

  const getRelatedBooks = useCallback(
    (book: Book, count = 4) =>
      books.filter((b) => b.id !== book.id && b.category === book.category).slice(0, count),
    [books],
  );

  const valor = useMemo(
    () => ({ books, categories, categoryMeta, loading, error, getBookById, getRelatedBooks, reload: carregar }),
    [books, categories, categoryMeta, loading, error, getBookById, getRelatedBooks, carregar],
  );

  return <CatalogContext.Provider value={valor}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
