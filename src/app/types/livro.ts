import { Book, CategoryMeta, Format } from '../data/catalog';

/** Formato cru devolvido pelo backend (snake_case, em português). */
export interface LivroApi {
  id: string;
  titulo: string;
  autor: string;
  categoria_id: number | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  descricao: string | null;
  preco_fisico: number | null;
  preco_ebook: number | null;
  peso_gramas: number;
  formatos: string;
  capa_url: string | null;
  cor_capa: string;
  estoque: number;
  paginas: number | null;
  publicado_em: string | null;
  destaque: boolean;
  mais_vendido: boolean;
  lancamento: boolean;
  avaliacao: number | null;
  num_avaliacoes: number | null;
  ativo: boolean;
}

export interface CategoriaApi {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  cor: string;
  imagem_url: string | null;
  total_livros?: number;
}

/**
 * Converte a resposta da API para a interface `Book` que a vitrine já usa.
 * É o que permite BookCard/CatalogPage/ProductPage seguirem inalterados por
 * dentro depois da migração do catálogo para o banco.
 */
export function mapLivroToBook(livro: LivroApi): Book {
  return {
    id: livro.id,
    title: livro.titulo,
    author: livro.autor,
    category: livro.categoria_nome ?? 'Sem categoria',
    description: livro.descricao ?? '',
    price: {
      physical: livro.preco_fisico ?? undefined,
      ebook: livro.preco_ebook ?? undefined,
    },
    formats: livro.formatos.split(',').filter(Boolean) as Format[],
    cover: livro.capa_url ?? '',
    coverColor: livro.cor_capa,
    stock: livro.estoque,
    pages: livro.paginas ?? undefined,
    weightGrams: livro.peso_gramas,
    published: livro.publicado_em ?? undefined,
    featured: livro.destaque,
    bestseller: livro.mais_vendido,
    isNew: livro.lancamento,
    rating: livro.avaliacao ?? undefined,
    reviews: livro.num_avaliacoes ?? undefined,
  };
}

export function mapCategoriaToMeta(categoria: CategoriaApi): CategoryMeta {
  return {
    id: categoria.id,
    image: categoria.imagem_url ?? '',
    color: categoria.cor,
    description: categoria.descricao ?? '',
  };
}
