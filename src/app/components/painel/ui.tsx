import { CSSProperties, ReactNode, useState } from 'react';

// Primitivos do painel. Existem para os painéis não repetirem a mesma parede
// de estilos inline; a paleta é a mesma do resto do site.
export const cores = {
  fundo: '#070d1a',
  superficie: '#0f1829',
  superficieAlta: '#1a2540',
  borda: '#1e2d4a',
  texto: '#f1f5f9',
  textoSuave: '#94a3b8',
  textoFraco: '#64748b',
  primaria: '#06b6d4',
  perigo: '#ef4444',
  sucesso: '#10b981',
  alerta: '#f59e0b',
} as const;

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: cores.superficie,
        border: `1px solid ${cores.borda}`,
        borderRadius: '1rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between flex-wrap gap-3"
      style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${cores.borda}` }}
    >
      <div>
        <h2 style={{ color: cores.texto, fontWeight: 700, fontSize: '1rem' }}>{titulo}</h2>
        {descricao && (
          <p style={{ color: cores.textoFraco, fontSize: '0.8rem', marginTop: '0.2rem' }}>{descricao}</p>
        )}
      </div>
      {acao}
    </div>
  );
}

type Variante = 'primaria' | 'secundaria' | 'perigo';

const estilosBotao: Record<Variante, CSSProperties> = {
  primaria: { background: cores.primaria, color: '#000', border: 'none' },
  secundaria: { background: cores.superficieAlta, color: cores.textoSuave, border: `1px solid ${cores.borda}` },
  perigo: { background: 'rgba(239,68,68,0.12)', color: cores.perigo, border: '1px solid rgba(239,68,68,0.3)' },
};

// Hover por variante: mesmo padrão do resto do site (realce sutil, sem mudar
// o layout). Como todo botão do dashboard passa por este componente, um
// único lugar cobre a exigência de hover em "todos os botões do dashboard".
const hoverBotao: Record<Variante, CSSProperties> = {
  primaria: { filter: 'brightness(1.12)' },
  secundaria: { background: cores.borda, color: '#e2e8f0' },
  perigo: { background: 'rgba(239,68,68,0.22)' },
};

export function Botao({
  children, onClick, variante = 'primaria', type = 'button', disabled, style, title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: Variante;
  type?: 'button' | 'submit';
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex items-center justify-center gap-1.5"
      style={{
        borderRadius: '0.6rem',
        padding: '0.5rem 0.9rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'opacity 0.15s, filter 0.15s, background 0.15s, color 0.15s',
        ...estilosBotao[variante],
        ...(hover && !disabled ? hoverBotao[variante] : null),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Campo({
  label, children, dica, span,
}: { label: string; children: ReactNode; dica?: string; span?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: span ? '1 / -1' : undefined }}>
      <span style={{ color: cores.textoSuave, fontSize: '0.78rem', fontWeight: 600 }}>{label}</span>
      {children}
      {dica && <span style={{ color: cores.textoFraco, fontSize: '0.7rem' }}>{dica}</span>}
    </label>
  );
}

export const estiloInput: CSSProperties = {
  background: cores.superficieAlta,
  border: `1px solid ${cores.borda}`,
  borderRadius: '0.6rem',
  padding: '0.55rem 0.75rem',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
};

export function Tabela({ colunas, children }: { colunas: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '640px' }}>
        <thead>
          <tr>
            {colunas.map((c, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  padding: '0.7rem 1.25rem',
                  color: cores.textoFraco,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${cores.borda}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <td
      style={{
        padding: '0.7rem 1.25rem',
        color: '#e2e8f0',
        fontSize: '0.85rem',
        borderBottom: `1px solid ${cores.borda}`,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function Etiqueta({ children, cor }: { children: ReactNode; cor: string }) {
  return (
    <span
      style={{
        background: `${cor}18`,
        color: cor,
        border: `1px solid ${cor}40`,
        borderRadius: '2rem',
        padding: '0.15rem 0.6rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso'; children: ReactNode }) {
  const cor = tipo === 'erro' ? cores.perigo : cores.sucesso;
  return (
    <div
      style={{
        background: `${cor}12`,
        border: `1px solid ${cor}35`,
        color: cor,
        borderRadius: '0.6rem',
        padding: '0.7rem 0.9rem',
        fontSize: '0.83rem',
        margin: '1rem 1.5rem 0',
      }}
    >
      {children}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div style={{ color: cores.textoFraco, textAlign: 'center', padding: '2.5rem 1rem', fontSize: '0.88rem' }}>
      {children}
    </div>
  );
}

/** Painel modal simples, usado pelos formulários de produto e categoria. */
export function Modal({ titulo, aberto, onFechar, children, largura = '820px' }: {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
}) {
  if (!aberto) return null;

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,7,15,0.75)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '3rem 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cores.superficie,
          border: `1px solid ${cores.borda}`,
          borderRadius: '1rem',
          width: '100%',
          maxWidth: largura,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: '1.1rem 1.5rem', borderBottom: `1px solid ${cores.borda}` }}
        >
          <h3 style={{ color: cores.texto, fontWeight: 700, fontSize: '1rem' }}>{titulo}</h3>
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', color: cores.textoFraco, cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
