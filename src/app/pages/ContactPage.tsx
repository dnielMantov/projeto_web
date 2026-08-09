import { FormEvent, useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle } from 'lucide-react';

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

const labelStyle = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '0.82rem',
  fontWeight: 500,
  marginBottom: '0.4rem',
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '4rem 0' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            Fale conosco
          </div>
          <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
            Contato
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.75, maxWidth: '640px' }}>
            Dúvidas sobre pedidos, parcerias comerciais ou sugestões de conteúdo? Envie uma mensagem para nossa equipe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.75rem' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    placeholder="voce@email.com"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Assunto</label>
                <input
                  required
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                  placeholder="Sobre o que você quer falar?"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Mensagem</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                  placeholder="Escreva sua mensagem..."
                />
              </div>

              {sent && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle size={16} /> Mensagem enviada! Retornaremos em breve.
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '0.75rem',
                  padding: '0.875rem 1.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Enviar mensagem <Send size={16} />
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { icon: <Mail size={18} />, label: 'E-mail', value: 'contato@compia.com.br' },
              { icon: <Phone size={18} />, label: 'Telefone', value: '(11) 4002-8922' },
              { icon: <MapPin size={18} />, label: 'Endereço', value: 'Av. Paulista, 1374, São Paulo, SP · 01310-100' },
            ].map((info) => (
              <div
                key={info.label}
                style={{ background: '#0f1829', border: '1px solid #1e2d4a', borderRadius: '1rem', padding: '1.25rem' }}
              >
                <div className="flex items-center gap-2" style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>
                  {info.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{info.label}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{info.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
