import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Undo2 } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { formatPrice } from '../../data/catalog';
import { PedidoApi } from '../../types/pedido';
import { Dropdown } from '../common/Dropdown';
import { Aviso, Botao, Card, CardHeader, cores, estiloInput, Etiqueta, Tabela, Td, Vazio } from './ui';

/** Rótulo e cor de cada status do backend (pedidos.status). */
export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: string }> = {
  aguardando_pagamento: { rotulo: 'Aguardando pagamento', cor: '#f59e0b' },
  pago: { rotulo: 'Pago', cor: '#10b981' },
  processando: { rotulo: 'Processando', cor: '#06b6d4' },
  enviado: { rotulo: 'Enviado', cor: '#8b5cf6' },
  entregue: { rotulo: 'Entregue', cor: '#22c55e' },
  cancelado: { rotulo: 'Cancelado', cor: '#ef4444' },
};

interface PedidoGerencia extends PedidoApi {
  cliente_nome: string;
  cliente_email: string;
}

export function PedidosPanel({ podeExcluir = false, podeEstornar = false }: {
  podeExcluir?: boolean;
  podeEstornar?: boolean;
}) {
  const [pedidos, setPedidos] = useState<PedidoGerencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus) params.set('status', filtroStatus);
      if (busca.trim()) params.set('busca', busca.trim());
      const query = params.toString();

      const res = await apiFetch<{ pedidos: PedidoGerencia[] }>(`/gerencia/pedidos${query ? `?${query}` : ''}`);
      setPedidos(res.pedidos);
      setErro('');
    } catch {
      setErro('Não foi possível carregar os pedidos.');
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, busca]);

  useEffect(() => {
    const t = setTimeout(() => { void carregar(); }, 250);
    return () => clearTimeout(t);
  }, [carregar]);

  async function mudarStatus(pedido: PedidoGerencia, status: string) {
    try {
      await apiFetch(`/gerencia/pedidos/${pedido.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSucesso(`Pedido #${pedido.id} agora está "${STATUS_PEDIDO[status]?.rotulo ?? status}".`);
      setErro('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao atualizar o status.');
    }
  }

  async function excluir(pedido: PedidoGerencia) {
    if (!confirm(`Excluir o pedido #${pedido.id} definitivamente?\n\nIsso apaga também os itens e o registro de pagamento. Não dá para desfazer.`)) return;
    try {
      await apiFetch(`/admin/pedidos/${pedido.id}`, { method: 'DELETE' });
      setSucesso(`Pedido #${pedido.id} excluído.`);
      setErro('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir o pedido.');
    }
  }

  async function estornar(pedido: PedidoGerencia) {
    if (!confirm(`Estornar o pedido #${pedido.id}?\n\nO valor é devolvido pelo Mercado Pago, o pedido é cancelado e os itens voltam ao estoque.`)) return;
    try {
      await apiFetch(`/admin/pedidos/${pedido.id}/estorno`, { method: 'POST' });
      setSucesso(`Pedido #${pedido.id} estornado e cancelado.`);
      setErro('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao estornar o pedido.');
    }
  }

  return (
    <Card>
      <CardHeader
        titulo="Pedidos"
        descricao={`${pedidos.length} pedido(s) - clique numa linha para ver itens e dados do cliente`}
        acao={
          <div className="flex items-center gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Cliente, e-mail ou nº"
              style={{ ...estiloInput, width: '190px' }}
            />
            <Dropdown
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={[
                { value: '', label: 'Todos os status' },
                ...Object.entries(STATUS_PEDIDO).map(([chave, { rotulo }]) => ({ value: chave, label: rotulo })),
              ]}
              style={{ width: '190px' }}
            />
          </div>
        }
      />

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}

      {carregando ? (
        <Vazio>Carregando pedidos...</Vazio>
      ) : pedidos.length === 0 ? (
        <Vazio>Nenhum pedido encontrado.</Vazio>
      ) : (
        <Tabela colunas={['Pedido', 'Cliente', 'Data', 'Total', 'Status', '']}>
          {pedidos.map((pedido) => {
            const aberto = expandido === pedido.id;
            const info = STATUS_PEDIDO[pedido.status] ?? { rotulo: pedido.status, cor: cores.textoFraco };

            return [
              <tr key={pedido.id} onClick={() => setExpandido(aberto ? null : pedido.id)} style={{ cursor: 'pointer' }}>
                <Td style={{ fontWeight: 600 }}>
                  <div className="flex items-center gap-1.5">
                    {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    #{pedido.id}
                  </div>
                </Td>
                <Td>
                  <div>{pedido.cliente_nome}</div>
                  <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>{pedido.cliente_email}</div>
                </Td>
                <Td style={{ color: cores.textoSuave, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(pedido.criado_em.replace(' ', 'T')).toLocaleDateString('pt-BR')}
                </Td>
                <Td style={{ fontWeight: 700, color: cores.primaria }}>{formatPrice(Number(pedido.total))}</Td>
                <Td><Etiqueta cor={info.cor}>{info.rotulo}</Etiqueta></Td>
                <Td>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      value={pedido.status}
                      onChange={(v) => void mudarStatus(pedido, v)}
                      options={Object.entries(STATUS_PEDIDO).map(([chave, { rotulo }]) => ({ value: chave, label: rotulo }))}
                      style={{ width: '175px' }}
                      buttonStyle={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                    />
                    {podeEstornar && (
                      <Botao variante="secundaria" onClick={() => void estornar(pedido)} title="Estornar pagamento" style={{ padding: '0.35rem 0.5rem' }}>
                        <Undo2 size={14} />
                      </Botao>
                    )}
                    {podeExcluir && (
                      <Botao variante="perigo" onClick={() => void excluir(pedido)} title="Excluir pedido" style={{ padding: '0.35rem 0.5rem' }}>
                        <Trash2 size={14} />
                      </Botao>
                    )}
                  </div>
                </Td>
              </tr>,

              aberto && (
                <tr key={`${pedido.id}-detalhe`}>
                  <td colSpan={6} style={{ background: 'rgba(6,182,212,0.04)', borderBottom: `1px solid ${cores.borda}`, padding: '1.1rem 1.25rem' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div style={{ color: cores.textoSuave, fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                          Itens
                        </div>
                        {pedido.itens.map((item) => (
                          <div key={`${item.livro_id}-${item.formato}`} className="flex items-center justify-between" style={{ padding: '0.3rem 0', fontSize: '0.83rem' }}>
                            <span style={{ color: '#e2e8f0' }}>
                              {item.quantidade}× {item.titulo_snapshot}
                              <span style={{ color: cores.textoFraco }}> ({item.formato})</span>
                            </span>
                            <span style={{ color: cores.textoSuave }}>{formatPrice(Number(item.preco_unitario) * item.quantidade)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${cores.borda}`, marginTop: '0.5rem', paddingTop: '0.5rem', fontSize: '0.83rem' }}>
                          <span style={{ color: cores.textoFraco }}>Frete</span>
                          <span style={{ color: cores.textoSuave }}>{formatPrice(Number(pedido.frete_valor))}</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: cores.textoSuave, fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                          Entrega e cliente
                        </div>
                        <div style={{ color: cores.textoSuave, fontSize: '0.83rem', lineHeight: 1.9 }}>
                          <div><span style={{ color: cores.textoFraco }}>Destinatário:</span> {pedido.nome_destinatario}</div>
                          <div><span style={{ color: cores.textoFraco }}>CPF:</span> {pedido.cpf}</div>
                          {pedido.telefone && <div><span style={{ color: cores.textoFraco }}>Telefone:</span> {pedido.telefone}</div>}
                          <div><span style={{ color: cores.textoFraco }}>Método:</span> {pedido.metodo_entrega}</div>
                          {pedido.cep && (
                            <div>
                              <span style={{ color: cores.textoFraco }}>Endereço:</span>{' '}
                              {pedido.logradouro}, {pedido.numero}
                              {pedido.complemento ? ` - ${pedido.complemento}` : ''} - {pedido.cidade}/{pedido.uf}, CEP {pedido.cep}
                            </div>
                          )}
                          {pedido.codigo_rastreio && (
                            <div><span style={{ color: cores.textoFraco }}>Rastreio:</span> {pedido.codigo_rastreio}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ),
            ];
          })}
        </Tabela>
      )}
    </Card>
  );
}
