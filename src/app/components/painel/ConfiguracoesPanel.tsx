import { useEffect, useState } from 'react';
import { CreditCard, Truck, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { Aviso, Botao, Campo, Card, CardHeader, cores, estiloInput, Etiqueta } from './ui';

interface ConfiguracoesApi {
  configuracoes: Record<string, string>;
  padroes: Record<string, string>;
  gateway: { access_token_configurado: boolean; ambiente: 'teste' | 'producao' | 'ausente' };
}

const CAMPOS_FRETE: { chave: string; rotulo: string; }[] = [
  { chave: 'frete_base', rotulo: 'Taxa base (R$)' },
  { chave: 'frete_preco_kg', rotulo: 'Preço por kg (R$)' },
  { chave: 'frete_limiar_gratis', rotulo: 'Frete grátis a partir de (R$)' },
  { chave: 'frete_multiplicador_expressa', rotulo: 'Multiplicador da expressa' },
  { chave: 'frete_origem_uf', rotulo: 'UF de origem' },
];

export function ConfiguracoesPanel() {
  const [dados, setDados] = useState<ConfiguracoesApi | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiFetch<ConfiguracoesApi>('/admin/configuracoes')
      .then((d) => { setDados(d); setValores(d.configuracoes); })
      .catch(() => setErro('Não foi possível carregar as configurações.'));
  }, []);

  async function salvar() {
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      await apiFetch('/admin/configuracoes', { method: 'PUT', body: JSON.stringify(valores) });
      setSucesso('Configurações salvas. O cálculo de frete do checkout já usa os novos valores.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  if (!dados) {
    return (
      <Card>
        <div style={{ color: cores.textoFraco, padding: '2.5rem', textAlign: 'center' }}>
          {erro || 'Carregando configurações...'}
        </div>
      </Card>
    );
  }

  const { gateway } = dados;
  const corAmbiente = gateway.ambiente === 'teste' ? cores.alerta : gateway.ambiente === 'producao' ? cores.sucesso : cores.perigo;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          titulo="Gateway de pagamento"
          descricao="Integração com o Mercado Pago (cartão e PIX)"
        />
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div className="flex items-start gap-3" style={{ marginBottom: '1.25rem' }}>
            <CreditCard size={20} style={{ color: cores.primaria, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: cores.texto, fontWeight: 600 }}>Mercado Pago</span>
                <Etiqueta cor={cores.sucesso}>ativo</Etiqueta>
                <Etiqueta cor={corAmbiente}>
                  {gateway.ambiente === 'teste' ? 'credenciais de teste' : gateway.ambiente === 'producao' ? 'credenciais de produção' : 'não configurado'}
                </Etiqueta>
              </div>
              <p style={{ color: cores.textoFraco, fontSize: '0.83rem', lineHeight: 1.7 }}>
                O Access Token é uma credencial secreta e por isso vive apenas no arquivo{' '}
                <code style={{ color: cores.textoSuave }}>backend/.env</code>, nunca no banco nem nesta tela.
                Aqui só mostramos se ele está presente.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            style={{
              background: gateway.access_token_configurado ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${gateway.access_token_configurado ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              borderRadius: '0.6rem',
              padding: '0.75rem 1rem',
              color: gateway.access_token_configurado ? cores.sucesso : cores.perigo,
              fontSize: '0.85rem',
            }}
          >
            {gateway.access_token_configurado ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            {gateway.access_token_configurado
              ? 'MP_ACCESS_TOKEN configurado - pagamentos habilitados.'
              : 'MP_ACCESS_TOKEN ausente em backend/.env - os pagamentos vão falhar.'}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          titulo="Integração de frete"
          descricao="Endereço vem do ViaCEP; o preço usa estes parâmetros"
          acao={<Botao onClick={() => void salvar()} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Botao>}
        />

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}

        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div className="flex items-start gap-3" style={{ marginBottom: '1.25rem' }}>
            <Truck size={20} style={{ color: cores.primaria, marginTop: '2px' }} />
            <p style={{ color: cores.textoFraco, fontSize: '0.83rem', lineHeight: 1.7 }}>
              O frete é calculado a partir do peso e região.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CAMPOS_FRETE.map(({ chave, rotulo }) => (
              <Campo key={chave} label={rotulo}>
                <input
                  value={valores[chave] ?? ''}
                  onChange={(e) => setValores((v) => ({ ...v, [chave]: e.target.value }))}
                  style={estiloInput}
                />
              </Campo>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
