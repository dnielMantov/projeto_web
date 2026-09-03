import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, BookOpen, Download, Package, Loader2, Pencil } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, Format } from '../data/catalog';
import { apiFetch, ApiError } from '../lib/api';
import { FreteResposta } from '../types/pedido';
import { FRETE_GRATIS_MINIMO } from '../lib/frete';

function formatIcon(format: Format) {
  if (format === 'E-book') return <Download size={14} />;
  if (format === 'Kit') return <Package size={14} />;
  return <BookOpen size={14} />;
}

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [cep, setCep] = useState('');
  // CEP que já teve um cálculo bem-sucedido - usado para recalcular sozinho
  // quando o carrinho muda, sem o cliente precisar digitar de novo.
  const [cepConfirmado, setCepConfirmado] = useState('');
  const [frete, setFrete] = useState<FreteResposta | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteErro, setFreteErro] = useState('');

  const hasPhysical = items.some((i) => i.format !== 'E-book');
  const freteOpcaoPadrao = frete?.opcoes.find((o) => o.tipo === 'padrao');
  const freteValor = freteOpcaoPadrao ? freteOpcaoPadrao.valor : 0;
  const total = totalPrice + (frete ? freteValor : 0);

  async function calcularFrete(cepAlvo: string) {
    if (!cepAlvo.trim()) return;
    setFreteLoading(true);
    setFreteErro('');
    try {
      // Mesmo endpoint usado no checkout - o valor exibido aqui já é o real
      // calculado pelo backend, não uma estimativa.
      const resposta = await apiFetch<FreteResposta>('/frete/calcular', {
        method: 'POST',
        body: JSON.stringify({
          cep: cepAlvo,
          itens: items.map((i) => ({ livro_id: i.book.id, formato: i.format, quantidade: i.quantity })),
        }),
      });
      setFrete(resposta);
      setCepConfirmado(cepAlvo);
    } catch (err) {
      setFrete(null);
      setFreteErro(err instanceof ApiError ? err.message : 'Não foi possível calcular o frete.');
    } finally {
      setFreteLoading(false);
    }
  }

  // Bug corrigido: o frete (inclusive o "grátis" por passar de R$199) ficava
  // congelado no valor calculado na hora do clique. Se o cliente removesse
  // itens depois e caísse abaixo do limiar, a tela continuava mostrando
  // grátis. Recalculamos com o mesmo CEP sempre que o carrinho muda.
  const itensAssinatura = items.map((i) => `${i.book.id}:${i.format}:${i.quantity}`).join('|');
  const primeiraExecucao = useRef(true);
  useEffect(() => {
    if (primeiraExecucao.current) {
      primeiraExecucao.current = false;
      return;
    }
    if (!cepConfirmado || items.length === 0) return;
    void calcularFrete(cepConfirmado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensAssinatura]);

  function trocarCep() {
    setFrete(null);
    setCepConfirmado('');
    setFreteErro('');
  }

  if (items.length === 0) {
    return (
      <div
        style={{ backgroundColor: '#070d1a', minHeight: '50vh' }}
        className="flex flex-col items-center justify-center gap-8 py-16"
      >
        <div
          className="flex items-center justify-center animate-pulse"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,141,209,0.15))',
            border: '2px solid rgba(6,182,212,0.3)',
            boxShadow: '0 0 40px rgba(6,182,212,0.1)',
          }}
        >
          <ShoppingCart size={56} style={{ color: '#06b6d4' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '2rem', marginBottom: '0.75rem' }}>
            Seu carrinho está vazio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6' }}>
            Explore nosso catálogo de livros incríveis e comece sua próxima leitura hoje mesmo.
          </p>
        </div>
        <Link
          to="/catalogo"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#000',
            fontWeight: 700,
            borderRadius: '0.875rem',
            padding: '1rem 2rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.05rem',
            boxShadow: '0 8px 24px rgba(6,182,212,0.25)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(-2px)';
            el.style.boxShadow = '0 12px 32px rgba(6,182,212,0.35)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '0 8px 24px rgba(6,182,212,0.25)';
          }}
        >
          Ver catálogo <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '3rem 0 4rem' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '2.5rem', margin: 0, lineHeight: 1.2 }}>
                Carrinho de Compras
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0.5rem 0 0', fontWeight: 400 }}>
                {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'} adicionados
              </p>
            </div>
            <button
              onClick={clearCart}
              style={{
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              Limpar carrinho
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              const price = item.format === 'E-book' ? (item.book.price.ebook ?? 0) : (item.book.price.physical ?? 0);
              return (
                <div
                  key={`${item.book.id}-${item.format}`}
                  style={{
                    background: 'linear-gradient(135deg, #0f1829 0%, #141e2e 100%)',
                    border: '1px solid #1e2d4a',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#06b6d4';
                    el.style.boxShadow = '0 4px 16px rgba(6, 182, 212, 0.15)';
                    el.style.background = 'linear-gradient(135deg, #11192e 0%, #161f32 100%)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#1e2d4a';
                    el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                    el.style.background = 'linear-gradient(135deg, #0f1829 0%, #141e2e 100%)';
                  }}
                >
                  <Link to={`/produto/${item.book.id}`}>
                    <div
                      className="rounded-lg overflow-hidden shrink-0"
                      style={{ width: '64px', height: '88px', background: item.book.coverColor, position: 'relative' }}
                    >
                      <img
                        src={item.book.cover}
                        alt={item.book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/produto/${item.book.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        color: '#f1f5f9',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        marginBottom: '0.25rem',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#f1f5f9')}
                      >
                        {item.book.title}
                      </div>
                    </Link>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                      por {item.book.author}
                    </div>
                    <div
                      className="inline-flex items-center gap-2"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#06b6d4',
                        borderRadius: '2rem',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        marginBottom: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      {formatIcon(item.format)} {item.format}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div
                        className="flex items-center"
                        style={{
                          background: '#1a2540',
                          border: '1px solid #1e2d4a',
                          borderRadius: '0.7rem',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.book.id, item.format, item.quantity - 1)}
                          style={{
                            padding: '0.5rem 0.7rem',
                            color: '#94a3b8',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                        >
                          <Minus size={16} />
                        </button>
                        <div
                          style={{
                            color: '#e2e8f0',
                            fontWeight: 600,
                            minWidth: '2.5rem',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            borderLeft: '1px solid #1e2d4a',
                            borderRight: '1px solid #1e2d4a',
                          }}
                        >
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.book.id, item.format, item.quantity + 1)}
                          style={{
                            padding: '0.5rem 0.7rem',
                            color: '#94a3b8',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          {item.quantity > 1 && (
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                              {item.quantity}× {formatPrice(price)}
                            </div>
                          )}
                          <div style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.2rem' }}>
                            {formatPrice(price * item.quantity)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.book.id, item.format)}
                          style={{
                            color: '#64748b',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = '#ef4444';
                            el.style.background = 'rgba(239, 68, 68, 0.15)';
                            el.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = '#64748b';
                            el.style.background = 'rgba(239, 68, 68, 0.05)';
                            el.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                          }}
                          title="Remover item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              to="/catalogo"
              style={{
                color: '#06b6d4',
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.gap = '0.8rem';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.gap = '0.5rem';
              }}
            >
              ← Continuar comprando
            </Link>
          </div>

          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #0f1829 0%, #141e2e 100%)',
                border: '1px solid #1e2d4a',
                borderRadius: '1.25rem',
                padding: '2rem 1.75rem',
                position: 'sticky',
                top: '5rem',
                boxShadow: '0 8px 32px rgba(6, 182, 212, 0.08)',
              }}
            >
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.35rem', marginBottom: '1.75rem', margin: 0 }}>
                Resumo do Pedido
              </h2>

              <div className="flex flex-col gap-4" style={{ marginBottom: '1.75rem', paddingBottom: '1.75rem', borderBottom: '1px solid rgba(30, 45, 74, 0.5)' }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                    Subtotal
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem' }}>{formatPrice(totalPrice)}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                  {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
                </div>

                {hasPhysical && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>Frete</span>
                      {frete ? (
                        <span
                          className="flex items-center gap-2"
                          style={{
                            color: freteValor === 0 ? '#10b981' : '#e2e8f0',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          {freteValor === 0 ? 'Grátis' : formatPrice(freteValor)}
                          <button
                            onClick={trocarCep}
                            title="Trocar CEP"
                            style={{
                              color: '#64748b',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#06b6d4')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
                          >
                            <Pencil size={14} />
                          </button>
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Informe o CEP</span>
                      )}
                    </div>

                    {!frete && (
                      <div className="flex flex-col gap-2.5" style={{ marginTop: '1rem' }}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cep}
                            onChange={(e) => setCep(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') calcularFrete(cep); }}
                            placeholder="Seu CEP (00000-000)"
                            style={{
                              flex: 1,
                              background: '#1a2540',
                              border: '1px solid #1e2d4a',
                              borderRadius: '0.6rem',
                              padding: '0.65rem 0.85rem',
                              color: '#e2e8f0',
                              fontSize: '0.9rem',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = '#06b6d4';
                              el.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                            }}
                            onBlur={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = '#1e2d4a';
                              el.style.boxShadow = 'none';
                            }}
                          />
                          <button
                            onClick={() => calcularFrete(cep)}
                            disabled={freteLoading || !cep.trim()}
                            style={{
                              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                              border: 'none',
                              color: '#000',
                              borderRadius: '0.6rem',
                              padding: '0.65rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: freteLoading || !cep.trim() ? 'not-allowed' : 'pointer',
                              opacity: freteLoading || !cep.trim() ? 0.5 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {freteLoading ? <Loader2 size={14} className="animate-spin" /> : 'Calcular'}
                          </button>
                        </div>
                        {freteErro && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            fontWeight: 500,
                          }}>
                            {freteErro}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!hasPhysical && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>Entrega (E-book)</span>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ✓ Download imediato
                    </span>
                  </div>
                )}

                {hasPhysical && frete && freteValor > 0 && totalPrice < FRETE_GRATIS_MINIMO && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: '0.7rem',
                      padding: '0.85rem 1rem',
                      fontSize: '0.85rem',
                      color: '#10b981',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>✨</span>
                    Adicione {formatPrice(FRETE_GRATIS_MINIMO - totalPrice)} mais para frete grátis!
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-between"
                style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1rem', marginBottom: '1.25rem' }}
              >
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Total</span>
                <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.4rem' }}>{formatPrice(total)}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: '-0.75rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Impostos inclusos no preço
              </p>

              <Link
                to="/checkout"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                Finalizar compra <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
