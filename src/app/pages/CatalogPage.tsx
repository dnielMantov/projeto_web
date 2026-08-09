import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { SlidersHorizontal, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';
import { Book, Category, Format } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { apiFetch } from '../lib/api';
import { LivroApi, mapLivroToBook } from '../types/livro';
import { BookCard } from '../components/BookCard';
import { Dropdown } from '../components/common/Dropdown';

type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco' | 'mais-recentes' | 'bestseller' | 'new';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'mais-recentes', label: 'Mais recentes' },
  { value: 'bestseller', label: 'Mais vendidos' },
];

const formats: Format[] = ['Físico', 'E-book', 'Kit'];

const ITEMS_PER_PAGE = 12;

export default function CatalogPage() {
  const { books, categories, categoryMeta } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [filterCats, setFilterCats] = useState<Category[]>([]);
  const [filterFormats, setFilterFormats] = useState<Format[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevancia');
  const [page, setPage] = useState(1);
  const [catSectionOpen, setCatSectionOpen] = useState(true);
  const [formatSectionOpen, setFormatSectionOpen] = useState(true);

  const [pageBooks, setPageBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState('');

  const q = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') as Category | null;
  const sortParam = searchParams.get('sort') as SortOption | null;

  const isFirstScroll = useRef(true);

  useEffect(() => {
    // As categorias chegam da API, então isto precisa reagir quando elas
    // carregam - senão o ?cat= da URL é descartado por chegar antes da lista.
    if (catParam && categories.includes(catParam)) {
      setFilterCats([catParam]);
    }
    if (sortParam) {
      setSortBy(sortParam === 'new' ? 'mais-recentes' : sortParam === 'bestseller' ? 'bestseller' : 'relevancia');
    }
  }, [catParam, sortParam, categories]);

  // Busca real no backend a cada mudança de filtro/ordenação/página - os
  // livros não são mockados nem filtrados no cliente. O debounce evita uma
  // requisição por tecla digitada na faixa de preço.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoadingPage(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(ITEMS_PER_PAGE));
        params.set('ordenar', sortBy);
        if (q) params.set('q', q);
        if (filterCats.length > 0) params.set('categoria', filterCats.join(','));
        if (filterFormats.length > 0) params.set('formato', filterFormats.join(','));
        if (priceMin.trim() !== '') params.set('preco_min', priceMin.trim());
        if (priceMax.trim() !== '') params.set('preco_max', priceMax.trim());

        const resposta = await apiFetch<{ livros: LivroApi[]; total: number }>(`/livros?${params.toString()}`);
        if (cancelled) return;
        setPageBooks(resposta.livros.map(mapLivroToBook));
        setTotal(resposta.total);
        setErrorPage('');
      } catch {
        if (!cancelled) setErrorPage('Não foi possível carregar os livros.');
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [page, q, filterCats, filterFormats, priceMin, priceMax, sortBy]);

  // Volta ao topo sempre que a página muda (não no primeiro carregamento).
  useEffect(() => {
    if (isFirstScroll.current) {
      isFirstScroll.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  function toggleCat(cat: Category) {
    setFilterCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPage(1);
  }

  function toggleFormat(format: Format) {
    setFilterFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
    setPage(1);
  }

  function applyPricePreset(min: string, max: string) {
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
  }

  function sanitizePriceInput(raw: string): string {
    return raw.replace(/[^\d]/g, '');
  }

  function clearFilters() {
    setFilterCats([]);
    setFilterFormats([]);
    setPriceMin('');
    setPriceMax('');
    setSortBy('relevancia');
    setPage(1);
    setSearchParams({});
  }

  const activeFilterCount = filterCats.length + filterFormats.length + (q ? 1 : 0) + (priceMin || priceMax ? 1 : 0);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1e2d4a', padding: '2rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem' }}>
              Catálogo
            </h1>

            <div className="flex items-end gap-3">
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Ordenar por</span>
                <Dropdown
                  value={sortBy}
                  options={SORT_OPTIONS}
                  onChange={(v) => { setSortBy(v as SortOption); setPage(1); }}
                  style={{ width: '170px' }}
                  ariaLabel="Ordenar por"
                />
              </label>

              <button
                className="md:hidden flex items-center gap-2"
                onClick={() => setFiltersOpen(!filtersOpen)}
                style={{
                  background: '#0f1829',
                  border: '1px solid #1e2d4a',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      background: '#06b6d4',
                      color: '#000',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside
            className={`shrink-0 w-full md:w-[240px] ${filtersOpen ? 'block' : 'hidden'} md:block`}
          >
            <div className="flex flex-col gap-6 md:sticky md:top-20">
              <p style={{ color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {total} {total === 1 ? 'título' : 'títulos'}
              </p>

              <div style={{ background: '#0f1829', borderRadius: '0.75rem', border: '1px solid #1e2d4a', overflow: 'hidden' }}>
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setCatSectionOpen(!catSectionOpen)}
                  style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Categorias
                  {catSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {catSectionOpen && (
                  <div style={{ padding: '0 0.75rem 0.75rem' }}>
                    {categories.map((cat) => {
                      const count = books.filter((b) => b.category === cat).length;
                      const active = filterCats.includes(cat);
                      const meta = categoryMeta[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCat(cat)}
                          className="w-full flex items-center justify-between p-2 rounded-lg"
                          style={{
                            background: active ? `${meta.color}15` : 'none',
                            border: active ? `1px solid ${meta.color}30` : '1px solid transparent',
                            cursor: 'pointer',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ color: active ? meta.color : '#94a3b8', fontSize: '0.85rem', textAlign: 'left' }}>
                            {cat}
                          </span>
                          <span
                            style={{
                              color: '#64748b',
                              fontSize: '0.75rem',
                              background: '#1a2540',
                              borderRadius: '2rem',
                              padding: '0.1rem 0.4rem',
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ background: '#0f1829', borderRadius: '0.75rem', border: '1px solid #1e2d4a', overflow: 'hidden' }}>
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setFormatSectionOpen(!formatSectionOpen)}
                  style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Formato
                  {formatSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {formatSectionOpen && (
                  <div style={{ padding: '0 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {formats.map((fmt) => {
                      const active = filterFormats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          onClick={() => toggleFormat(fmt)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '0.25rem',
                              border: `2px solid ${active ? '#06b6d4' : '#1e2d4a'}`,
                              background: active ? '#06b6d4' : 'transparent',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {active && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                          <span style={{ color: active ? '#e2e8f0' : '#94a3b8', fontSize: '0.85rem' }}>{fmt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ background: '#0f1829', borderRadius: '0.75rem', border: '1px solid #1e2d4a', padding: '1rem' }}>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Faixa de Preço
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Mínimo</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0"
                      value={priceMin}
                      onChange={(e) => { setPriceMin(sanitizePriceInput(e.target.value)); setPage(1); }}
                      style={{
                        width: '100%',
                        background: '#1a2540',
                        border: '1px solid #1e2d4a',
                        borderRadius: '0.375rem',
                        padding: '0.375rem 0.5rem',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ color: '#64748b', paddingTop: '1rem' }}>-</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Máximo</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Sem limite"
                      value={priceMax}
                      onChange={(e) => { setPriceMax(sanitizePriceInput(e.target.value)); setPage(1); }}
                      style={{
                        width: '100%',
                        background: '#1a2540',
                        border: '1px solid #1e2d4a',
                        borderRadius: '0.375rem',
                        padding: '0.375rem 0.5rem',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Até R$ 95', min: '', max: '95' },
                    { label: 'R$ 95 a R$ 150', min: '95', max: '150' },
                    { label: 'Mais de R$ 150', min: '150', max: '' },
                  ].map((preset) => {
                    const active = priceMin === preset.min && priceMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => applyPricePreset(preset.min, preset.max)}
                        style={{
                          background: active ? 'rgba(6,182,212,0.12)' : '#1a2540',
                          border: `1px solid ${active ? 'rgba(6,182,212,0.4)' : '#1e2d4a'}`,
                          color: active ? '#06b6d4' : '#94a3b8',
                          borderRadius: '0.375rem',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                >
                  Limpar filtros ({activeFilterCount})
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {loadingPage ? (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '5rem 0' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#06b6d4' }} />
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Carregando livros...</span>
              </div>
            ) : errorPage ? (
              <div style={{ color: '#ef4444', textAlign: 'center', padding: '5rem 0' }}>{errorPage}</div>
            ) : pageBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Search size={48} style={{ color: '#1e2d4a' }} />
                <div style={{ color: '#64748b', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                    Nenhum título encontrado
                  </div>
                  Tente ajustar os filtros ou buscar por outros termos.
                </div>
                <button onClick={clearFilters} style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {pageBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        background: '#0f1829',
                        border: '1px solid #1e2d4a',
                        color: page === 1 ? '#475569' : '#e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        cursor: page === 1 ? 'default' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          background: p === page ? '#06b6d4' : '#0f1829',
                          border: `1px solid ${p === page ? '#06b6d4' : '#1e2d4a'}`,
                          color: p === page ? '#000' : '#e2e8f0',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.875rem',
                          cursor: 'pointer',
                          fontWeight: p === page ? 700 : 400,
                          fontSize: '0.875rem',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        background: '#0f1829',
                        border: '1px solid #1e2d4a',
                        color: page === totalPages ? '#475569' : '#e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        cursor: page === totalPages ? 'default' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
