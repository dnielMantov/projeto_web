import { ReactNode, useState } from 'react';
import { cores } from './ui';

export interface ItemMenu {
  chave: string;
  rotulo: string;
  icone: ReactNode;
  descricao: string;
}

function ItemMenuBotao({ item, selecionado, onSelecionar }: {
  item: ItemMenu;
  selecionado: boolean;
  onSelecionar: (chave: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onSelecionar(item.chave)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-2.5 shrink-0"
      style={{
        background: selecionado ? 'rgba(6,182,212,0.12)' : hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: `1px solid ${selecionado ? 'rgba(6,182,212,0.3)' : 'transparent'}`,
        color: selecionado ? cores.primaria : hover ? cores.texto : cores.textoSuave,
        borderRadius: '0.7rem',
        padding: '0.65rem 0.9rem',
        fontSize: '0.875rem',
        fontWeight: selecionado ? 600 : 500,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        whiteSpace: 'nowrap',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {item.icone}
      {item.rotulo}
    </button>
  );
}

/**
 * Casca dos painéis: cabeçalho + menu lateral claro (exigência de "painel
 * amigável com menus claros" do enunciado). Gerente e Admin usam a mesma.
 */
export function PainelLayout({
  titulo, subtitulo, icone, corIcone, menu, ativo, onSelecionar, children,
}: {
  titulo: string;
  subtitulo: string;
  icone: ReactNode;
  corIcone: string;
  menu: ItemMenu[];
  ativo: string;
  onSelecionar: (chave: string) => void;
  children: ReactNode;
}) {
  const itemAtivo = menu.find((m) => m.chave === ativo);

  return (
    <div style={{ backgroundColor: cores.fundo, minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: '44px', height: '44px', background: `${corIcone}1f`, color: corIcone }}
          >
            {icone}
          </div>
          <div>
            <h1 style={{ color: cores.texto, fontWeight: 800, fontSize: '1.5rem' }}>{titulo}</h1>
            <p style={{ color: cores.textoFraco, fontSize: '0.875rem' }}>{subtitulo}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {menu.map((item) => (
                <ItemMenuBotao
                  key={item.chave}
                  item={item}
                  selecionado={item.chave === ativo}
                  onSelecionar={onSelecionar}
                />
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {itemAtivo && (
              <p style={{ color: cores.textoFraco, fontSize: '0.85rem', marginBottom: '1rem' }}>
                {itemAtivo.descricao}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
