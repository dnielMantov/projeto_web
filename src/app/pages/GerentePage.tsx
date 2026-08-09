import { useEffect, useState } from 'react';
import { Boxes, ClipboardList, LayoutGrid, Store, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { PainelLayout, ItemMenu } from '../components/painel/PainelLayout';
import { ProdutosPanel } from '../components/painel/ProdutosPanel';
import { CategoriasPanel } from '../components/painel/CategoriasPanel';
import { PedidosPanel, STATUS_PEDIDO } from '../components/painel/PedidosPanel';
import { Card, cores } from '../components/painel/ui';

interface MetricasApi {
  pedidos_por_status: Record<string, number>;
  livros_ativos: number;
  estoque_total: number;
  estoque_baixo: { id: string; titulo: string; estoque: number }[];
}

const MENU: ItemMenu[] = [
  { chave: 'visao', rotulo: 'Visão geral', icone: <Store size={16} />, descricao: 'Situação da operação hoje.' },
  { chave: 'produtos', rotulo: 'Catálogo', icone: <Boxes size={16} />, descricao: 'Cadastre, edite e controle o estoque dos produtos. As mudanças aparecem na loja na hora.' },
  { chave: 'categorias', rotulo: 'Categorias', icone: <LayoutGrid size={16} />, descricao: 'Organize o catálogo. Categorias viram filtros na loja.' },
  { chave: 'pedidos', rotulo: 'Pedidos', icone: <ClipboardList size={16} />, descricao: 'Acompanhe os pedidos e atualize o status de envio.' },
];

export default function GerentePage() {
  const { user } = useAuth();
  const [aba, setAba] = useState('visao');
  const [metricas, setMetricas] = useState<MetricasApi | null>(null);

  useEffect(() => {
    apiFetch<MetricasApi>('/gerencia/metricas').then(setMetricas).catch(() => setMetricas(null));
  }, [aba]);

  return (
    <PainelLayout
      titulo="Painel do Gerente"
      subtitulo={`Olá, ${user?.name ?? 'gerente'}`}
      icone={<Store size={22} />}
      corIcone="#f59e0b"
      menu={MENU}
      ativo={aba}
      onSelecionar={setAba}
    >
      {aba === 'visao' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { rotulo: 'Produtos na loja', valor: metricas?.livros_ativos ?? '-', cor: cores.primaria },
              { rotulo: 'Estoque total', valor: metricas?.estoque_total ?? '-', cor: '#22c55e' },
              { rotulo: 'Aguardando pagamento', valor: metricas?.pedidos_por_status?.aguardando_pagamento ?? '-', cor: '#f59e0b' },
              { rotulo: 'A enviar (pagos)', valor: metricas?.pedidos_por_status?.pago ?? '-', cor: '#10b981' },
              { rotulo: 'Enviados', valor: metricas?.pedidos_por_status?.enviado ?? '-', cor: '#8b5cf6' },
            ].map((kpi) => (
              <Card key={kpi.rotulo} style={{ padding: '1.25rem' }}>
                <div style={{ color: kpi.cor, fontWeight: 800, fontSize: '1.75rem' }}>{kpi.valor}</div>
                <div style={{ color: cores.textoFraco, fontSize: '0.8rem', marginTop: '0.2rem' }}>{kpi.rotulo}</div>
              </Card>
            ))}
          </div>

          <Card>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${cores.borda}` }}>
              <h2 className="flex items-center gap-2" style={{ color: cores.texto, fontWeight: 700, fontSize: '1rem' }}>
                <AlertTriangle size={16} style={{ color: cores.alerta }} /> Estoque baixo
              </h2>
              <p style={{ color: cores.textoFraco, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Produtos físicos com 5 unidades ou menos.
              </p>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {!metricas ? (
                <div style={{ color: cores.textoFraco, padding: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>Carregando...</div>
              ) : metricas.estoque_baixo.length === 0 ? (
                <div style={{ color: cores.textoFraco, padding: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                  Nenhum produto com estoque baixo.
                </div>
              ) : (
                metricas.estoque_baixo.map((l) => (
                  <div key={l.id} className="flex items-center justify-between" style={{ padding: '0.6rem 1.5rem' }}>
                    <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{l.titulo}</span>
                    <span style={{ color: l.estoque === 0 ? cores.perigo : cores.alerta, fontWeight: 700, fontSize: '0.875rem' }}>
                      {l.estoque} un.
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${cores.borda}` }}>
              <h2 style={{ color: cores.texto, fontWeight: 700, fontSize: '1rem' }}>Pedidos por status</h2>
            </div>
            <div className="flex flex-wrap gap-3" style={{ padding: '1.25rem 1.5rem' }}>
              {Object.entries(STATUS_PEDIDO).map(([chave, { rotulo, cor }]) => (
                <div
                  key={chave}
                  style={{
                    background: `${cor}12`,
                    border: `1px solid ${cor}30`,
                    borderRadius: '0.7rem',
                    padding: '0.7rem 1rem',
                    minWidth: '130px',
                  }}
                >
                  <div style={{ color: cor, fontWeight: 800, fontSize: '1.3rem' }}>
                    {metricas?.pedidos_por_status?.[chave] ?? 0}
                  </div>
                  <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>{rotulo}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {aba === 'produtos' && <ProdutosPanel />}
      {aba === 'categorias' && <CategoriasPanel />}
      {aba === 'pedidos' && <PedidosPanel />}
    </PainelLayout>
  );
}
