import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { CategoriaApi } from '../../types/livro';
import { useCatalog } from '../../context/CatalogContext';
import {
  Aviso, Botao, Campo, Card, CardHeader, cores, estiloInput, Etiqueta, Modal, Tabela, Td, Vazio,
} from './ui';

interface FormCategoria {
  nome: string;
  descricao: string;
  cor: string;
  imagem_url: string;
}

const FORM_VAZIO: FormCategoria = { nome: '', descricao: '', cor: '#06b6d4', imagem_url: '' };

export function CategoriasPanel() {
  const { reload: recarregarVitrine } = useCatalog();
  const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormCategoria>(FORM_VAZIO);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(async () => {
    try {
      const resCategorias = await apiFetch<{ categorias: CategoriaApi[] }>('/categorias');
      setCategorias(resCategorias.categorias);
      setErro('');
    } catch {
      setErro('Não foi possível carregar as categorias.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function abrirNova() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setErroForm('');
    setModalAberto(true);
  }

  function abrirEdicao(c: CategoriaApi) {
    setForm({ nome: c.nome, descricao: c.descricao ?? '', cor: c.cor, imagem_url: c.imagem_url ?? '' });
    setEditandoId(c.id);
    setErroForm('');
    setModalAberto(true);
  }

  async function salvar() {
    setErroForm('');
    try {
      if (editandoId) {
        await apiFetch(`/gerencia/categorias/${editandoId}`, { method: 'PUT', body: JSON.stringify(form) });
        setSucesso(`Categoria "${form.nome}" atualizada.`);
      } else {
        await apiFetch('/gerencia/categorias', { method: 'POST', body: JSON.stringify(form) });
        setSucesso(`Categoria "${form.nome}" criada e já disponível nos filtros da loja.`);
      }
      setModalAberto(false);
      await carregar();
      await recarregarVitrine();
    } catch (e) {
      setErroForm(e instanceof ApiError ? e.message : 'Erro ao salvar a categoria.');
    }
  }

  async function excluirCategoria(c: CategoriaApi) {
    if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
    try {
      await apiFetch(`/gerencia/categorias/${c.id}`, { method: 'DELETE' });
      setSucesso(`Categoria "${c.nome}" excluída.`);
      setErro('');
      await carregar();
      await recarregarVitrine();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir a categoria.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          titulo="Categorias"
          descricao="Organizam o catálogo e viram filtros na loja"
          acao={<Botao onClick={abrirNova}><Plus size={15} /> Nova categoria</Botao>}
        />

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}

        {carregando ? (
          <Vazio>Carregando...</Vazio>
        ) : categorias.length === 0 ? (
          <Vazio>Nenhuma categoria cadastrada.</Vazio>
        ) : (
          <Tabela colunas={['Categoria', 'Descrição', 'Produtos', '']}>
            {categorias.map((c) => (
              <tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: c.cor, display: 'inline-block' }} />
                    <span style={{ fontWeight: 600 }}>{c.nome}</span>
                  </div>
                </Td>
                <Td style={{ color: cores.textoFraco, fontSize: '0.8rem' }}>{c.descricao || '-'}</Td>
                <Td>
                  <Etiqueta cor={c.total_livros ? cores.primaria : cores.textoFraco}>
                    {c.total_livros ?? 0}
                  </Etiqueta>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Botao variante="secundaria" onClick={() => abrirEdicao(c)} title="Editar" style={{ padding: '0.4rem 0.55rem' }}>
                      <Pencil size={14} />
                    </Botao>
                    <Botao variante="perigo" onClick={() => void excluirCategoria(c)} title="Excluir" style={{ padding: '0.4rem 0.55rem' }}>
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
        titulo={editandoId ? 'Editar categoria' : 'Nova categoria'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        largura="520px"
      >
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {erroForm && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: cores.perigo, borderRadius: '0.6rem', padding: '0.7rem 0.9rem', fontSize: '0.83rem', marginBottom: '1rem' }}>
              {erroForm}
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            <Campo label="Nome *">
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={estiloInput} />
            </Campo>
            <Campo label="Descrição">
              <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={estiloInput} />
            </Campo>
            <Campo label="Cor" dica="Usada nos cartões e filtros da loja.">
              <input type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })}
                style={{ ...estiloInput, height: '38px', padding: '0.2rem' }} />
            </Campo>
            <Campo label="URL da imagem">
              <input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                placeholder="https://..." style={estiloInput} />
            </Campo>
          </div>

          <div className="flex items-center justify-end gap-2" style={{ marginTop: '1.5rem' }}>
            <Botao variante="secundaria" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao onClick={() => void salvar()}>{editandoId ? 'Salvar' : 'Criar categoria'}</Botao>
          </div>
        </div>
      </Modal>
    </div>
  );
}
