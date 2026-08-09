import { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Cpu, Zap, Shield, Lock, Code, BookOpen } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

// Ícone por nome, com genérico para categorias criadas pelo gerente.
const iconesPorCategoria: Record<string, ReactNode> = {
  'Inteligência Artificial': <Cpu size={28} />,
  'Blockchain': <Zap size={28} />,
  'Cibersegurança': <Shield size={28} />,
  'Criptografia': <Lock size={28} />,
  'Arquitetura de Software': <Code size={28} />,
};

export default function CategoriesPage() {
  const { books, categories, categoryMeta, loading, error } = useCatalog();
  const categoryList = categories.map((name) => ({
    name,
    icon: iconesPorCategoria[name] ?? <BookOpen size={28} />,
  }));

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '4rem 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ marginBottom: '3rem', maxWidth: '640px' }}>
          <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
            Categorias
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.75 }}>
            Explore nosso catálogo organizado pelas principais áreas de tecnologia cobertas pela COMPIA Editora.
          </p>
        </div>

        {loading && <div style={{ color: '#64748b', padding: '3rem 0' }}>Carregando categorias...</div>}
        {error && <div style={{ color: '#ef4444', padding: '3rem 0' }}>{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryList.map(({ name, icon }) => {
            const meta = categoryMeta[name];
            const count = books.filter((b) => b.category === name).length;
            return (
              <Link
                key={name}
                to={`/catalogo?cat=${encodeURIComponent(name)}`}
                className="group relative overflow-hidden rounded-2xl"
                style={{
                  border: '1px solid #1e2d4a',
                  textDecoration: 'none',
                  minHeight: '170px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '1.25rem',
                  background: '#0f1829',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = meta.color;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${meta.color}25`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <img
                  src={meta.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: 0.12 }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(0deg, #0f1829 10%, ${meta.color}25 100%)` }}
                />

                <div className="relative flex flex-col gap-2">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '0.875rem',
                      background: `${meta.color}20`,
                      color: meta.color,
                      border: `1px solid ${meta.color}40`,
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>{name}</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: '420px' }}>
                    {meta.description}
                  </p>
                  <div className="flex items-center gap-1.5" style={{ color: meta.color, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.15rem' }}>
                    {count} {count === 1 ? 'título' : 'títulos'} <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
