import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Card, CardHeader, cores, Etiqueta, Tabela, Td, Vazio } from './ui';

interface LogApi {
  id: number;
  usuario_id: number;
  usuario_nome: string;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  detalhes: string | null;
  criado_em: string;
}

/** Cor por família de ação, para a tabela ficar escaneável. */
function corDaAcao(acao: string): string {
  if (acao.startsWith('excluiu') || acao.startsWith('desativou') || acao.startsWith('estornou')) return cores.perigo;
  if (acao.startsWith('criou')) return cores.sucesso;
  if (acao.startsWith('editou') || acao.startsWith('alterou') || acao.startsWith('ajustou') || acao.startsWith('atualizou')) return cores.alerta;
  return cores.primaria;
}

export function LogsPanel() {
  const [logs, setLogs] = useState<LogApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<{ logs: LogApi[] }>('/admin/logs')
      .then((d) => setLogs(d.logs))
      .catch(() => setErro('Não foi possível carregar os logs.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <Card>
      <CardHeader
        titulo="Logs de atividade"
        descricao="Últimas 50 ações registradas (login, catálogo, pedidos, configurações)"
      />
      {carregando ? (
        <Vazio>Carregando logs...</Vazio>
      ) : erro ? (
        <Vazio>{erro}</Vazio>
      ) : logs.length === 0 ? (
        <Vazio>Nenhuma atividade registrada ainda.</Vazio>
      ) : (
        <Tabela colunas={['Quando', 'Quem', 'Ação', 'Entidade', 'Detalhes']}>
          {logs.map((log) => (
            <tr key={log.id}>
              <Td style={{ color: cores.textoFraco, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                {new Date(log.criado_em.replace(' ', 'T')).toLocaleString('pt-BR')}
              </Td>
              <Td>{log.usuario_nome}</Td>
              <Td><Etiqueta cor={corDaAcao(log.acao)}>{log.acao.replace(/_/g, ' ')}</Etiqueta></Td>
              <Td style={{ color: cores.textoSuave, fontSize: '0.8rem' }}>
                {log.entidade}{log.entidade_id ? ` #${log.entidade_id}` : ''}
              </Td>
              <Td style={{ color: cores.textoFraco, fontSize: '0.78rem' }}>{log.detalhes || '-'}</Td>
            </tr>
          ))}
        </Tabela>
      )}
    </Card>
  );
}
