import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { Role, useAuth } from '../../context/AuthContext';
import { Dropdown } from '../common/Dropdown';
import { Aviso, Botao, Card, CardHeader, cores, Etiqueta, Tabela, Td, Vazio } from './ui';

interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  papel: Role;
  ativo: number;
  criado_em: string;
}

const CORES_PAPEL: Record<Role, string> = {
  cliente: '#64748b',
  gerente: '#f59e0b',
  admin: '#06b6d4',
};

export function UsuariosPanel() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    try {
      const res = await apiFetch<{ usuarios: UsuarioApi[] }>('/admin/usuarios');
      setUsuarios(res.usuarios);
      setErro('');
    } catch {
      setErro('Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function mudarPapel(alvo: UsuarioApi, papel: Role) {
    try {
      await apiFetch(`/admin/usuarios/${alvo.id}/papel`, { method: 'PATCH', body: JSON.stringify({ papel }) });
      setSucesso(`${alvo.nome} agora é ${papel}.`);
      setErro('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao alterar o papel.');
    }
  }

  async function alternarAtivo(alvo: UsuarioApi) {
    try {
      await apiFetch(`/admin/usuarios/${alvo.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !alvo.ativo }),
      });
      setSucesso(`${alvo.nome} foi ${alvo.ativo ? 'desativado' : 'ativado'}.`);
      setErro('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao alterar o status.');
    }
  }

  return (
    <Card>
      <CardHeader
        titulo="Usuários"
        descricao={`${usuarios.length} conta(s) - promova clientes a gerente ou admin`}
      />

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}

      {carregando ? (
        <Vazio>Carregando usuários...</Vazio>
      ) : usuarios.length === 0 ? (
        <Vazio>Nenhum usuário cadastrado.</Vazio>
      ) : (
        <Tabela colunas={['Nome', 'E-mail', 'Papel', 'Situação', 'Desde', '']}>
          {usuarios.map((u) => {
            const euMesmo = u.id === user?.id;
            return (
              <tr key={u.id}>
                <Td style={{ fontWeight: 600 }}>
                  {u.nome}
                  {euMesmo && <span style={{ color: cores.textoFraco, fontWeight: 400, fontSize: '0.75rem' }}> (você)</span>}
                </Td>
                <Td style={{ color: cores.textoSuave }}>{u.email}</Td>
                <Td>
                  <Dropdown
                    value={u.papel}
                    disabled={euMesmo}
                    title={euMesmo ? 'Você não pode alterar o seu próprio papel' : undefined}
                    onChange={(v) => void mudarPapel(u, v as Role)}
                    options={[
                      { value: 'cliente', label: 'cliente' },
                      { value: 'gerente', label: 'gerente' },
                      { value: 'admin', label: 'admin' },
                    ]}
                    style={{ width: '130px' }}
                    buttonStyle={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: CORES_PAPEL[u.papel] }}
                  />
                </Td>
                <Td>
                  <Etiqueta cor={u.ativo ? cores.sucesso : cores.perigo}>{u.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
                </Td>
                <Td style={{ color: cores.textoFraco, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {new Date(u.criado_em.replace(' ', 'T')).toLocaleDateString('pt-BR')}
                </Td>
                <Td>
                  <Botao
                    variante={u.ativo ? 'perigo' : 'secundaria'}
                    onClick={() => void alternarAtivo(u)}
                    disabled={euMesmo}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                  >
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </Botao>
                </Td>
              </tr>
            );
          })}
        </Tabela>
      )}
    </Card>
  );
}
