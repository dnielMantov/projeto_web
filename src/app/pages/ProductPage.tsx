import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  ShoppingCart, Zap, Star, BookOpen, Download, Package,
  ChevronRight, ChevronLeft, Check, AlertCircle, Calendar, FileText,
} from 'lucide-react';
import { formatPrice, Format } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { BookCard } from '../components/BookCard';
import { Dropdown } from '../components/common/Dropdown';
import type { CarouselApi } from '../components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '../components/ui/carousel';

const navButtonStyle = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(15,24,41,0.9)',
  border: '1px solid #1e2d4a',
  color: '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  transition: 'border-color 0.2s, color 0.2s',
  backdropFilter: 'blur(4px)',
};
function navHoverOn(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
  (e.currentTarget as HTMLElement).style.color = '#06b6d4';
}
function navHoverOff(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
}

const OPCOES_QUANTIDADE = [
  { value: '1', label: '1 unidade' },
  { value: '2', label: '2 unidades' },
  { value: '3', label: '3 unidades' },
  { value: '4', label: '4 unidades' },
  { value: '5', label: '5 unidades' },
  { value: 'custom', label: 'Mais de 5 unidades' },
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { getBookById, getRelatedBooks, categoryMeta, loading, error } = useCatalog();
  const book = getBookById(id ?? '');
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [added, setAdded] = useState(false);
  const [hoveringCart, setHoveringCart] = useState(false);
  const [hoveringBuy, setHoveringBuy] = useState(false);
  // Contador (não boolean) para o mesmo motivo do BookCard: garante que a
  // animação de clique sempre reinicie do zero, mesmo em cliques rápidos.
  const [popKey, setPopKey] = useState(0);
  const [relatedApi, setRelatedApi] = useState<CarouselApi>();
  const [quantidadeSelecao, setQuantidadeSelecao] = useState('1');
  const [quantidadePersonalizada, setQuantidadePersonalizada] = useState(6);

  // O livro chega depois do fetch do catálogo, então o formato padrão só pode
  // ser escolhido quando ele existir.
  useEffect(() => {
    if (book && selectedFormat === null) {
      setSelectedFormat(book.formats.includes('Físico') ? 'Físico' : book.formats[0]);
    }
  }, [book, selectedFormat]);

  // Enquanto o catálogo carrega não dá para afirmar que o produto não existe -
  // mesma armadilha do authLoading no ProtectedRoute.
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32" style={{ backgroundColor: '#070d1a', minHeight: '100vh', color: '#64748b' }}>
        Carregando produto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32" style={{ backgroundColor: '#070d1a', minHeight: '100vh', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4" style={{ backgroundColor: '#070d1a', minHeight: '100vh' }}>
        <AlertCircle size={48} style={{ color: '#1e2d4a' }} />
        <div style={{ color: '#64748b', textAlign: 'center' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Produto não encontrado
          </div>
          Verifique o link ou volte ao catálogo.
        </div>
        <Link
          to="/catalogo"
          style={{
            background: '#06b6d4',
            color: '#000',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const relatedBooks = getRelatedBooks(book, 12);
  // Fallback: uma categoria criada pelo gerente pode não ter cor definida.
  const meta = categoryMeta[book.category] ?? { id: 0, color: '#06b6d4', image: '', description: '' };
  const price = selectedFormat === 'E-book' ? book.price.ebook : (book.price.physical ?? book.price.ebook);
  const inStock = (book.stock ?? 0) > 0;
  const quantidade = quantidadeSelecao === 'custom' ? Math.max(6, quantidadePersonalizada) : Number(quantidadeSelecao);

  function handleAddToCart() {
    // A checagem se repete aqui porque declarações de função são içadas: o
    // estreitamento de `book` feito acima não alcança o corpo desta função.
    if (!book || !selectedFormat) return;
    addItem(book, selectedFormat, quantidade);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // ANIMAÇÃO 1: mesma animação discreta usada nos cards de livro.
    setPopKey((k) => k + 1);
  }

  function handleBuyNow() {
    if (book && selectedFormat) addItem(book, selectedFormat, quantidade);
  }

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1e2d4a', padding: '0.875rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2" style={{ color: '#64748b', fontSize: '0.8rem' }}>
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Início</Link>
            <ChevronRight size={12} />
            <Link to="/catalogo" style={{ color: '#64748b', textDecoration: 'none' }}>Catálogo</Link>
            <ChevronRight size={12} />
            <Link to={`/catalogo?cat=${encodeURIComponent(book.category)}`} style={{ color: '#64748b', textDecoration: 'none' }}>
              {book.category}
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: '#94a3b8' }} className="truncate">{book.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex justify-center">
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  width: '100%',
                  // Mesma proporção da capa dos cards (3/4), só que um pouco
                  // maior - esta é a imagem de destaque da página, não uma
                  // miniatura de grade.
                  maxWidth: '380px',
                  aspectRatio: '3/4',
                  background: book.coverColor,
                }}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{ height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.8)', marginBottom: '0.5rem' }}>
                    {book.title}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{book.author}</div>
                </div>
                {book.isNew && (
                  <div
                    className="absolute top-4 left-4"
                    style={{ background: '#06b6d4', color: '#000', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}
                  >
                    Novo
                  </div>
                )}
                {book.bestseller && (
                  <div
                    className="absolute top-4 right-4"
                    style={{ background: '#f59e0b', color: '#000', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}
                  >
                    Best-seller
                  </div>
                )}
              </div>
            </div>

            {book.formats.length > 1 && (
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Formato
                </div>
                <div className="flex gap-3 flex-wrap">
                  {book.formats.map((fmt) => {
                    const fmtPrice = fmt === 'E-book' ? book.price.ebook : book.price.physical;
                    const active = selectedFormat === fmt;
                    return (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        style={{
                          background: active ? 'rgba(6,182,212,0.15)' : '#0f1829',
                          border: `2px solid ${active ? '#06b6d4' : '#1e2d4a'}`,
                          borderRadius: '0.75rem',
                          padding: '0.75rem 1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ color: active ? '#06b6d4' : '#64748b' }}>
                          {fmt === 'E-book' ? <Download size={20} /> : fmt === 'Kit' ? <Package size={20} /> : <BookOpen size={20} />}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ color: active ? '#e2e8f0' : '#94a3b8', fontWeight: 600, fontSize: '0.875rem' }}>{fmt}</div>
                          <div style={{ color: active ? '#06b6d4' : '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                            {fmtPrice ? formatPrice(fmtPrice) : 'Indisponível'}
                          </div>
                        </div>
                        {active && <Check size={16} style={{ color: '#06b6d4', marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedFormat === 'E-book' && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}
              >
                <Download size={16} style={{ color: '#06b6d4', marginTop: '0.1rem', flexShrink: 0 }} />
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  E-book entregue imediatamente após a confirmação do pagamento via link de download na sua área do cliente.
                  Compatível com todos os leitores de PDF e EPUB.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <div>
              <Link
                to={`/catalogo?cat=${encodeURIComponent(book.category)}`}
                style={{
                  color: meta.color,
                  background: `${meta.color}15`,
                  border: `1px solid ${meta.color}30`,
                  borderRadius: '2rem',
                  padding: '0.3rem 0.875rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {book.category}
              </Link>
            </div>

            <div>
              <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                {book.title}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>por {book.author}</p>
            </div>

            {book.rating && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= Math.floor(book.rating!) ? '#f59e0b' : 'transparent'}
                      color={star <= Math.floor(book.rating!) ? '#f59e0b' : '#475569'}
                    />
                  ))}
                </div>
                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>{book.rating}</span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({book.reviews} avaliações)</span>
              </div>
            )}

            <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.95rem' }}>{book.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FileText size={16} />, label: 'Páginas', value: book.pages ? `${book.pages}` : 'N/D' },
                { icon: <Calendar size={16} />, label: 'Publicação', value: book.published ? new Date(book.published).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'N/D' },
                { icon: <BookOpen size={16} />, label: 'Editora', value: 'COMPIA' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#0f1829',
                    border: '1px solid #1e2d4a',
                    borderRadius: '0.625rem',
                    padding: '0.875rem',
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: '#64748b', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1.5rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                {selectedFormat ? `Preço · ${selectedFormat}` : 'Preço'}
              </div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.5rem' }}>
                {price ? formatPrice(price) : 'Indisponível'}
              </div>

              <div className="flex items-center gap-2 mb-4">
                {inStock ? (
                  <>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
                      {(book.stock ?? 0) > 5 ? 'Em estoque' : `Apenas ${book.stock} em estoque`}
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Esgotado</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Quantidade:</span>
                <Dropdown
                  value={quantidadeSelecao}
                  options={OPCOES_QUANTIDADE}
                  onChange={setQuantidadeSelecao}
                  style={{ width: '190px' }}
                  ariaLabel="Quantidade"
                />
                {quantidadeSelecao === 'custom' && (
                  <input
                    type="number"
                    min={6}
                    value={quantidadePersonalizada}
                    onChange={(e) => setQuantidadePersonalizada(Math.max(6, Number(e.target.value) || 6))}
                    style={{
                      width: '90px',
                      background: '#1a2540',
                      border: '1px solid #1e2d4a',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  key={popKey}
                  onClick={handleAddToCart}
                  onMouseEnter={() => setHoveringCart(true)}
                  onMouseLeave={() => setHoveringCart(false)}
                  disabled={!inStock || !selectedFormat}
                  className={popKey > 0 ? 'add-to-cart-pop' : undefined}
                  style={{
                    background: hoveringCart && inStock ? '#10b981' : added ? '#0891b2' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: '#000',
                    fontWeight: 700,
                    borderRadius: '0.75rem',
                    padding: '0.875rem 2rem',
                    border: 'none',
                    cursor: inStock ? 'pointer' : 'default',
                    opacity: !inStock ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    // minWidth fixo: o botão não pode mudar de tamanho quando o
                    // texto troca para "Adicionado!".
                    minWidth: '240px',
                    transform: hoveringCart && inStock ? 'scale(1.05)' : 'scale(1)',
                    transition: 'background 0.18s, transform 0.18s',
                  }}
                >
                  {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
                </button>

                <Link
                  to="/checkout"
                  onClick={handleBuyNow}
                  onMouseEnter={() => setHoveringBuy(true)}
                  onMouseLeave={() => setHoveringBuy(false)}
                  style={{
                    background: hoveringBuy ? '#047857' : '#1a2540',
                    border: `1px solid ${hoveringBuy ? '#047857' : '#1e2d4a'}`,
                    color: hoveringBuy ? '#fff' : '#e2e8f0',
                    fontWeight: 700,
                    borderRadius: '0.75rem',
                    padding: '0.875rem 2rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    transform: hoveringBuy ? 'scale(1.05)' : 'scale(1)',
                    transition: 'background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s',
                  }}
                >
                  <Zap size={18} /> Comprar agora
                </Link>
              </div>
            </div>
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.4rem' }}>
                Títulos Relacionados
              </h2>
              <Link
                to={`/catalogo?cat=${encodeURIComponent(book.category)}`}
                className="flex items-center gap-1"
                style={{ color: '#06b6d4', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>
            <Carousel setApi={setRelatedApi} opts={{ align: 'start' }}>
              <button
                onClick={() => relatedApi?.scrollPrev()}
                aria-label="Anterior"
                style={{ ...navButtonStyle, left: '0.5rem' }}
                onMouseEnter={navHoverOn}
                onMouseLeave={navHoverOff}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => relatedApi?.scrollNext()}
                aria-label="Próximo"
                style={{ ...navButtonStyle, right: '0.5rem' }}
                onMouseEnter={navHoverOn}
                onMouseLeave={navHoverOff}
              >
                <ChevronRight size={18} />
              </button>
              <CarouselContent>
                {relatedBooks.map((rb) => (
                  <CarouselItem key={rb.id} className="basis-1/2 sm:basis-1/3 lg:basis-1/5">
                    <BookCard book={rb} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
}
