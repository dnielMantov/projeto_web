import { useState, useEffect, ReactNode, FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Package, Download, ChevronRight, User, Lock, Mail, Eye, EyeOff, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/catalog';
import { apiFetch, ApiError } from '../lib/api';
import { PedidoApi } from '../types/pedido';
import { menuItemProps } from '../lib/menuItemStyle';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

type Tab = 'login' | 'cadastro' | 'pedidos' | 'downloads';

const statusConfig: Record<PedidoApi['status'], { label: string; color: string; icon: ReactNode; bg: string }> = {
  aguardando_pagamento: { label: 'Aguardando pagamento', color: '#f59e0b', icon: <Clock size={14} />, bg: 'rgba(245,158,11,0.1)' },
  pago: { label: 'Pago', color: '#06b6d4', icon: <CheckCircle size={14} />, bg: 'rgba(6,182,212,0.1)' },
  processando: { label: 'Processando', color: '#f59e0b', icon: <Clock size={14} />, bg: 'rgba(245,158,11,0.1)' },
  enviado: { label: 'Enviado', color: '#06b6d4', icon: <Truck size={14} />, bg: 'rgba(6,182,212,0.1)' },
  entregue: { label: 'Entregue', color: '#10b981', icon: <CheckCircle size={14} />, bg: 'rgba(16,185,129,0.1)' },
  cancelado: { label: 'Cancelado', color: '#ef4444', icon: <XCircle size={14} />, bg: 'rgba(239,68,68,0.1)' },
};

export default function CustomerPage() {
  const { user, login, register, logout } = useAuth();
  const [tab, setTab] = useState<Tab>(user ? 'pedidos' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [orders, setOrders] = useState<PedidoApi[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  function handleLogoutConfirmed() {
    setLogoutConfirmOpen(false);
    logout();
    // Bug corrigido: sem isto, a aba ficava travada em 'pedidos'/'downloads'
    // após sair - nenhuma das abas Entrar/Criar conta batia com esse valor,
    // então nenhuma delas aparecia selecionada e o formulário nem renderizava.
    setTab('login');
  }

  useEffect(() => {
    if (!user || user.role !== 'cliente' || (tab !== 'pedidos' && tab !== 'downloads')) return;
    setOrdersLoading(true);
    setOrdersError('');
    apiFetch<{ pedidos: PedidoApi[] }>('/pedidos')
      .then((data) => setOrders(data.pedidos))
      .catch(() => setOrdersError('Não foi possível carregar seus pedidos.'))
      .finally(() => setOrdersLoading(false));
  }, [user, tab]);

  const inputStyle = {
    width: '100%',
    background: '#1a2540',
    border: '1px solid #1e2d4a',
    borderRadius: '0.5rem',
    padding: '0.7rem 0.875rem',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    outline: 'none',
  };

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }
    setLoginError('');
    try {
      await login(loginForm.email, loginForm.password);
      setTab('pedidos');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Erro ao entrar.');
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) {
      setRegisterError('As senhas não coincidem.');
      return;
    }
    setRegisterError('');
    try {
      await register(registerForm.name, registerForm.email, registerForm.password);
      setRegisterSuccess(true);
      setTimeout(() => { setRegisterSuccess(false); setTab('pedidos'); }, 1500);
    } catch (err) {
      setRegisterError(err instanceof ApiError ? err.message : 'Erro ao criar conta.');
    }
  }

  // /minha-conta é exclusiva de cliente - gerente e admin caem direto no
  // painel deles, tanto ao logar aqui quanto ao tentar acessar esta rota.
  if (user && user.role !== 'cliente') {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const ebooks = orders.flatMap((o) =>
    o.itens.filter((i) => i.formato === 'E-book').map((i) => ({ ...i, pedidoId: o.id }))
  );

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '2rem 0 4rem' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem', marginBottom: '2rem' }}>
          {user ? `Olá, ${user.name.split(' ')[0]}` : 'Minha Conta'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', overflow: 'hidden' }}>
              {user ? (
                <>
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid #1e2d4a' }}>
                    <div
                      className="flex items-center justify-center mx-auto mb-3"
                      style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                        color: '#fff', fontWeight: 800, fontSize: '1.3rem',
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>{user.email}</div>
                  </div>
                  {[
                    { key: 'pedidos' as Tab, icon: <Package size={16} />, label: 'Meus Pedidos' },
                    { key: 'downloads' as Tab, icon: <Download size={16} />, label: 'Downloads' },
                  ].map((item) => {
                    const ativo = tab === item.key;
                    const hover = menuItemProps(ativo ? '#06b6d4' : '#94a3b8');
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className="w-full flex items-center gap-2 px-4 py-3"
                        style={{
                          ...hover.style,
                          padding: '0.75rem 1rem',
                          background: ativo ? 'rgba(6,182,212,0.1)' : 'none',
                          borderLeft: ativo ? '3px solid #06b6d4' : '3px solid transparent',
                          fontWeight: ativo ? 600 : 400,
                        }}
                        onMouseEnter={hover.onMouseEnter}
                        onMouseLeave={hover.onMouseLeave}
                      >
                        {item.icon} {item.label}
                      </button>
                    );
                  })}
                  {(() => {
                    const hover = menuItemProps('#ef4444', '#f87171');
                    return (
                      <button
                        onClick={() => setLogoutConfirmOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-3"
                        style={{ ...hover.style, padding: '0.75rem 1rem', borderTop: '1px solid #1e2d4a' }}
                        onMouseEnter={hover.onMouseEnter}
                        onMouseLeave={hover.onMouseLeave}
                      >
                        <User size={16} /> Sair
                      </button>
                    );
                  })()}
                </>
              ) : (
                <>
                  {[
                    { key: 'login' as Tab, label: 'Entrar' },
                    { key: 'cadastro' as Tab, label: 'Criar conta' },
                  ].map((item) => {
                    const ativo = tab === item.key;
                    const hover = menuItemProps(ativo ? '#06b6d4' : '#94a3b8');
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className="w-full px-4 py-3"
                        style={{
                          ...hover.style,
                          padding: '0.75rem 1rem',
                          background: ativo ? 'rgba(6,182,212,0.1)' : 'none',
                          borderLeft: ativo ? '3px solid #06b6d4' : '3px solid transparent',
                          fontWeight: ativo ? 600 : 400,
                        }}
                        onMouseEnter={hover.onMouseEnter}
                        onMouseLeave={hover.onMouseLeave}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {tab === 'login' && !user && (
              <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  Entrar na sua conta
                </h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.375rem' }}>
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.375rem' }}>
                      Senha
                    </label>
                    <div className="relative">
                      <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        style={{ ...inputStyle, paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {loginError && <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{loginError}</div>}
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      color: '#000',
                      fontWeight: 700,
                      borderRadius: '0.625rem',
                      padding: '0.875rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                    }}
                  >
                    Entrar
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Não tem conta? </span>
                    <button
                      type="button"
                      onClick={() => setTab('cadastro')}
                      style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Criar conta grátis
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'cadastro' && !user && (
              <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  Criar conta
                </h2>
                {registerSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <CheckCircle size={48} style={{ color: '#10b981' }} />
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>Conta criada com sucesso!</div>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    {[
                      { label: 'Nome completo', field: 'name', type: 'text', placeholder: 'João da Silva' },
                      { label: 'E-mail', field: 'email', type: 'email', placeholder: 'seu@email.com' },
                      { label: 'Senha', field: 'password', type: 'password', placeholder: '••••••••' },
                      { label: 'Confirmar senha', field: 'confirm', type: 'password', placeholder: '••••••••' },
                    ].map((f) => (
                      <div key={f.field}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.375rem' }}>
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={(registerForm as any)[f.field]}
                          onChange={(e) => setRegisterForm({ ...registerForm, [f.field]: e.target.value })}
                          style={inputStyle}
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                    {registerError && <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{registerError}</div>}
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        color: '#000',
                        fontWeight: 700,
                        borderRadius: '0.625rem',
                        padding: '0.875rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      Criar conta
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Já tem conta? </span>
                      <button
                        type="button"
                        onClick={() => setTab('login')}
                        style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Entrar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === 'pedidos' && user && (
              <div className="flex flex-col gap-4">
                {ordersLoading ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Carregando pedidos...</div>
                ) : ordersError ? (
                  <div style={{ color: '#ef4444', textAlign: 'center', padding: '3rem' }}>{ordersError}</div>
                ) : selectedOrder ? (
                  (() => {
                    const order = orders.find((o) => o.id === selectedOrder)!;
                    const cfg = statusConfig[order.status];
                    return (
                      <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.75rem' }}>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.25rem' }}
                        >
                          ← Voltar para pedidos
                        </button>
                        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                          <div>
                            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>Pedido #{order.id}</div>
                            <div style={{ color: '#64748b', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                              {new Date(order.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.85rem', fontWeight: 600 }}>
                            {cfg.icon} {cfg.label}
                          </div>
                        </div>
                        {order.codigo_rastreio && (
                          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '0.625rem', padding: '0.875rem', marginBottom: '1.25rem' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Código de rastreio</div>
                            <div style={{ color: '#06b6d4', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{order.codigo_rastreio}</div>
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
                          {order.itens.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#0a1220', border: '1px solid #1e2d4a' }}>
                              <div>
                                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>{item.titulo_snapshot}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.formato} · Qtd: {item.quantidade}</div>
                              </div>
                              <div style={{ color: '#06b6d4', fontWeight: 700 }}>{formatPrice(parseFloat(item.preco_unitario))}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid #1e2d4a' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Total</span>
                          <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.1rem' }}>{formatPrice(parseFloat(order.total))}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : orders.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>
                    Você ainda não fez nenhum pedido.
                  </div>
                ) : (
                  <>
                    <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>Histórico de Pedidos</h2>
                    {orders.map((order) => {
                      const cfg = statusConfig[order.status];
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order.id)}
                          style={{
                            background: '#0f1829',
                            border: '1px solid #1e2d4a',
                            borderRadius: '0.875rem',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#06b6d4')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a')}
                        >
                          <Package size={20} style={{ color: '#475569', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                              Pedido #{order.id}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                              {new Date(order.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} ·{' '}
                              {order.itens.length} {order.itens.length === 1 ? 'item' : 'itens'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 600 }}>
                              {cfg.icon} {cfg.label}
                            </div>
                            <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.9rem' }}>
                              {formatPrice(parseFloat(order.total))}
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: '#475569', flexShrink: 0 }} />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {tab === 'downloads' && user && (
              <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.75rem' }}>
                <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                  Meus E-books
                </h2>
                {ordersLoading ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Carregando...</div>
                ) : ebooks.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                    Nenhum e-book disponível para download.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {ebooks.map((item) => (
                      <div
                        key={`${item.pedidoId}-${item.id}`}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: '#0a1220', border: '1px solid #1e2d4a' }}
                      >
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>
                            {item.titulo_snapshot}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>E-book · PDF + EPUB</div>
                        </div>
                        <button
                          style={{
                            background: 'rgba(6,182,212,0.12)',
                            border: '1px solid rgba(6,182,212,0.3)',
                            color: '#06b6d4',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <Download size={14} /> Baixar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Sair da conta?"
        message="Você precisará entrar novamente para acessar sua conta, pedidos e downloads."
        confirmLabel="Sair"
        danger
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
