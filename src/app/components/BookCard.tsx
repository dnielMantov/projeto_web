import { useState, MouseEvent } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, Star, BookOpen, Download, Package } from 'lucide-react';
import { Book, Format, formatPrice } from '../data/catalog';
import { useCart } from '../context/CartContext';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

export function BookCard({ book, compact = false }: BookCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [hoveringCart, setHoveringCart] = useState(false);
  // Contador em vez de boolean: cada clique remonta o botão (via key), o que
  // garante a animação sempre tocar do zero. Um boolean ficava "preso" em
  // true se dois cliques caíssem dentro da mesma janela de 320ms - o segundo
  // clique não re-renderizava (mesmo valor) e a troca de classe não disparava
  // de novo, dando a impressão de que a animação tocou duas vezes seguidas.
  const [popKey, setPopKey] = useState(0);

  const defaultFormat: Format =
    book.formats.includes('Físico') ? 'Físico' : book.formats[0];

  const price =
    defaultFormat === 'E-book' ? book.price.ebook : book.price.physical;

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    setAdding(true);
    addItem(book, defaultFormat);
    setTimeout(() => setAdding(false), 800);
    // ANIMAÇÃO 1: discreta, para o próprio botão - diferente do "bump" do
    // ícone do cabeçalho (ANIMAÇÃO 0).
    setPopKey((k) => k + 1);
  }

  const formatIcon =
    book.formats.includes('Kit') ? <Package size={11} /> :
    book.formats.includes('E-book') && !book.formats.includes('Físico') ? <Download size={11} /> :
    <BookOpen size={11} />;

  return (
    <Link
      to={`/produto/${book.id}`}
      className="group flex flex-col rounded-xl overflow-hidden h-full"
      style={{
        background: '#0f1829',
        border: '1px solid #1e2d4a',
        textDecoration: 'none',
        // box-shadow de propósito fora da transição: animá-la repinta a sombra
        // borrada a cada frame, e o :hover dispara sozinho enquanto o usuário
        // rola o mouse por cima da grade de cards.
        transition: 'transform 0.25s ease, border-color 0.25s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: compact ? '3/2' : '3/4', background: book.coverColor }}
      >
        <img
          src={book.cover}
          alt={book.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {(book.isNew || book.bestseller) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {book.isNew && (
              <span
                style={{
                  background: '#06b6d4',
                  color: '#000',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Novo
              </span>
            )}
            {book.bestseller && (
              <span
                style={{
                  background: '#f59e0b',
                  color: '#000',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Best-seller
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1" style={{ padding: compact ? '0.8rem' : '0.95rem', gap: '0.45rem' }}>
        <div className="flex items-center justify-between gap-2">
          <span
            style={{
              fontSize: compact ? '0.6rem' : '0.64rem',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {book.category}
          </span>
          <span
            className="flex items-center gap-1 shrink-0"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              fontSize: '0.6rem',
              fontWeight: 500,
              padding: '0.15rem 0.4rem',
              borderRadius: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            {formatIcon}
            {book.formats.length > 1 ? 'Físico + E-book' : book.formats[0]}
          </span>
        </div>

        <div>
          <div
            className="line-clamp-2"
            style={{
              fontSize: compact ? '0.82rem' : '0.92rem',
              fontWeight: 700,
              color: '#f1f5f9',
              lineHeight: 1.35,
            }}
          >
            {book.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {book.author}
          </div>
        </div>

        {book.rating && (
          <div className="flex items-center gap-1">
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {book.rating} ({book.reviews})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid #1e2d4a' }}>
          <div>
            <div style={{ fontSize: '0.63rem', color: '#64748b' }}>
              {defaultFormat === 'E-book' ? 'E-book a partir de' : 'a partir de'}
            </div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem' }}>
              {price ? formatPrice(price) : 'Indisponível'}
            </div>
          </div>
          <button
            key={popKey}
            onClick={handleAdd}
            onMouseEnter={() => setHoveringCart(true)}
            onMouseLeave={() => setHoveringCart(false)}
            className={popKey > 0 ? 'flex items-center justify-center rounded-lg add-to-cart-pop' : 'flex items-center justify-center rounded-lg'}
            style={{
              background: hoveringCart ? '#10b981' : adding ? '#0891b2' : '#06b6d4',
              color: '#000',
              width: '32px',
              height: '32px',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transform: hoveringCart ? 'scale(1.12)' : 'scale(1)',
              transition: 'background 0.18s, transform 0.18s',
            }}
            title="Adicionar ao carrinho"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
