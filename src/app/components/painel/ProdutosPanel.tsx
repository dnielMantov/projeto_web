import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, PackageSearch, ChevronDown } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { formatPrice, Format } from '../../data/catalog';
import { CategoriaApi, LivroApi } from '../../types/livro';
import { useCatalog } from '../../context/CatalogContext';
import { Dropdown } from '../common/Dropdown';
import {
  Aviso, Botao, Campo, Card, CardHeader, cores, estiloInput, Etiqueta, Modal, Tabela, Td, Vazio,
} from './ui';

const FORMATOS: Format[] = ['Físico', 'E-book', 'Kit'];

type ColunaOrdenavel = 'titulo' | 'categoria_nome' | 'formatos' | 'preco' | 'estoque' | 'ativo';

/** Cabeçalho clicável com seta que gira - mesma animação usada no Dropdown. */
function CabecalhoOrdenavel({ label, coluna, ativo, asc, onClick }: {
  label: string;
  coluna: ColunaOrdenavel;
  ativo: ColunaOrdenavel | null;
  asc: boolean;
  onClick: (coluna: ColunaOrdenavel) => void;
}) {
  const selecionado = ativo === coluna;
  return (
    <button
      onClick={() => onClick(coluna)}
      className="flex items-center gap-1"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        font: 'inherit',
        textTransform: 'inherit',
        letterSpacing: 'inherit',
        color: selecionado ? cores.primaria : 'inherit',
      }}
    >
      {label}
      <ChevronDown
        size={12}
        style={{
          opacity: selecionado ? 1 : 0.4,
          transform: selecionado && asc ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease, opacity 0.15s',
        }}
      />
    </button>
  );
}

interface Formulario {
  id: string;
  titulo: string;
  autor: string;
  categoria_id: string;
  descricao: string;
  formatos: Format[];
  preco_fisico: string;
  preco_ebook: string;
  peso_gramas: string;
  capa_url: string;
  cor_capa: string;
  estoque: string;
  paginas: string;
  publicado_em: string;
  destaque: boolean;
  mais_vendido: boolean;
  lancamento: boolean;
  ativo: boolean;
}

const FORM_VAZIO: Formulario = {
  id: '', titulo: '', autor: '', categoria_id: '', descricao: '', formatos: ['Físico'],
  preco_fisico: '', preco_ebook: '', peso_gramas: '500', capa_url: '', cor_capa: '#0369a1',
  estoque: '0', paginas: '', publicado_em: '',
  destaque: false, mais_vendido: false, lancamento: false, ativo: true,
};

function paraFormulario(livro: LivroApi): Formulario {
  return {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    categoria_id: livro.categoria_id ? String(livro.categoria_id) : '',
    descricao: livro.descricao ?? '',
    formatos: livro.formatos.split(',').filter(Boolean) as Format[],
    preco_fisico: livro.preco_fisico != null ? String(livro.preco_fisico) : '',
    preco_ebook: livro.preco_ebook != null ? String(livro.preco_ebook) : '',
    peso_gramas: String(livro.peso_gramas),
    capa_url: livro.capa_url ?? '',
    cor_capa: livro.cor_capa,
    estoque: String(livro.estoque),
    paginas: livro.paginas != null ? String(livro.paginas) : '',
    publicado_em: livro.publicado_em ?? '',
    destaque: livro.destaque,
    mais_vendido: livro.mais_vendido,
    lancamento: livro.lancamento,
    ativo: livro.ativo,
  };
}

export function ProdutosPanel() {
  const { reload: recarregarVitrine } = useCatalog();
  const [livros, setLivros] = useState<LivroApi[]>([]);
  const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [sortColuna, setSortColuna] = useState<ColunaOrdenavel | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  function alternarOrdenacao(coluna: ColunaOrdenavel) {
    if (sortColuna === coluna) {
      setSortAsc((a) => !a);
    } else {
      setSortColuna(coluna);
      setSortAsc(true);
    }
  }

  function valorOrdenavel(l: LivroApi, coluna: ColunaOrdenavel): string | number {
    switch (coluna) {
      case 'titulo': return l.titulo.toLowerCase();
      case 'categoria_nome': return (l.categoria_nome ?? '').toLowerCase();
      case 'formatos': return l.formatos.toLowerCase();
      case 'preco': return l.preco_fisico ?? l.preco_ebook ?? 0;
      case 'estoque': return l.estoque;
      case 'ativo': return l.ativo ? 1 : 0;
    }
  }

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [resLivros, resCategorias] = await Promise.all([
        apiFetch<{ livros: LivroApi[] }>('/gerencia/livros'),
        apiFetch<{ categorias: CategoriaApi[] }>('/categorias'),
      ]);
      setLivros(resLivros.livros);
      setCategorias(resCategorias.categorias);
      setErro('');
    } catch {
      setErro('Não foi possível carregar os produtos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setErroForm('');
    setModalAberto(true);
  }

  function abrirEdicao(livro: LivroApi) {
    setForm(paraFormulario(livro));
    setEditandoId(livro.id);
    setErroForm('');
    setModalAberto(true);
  }

  function alterar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alternarFormato(formato: Format) {
    setForm((f) => ({
      ...f,
      formatos: f.formatos.includes(formato)
        ? f.formatos.filter((x) => x !== formato)
        : [...f.formatos, formato],
    }));
  }

  async function salvar() {
    setSalvando(true);
    setErroForm('');

    const corpo = {
      titulo: form.titulo,
      autor: form.autor,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      descricao: form.descricao,
      formatos: form.formatos,
      preco_fisico: form.preco_fisico === '' ? null : Number(form.preco_fisico),
      preco_ebook: form.preco_ebook === '' ? null : Number(form.preco_ebook),
      peso_gramas: Number(form.peso_gramas || 0),
      capa_url: form.capa_url,
      cor_capa: form.cor_capa,
      estoque: Number(form.estoque || 0),
      paginas: form.paginas === '' ? null : Number(form.paginas),
      publicado_em: form.publicado_em,
      destaque: form.destaque,
      mais_vendido: form.mais_vendido,
      lancamento: form.lancamento,
      ativo: form.ativo,
      ...(editandoId ? {} : form.id ? { id: form.id } : {}),
    };

    try {
      if (editandoId) {
        await apiFetch(`/gerencia/livros/${editandoId}`, { method: 'PUT', body: JSON.stringify(corpo) });
        setSucesso(`"${form.titulo}" foi atualizado.`);
      } else {
        await apiFetch('/gerencia/livros', { method: 'POST', body: JSON.stringify(corpo) });
        setSucesso(`"${form.titulo}" foi cadastrado e já está na loja.`);
      }
      setModalAberto(false);
      await carregar();
      // A vitrine tem sua própria cópia do catálogo em memória.
      await recarregarVitrine();
    } catch (e) {
      setErroForm(e instanceof ApiError ? e.message : 'Erro ao salvar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(livro: LivroApi) {
    if (!confirm(`Excluir "${livro.titulo}"?\n\nSe ele já tiver pedidos, será apenas desativado (sai da loja, mas o histórico de vendas é preservado).`)) {
      return;
    }

    try {
      const res = await apiFetch<{ modo: string; mensagem: string }>(`/gerencia/livros/${livro.id}`, { method: 'DELETE' });
      setSucesso(res.mensagem);
      await carregar();
      await recarregarVitrine();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir.');
    }
  }

  async function ajustarEstoque(livro: LivroApi, novo: number) {
    try {
      await apiFetch(`/gerencia/livros/${livro.id}/estoque`, {
        method: 'PATCH',
        body: JSON.stringify({ estoque: novo }),
      });
      await carregar();
      await recarregarVitrine();
    } catch {
      setErro('Erro ao atualizar o estoque.');
    }
  }

  const filtrados = livros
    .filter((l) => {
      const termo = busca.toLowerCase();
      return !termo || l.titulo.toLowerCase().includes(termo) || l.autor.toLowerCase().includes(termo) || l.id.includes(termo);
    })
    .sort((a, b) => {
      if (!sortColuna) return 0;
      const va = valorOrdenavel(a, sortColuna);
      const vb = valorOrdenavel(b, sortColuna);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number);
      return sortAsc ? cmp : -cmp;
    });

  return (
    <>
      <Card>
        <CardHeader
          titulo="Produtos"
          descricao={`${livros.length} no catálogo - livros, e-books e kits`}
          acao={
            <div className="flex items-center gap-2">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                style={{ ...estiloInput, width: '180px' }}
              />
              <Botao onClick={abrirNovo}><Plus size={15} /> Novo produto</Botao>
            </div>
          }
        />

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}

        {carregando ? (
          <Vazio>Carregando produtos...</Vazio>
        ) : filtrados.length === 0 ? (
          <Vazio>Nenhum produto encontrado.</Vazio>
        ) : (
          <Tabela colunas={[
            <CabecalhoOrdenavel label="Produto" coluna="titulo" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            <CabecalhoOrdenavel label="Categoria" coluna="categoria_nome" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            <CabecalhoOrdenavel label="Formatos" coluna="formatos" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            <CabecalhoOrdenavel label="Preço" coluna="preco" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            <CabecalhoOrdenavel label="Estoque" coluna="estoque" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            <CabecalhoOrdenavel label="Status" coluna="ativo" ativo={sortColuna} asc={sortAsc} onClick={alternarOrdenacao} />,
            '',
          ]}>
            {filtrados.map((livro) => (
              <tr key={livro.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="rounded shrink-0"
                      style={{ width: '32px', height: '44px', background: livro.cor_capa, overflow: 'hidden' }}
                    >
                      {livro.capa_url && (
                        <img src={livro.capa_url} alt="" loading="lazy" className="w-full h-full object-cover" style={{ opacity: 0.65 }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{livro.titulo}</div>
                      <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>
                        {livro.autor || 'Sem autor'} · {livro.id}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td style={{ color: cores.textoSuave }}>{livro.categoria_nome ?? '-'}</Td>
                <Td style={{ color: cores.textoSuave, fontSize: '0.78rem' }}>{livro.formatos}</Td>
                <Td>
                  {livro.preco_fisico != null && <div>{formatPrice(livro.preco_fisico)}</div>}
                  {livro.preco_ebook != null && (
                    <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>
                      e-book {formatPrice(livro.preco_ebook)}
                    </div>
                  )}
                </Td>
                <Td>
                  {livro.formatos === 'E-book' ? (
                    <span style={{ color: cores.textoFraco, fontSize: '0.78rem' }}>ilimitado</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      defaultValue={livro.estoque}
                      onBlur={(e) => {
                        const novo = Number(e.target.value);
                        if (novo !== livro.estoque) void ajustarEstoque(livro, novo);
                      }}
                      style={{
                        ...estiloInput,
                        width: '76px',
                        padding: '0.3rem 0.5rem',
                        color: livro.estoque === 0 ? cores.perigo : livro.estoque <= 5 ? cores.alerta : '#e2e8f0',
                      }}
                    />
                  )}
                </Td>
                <Td>
                  <Etiqueta cor={livro.ativo ? cores.sucesso : cores.textoFraco}>
                    {livro.ativo ? 'Na loja' : 'Inativo'}
                  </Etiqueta>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Botao variante="secundaria" onClick={() => abrirEdicao(livro)} title="Editar" style={{ padding: '0.4rem 0.55rem' }}>
                      <Pencil size={14} />
                    </Botao>
                    <Botao variante="perigo" onClick={() => void excluir(livro)} title="Excluir" style={{ padding: '0.4rem 0.55rem' }}>
                      <Trash2 size={14} />
                    </Botao>
                  </div>
                </Td>
              </tr>
            ))}
          </Tabela>
        )}
      </Card>

      <Modal
        titulo={editandoId ? 'Editar produto' : 'Novo produto'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {erroForm && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: cores.perigo, borderRadius: '0.6rem', padding: '0.7rem 0.9rem', fontSize: '0.83rem', marginBottom: '1rem' }}>
              {erroForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Campo label="Título *" span>
              <input value={form.titulo} onChange={(e) => alterar('titulo', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Autor">
              <input value={form.autor} onChange={(e) => alterar('autor', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Categoria">
              <Dropdown
                value={form.categoria_id}
                onChange={(v) => alterar('categoria_id', v)}
                options={[
                  { value: '', label: 'Sem categoria' },
                  ...categorias.map((c) => ({ value: String(c.id), label: c.nome })),
                ]}
                style={{ width: '100%' }}
              />
            </Campo>

            <Campo label="Descrição" span>
              <textarea
                value={form.descricao}
                onChange={(e) => alterar('descricao', e.target.value)}
                rows={3}
                style={{ ...estiloInput, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Campo>

            <Campo label="Formatos *" span dica="Físico e Kit usam o preço físico; e-book usa o preço de e-book.">
              <div className="flex gap-2 flex-wrap">
                {FORMATOS.map((f) => {
                  const ativo = form.formatos.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => alternarFormato(f)}
                      style={{
                        background: ativo ? 'rgba(6,182,212,0.15)' : cores.superficieAlta,
                        border: `1px solid ${ativo ? cores.primaria : cores.borda}`,
                        color: ativo ? cores.primaria : cores.textoSuave,
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontWeight: ativo ? 600 : 500,
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </Campo>

            <Campo label="Preço físico / kit (R$)">
              <input type="number" step="0.01" min="0" value={form.preco_fisico}
                onChange={(e) => alterar('preco_fisico', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Preço e-book (R$)">
              <input type="number" step="0.01" min="0" value={form.preco_ebook}
                onChange={(e) => alterar('preco_ebook', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Peso (gramas)" dica="Usado no cálculo do frete.">
              <input type="number" min="0" value={form.peso_gramas}
                onChange={(e) => alterar('peso_gramas', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Estoque">
              <input type="number" min="0" value={form.estoque}
                onChange={(e) => alterar('estoque', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="URL da capa" span dica="Endereço público de uma imagem (jpg/png/webp).">
              <input value={form.capa_url} onChange={(e) => alterar('capa_url', e.target.value)}
                placeholder="https://..." style={estiloInput} />
            </Campo>

            {(form.capa_url || form.cor_capa) && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  className="rounded-lg shrink-0"
                  style={{ width: '72px', height: '96px', background: form.cor_capa, overflow: 'hidden', border: `1px solid ${cores.borda}` }}
                >
                  {form.capa_url && (
                    <img
                      src={form.capa_url}
                      alt="Pré-visualização da capa"
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.7 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                      onLoad={(e) => { (e.target as HTMLImageElement).style.visibility = 'visible'; }}
                    />
                  )}
                </div>
                <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>
                  Pré-visualização. Se a imagem não aparecer, a URL está inacessível.
                </div>
              </div>
            )}

            <Campo label="Cor de fundo da capa">
              <input type="color" value={form.cor_capa} onChange={(e) => alterar('cor_capa', e.target.value)}
                style={{ ...estiloInput, height: '38px', padding: '0.2rem' }} />
            </Campo>

            <Campo label="Páginas">
              <input type="number" min="0" value={form.paginas}
                onChange={(e) => alterar('paginas', e.target.value)} style={estiloInput} />
            </Campo>

            <Campo label="Publicado em">
              <input value={form.publicado_em} onChange={(e) => alterar('publicado_em', e.target.value)}
                placeholder="2026-03-15" style={estiloInput} />
            </Campo>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {([
                ['destaque', 'Em destaque na home'],
                ['mais_vendido', 'Mais vendido'],
                ['lancamento', 'Lançamento'],
                ['ativo', 'Visível na loja'],
              ] as const).map(([campo, rotulo]) => (
                <label key={campo} className="flex items-center gap-2" style={{ color: cores.textoSuave, fontSize: '0.83rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form[campo]}
                    onChange={(e) => alterar(campo, e.target.checked)}
                    style={{ accentColor: cores.primaria, width: '15px', height: '15px' }}
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2" style={{ marginTop: '1.5rem' }}>
            <Botao variante="secundaria" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao onClick={() => void salvar()} disabled={salvando}>
              <PackageSearch size={15} /> {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar produto'}
            </Botao>
          </div>
        </div>
      </Modal>
    </>
  );
}
