import { Link } from 'react-router';
import { ReactNode, useRef } from 'react';
import { ArrowRight, ChevronRight, Zap, Shield, Cpu, Code, Lock, BookOpen, Download, Package } from 'lucide-react';
import { formatPrice } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { BookCard } from '../components/BookCard';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { HeroCanvas } from '../components/HeroCanvas';

// Categorias agora vêm do banco e o gerente pode criar novas, então o ícone é
// resolvido pelo nome, com um genérico para qualquer categoria nova.
const iconesPorCategoria: Record<string, ReactNode> = {
  'Inteligência Artificial': <Cpu size={24} />,
  'Blockchain': <Zap size={24} />,
  'Cibersegurança': <Shield size={24} />,
  'Criptografia': <Lock size={24} />,
  'Arquitetura de Software': <Code size={24} />,
};

function formatIcon(formats: string[]) {
  if (formats.includes('Kit')) return <Package size={10} />;
  if (formats.includes('E-book') && !formats.includes('Físico')) return <Download size={10} />;
  return <BookOpen size={10} />;
}

const stats = [
  { label: 'Títulos publicados', value: '20+' },
  { label: 'Autores especialistas', value: '12' },
  { label: 'Leitores satisfeitos', value: '8.400+' },
  { label: 'Anos de experiência', value: '7' },
];

export default function HomePage() {
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const { books, categories, categoryMeta, loading, error } = useCatalog();

  const featuredBooks = books.filter((b) => b.featured);
  const bestsellers = books.filter((b) => b.bestseller).slice(0, 6);
  const newReleases = books.filter((b) => b.isNew).slice(0, 4);
  const categoryList = categories.slice(0, 5).map((name) => ({
    name,
    icon: iconesPorCategoria[name] ?? <BookOpen size={24} />,
  }));

  return (
    <div style={{ backgroundColor: '#070d1a' }}>
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '56vh', display: 'flex', alignItems: 'center', background: '#000000' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseRef.current.x = e.clientX - rect.left;
          mouseRef.current.y = e.clientY - rect.top;
          mouseRef.current.active = true;
        }}
        onMouseEnter={() => { mouseRef.current.active = true; }}
        onMouseLeave={() => { mouseRef.current.active = false; }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,45,74,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,74,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <HeroCanvas mouseRef={mouseRef} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', display: 'block' }} />
              <span style={{ color: '#06b6d4', fontSize: '0.8rem', fontWeight: 500 }}>
                A editora especializada em tecnologia do futuro
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 900,
                color: '#f1f5f9',
                lineHeight: 1.2,
                marginBottom: '0.875rem',
                letterSpacing: '-0.03em',
              }}
            >
              Conhecimento que{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                transforma carreiras
              </span>
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, maxWidth: '480px' }}>
              Publicações especializadas em IA, Blockchain, Cibersegurança e Arquitetura de Software.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-t-2xl overflow-hidden"
              style={{ background: '#1e2d4a' }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{ background: 'rgba(15,24,41,0.95)', padding: '1.25rem', textAlign: 'center' }}
                >
                  <div style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.5rem' }}>{stat.value}</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 0 4rem', background: 'rgba(15,24,41,0.4)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>
                Em Destaque
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Seleção especial dos editores</p>
            </div>
            <Link
              to="/catalogo"
              className="flex items-center gap-1"
              style={{ color: '#06b6d4', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div style={{ color: '#64748b', padding: '3rem 0', textAlign: 'center' }}>Carregando catálogo...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', padding: '3rem 0', textAlign: 'center' }}>{error}</div>
          ) : featuredBooks.length === 0 ? (
            <div style={{ color: '#64748b', padding: '3rem 0', textAlign: 'center' }}>
              Nenhum título em destaque no momento.
            </div>
          ) : (
            <FeaturedCarousel books={featuredBooks} />
          )}
        </div>
      </section>

      <section style={{ padding: '5rem 0 4rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>
                Categorias
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Explore por área de conhecimento</p>
            </div>
            <Link
              to="/categorias"
              className="flex items-center gap-1"
              style={{ color: '#06b6d4', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryList.map(({ name, icon }) => {
              const meta = categoryMeta[name];
              const count = books.filter((b) => b.category === name).length;
              return (
                <Link
                  key={name}
                  to={`/catalogo?cat=${encodeURIComponent(name)}`}
                  className="relative overflow-hidden rounded-2xl group"
                  style={{
                    border: '1px solid #1e2d4a',
                    textDecoration: 'none',
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    background: '#0f1829',
                    transition: 'border-color 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = meta.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${meta.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={meta.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 0.08 }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${meta.color}20, transparent)` }}
                  />
                  <div className="relative flex flex-col items-center gap-2 p-4 text-center">
                    <div style={{ color: meta.color }}>{icon}</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.925rem', lineHeight: 1.3 }}>
                      {name}
                    </div>
                    <div style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '0.75rem' }}>{count} títulos</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
                    Novidades
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Lançamentos recentes da editora</p>
                </div>
                <Link
                  to="/catalogo?sort=new"
                  className="flex items-center gap-1"
                  style={{ color: '#06b6d4', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  Ver todos <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {newReleases.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
                    Mais Vendidos
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Os favoritos dos leitores</p>
                </div>
                <Link
                  to="/catalogo?sort=bestseller"
                  className="flex items-center gap-1"
                  style={{ color: '#06b6d4', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  Ver todos <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {bestsellers.map((book, index) => {
                  const price = book.price.physical ?? book.price.ebook ?? 0;
                  const meta = categoryMeta[book.category];
                  const top3 = index < 3;
                  return (
                    <Link
                      key={book.id}
                      to={`/produto/${book.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
                      style={{
                        background: '#0f1829',
                        border: '1px solid #1e2d4a',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0 rounded-lg"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: top3 ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.08)',
                          color: top3 ? '#f59e0b' : '#d97706',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        className="relative rounded-lg overflow-hidden shrink-0"
                        style={{ width: '48px', height: '64px', background: book.coverColor }}
                      >
                        <img src={book.cover} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0 gap-1">
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                          {book.title}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }} className="truncate">{book.author}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            style={{
                              background: `${meta?.color ?? '#64748b'}18`,
                              color: meta?.color ?? '#94a3b8',
                              fontSize: '0.62rem',
                              fontWeight: 600,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.25rem',
                              whiteSpace: 'nowrap',
                            }}
                            className="truncate"
                          >
                            {book.category}
                          </span>
                          <span
                            className="flex items-center gap-1 shrink-0"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: '#94a3b8',
                              fontSize: '0.62rem',
                              fontWeight: 500,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.25rem',
                            }}
                          >
                            {formatIcon(book.formats)}
                            {book.formats.length > 1 ? 'Físico + E-book' : book.formats[0]}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0" style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.9rem' }}>
                        {formatPrice(price)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #0f1829 0%, #162035 50%, #1a1040 100%)',
              border: '1px solid #1e2d4a',
              padding: 'clamp(2rem, 5vw, 4rem)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-1/2 h-full"
              style={{
                background: 'radial-gradient(ellipse at right, rgba(139,92,246,0.15) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-1/3 h-full"
              style={{
                background: 'radial-gradient(ellipse at left, rgba(6,182,212,0.12) 0%, transparent 70%)',
              }}
            />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div
                  className="inline-block px-3 py-1 rounded-full mb-4"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <span style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 500 }}>
                    🚀 Kit especial disponível
                  </span>
                </div>
                <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
                  Kit Trilha de IA Completa
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '440px', lineHeight: 1.7 }}>
                  Os 3 livros mais vendidos de IA da COMPIA em um kit com desconto exclusivo. A trilha completa para
                  dominar Machine Learning, Deep Learning e Python para IA.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'line-through' }}>
                    R$ 314,70
                  </div>
                  <div style={{ color: '#06b6d4', fontWeight: 800, fontSize: '2rem' }}>R$ 249,90</div>
                  <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Economize R$ 64,80</div>
                </div>
                <Link
                  to="/produto/kit-001"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#fff',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  Ver kit <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
