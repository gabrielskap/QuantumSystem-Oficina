export type TipoCliente = 'PF' | 'PJ';

export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Cliente {
  id: string;
  tipo: TipoCliente;
  nome: string; // ou Razão Social
  documento: string; // CPF ou CNPJ
  telefone: string;
  email: string;
  endereco: Endereco;
  observacoes: string;
  dataCadastro: string;
}

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  combustivel: string;
  chassi: string;
  renavam: string;
  quilometragem: number;
  dadosConsulta?: boolean;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
}

export interface Servico {
  id: string;
  descricao: string;
  valorPadrao: number;
  tempoEstimado: number; // em horas
}

export type StatusOS = 'aberta' | 'em_andamento' | 'concluida' | 'entregue' | 'cancelada';

export interface ItemOS {
  id: string;
  tipo: 'servico' | 'peca';
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface OrdemServico {
  numero: string;
  clienteId: string;
  veiculoId: string;
  dataEntrada: string;
  previsaoEntrega: string;
  status: StatusOS;
  itens: ItemOS[];
  valorMaoDeObra: number;
  desconto: number;
  valorTotal: number;
  mecanicoResponsavel: string;
  diagnostico: string;
}

export type StatusOrcamento = 'pendente' | 'aprovado' | 'recusado';

export interface Orçamento {
  numero: string;
  clienteId: string;
  veiculoId: string;
  itens: ItemOS[];
  data: string;
  validade: string;
  status: StatusOrcamento;
  valorTotal: number;
  observacoes: string;
  valorMaoDeObra?: number;
  desconto?: number;
}

export interface ItemVenda {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

export interface VendaProduto {
  id: string;
  clienteId?: string; // opcional
  itens: ItemVenda[];
  formaPagamento: string;
  valorTotal: number;
  data: string;
}

export interface Recibo {
  id: string;
  referenciaId: string; // ID da OS ou ID da Venda
  referenciaTipo: 'OS' | 'Venda';
  valor: number;
  formaPagamento: string;
  data: string;
  clienteNome: string;
  descricao?: string;
  clienteDocumento?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteEndereco?: string;
}

export type StatusNF = 'emitida' | 'cancelada' | 'pendente';

export interface NotaFiscal {
  id: string;
  referenciaId: string; // ID da OS ou ID da Venda
  referenciaTipo: 'OS' | 'Venda';
  tipo: 'Serviço' | 'Produto' | 'Mista';
  numero: string;
  status: StatusNF;
  data: string;
  valorTotal: number;
  clienteNome: string;
}

export interface Configuracoes {
  nomeOficina: string;
  telefone: string;
  cnpj: string;
  email: string;
  endereco: Endereco;
  nomeUsuario: string;
  logoUrl?: string;
}
