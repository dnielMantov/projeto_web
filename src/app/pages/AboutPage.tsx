import { Link } from 'react-router';
import { BookOpen, Cpu, Shield, Zap, Lock, Code, Award, Users, Globe, Target, ChevronRight, Sparkles } from 'lucide-react';

const values = [
  {
    icon: <Target size={22} />,
    title: 'Precisão Técnica',
    desc: 'Cada publicação passa por rigorosa revisão técnica com especialistas da área antes de chegar ao leitor.',
    color: '#06b6d4',
  },
  {
    icon: <Users size={22} />,
    title: 'Comunidade',
    desc: 'Construímos uma comunidade de profissionais que compartilham conhecimento e se apoiam mutuamente.',
    color: '#8b5cf6',
  },
  {
    icon: <Globe size={22} />,
    title: 'Acesso Democrático',
    desc: 'E-books acessíveis democratizam o aprendizado. Acreditamos que o conhecimento deve ser para todos.',
    color: '#10b981',
  },
  {
    icon: <Award size={22} />,
    title: 'Excelência',
    desc: 'Não publicamos qualquer coisa. Cada título representa o estado da arte em sua respectiva área.',
    color: '#f59e0b',
  },
];

const categories = [
  { icon: <Cpu size={20} />, name: 'Inteligência Artificial', color: '#0ea5e9' },
  { icon: <Zap size={20} />, name: 'Blockchain', color: '#8b5cf6' },
  { icon: <Shield size={20} />, name: 'Cibersegurança', color: '#ef4444' },
  { icon: <Lock size={20} />, name: 'Criptografia', color: '#f59e0b' },
  { icon: <Code size={20} />, name: 'Arquitetura de Software', color: '#10b981' },
  { icon: <Sparkles size={20} />, name: 'Dentre outros', color: '#94a3b8' },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh' }}>
      <section
        className="relative overflow-hidden"
        style={{ padding: 'clamp(4rem, 8vw, 7rem) 0', borderBottom: '1px solid #1e2d4a' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(6,182,212,0.08) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div
                style={{ width: '48px', height: '48px', borderRadius: '0.875rem', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <BookOpen size={24} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>COMPIA Editora</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Fundada em 2019 · São Paulo, Brasil
                </div>
              </div>
            </div>
            <h1
              style={{
                color: '#f1f5f9',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                letterSpacing: '-0.03em',
              }}
            >
              A editora que publica o{' '}
              <span style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                futuro da tecnologia
              </span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.8 }}>
              A COMPIA Editora nasceu da necessidade de materiais bibliográficos em português com rigor técnico e relevância prática
              nas áreas de Inteligência Artificial, Blockchain, Cibersegurança, Criptografia e Arquitetura de Software.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 0', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                Nossa Missão
              </div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
                Democratizar o conhecimento técnico de ponta
              </h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Vivemos em uma era de transformações tecnológicas sem precedentes. A Inteligência Artificial redefine indústrias,
                o blockchain redesenha o sistema financeiro, e as ameaças cibernéticas crescem em escala e sofisticação.
              </p>
              <p style={{ color: '#94a3b8', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1.75rem' }}>
                Nossa missão é produzir materiais didáticos que tornam esse conhecimento acessível a desenvolvedores,
                pesquisadores e profissionais de TI em todo o Brasil, escritos por quem está na linha de frente dessas tecnologias.
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(({ icon, name, color }) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      color,
                      borderRadius: '2rem',
                      padding: '0.35rem 0.875rem',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {icon} {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '2019', label: 'Ano de fundação' },
                { value: '20+', label: 'Títulos publicados' },
                { value: '12', label: 'Autores especialistas' },
                { value: '8.400+', label: 'Leitores ativos' },
                { value: '5', label: 'Áreas especializadas' },
                { value: '4.8★', label: 'Avaliação média' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: '#0f1829',
                    border: '1px solid #1e2d4a',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#06b6d4', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.35rem' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 0', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Nossos Valores
            </div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '2rem' }}>O que nos guia</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                style={{
                  background: '#0f1829',
                  border: '1px solid #1e2d4a',
                  borderRadius: '1rem',
                  padding: '1.75rem',
                }}
              >
                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.75rem',
                    background: `${v.color}15`,
                    color: v.color,
                  }}
                >
                  {v.icon}
                </div>
                <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: '0.625rem' }}>
                  {v.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            style={{
              background: '#0f1829',
              border: '1px solid #1e2d4a',
              borderRadius: '1.5rem',
              padding: 'clamp(2rem, 5vw, 3.5rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
            }}
          >
            <div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem' }}>
                Entre em contato
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'E-mail', value: 'contato@compia.com.br' },
                  { label: 'Comercial / Parcerias', value: 'parcerias@compia.com.br' },
                  { label: 'Endereço', value: 'Av. Paulista, 1374, São Paulo, SP · 01310-100' },
                  { label: 'CNPJ', value: '12.345.678/0001-90' },
                ].map((info) => (
                  <div key={info.label}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{info.label}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>{info.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Interessado em publicar pela COMPIA, firmar parceria ou fazer uma encomenda corporativa de livros? Entre em contato com nossa equipe comercial.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contato"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: '#000',
                    fontWeight: 700,
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1.75rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  Contato <ChevronRight size={16} />
                </Link>
                <Link
                  to="/catalogo"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #1e2d4a',
                    color: '#e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1.5rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  Ver catálogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
