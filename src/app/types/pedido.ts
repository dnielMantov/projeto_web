import { Format } from '../data/catalog';

export interface PedidoItemApi {
  id: number;
  livro_id: string;
  titulo_snapshot: string;
  formato: Format;
  quantidade: number;
  preco_unitario: string;
}

export interface PedidoApi {
  id: number;
  usuario_id: number;
  status: 'aguardando_pagamento' | 'pago' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  metodo_entrega: 'padrao' | 'expressa' | 'retirada' | 'download';
  subtotal: string;
  frete_valor: string;
  frete_prazo_min: number | null;
  frete_prazo_max: number | null;
  total: string;
  nome_destinatario: string;
  cpf: string;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreio: string | null;
  criado_em: string;
  itens: PedidoItemApi[];
}

export interface FreteOpcao {
  tipo: 'padrao' | 'expressa';
  valor: number;
  prazoMinDias: number;
  prazoMaxDias: number;
  gratis: boolean;
}

export interface FreteResposta {
  cep: string;
  cidade: string;
  uf: string;
  regiao: 'local' | 'regional' | 'nacional';
  opcoes: FreteOpcao[];
}

export interface PagamentoApi {
  id: number;
  status: string;
  status_detail: string | null;
  qr_code?: string | null;
  qr_code_base64?: string | null;
}

export interface PagamentoStatusApi {
  status: string;
  status_detail: string | null;
  pedido_status: string;
}
