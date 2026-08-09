import { useState } from 'react';
import { BarChart3, Boxes, ClipboardList, LayoutGrid, ScrollText, Settings, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PainelLayout, ItemMenu } from '../components/painel/PainelLayout';
import { ProdutosPanel } from '../components/painel/ProdutosPanel';
import { CategoriasPanel } from '../components/painel/CategoriasPanel';
import { PedidosPanel } from '../components/painel/PedidosPanel';
import { UsuariosPanel } from '../components/painel/UsuariosPanel';
import { ConfiguracoesPanel } from '../components/painel/ConfiguracoesPanel';
import { RelatoriosPanel } from '../components/painel/RelatoriosPanel';
import { LogsPanel } from '../components/painel/LogsPanel';

// O admin faz tudo que o gerente faz e mais: usuários, configurações, logs,
// relatórios, exclusão e estorno de pedidos.
const MENU: ItemMenu[] = [
  { chave: 'relatorios', rotulo: 'Visão geral', icone: <BarChart3 size={16} />, descricao: 'Métricas gerais de vendas.' },
  { chave: 'usuarios', rotulo: 'Usuários', icone: <Users size={16} />, descricao: 'Gerencie contas e defina papéis (cliente, gerente, admin).' },
  { chave: 'produtos', rotulo: 'Catálogo', icone: <Boxes size={16} />, descricao: 'Cadastre, edite e controle o estoque dos produtos.' },
  { chave: 'categorias', rotulo: 'Categorias', icone: <LayoutGrid size={16} />, descricao: 'Organize o catálogo. Categorias viram filtros na loja.' },
  { chave: 'pedidos', rotulo: 'Pedidos', icone: <ClipboardList size={16} />, descricao: 'Acompanhe, atualize, estorne ou exclua pedidos.' },
  { chave: 'configuracoes', rotulo: 'Configurações', icone: <Settings size={16} />, descricao: 'Gateway de pagamento e parâmetros de frete.' },
  { chave: 'logs', rotulo: 'Logs', icone: <ScrollText size={16} />, descricao: 'Registro de atividade do sistema.' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [aba, setAba] = useState('relatorios');

  return (
    <PainelLayout
      titulo="Painel Administrativo"
      subtitulo={`Olá, ${user?.name ?? 'admin'}`}
      icone={<ShieldCheck size={22} />}
      corIcone="#06b6d4"
      menu={MENU}
      ativo={aba}
      onSelecionar={setAba}
    >
      {aba === 'relatorios' && <RelatoriosPanel />}
      {aba === 'usuarios' && <UsuariosPanel />}
      {aba === 'produtos' && <ProdutosPanel />}
      {aba === 'categorias' && <CategoriasPanel />}
      {aba === 'pedidos' && <PedidosPanel podeExcluir podeEstornar />}
      {aba === 'configuracoes' && <ConfiguracoesPanel />}
      {aba === 'logs' && <LogsPanel />}
    </PainelLayout>
  );
}
