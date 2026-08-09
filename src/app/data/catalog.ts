// Tipos do domínio do catálogo.
//
// Os dados em si vivem no banco (tabela `livros`, editável pelo painel do
// Gerente) e chegam pela API - ver src/app/context/CatalogContext.tsx.
// A carga inicial daqueles 21 livros mora em backend/database/seed_data.php.

// Categorias são dados agora (tabela `categorias`), não mais uma união fixa.
export type Category = string;

export type Format = 'Físico' | 'E-book' | 'Kit';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  description: string;
  price: {
    physical?: number;
    ebook?: number;
  };
  formats: Format[];
  cover: string;
  coverColor: string;
  stock?: number;
  pages?: number;
  weightGrams?: number;
  published?: string;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
}

export interface CategoryMeta {
  id: number;
  image: string;
  color: string;
  description: string;
}

export interface CartItem {
  book: Book;
  format: Format;
  quantity: number;
}

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
