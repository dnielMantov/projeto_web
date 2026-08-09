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
        className="flex flex-col items-center justify-center gap-6 py-12"
      >
        <div
          className="flex items-center justify-center"
          style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0f1829', border: '1px solid #1e2d4a' }}
        >
          <ShoppingCart size={36} style={{ color: '#1e2d4a' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Seu carrinho está vazio
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Explore nosso catálogo e adicione títulos ao carrinho.
          </p>
        </div>
        <Link
          to="/catalogo"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#000',
            fontWeight: 700,
            borderRadius: '0.75rem',
            padding: '0.875rem 2rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Ver catálogo <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '2rem 0 4rem' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem' }}>
            Carrinho de Compras
          </h1>
          <button
            onClick={clearCart}
            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Limpar carrinho
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              const price = item.format === 'E-book' ? (item.book.price.ebook ?? 0) : (item.book.price.physical ?? 0);
              return (
                <div
                  key={`${item.book.id}-${item.format}`}
                  style={{
                    background: '#0f1829',
                    border: '1px solid #1e2d4a',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
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
                      <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {item.book.title}
                      </div>
                    </Link>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                      {item.book.author}
                    </div>
                    <div
                      className="inline-flex items-center gap-1"
                      style={{
                        background: '#1a2540',
                        border: '1px solid #1e2d4a',
                        color: '#94a3b8',
                        borderRadius: '2rem',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {formatIcon(item.format)} {item.format}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div
                        className="flex items-center gap-1"
                        style={{ background: '#1a2540', border: '1px solid #1e2d4a', borderRadius: '0.5rem', overflow: 'hidden' }}
                      >
                        <button
                          onClick={() => updateQuantity(item.book.id, item.format, item.quantity - 1)}
                          style={{ padding: '0.4rem 0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ color: '#e2e8f0', fontWeight: 600, minWidth: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.book.id, item.format, item.quantity + 1)}
                          style={{ padding: '0.4rem 0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {item.quantity > 1 ? `${item.quantity}× ${formatPrice(price)}` : ''}
                          </div>
                          <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '1rem' }}>
                            {formatPrice(price * item.quantity)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.book.id, item.format)}
                          style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: '0.25rem' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#475569')}
                          title="Remover item"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              to="/catalogo"
              style={{ color: '#06b6d4', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
            >
              ← Continuar comprando
            </Link>
          </div>

          <div>
            <div
              style={{
                background: '#0f1829',
                border: '1px solid #1e2d4a',
                borderRadius: '1rem',
                padding: '1.5rem',
                position: 'sticky',
                top: '5rem',
              }}
            >
              <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                Resumo do Pedido
              </h2>

              <div className="flex flex-col gap-3" style={{ marginBottom: '1.25rem' }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? 'item' : 'itens'})
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{formatPrice(totalPrice)}</span>
                </div>

                {hasPhysical && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Frete</span>
                      {frete ? (
                        <span
                          className="flex items-center gap-2"
                          style={{ color: freteValor === 0 ? '#10b981' : '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          {freteValor === 0 ? 'Grátis' : formatPrice(freteValor)}
                          <button
                            onClick={trocarCep}
                            title="Trocar CEP"
                            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <Pencil size={13} />
                          </button>
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Informe o CEP</span>
                      )}
                    </div>

                    {!frete && (
                      <div className="flex flex-col gap-2" style={{ marginTop: '0.6rem' }}>
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
                              borderRadius: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              color: '#e2e8f0',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => calcularFrete(cep)}
                            disabled={freteLoading || !cep.trim()}
                            style={{
                              background: '#1a2540',
                              border: '1px solid #1e2d4a',
                              color: '#e2e8f0',
                              borderRadius: '0.5rem',
                              padding: '0.5rem 0.9rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: freteLoading || !cep.trim() ? 'default' : 'pointer',
                              opacity: freteLoading || !cep.trim() ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {freteLoading ? <Loader2 size={14} className="animate-spin" /> : 'Calcular'}
                          </button>
                        </div>
                        {freteErro && <div style={{ color: '#ef4444', fontSize: '0.78rem' }}>{freteErro}</div>}
                      </div>
                    )}
                  </div>
                )}

                {!hasPhysical && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Entrega (E-book)</span>
                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>Download imediato</span>
                  </div>
                )}

                {hasPhysical && frete && freteValor > 0 && totalPrice < FRETE_GRATIS_MINIMO && (
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.78rem',
                      color: '#10b981',
                    }}
                  >
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
