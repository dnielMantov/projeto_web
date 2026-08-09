import { useState, useEffect, useRef, FormEvent } from 'react';
import { Outlet, Link, useNavigate, useLocation, ScrollRestoration } from 'react-router';
import { ShoppingCart, Search, Menu, X, User, ChevronDown, Github, Linkedin, Twitter, Instagram, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './common/ConfirmDialog';
import { menuItemProps } from '../lib/menuItemStyle';
import { Logo } from './Logo';

export default function Layout() {
  const { totalItems, bumpToken, toasts } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [cartBumping, setCartBumping] = useState(false);
  const [tinySearchOpen, setTinySearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isFirstBump = useRef(true);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // ANIMAÇÃO 0: o ícone "chacoalha" a cada item adicionado. Pulamos o primeiro
  // valor de bumpToken (montagem do provider) para não animar sem motivo.
  useEffect(() => {
    if (isFirstBump.current) {
      isFirstBump.current = false;
      return;
    }
    setCartBumping(true);
    const t = setTimeout(() => setCartBumping(false), 600);
    return () => clearTimeout(t);
  }, [bumpToken]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  function handleLogoutConfirmed() {
    setLogoutConfirmOpen(false);
    logout();
  }

  const navLinks = [
    { label: 'Catálogo', to: '/catalogo' },
    { label: 'Categorias', to: '/categorias' },
    { label: 'Sobre', to: '/sobre' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#070d1a', color: '#e2e8f0' }}>
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: '#070d1a',
          borderBottom: `1px solid ${scrolled ? '#1e2d4a' : 'transparent'}`,
          transition: 'border-color 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', height: '4rem', gap: '0.75rem' }}>
            <Link to="/" className="flex items-center gap-2.5 shrink-0" style={{ justifySelf: 'start', gridColumn: 1 }}>
              <Logo size={42} />
              <div className="flex flex-col leading-none">
                <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '1.15rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                  COMPIA
                </span>
                <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Editora
                </span>
              </div>
            </Link>

            {/* Coluna do meio de um grid 1fr/auto/1fr: fica sempre centralizada
                no cabeçalho, independente da largura da logo ou dos ícones.
                gridColumn é explícito nas 3 colunas porque, com display:none
                (abaixo de lg), o auto-placement do grid pula esta coluna e
                empurra os ícones para a coluna do meio - bug que os deixava
                "centralizados" no mobile em vez de alinhados à direita. */}
            <nav className="hidden lg:flex items-center gap-5 shrink-0" style={{ gridColumn: 2 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{
                    color: location.pathname === link.to ? '#06b6d4' : '#94a3b8',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#06b6d4')}
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color =
                      location.pathname === link.to ? '#06b6d4' : '#94a3b8')
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3" style={{ justifySelf: 'end', gridColumn: 3 }}>
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center relative"
                style={{ width: '260px' }}
              >
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '0.875rem', color: '#64748b', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar livros, autores, temas..."
                  style={{
                    width: '100%',
                    background: '#1a2540',
                    border: '1px solid #1e2d4a',
                    borderRadius: '0.625rem',
                    padding: '0.55rem 0.875rem 0.55rem 2.25rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e2d4a')}
                />
              </form>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Link
                  to="/carrinho"
                  className="relative flex items-center justify-center"
                  style={{ color: '#94a3b8', padding: '0.4rem', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                  aria-label="Carrinho"
                >
                  <span className={cartBumping ? 'cart-icon-bump' : undefined}>
                    <ShoppingCart size={20} />
                  </span>
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-black"
                      style={{
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background: '#06b6d4',
                      }}
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* Popups de "item adicionado", em cascata (máx. 3 ao mesmo
                    tempo). Escondido em telas pequenas para não poluir -
                    lá só a animação do ícone acontece. */}
                <div
                  className="hidden sm:flex absolute flex-col gap-2"
                  style={{ top: 'calc(100% + 0.5rem)', right: 0, zIndex: 80, width: '240px', pointerEvents: 'none' }}
                >
                  {toasts.map((toast) => (
                    <div
                      key={toast.id}
                      className="cart-toast-enter flex items-center gap-2"
                      style={{
                        background: '#0f1829',
                        border: '1px solid rgba(6,182,212,0.35)',
                        borderRadius: '0.625rem',
                        padding: '0.6rem 0.8rem',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: '#06b6d4', flexShrink: 0 }} />
                      <span style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.3 }} className="truncate">
                        <strong>{toast.title}</strong> foi adicionado
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5"
                  style={{ color: '#94a3b8', padding: '0.4rem', transition: 'color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                  aria-label="Minha conta"
                >
                  <User size={20} />
                  {user && (
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                      {user.name.split(' ')[0]}
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {userMenuOpen && (
                  <div
                    className="dropdown-menu-in absolute right-0 mt-2 rounded-xl overflow-hidden shadow-xl"
                    style={{
                      background: '#0f1829',
                      border: '1px solid #1e2d4a',
                      minWidth: '180px',
                      zIndex: 100,
                    }}
                  >
                    {user ? (
                      <>
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e2d4a' }}>
                          <div style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                        </div>
                        {/* /minha-conta é exclusiva de cliente - gerente e admin só veem o painel deles. */}
                        {user.role === 'cliente' && (
                          <>
                            <Link to="/minha-conta" {...menuItemProps('#94a3b8')}>
                              Minha Conta
                            </Link>
                            <Link to="/minha-conta#pedidos" {...menuItemProps('#94a3b8')}>
                              Meus Pedidos
                            </Link>
                          </>
                        )}
                        {user.role !== 'cliente' && (
                          <Link
                            to={`/${user.role}`}
                            {...menuItemProps('#06b6d4')}
                            style={{ ...menuItemProps('#06b6d4').style, borderTop: '1px solid #1e2d4a' }}
                          >
                            Painel {user.role === 'admin' ? 'Admin' : 'Gerente'}
                          </Link>
                        )}
                        <button
                          onClick={() => setLogoutConfirmOpen(true)}
                          {...menuItemProps('#ef4444', '#f87171')}
                          style={{ ...menuItemProps('#ef4444', '#f87171').style, borderTop: '1px solid #1e2d4a' }}
                        >
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/minha-conta" {...menuItemProps('#e2e8f0')}>
                          Entrar
                        </Link>
                        <Link
                          to="/minha-conta?tab=cadastro"
                          {...menuItemProps('#06b6d4')}
                          style={{ ...menuItemProps('#06b6d4').style, borderTop: '1px solid #1e2d4a' }}
                        >
                          Criar conta
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                className="lg:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                style={{ color: '#94a3b8', padding: '0.4rem', cursor: 'pointer' }}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
            </div>
          </div>

          {/* Busca do mobile: linha própria abaixo do cabeçalho, sempre visível
              (não fica mais escondida só dentro do menu hamburguer). Em telas
              muito pequenas (abaixo de 380px) vira um botão de lupa que expande
              o campo ao tocar, pra não brigar por espaço com logo/ícones. */}
          <div className="md:hidden" style={{ paddingBottom: '0.75rem' }}>
            <form
              onSubmit={handleSearch}
              className={`items-center relative ${tinySearchOpen ? 'flex' : 'hidden min-[380px]:flex'}`}
            >
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.875rem', color: '#64748b', pointerEvents: 'none' }}
              />
              <input
                type="text"
                autoFocus={tinySearchOpen}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar livros, autores, temas..."
                style={{
                  width: '100%',
                  background: '#1a2540',
                  border: '1px solid #1e2d4a',
                  borderRadius: '0.625rem',
                  padding: '0.55rem 2.25rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              {tinySearchOpen && (
                <button
                  type="button"
                  onClick={() => setTinySearchOpen(false)}
                  aria-label="Fechar busca"
                  style={{ position: 'absolute', right: '0.75rem', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </form>
            {!tinySearchOpen && (
              <button
                type="button"
                className="min-[380px]:hidden flex items-center gap-2"
                onClick={() => setTinySearchOpen(true)}
                style={{
                  background: '#1a2540',
                  border: '1px solid #1e2d4a',
                  borderRadius: '0.625rem',
                  padding: '0.55rem 0.875rem',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Search size={16} />
                Buscar
              </button>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div style={{ background: '#0f1829', borderTop: '1px solid #1e2d4a' }}>
            <div className="px-4 py-4 flex flex-col gap-3">
              {/* Busca já tem sua própria linha sempre visível logo abaixo do
                  cabeçalho (fora deste menu) - não duplicar aqui. */}
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{ color: '#e2e8f0', padding: '0.5rem 0', fontSize: '0.95rem' }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/minha-conta"
                style={{ color: '#e2e8f0', padding: '0.5rem 0', fontSize: '0.95rem' }}
              >
                Minha Conta
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer style={{ background: '#060b17', borderTop: '1px solid #1e2d4a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <Logo size={34} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>COMPIA Editora</span>
              </Link>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Publicações especializadas em Inteligência Artificial, Blockchain, Cibersegurança e Tecnologias do Futuro.
              </p>
              <div className="flex gap-3">
                {[
                  { Icon: Github, href: '#' },
                  { Icon: Linkedin, href: '#' },
                  { Icon: Twitter, href: '#' },
                  { Icon: Instagram, href: '#' },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    style={{
                      color: '#64748b',
                      transition: 'color 0.2s',
                      padding: '0.25rem',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Conta',
                links: [
                  { label: 'Entrar', to: '/minha-conta' },
                  { label: 'Criar conta', to: '/minha-conta?tab=cadastro' },
                  { label: 'Meus pedidos', to: '/minha-conta' },
                  { label: 'Downloads', to: '/minha-conta' },
                  { label: 'Carrinho', to: '/carrinho' },
                ],
              },
              {
                title: 'Institucional',
                links: [
                  { label: 'Sobre a COMPIA', to: '/sobre' },
                  { label: 'Política de Privacidade', to: '/privacidade' },
                  { label: 'Termos de Uso', to: '/termos' },
                  { label: 'Contato', to: '/contato' },
                ],
              },
            ].map((group) => (
              <div key={group.title} className="md:justify-self-center">
                <h4
                  style={{
                    color: '#e2e8f0',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {group.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        style={{ color: '#64748b', fontSize: '0.875rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '2.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #1e2d4a',
            }}
          >
            <p style={{ color: '#475569', fontSize: '0.8rem' }}>
              © 2026 COMPIA Editora. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Deseja sair?"
        message="Você precisará entrar novamente."
        confirmLabel="Sair"
        danger
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <ScrollRestoration />
    </div>
  );
}
