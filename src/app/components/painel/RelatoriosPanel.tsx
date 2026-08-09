import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiFetch } from '../../lib/api';
import { formatPrice } from '../../data/catalog';
import { Card, CardHeader, cores, Vazio } from './ui';
import { STATUS_PEDIDO } from './PedidosPanel';

interface RelatorioApi {
  faturamento: number;
  pedidos_faturados: number;
  ticket_medio: number;
  clientes: number;
  estoque_total: number;
  pedidos_por_status: Record<string, number>;
  vendas_por_dia: { dia: string; pedidos: number; faturamento: number }[];
  top_livros: { livro_id: string; titulo: string; unidades: number; receita: number }[];
  por_categoria: { categoria: string; cor: string; unidades: number; receita: number }[];
}

const estiloTooltip = {
  background: cores.superficie,
  border: `1px solid ${cores.borda}`,
  borderRadius: '0.6rem',
  color: '#e2e8f0',
  fontSize: '0.8rem',
};

export function RelatoriosPanel() {
  const [dados, setDados] = useState<RelatorioApi | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<RelatorioApi>('/admin/relatorios')
      .then(setDados)
      .catch(() => setErro('Não foi possível carregar os relatórios.'));
  }, []);

  if (erro) return <Card><Vazio>{erro}</Vazio></Card>;
  if (!dados) return <Card><Vazio>Carregando relatórios...</Vazio></Card>;

  const semVendas = dados.pedidos_faturados === 0;

  const kpis = [
    { rotulo: 'Faturamento', valor: formatPrice(dados.faturamento), cor: cores.sucesso },
    { rotulo: 'Pedidos faturados', valor: String(dados.pedidos_faturados), cor: cores.primaria },
    { rotulo: 'Ticket médio', valor: formatPrice(dados.ticket_medio), cor: '#8b5cf6' },
    { rotulo: 'Clientes', valor: String(dados.clientes), cor: cores.alerta },
    { rotulo: 'Estoque total', valor: String(dados.estoque_total), cor: '#22c55e' },
  ];

  const serieDias = dados.vendas_por_dia.map((d) => ({
    ...d,
    diaCurto: new Date(`${d.dia}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.rotulo} style={{ padding: '1.25rem' }}>
            <div style={{ color: kpi.cor, fontWeight: 800, fontSize: '1.5rem' }}>{kpi.valor}</div>
            <div style={{ color: cores.textoFraco, fontSize: '0.8rem', marginTop: '0.2rem' }}>{kpi.rotulo}</div>
          </Card>
        ))}
      </div>

      {semVendas && (
        <Card>
          <Vazio>
            Ainda não há vendas concretizadas. Os gráficos aparecem quando o primeiro pedido for pago.
          </Vazio>
        </Card>
      )}

      {!semVendas && (
        <>
          <Card>
            <CardHeader titulo="Faturamento nos últimos 30 dias" />
            <div style={{ padding: '1.25rem 0.75rem 1.25rem 0' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={serieDias}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cores.borda} />
                  <XAxis dataKey="diaCurto" stroke={cores.textoFraco} fontSize={11} />
                  <YAxis stroke={cores.textoFraco} fontSize={11} />
                  <Tooltip
                    contentStyle={estiloTooltip}
                    formatter={(v: number, nome) => (nome === 'faturamento' ? formatPrice(v) : v)}
                  />
                  <Line type="monotone" dataKey="faturamento" stroke={cores.primaria} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader titulo="Produtos mais vendidos" descricao="Por unidades" />
              <div style={{ padding: '1.25rem 0.75rem 1.25rem 0' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dados.top_livros} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={cores.borda} />
                    <XAxis type="number" stroke={cores.textoFraco} fontSize={11} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="titulo"
                      stroke={cores.textoFraco}
                      fontSize={10}
                      width={130}
                      tickFormatter={(t: string) => (t.length > 22 ? `${t.slice(0, 22)}...` : t)}
                    />
                    <Tooltip contentStyle={estiloTooltip} />
                    <Bar dataKey="unidades" fill={cores.primaria} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader titulo="Receita por categoria" />
              <div style={{ padding: '1.25rem' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={dados.por_categoria}
                      dataKey="receita"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ categoria }) => categoria}
                      fontSize={11}
                    >
                      {dados.por_categoria.map((c) => (
                        <Cell key={c.categoria} fill={c.cor} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={estiloTooltip} formatter={(v: number) => formatPrice(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader titulo="Pedidos por status" />
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
                {dados.pedidos_por_status[chave] ?? 0}
              </div>
              <div style={{ color: cores.textoFraco, fontSize: '0.75rem' }}>{rotulo}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
