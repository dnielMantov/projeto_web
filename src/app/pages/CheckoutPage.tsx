import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router';
import { Check, ChevronRight, CreditCard, Smartphone, Truck, Zap, MapPin, User, Download, CheckCircle, Clock, Copy } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/catalog';
import { apiFetch, ApiError } from '../lib/api';
import { FreteOpcao, FreteResposta, PagamentoApi, PagamentoStatusApi, PedidoApi } from '../types/pedido';

type Step = 'dados' | 'entrega' | 'pagamento' | 'revisao' | 'confirmacao';
type DeliveryMethod = 'padrao' | 'expressa' | 'retirada' | 'download';
type PaymentMethod = 'credit' | 'pix';

const STEPS: { key: Step; label: string }[] = [
  { key: 'dados', label: 'Dados' },
  { key: 'entrega', label: 'Entrega' },
  { key: 'pagamento', label: 'Pagamento' },
  { key: 'revisao', label: 'Revisão' },
];

interface FormData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

const STATUS_DETAIL_PT: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão.',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) inválido.',
  cc_rejected_bad_filled_date: 'Data de validade inválida.',
  cc_rejected_bad_filled_card_number: 'Número do cartão inválido.',
  cc_rejected_call_for_authorize: 'Pagamento não autorizado. Entre em contato com o banco emissor.',
  cc_rejected_card_disabled: 'Cartão desabilitado. Entre em contato com o banco emissor.',
  cc_rejected_high_risk: 'Pagamento recusado por segurança.',
  cc_rejected_other_reason: 'O banco emissor recusou o pagamento.',
};

function mensagemRejeicao(detail: string | null | undefined): string {
  if (detail && STATUS_DETAIL_PT[detail]) return STATUS_DETAIL_PT[detail];
  return 'Pagamento não aprovado. Verifique os dados do cartão e tente novamente.';
}

export default function CheckoutPage() {
  const { user, authLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>('dados');
  const [delivery, setDelivery] = useState<DeliveryMethod>('padrao');
  const [payment, setPayment] = useState<PaymentMethod>('credit');
  const [form, setForm] = useState<FormData>({
    name: '', email: '', cpf: '', phone: '',
    cep: '', street: '', number: '', complement: '', city: '', state: '',
  });
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '', installments: '1' });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  const [freteOpcoes, setFreteOpcoes] = useState<FreteOpcao[] | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteError, setFreteError] = useState('');

  const [pedido, setPedido] = useState<PedidoApi | null>(null);
  const [pedidoLoading, setPedidoLoading] = useState(false);
  const [pedidoError, setPedidoError] = useState('');

  const [pagamento, setPagamento] = useState<PagamentoApi | null>(null);
  const [pagamentoLoading, setPagamentoLoading] = useState(false);
  const [pagamentoError, setPagamentoError] = useState('');
  const [copiado, setCopiado] = useState(false);

  const hasPhysical = items.some((i) => i.format !== 'E-book');
  const freteSelecionado = freteOpcoes?.find((o) => o.tipo === delivery)?.valor ?? 0;
  const frete = (delivery === 'padrao' || delivery === 'expressa') ? freteSelecionado : 0;
  const total = totalPrice + frete;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // Preço já é confirmado pela editora e exibido com impostos inclusos no preço,
  // conforme padrão do varejo brasileiro (sem linha de "imposto" separada no checkout).
  const subtotalExibido = pedido ? parseFloat(pedido.subtotal) : totalPrice;
  const freteExibido = pedido ? parseFloat(pedido.frete_valor) : frete;
  const totalExibido = pedido ? parseFloat(pedido.total) : total;

  useEffect(() => {
    if (payment !== 'pix' || !pagamento || step !== 'revisao') return;
    if (['approved', 'rejected', 'cancelled'].includes(pagamento.status)) return;

    const intervalo = setInterval(async () => {
      try {
        const status = await apiFetch<PagamentoStatusApi>(`/pagamentos/${pagamento.id}/status`);
        setPagamento((p) => (p ? { ...p, status: status.status, status_detail: status.status_detail } : p));
        if (status.status === 'approved') {
          setStep('confirmacao');
        }
      } catch {
        // erro passageiro de rede durante o polling: tenta de novo no próximo ciclo
      }
    }, 3000);

    return () => clearInterval(intervalo);
  }, [payment, pagamento, step]);

  if (authLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/minha-conta" replace />;
  }

  function validateDados(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    if (!form.email.includes('@')) errs.email = 'Email inválido';
    if (!form.cpf.trim()) errs.cpf = 'CPF obrigatório';
    if (hasPhysical && !form.cep.trim()) errs.cep = 'CEP obrigatório';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function nextStep() {
    if (step === 'dados') {
      if (!validateDados()) return;

      if (hasPhysical) {
        setFreteLoading(true);
        setFreteError('');
        try {
          const resposta = await apiFetch<FreteResposta>('/frete/calcular', {
            method: 'POST',
            body: JSON.stringify({
              cep: form.cep,
              itens: items.map((i) => ({ livro_id: i.book.id, formato: i.format, quantidade: i.quantity })),
            }),
          });
          setFreteOpcoes(resposta.opcoes);
          setForm((f) => ({ ...f, city: resposta.cidade, state: resposta.uf }));
          if (delivery !== 'padrao' && delivery !== 'expressa') {
            setDelivery('padrao');
          }
        } catch (err) {
          setFreteError(err instanceof ApiError ? err.message : 'Não foi possível calcular o frete.');
          return;
        } finally {
          setFreteLoading(false);
        }
      } else {
        setDelivery('download');
      }
    }

    if (step === 'pagamento' && !pedido) {
      setPedidoLoading(true);
      setPedidoError('');
      try {
        const criado = await apiFetch<PedidoApi>('/pedidos', {
          method: 'POST',
          body: JSON.stringify({
            itens: items.map((i) => ({ livro_id: i.book.id, formato: i.format, quantidade: i.quantity })),
            metodo_entrega: delivery,
            cep: hasPhysical && (delivery === 'padrao' || delivery === 'expressa') ? form.cep : undefined,
            logradouro: form.street,
            numero: form.number,
            complemento: form.complement,
            nome: form.name,
            cpf: form.cpf,
            telefone: form.phone,
          }),
        });
        setPedido(criado);
      } catch (err) {
        setPedidoError(err instanceof ApiError ? err.message : 'Não foi possível criar o pedido.');
        return;
      } finally {
        setPedidoLoading(false);
      }
    }

    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }

  function prevStep() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  async function confirmarPagamento() {
    if (!pedido) return;
    setPagamentoError('');
    setPagamentoLoading(true);
    try {
      if (payment === 'pix') {
        const resultado = await apiFetch<PagamentoApi>('/pagamentos/pix', {
          method: 'POST',
          body: JSON.stringify({ pedido_id: pedido.id, email: form.email, cpf: form.cpf, nome_completo: form.name }),
        });
        setPagamento(resultado);
      } else {
        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não carregou. Verifique sua conexão e tente novamente.');
        }
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
        if (!publicKey) {
          throw new Error('VITE_MP_PUBLIC_KEY não configurada no .env do frontend.');
        }
        const mp = new window.MercadoPago(publicKey);
        const numeroLimpo = card.number.replace(/\s/g, '');
        const [mes, ano] = card.expiry.split('/');

        const metodos = await mp.getPaymentMethods({ bin: numeroLimpo.slice(0, 6) });
        const paymentMethodId = metodos.results[0]?.id;
        if (!paymentMethodId) {
          throw new Error('Não foi possível identificar a bandeira do cartão.');
        }

        const tokenResp = await mp.createCardToken({
          cardNumber: numeroLimpo,
          cardholderName: card.name,
          cardExpirationMonth: mes,
          cardExpirationYear: `20${ano}`,
          securityCode: card.cvv,
          identificationType: 'CPF',
          identificationNumber: form.cpf.replace(/\D/g, ''),
        });

        const resultado = await apiFetch<PagamentoApi>('/pagamentos/cartao', {
          method: 'POST',
          body: JSON.stringify({
            pedido_id: pedido.id,
            card_token: tokenResp.id,
            payment_method_id: paymentMethodId,
            installments: Number(card.installments),
            email: form.email,
            cpf: form.cpf,
          }),
        });
        setPagamento(resultado);

        if (resultado.status === 'approved') {
          clearCart();
          setStep('confirmacao');
        } else {
          setPagamentoError(mensagemRejeicao(resultado.status_detail));
        }
      }
    } catch (err) {
      setPagamentoError(err instanceof ApiError || err instanceof Error ? err.message : 'Falha ao processar pagamento.');
    } finally {
      setPagamentoLoading(false);
    }
  }

  function copiarPix() {
    if (!pagamento?.qr_code) return;
    navigator.clipboard.writeText(pagamento.qr_code).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function updateForm(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFormErrors((e) => ({ ...e, [field]: undefined }));
  }

  const inputStyle = (err?: string) => ({
    width: '100%',
    background: '#1a2540',
    border: `1px solid ${err ? '#ef4444' : '#1e2d4a'}`,
    borderRadius: '0.5rem',
    padding: '0.7rem 0.875rem',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    outline: 'none',
  });

  const labelStyle = { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.375rem', display: 'block' };

  if (step === 'confirmacao') {
    return (
      <div style={{ backgroundColor: '#070d1a', minHeight: '100vh' }} className="flex items-center justify-center px-4 py-16">
        <div
          style={{
            background: '#0f1829',
            border: '1px solid #1e2d4a',
            borderRadius: '1.5rem',
            padding: 'clamp(2rem, 5vw, 3rem)',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-6"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(16,185,129,0.4)',
            }}
          >
            <CheckCircle size={40} style={{ color: '#10b981' }} />
          </div>
          <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Pedido Realizado!
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Seu pedido <strong style={{ color: '#06b6d4' }}>#{pedido?.id}</strong> foi confirmado com sucesso.{' '}
            {items.some((i) => i.format === 'E-book')
              ? 'Seus e-books estarão disponíveis para download em breve na sua área do cliente.'
              : 'Seu pedido será processado e enviado em breve.'}
          </p>

          <div
            style={{
              background: '#0a1220',
              border: '1px solid #1e2d4a',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.5rem' }}>Resumo</div>
            <div className="flex justify-between" style={{ marginBottom: '0.35rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pedido</span>
              <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.875rem' }}>#{pedido?.id}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total pago</span>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>{formatPrice(totalExibido)}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              to="/minha-conta"
              style={{
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.3)',
                color: '#06b6d4',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Meus pedidos
            </Link>
            <Link
              to="/catalogo"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#000',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const opcoesEntrega = [
    ...(freteOpcoes ?? []).map((op) => ({
      key: op.tipo as DeliveryMethod,
      icon: op.tipo === 'expressa' ? <Zap size={20} /> : <Truck size={20} />,
      label: op.tipo === 'expressa' ? 'Entrega Expressa' : 'Entrega Padrão',
      desc: `Chega em ${op.prazoMinDias}-${op.prazoMaxDias} dias úteis`,
      price: op.gratis ? 'Grátis' : formatPrice(op.valor),
      available: true,
    })),
    {
      key: 'retirada' as DeliveryMethod,
      icon: <MapPin size={20} />,
      label: 'Retirada no local',
      desc: 'Retirada em nossa sede em São Paulo, SP',
      price: 'Grátis',
      available: hasPhysical,
    },
    {
      key: 'download' as DeliveryMethod,
      icon: <Download size={20} />,
      label: 'Download / Área restrita',
      desc: 'Acesso imediato após confirmação do pagamento',
      price: 'Grátis',
      available: items.some((i) => i.format === 'E-book'),
    },
  ].filter((opt) => opt.available);

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '2rem 0 4rem' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem', marginBottom: '2rem' }}>Checkout</h1>

        <div className="flex items-center gap-0 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center" style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: i < stepIndex
                      ? '#10b981'
                      : i === stepIndex
                      ? '#06b6d4'
                      : '#1a2540',
                    color: i <= stepIndex ? '#000' : '#64748b',
                    border: i === stepIndex ? '2px solid #06b6d4' : 'none',
                  }}
                >
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </div>
                <span
                  style={{
                    color: i === stepIndex ? '#06b6d4' : i < stepIndex ? '#10b981' : '#64748b',
                    fontSize: '0.825rem',
                    fontWeight: i === stepIndex ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: i < stepIndex ? '#10b981' : '#1e2d4a',
                    margin: '0 0.75rem',
                    minWidth: '32px',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.75rem' }}>
              {step === 'dados' && (
                <div className="flex flex-col gap-4">
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <User size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Dados do Comprador
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Nome completo *</label>
                      <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} style={inputStyle(formErrors.name)} placeholder="João da Silva" />
                      {formErrors.name && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.name}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>E-mail *</label>
                      <input value={form.email} onChange={(e) => updateForm('email', e.target.value)} style={inputStyle(formErrors.email)} placeholder="joao@email.com" type="email" />
                      {formErrors.email && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.email}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>CPF *</label>
                      <input value={form.cpf} onChange={(e) => updateForm('cpf', e.target.value)} style={inputStyle(formErrors.cpf)} placeholder="000.000.000-00" />
                      {formErrors.cpf && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.cpf}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>Telefone</label>
                      <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} style={inputStyle()} placeholder="(11) 99999-0000" type="tel" />
                    </div>
                  </div>

                  {hasPhysical && (
                    <>
                      <div style={{ borderTop: '1px solid #1e2d4a', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                        <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' }}>
                          <MapPin size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                          Endereço de Entrega
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label style={labelStyle}>CEP *</label>
                            <input value={form.cep} onChange={(e) => updateForm('cep', e.target.value)} style={inputStyle(formErrors.cep)} placeholder="00000-000" />
                            {formErrors.cep && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.cep}</div>}
                          </div>
                          <div className="sm:col-span-2">
                            <label style={labelStyle}>Rua</label>
                            <input value={form.street} onChange={(e) => updateForm('street', e.target.value)} style={inputStyle()} placeholder="Rua das Flores" />
                          </div>
                          <div>
                            <label style={labelStyle}>Número</label>
                            <input value={form.number} onChange={(e) => updateForm('number', e.target.value)} style={inputStyle()} placeholder="123" />
                          </div>
                          <div>
                            <label style={labelStyle}>Complemento</label>
                            <input value={form.complement} onChange={(e) => updateForm('complement', e.target.value)} style={inputStyle()} placeholder="Apto 4B" />
                          </div>
                        </div>
                        {freteError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.75rem' }}>{freteError}</div>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 'entrega' && (
                <div className="flex flex-col gap-4">
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <Truck size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Método de Entrega
                  </h2>
                  {form.city && (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '-0.75rem' }}>
                      Entregando para {form.city}, {form.state}
                    </p>
                  )}
                  {opcoesEntrega.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDelivery(opt.key)}
                        style={{
                          background: delivery === opt.key ? 'rgba(6,182,212,0.1)' : '#0a1220',
                          border: `2px solid ${delivery === opt.key ? '#06b6d4' : '#1e2d4a'}`,
                          borderRadius: '0.875rem',
                          padding: '1rem 1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div style={{ color: delivery === opt.key ? '#06b6d4' : '#64748b', flexShrink: 0 }}>{opt.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>{opt.desc}</div>
                        </div>
                        <div style={{ color: delivery === opt.key ? '#06b6d4' : '#10b981', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {opt.price}
                        </div>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${delivery === opt.key ? '#06b6d4' : '#1e2d4a'}`,
                            background: delivery === opt.key ? '#06b6d4' : 'transparent',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {delivery === opt.key && <Check size={12} color="#000" />}
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {step === 'pagamento' && (
                <div className="flex flex-col gap-5">
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <CreditCard size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Forma de Pagamento
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'credit' as PaymentMethod, icon: <CreditCard size={20} />, label: 'Cartão de Crédito' },
                      { key: 'pix' as PaymentMethod, icon: <Smartphone size={20} />, label: 'PIX' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setPayment(m.key)}
                        style={{
                          background: payment === m.key ? 'rgba(6,182,212,0.1)' : '#0a1220',
                          border: `2px solid ${payment === m.key ? '#06b6d4' : '#1e2d4a'}`,
                          borderRadius: '0.875rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ color: payment === m.key ? '#06b6d4' : '#64748b' }}>{m.icon}</div>
                        <span style={{ color: payment === m.key ? '#e2e8f0' : '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {payment === 'credit' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        {[
                          { name: 'VISA', color: '#1a1f71' },
                          { name: 'MASTER', color: '#eb001b' },
                          { name: 'ELO', color: '#f7b900' },
                        ].map((brand) => (
                          <div
                            key={brand.name}
                            style={{
                              background: '#1a2540',
                              border: '1px solid #1e2d4a',
                              borderRadius: '0.375rem',
                              padding: '0.3rem 0.75rem',
                              fontSize: '0.7rem',
                              color: '#fff',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                            }}
                          >
                            {brand.name}
                          </div>
                        ))}
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>aceitos</span>
                      </div>

                      <div>
                        <label style={labelStyle}>Número do cartão</label>
                        <input
                          value={card.number}
                          onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                          style={inputStyle()}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Nome no cartão</label>
                        <input
                          value={card.name}
                          onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                          style={inputStyle()}
                          placeholder="JOÃO DA SILVA"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label style={labelStyle}>Validade</label>
                          <input
                            value={card.expiry}
                            onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                            style={inputStyle()}
                            placeholder="MM/AA"
                            maxLength={5}
                          />
                        </div>
                        <div className="col-span-1">
                          <label style={labelStyle}>CVV</label>
                          <input
                            value={card.cvv}
                            onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                            style={inputStyle()}
                            placeholder="000"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                        <div className="col-span-1">
                          <label style={labelStyle}>Parcelas</label>
                          <select
                            value={card.installments}
                            onChange={(e) => setCard((c) => ({ ...c, installments: e.target.value }))}
                            style={{ ...inputStyle(), cursor: 'pointer' }}
                          >
                            {[1, 2, 3, 6, 12].map((n) => (
                              <option key={n} value={n}>
                                {n}× {formatPrice(total / n)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {payment === 'pix' && (
                    <div
                      style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '0.625rem',
                        padding: '1rem',
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        lineHeight: 1.6,
                      }}
                    >
                      O QR Code do PIX (com confirmação instantânea) será gerado na próxima etapa, ao confirmar o pedido.
                    </div>
                  )}
                </div>
              )}

              {step === 'revisao' && (
                <div className="flex flex-col gap-5">
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Revisar Pedido
                  </h2>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Itens ({items.length})
                    </div>
                    <div className="flex flex-col gap-3">
                      {items.map((item) => {
                        const price = item.format === 'E-book' ? (item.book.price.ebook ?? 0) : (item.book.price.physical ?? 0);
                        return (
                          <div key={`${item.book.id}-${item.format}`} className="flex items-center gap-3">
                            <div
                              style={{ width: '40px', height: '54px', borderRadius: '0.375rem', background: item.book.coverColor, overflow: 'hidden', flexShrink: 0 }}
                            >
                              <img src={item.book.cover} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }} className="truncate">{item.book.title}</div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.format} · Qtd: {item.quantity}</div>
                            </div>
                            <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                              {formatPrice(price * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { icon: <User size={16} />, label: 'Comprador', value: form.name },
                      { icon: <Truck size={16} />, label: 'Entrega', value: delivery === 'padrao' ? 'Entrega Padrão' : delivery === 'expressa' ? 'Entrega Expressa' : delivery === 'retirada' ? 'Retirada' : 'Download' },
                      { icon: <CreditCard size={16} />, label: 'Pagamento', value: payment === 'credit' ? 'Cartão de Crédito' : 'PIX' },
                    ].map((info) => (
                      <div key={info.label} style={{ background: '#0a1220', border: '1px solid #1e2d4a', borderRadius: '0.625rem', padding: '0.875rem' }}>
                        <div className="flex items-center gap-1.5" style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                          {info.icon} {info.label}
                        </div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>{info.value}</div>
                      </div>
                    ))}
                  </div>

                  {pagamentoError && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.625rem', padding: '0.875rem', color: '#ef4444', fontSize: '0.85rem' }}>
                      {pagamentoError}
                    </div>
                  )}

                  {payment === 'pix' && pagamento && (
                    <div className="flex flex-col items-center gap-4">
                      {pagamento.qr_code_base64 && (
                        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={`data:image/png;base64,${pagamento.qr_code_base64}`} alt="QR Code PIX" width={200} height={200} />
                        </div>
                      )}
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                          Pague {formatPrice(totalExibido)} via PIX
                        </div>
                        {pagamento.qr_code && (
                          <div className="flex items-center gap-2 justify-center" style={{ maxWidth: '100%' }}>
                            <code style={{ color: '#06b6d4', fontSize: '0.75rem', wordBreak: 'break-all', flex: 1, textAlign: 'left' }}>
                              {pagamento.qr_code}
                            </code>
                            <button
                              onClick={copiarPix}
                              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer', flexShrink: 0 }}
                              title="Copiar código PIX"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                        {copiado && <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.4rem' }}>Copiado!</div>}
                      </div>
                      <div
                        className="flex items-center gap-2"
                        style={{
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: '0.625rem',
                          padding: '0.75rem 1rem',
                          color: '#f59e0b',
                          fontSize: '0.82rem',
                        }}
                      >
                        <Clock size={14} /> Aguardando confirmação do pagamento...
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #1e2d4a' }}>
                <button
                  onClick={prevStep}
                  style={{
                    background: 'none',
                    border: '1px solid #1e2d4a',
                    color: '#94a3b8',
                    borderRadius: '0.625rem',
                    padding: '0.7rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Voltar
                </button>
                {step !== 'revisao' ? (
                  <button
                    onClick={nextStep}
                    disabled={freteLoading || pedidoLoading}
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      color: '#000',
                      fontWeight: 700,
                      borderRadius: '0.625rem',
                      padding: '0.7rem 1.5rem',
                      border: 'none',
                      cursor: freteLoading || pedidoLoading ? 'default' : 'pointer',
                      opacity: freteLoading || pedidoLoading ? 0.7 : 1,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {freteLoading ? 'Calculando frete...' : pedidoLoading ? 'Criando pedido...' : (<>Continuar <ChevronRight size={16} /></>)}
                  </button>
                ) : pedidoError ? (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{pedidoError}</div>
                ) : payment === 'pix' && pagamento ? (
                  <div style={{ color: '#f59e0b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Aguardando pagamento
                  </div>
                ) : (
                  <button
                    onClick={confirmarPagamento}
                    disabled={pagamentoLoading}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: '0.625rem',
                      padding: '0.7rem 1.5rem',
                      border: 'none',
                      cursor: pagamentoLoading ? 'default' : 'pointer',
                      opacity: pagamentoLoading ? 0.7 : 1,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {pagamentoLoading ? 'Processando...' : (<><Check size={16} /> Confirmar Pedido</>)}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.25rem', position: 'sticky', top: '5rem' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
                Resumo
              </div>
              {items.map((item) => {
                const price = item.format === 'E-book' ? (item.book.price.ebook ?? 0) : (item.book.price.physical ?? 0);
                return (
                  <div key={`${item.book.id}-${item.format}`} className="flex justify-between gap-2 mb-2">
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', flex: 1 }} className="truncate">
                      {item.book.title} × {item.quantity}
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.8rem', flexShrink: 0 }}>{formatPrice(price * item.quantity)}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid #1e2d4a', margin: '0.875rem 0' }} />
              <div className="flex justify-between mb-2">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Subtotal</span>
                <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{formatPrice(subtotalExibido)}</span>
              </div>
              {freteExibido > 0 && (
                <div className="flex justify-between mb-2">
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Frete</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{formatPrice(freteExibido)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #1e2d4a', margin: '0.875rem 0' }} />
              <div className="flex justify-between">
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>Total</span>
                <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.1rem' }}>{formatPrice(totalExibido)}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
                Impostos inclusos no preço, conforme padrão do varejo brasileiro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
