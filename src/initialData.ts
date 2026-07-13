import { Cliente, Veiculo, Produto, Servico, OrdemServico, Orçamento, VendaProduto, Recibo, NotaFiscal, Configuracoes } from './types';

export const initialClientes: Cliente[] = [
  {
    id: 'c1',
    tipo: 'PF',
    nome: 'Carlos Eduardo Silva',
    documento: '123.456.789-00',
    telefone: '(11) 98765-4321',
    email: 'carlos.silva@email.com',
    endereco: {
      cep: '01311-200',
      rua: 'Avenida Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    observacoes: 'Cliente fiel, prefere peças originais.',
    dataCadastro: '15/01/2026'
  },
  {
    id: 'c2',
    tipo: 'PJ',
    nome: 'Transportes Rápidos Ltda',
    documento: '12.345.678/0001-99',
    telefone: '(11) 3344-5566',
    email: 'contato@transrapidos.com.br',
    endereco: {
      cep: '04571-010',
      rua: 'Rua Berrini',
      numero: '500',
      bairro: 'Cidade Monções',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    observacoes: 'Faturamento mensal. Entrar em contato com o gerente de frota, Marcos.',
    dataCadastro: '02/02/2026'
  },
  {
    id: 'c3',
    tipo: 'PF',
    nome: 'Ana Beatriz Souza',
    documento: '234.567.890-11',
    telefone: '(21) 99122-3344',
    email: 'anabea@gmail.com',
    endereco: {
      cep: '22040-010',
      rua: 'Avenida Atlântica',
      numero: '1540',
      bairro: 'Copacabana',
      cidade: 'Rio de Janeiro',
      uf: 'RJ'
    },
    observacoes: 'Retirar o carro sempre após as 18h.',
    dataCadastro: '20/03/2026'
  },
  {
    id: 'c4',
    tipo: 'PF',
    nome: 'Ricardo Oliveira Neves',
    documento: '345.678.901-22',
    telefone: '(31) 98877-6655',
    email: 'ricardo.neves@outlook.com',
    endereco: {
      cep: '30140-010',
      rua: 'Rua da Bahia',
      numero: '120',
      bairro: 'Centro',
      cidade: 'Belo Horizonte',
      uf: 'MG'
    },
    observacoes: 'Sempre pede orçamento detalhado por WhatsApp antes de aprovar.',
    dataCadastro: '05/04/2026'
  },
  {
    id: 'c5',
    tipo: 'PF',
    nome: 'Mariana Costa Ferreira',
    documento: '456.789.012-33',
    telefone: '(41) 99654-3210',
    email: 'mari.costa@hotmail.com',
    endereco: {
      cep: '80010-000',
      rua: 'Rua XV de Novembro',
      numero: '850',
      bairro: 'Centro',
      cidade: 'Curitiba',
      uf: 'PR'
    },
    observacoes: 'Primeira vez na oficina. Indicada pelo Carlos.',
    dataCadastro: '12/05/2026'
  },
  {
    id: 'c6',
    tipo: 'PJ',
    nome: 'Auto Escola Piloto',
    documento: '98.765.432/0001-10',
    telefone: '(11) 2233-4455',
    email: 'direcao@aepiloto.com.br',
    endereco: {
      cep: '02011-000',
      rua: 'Rua Voluntários da Pátria',
      numero: '1200',
      bairro: 'Santana',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    observacoes: 'Carros de instrução de direção. Manutenções preventivas frequentes.',
    dataCadastro: '28/05/2026'
  }
];

export const initialVeiculos: Veiculo[] = [
  {
    id: 'v1',
    clienteId: 'c1',
    placa: 'BRA2E19',
    marca: 'Chevrolet',
    modelo: 'Onix 1.0 Turbo',
    ano: '2021',
    cor: 'Prata',
    combustivel: 'Flex',
    chassi: '9BGXXXXXXXXXXXXXX',
    renavam: '12345678901',
    quilometragem: 42500
  },
  {
    id: 'v2',
    clienteId: 'c2',
    placa: 'ABC1234',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter 415 CDI',
    ano: '2019',
    cor: 'Branco',
    combustivel: 'Diesel',
    chassi: '8ADXXXXXXXXXXXXXX',
    renavam: '98765432109',
    quilometragem: 185300
  },
  {
    id: 'v3',
    clienteId: 'c3',
    placa: 'RIO2A26',
    marca: 'Honda',
    modelo: 'Civic LXS 1.8',
    ano: '2016',
    cor: 'Preto',
    combustivel: 'Flex',
    chassi: '93HXXXXXXXXXXXXXX',
    renavam: '56473829102',
    quilometragem: 98000
  },
  {
    id: 'v4',
    clienteId: 'c4',
    placa: 'MGB4F88',
    marca: 'Volkswagen',
    modelo: 'T-Cross 1.4 TSI',
    ano: '2022',
    cor: 'Cinza Platina',
    combustivel: 'Flex',
    chassi: '9BWXXXXXXXXXXXXXX',
    renavam: '82736451920',
    quilometragem: 18400
  },
  {
    id: 'v5',
    clienteId: 'c5',
    placa: 'PRT9G11',
    marca: 'Fiat',
    modelo: 'Argo 1.0 Drive',
    ano: '2020',
    cor: 'Vermelho',
    combustivel: 'Flex',
    chassi: '9BDXXXXXXXXXXXXXX',
    renavam: '10293847561',
    quilometragem: 61200
  },
  {
    id: 'v6',
    clienteId: 'c6',
    placa: 'PIL9090',
    marca: 'Fiat',
    modelo: 'Mobi 1.0 Like',
    ano: '2019',
    cor: 'Branco',
    combustivel: 'Flex',
    chassi: '9BDYYYYYYYYYYYYYY',
    renavam: '29384756102',
    quilometragem: 112000
  }
];

export const initialProdutos: Produto[] = [
  {
    id: 'p1',
    codigo: 'PE-0001',
    nome: 'Filtro de Óleo Fram PH5548',
    categoria: 'Filtros',
    precoVenda: 45.00,
    estoqueAtual: 24,
    estoqueMinimo: 10
  },
  {
    id: 'p2',
    codigo: 'PE-0002',
    nome: 'Óleo Motor Castrol Magnatec 5W30 (1L)',
    categoria: 'Lubrificantes',
    precoVenda: 65.00,
    estoqueAtual: 48,
    estoqueMinimo: 15
  },
  {
    id: 'p3',
    codigo: 'PE-0003',
    nome: 'Pastilha de Freio Dianteira Fras-le',
    categoria: 'Freios',
    precoVenda: 140.00,
    estoqueAtual: 8,
    estoqueMinimo: 5
  },
  {
    id: 'p4',
    codigo: 'PE-0004',
    nome: 'Disco de Freio Dianteiro Fremax (Par)',
    categoria: 'Freios',
    precoVenda: 320.00,
    estoqueAtual: 4,
    estoqueMinimo: 3
  },
  {
    id: 'p5',
    codigo: 'PE-0005',
    nome: 'Vela de Ignição NGK Flex (Jogo)',
    categoria: 'Ignição',
    precoVenda: 110.00,
    estoqueAtual: 12,
    estoqueMinimo: 6
  },
  {
    id: 'p6',
    codigo: 'PE-0006',
    nome: 'Palheta Limpador Dyna (Par)',
    categoria: 'Acessórios',
    precoVenda: 75.00,
    estoqueAtual: 18,
    estoqueMinimo: 5
  },
  {
    id: 'p7',
    codigo: 'PE-0007',
    nome: 'Amortecedor Dianteiro Cofap',
    categoria: 'Suspensão',
    precoVenda: 480.00,
    estoqueAtual: 2,
    estoqueMinimo: 4
  },
  {
    id: 'p8',
    codigo: 'PE-0008',
    nome: 'Aditivo para Radiador Paraflu (1L)',
    categoria: 'Arrefecimento',
    precoVenda: 35.00,
    estoqueAtual: 30,
    estoqueMinimo: 10
  }
];

export const initialServicos: Servico[] = [
  {
    id: 's1',
    descricao: 'Troca de Óleo e Filtro',
    valorPadrao: 60.00,
    tempoEstimado: 0.5
  },
  {
    id: 's2',
    descricao: 'Alinhamento 3D e Balanceamento (4 rodas)',
    valorPadrao: 150.00,
    tempoEstimado: 1.0
  },
  {
    id: 's3',
    descricao: 'Revisão do Sistema de Freio',
    valorPadrao: 180.00,
    tempoEstimado: 1.5
  },
  {
    id: 's4',
    descricao: 'Substituição de Amortecedores Dianteiros',
    valorPadrao: 250.00,
    tempoEstimado: 2.5
  },
  {
    id: 's5',
    descricao: 'Higienização do Ar Condicionado',
    valorPadrao: 90.00,
    tempoEstimado: 0.8
  },
  {
    id: 's6',
    descricao: 'Diagnóstico Computadorizado (Injeção)',
    valorPadrao: 120.00,
    tempoEstimado: 1.0
  },
  {
    id: 's7',
    descricao: 'Limpeza do Sistema de Arrefecimento',
    valorPadrao: 140.00,
    tempoEstimado: 1.2
  }
];

export const initialOrdensServico: OrdemServico[] = [
  {
    numero: '1001',
    clienteId: 'c1',
    veiculoId: 'v1',
    dataEntrada: '01/07/2026',
    previsaoEntrega: '02/07/2026',
    status: 'entregue',
    itens: [
      { id: 's1', tipo: 'servico', descricao: 'Troca de Óleo e Filtro', quantidade: 1, valorUnitario: 60.00 },
      { id: 'p2', tipo: 'peca', descricao: 'Óleo Motor Castrol Magnatec 5W30 (1L)', quantidade: 4, valorUnitario: 65.00 },
      { id: 'p1', tipo: 'peca', descricao: 'Filtro de Óleo Fram PH5548', quantidade: 1, valorUnitario: 45.00 }
    ],
    valorMaoDeObra: 60.00,
    desconto: 15.00,
    valorTotal: 350.00,
    mecanicoResponsavel: 'Adalberto Silva',
    diagnostico: 'Revisão básica de 40.000km realizada de acordo com o plano do fabricante.'
  },
  {
    numero: '1002',
    clienteId: 'c2',
    veiculoId: 'v2',
    dataEntrada: '05/07/2026',
    previsaoEntrega: '08/07/2026',
    status: 'concluida',
    itens: [
      { id: 's4', tipo: 'servico', descricao: 'Substituição de Amortecedores Dianteiros', quantidade: 1, valorUnitario: 250.00 },
      { id: 's2', tipo: 'servico', descricao: 'Alinhamento 3D e Balanceamento (4 rodas)', quantidade: 1, valorUnitario: 150.00 },
      { id: 'p7', tipo: 'peca', descricao: 'Amortecedor Dianteiro Cofap', quantidade: 2, valorUnitario: 480.00 }
    ],
    valorMaoDeObra: 400.00,
    desconto: 50.00,
    valorTotal: 1310.00,
    mecanicoResponsavel: 'Luiz Gustavo',
    diagnostico: 'Amortecedores dianteiros estourados, provocando instabilidade. Efetuada a substituição das peças e o alinhamento da direção.'
  },
  {
    numero: '1003',
    clienteId: 'c3',
    veiculoId: 'v3',
    dataEntrada: '10/07/2026',
    previsaoEntrega: '14/07/2026',
    status: 'em_andamento',
    itens: [
      { id: 's3', tipo: 'servico', descricao: 'Revisão do Sistema de Freio', quantidade: 1, valorUnitario: 180.00 },
      { id: 'p3', tipo: 'peca', descricao: 'Pastilha de Freio Dianteira Fras-le', quantidade: 1, valorUnitario: 140.00 },
      { id: 'p4', tipo: 'peca', descricao: 'Disco de Freio Dianteiro Fremax (Par)', quantidade: 1, valorUnitario: 320.00 }
    ],
    valorMaoDeObra: 180.00,
    desconto: 0.00,
    valorTotal: 640.00,
    mecanicoResponsavel: 'Adalberto Silva',
    diagnostico: 'Pastilhas gastas no limite de segurança, riscando o disco. Troca imediata do conjunto necessária.'
  },
  {
    numero: '1004',
    clienteId: 'c4',
    veiculoId: 'v4',
    dataEntrada: '12/07/2026',
    previsaoEntrega: '13/07/2026',
    status: 'aberta',
    itens: [
      { id: 's6', tipo: 'servico', descricao: 'Diagnóstico Computadorizado (Injeção)', quantidade: 1, valorUnitario: 120.00 }
    ],
    valorMaoDeObra: 120.00,
    desconto: 0.00,
    valorTotal: 120.00,
    mecanicoResponsavel: 'Carlos Alberto (Mecânico Chefe)',
    diagnostico: 'Cliente relata luz de injeção acesa e perda esporádica de potência.'
  },
  {
    numero: '1005',
    clienteId: 'c5',
    veiculoId: 'v5',
    dataEntrada: '13/07/2026',
    previsaoEntrega: '15/07/2026',
    status: 'aberta',
    itens: [
      { id: 's5', tipo: 'servico', descricao: 'Higienização do Ar Condicionado', quantidade: 1, valorUnitario: 90.00 },
      { id: 'p6', tipo: 'peca', descricao: 'Palheta Limpador Dyna (Par)', quantidade: 1, valorUnitario: 75.00 }
    ],
    valorMaoDeObra: 90.00,
    desconto: 5.00,
    valorTotal: 160.00,
    mecanicoResponsavel: 'Luiz Gustavo',
    diagnostico: 'Ar condicionado com odor desagradável e palhetas que deixam rastro de água no para-brisa.'
  },
  {
    numero: '1006',
    clienteId: 'c6',
    veiculoId: 'v6',
    dataEntrada: '08/07/2026',
    previsaoEntrega: '10/07/2026',
    status: 'cancelada',
    itens: [
      { id: 's3', tipo: 'servico', descricao: 'Revisão do Sistema de Freio', quantidade: 1, valorUnitario: 180.00 }
    ],
    valorMaoDeObra: 180.00,
    desconto: 0.00,
    valorTotal: 180.00,
    mecanicoResponsavel: 'Carlos Alberto',
    diagnostico: 'Cliente desistiu do reparo por razões de orçamento interno.'
  }
];

export const initialOrcamentos: Orçamento[] = [
  {
    numero: '2001',
    clienteId: 'c4',
    veiculoId: 'v4',
    itens: [
      { id: 's6', tipo: 'servico', descricao: 'Diagnóstico Computadorizado (Injeção)', quantidade: 1, valorUnitario: 120.00 },
      { id: 'p5', tipo: 'peca', descricao: 'Vela de Ignição NGK Flex (Jogo)', quantidade: 1, valorUnitario: 110.00 }
    ],
    data: '12/07/2026',
    validade: '22/07/2026',
    status: 'pendente',
    valorTotal: 230.00,
    observacoes: 'Substituição das velas diagnosticadas como desgastadas no teste de osciloscópio.'
  },
  {
    numero: '2002',
    clienteId: 'c1',
    veiculoId: 'v1',
    itens: [
      { id: 's2', tipo: 'servico', descricao: 'Alinhamento 3D e Balanceamento (4 rodas)', quantidade: 1, valorUnitario: 150.00 }
    ],
    data: '10/07/2026',
    validade: '20/07/2026',
    status: 'aprovado',
    valorTotal: 150.00,
    observacoes: 'Aprovado pelo cliente. Integrado na OS de revisão.'
  },
  {
    numero: '2003',
    clienteId: 'c5',
    veiculoId: 'v5',
    itens: [
      { id: 's7', tipo: 'servico', descricao: 'Limpeza do Sistema de Arrefecimento', quantidade: 1, valorUnitario: 140.00 },
      { id: 'p8', tipo: 'peca', descricao: 'Aditivo para Radiador Paraflu (1L)', quantidade: 2, valorUnitario: 35.00 }
    ],
    data: '08/07/2026',
    validade: '18/07/2026',
    status: 'recusado',
    valorTotal: 210.00,
    observacoes: 'Cliente considerou o valor alto e decidiu fazer no próximo mês.'
  },
  {
    numero: '2004',
    clienteId: 'c3',
    veiculoId: 'v3',
    itens: [
      { id: 's5', tipo: 'servico', descricao: 'Higienização do Ar Condicionado', quantidade: 1, valorUnitario: 90.00 }
    ],
    data: '13/07/2026',
    validade: '23/07/2026',
    status: 'pendente',
    valorTotal: 90.00,
    observacoes: 'Serviço preventivo sugerido durante a vistoria geral.'
  }
];

export const initialVendas: VendaProduto[] = [
  {
    id: 'vd1',
    clienteId: 'c1',
    itens: [
      { produtoId: 'p6', nome: 'Palheta Limpador Dyna (Par)', quantidade: 1, valorUnitario: 75.00 },
      { produtoId: 'p8', nome: 'Aditivo para Radiador Paraflu (1L)', quantidade: 2, valorUnitario: 35.00 }
    ],
    formaPagamento: 'Cartão de Crédito',
    valorTotal: 145.00,
    data: '03/07/2026'
  },
  {
    id: 'vd2',
    itens: [
      { produtoId: 'p2', nome: 'Óleo Motor Castrol Magnatec 5W30 (1L)', quantidade: 2, valorUnitario: 65.00 }
    ],
    formaPagamento: 'Pix',
    valorTotal: 130.00,
    data: '06/07/2026'
  },
  {
    id: 'vd3',
    clienteId: 'c3',
    itens: [
      { produtoId: 'p1', nome: 'Filtro de Óleo Fram PH5548', quantidade: 1, valorUnitario: 45.00 },
      { produtoId: 'p2', nome: 'Óleo Motor Castrol Magnatec 5W30 (1L)', quantidade: 4, valorUnitario: 65.00 }
    ],
    formaPagamento: 'Dinheiro',
    valorTotal: 305.00,
    data: '11/07/2026'
  },
  {
    id: 'vd4',
    itens: [
      { produtoId: 'p8', nome: 'Aditivo para Radiador Paraflu (1L)', quantidade: 3, valorUnitario: 35.00 }
    ],
    formaPagamento: 'Pix',
    valorTotal: 105.00,
    data: '13/07/2026'
  }
];

export const initialRecibos: Recibo[] = [
  {
    id: 'rec1',
    referenciaId: '1001',
    referenciaTipo: 'OS',
    valor: 350.00,
    formaPagamento: 'Pix',
    data: '02/07/2026',
    clienteNome: 'Carlos Eduardo Silva'
  },
  {
    id: 'rec2',
    referenciaId: 'vd1',
    referenciaTipo: 'Venda',
    valor: 145.00,
    formaPagamento: 'Cartão de Crédito',
    data: '03/07/2026',
    clienteNome: 'Carlos Eduardo Silva'
  },
  {
    id: 'rec3',
    referenciaId: 'vd2',
    referenciaTipo: 'Venda',
    valor: 130.00,
    formaPagamento: 'Pix',
    data: '06/07/2026',
    clienteNome: 'Consumidor Final'
  },
  {
    id: 'rec4',
    referenciaId: '1002',
    referenciaTipo: 'OS',
    valor: 1310.00,
    formaPagamento: 'Boleto Bancário',
    data: '08/07/2026',
    clienteNome: 'Transportes Rápidos Ltda'
  }
];

export const initialNotasFiscais: NotaFiscal[] = [
  {
    id: 'nf1',
    referenciaId: '1001',
    referenciaTipo: 'OS',
    tipo: 'Mista',
    numero: '000104',
    status: 'emitida',
    data: '02/07/2026',
    valorTotal: 350.00,
    clienteNome: 'Carlos Eduardo Silva'
  },
  {
    id: 'nf2',
    referenciaId: 'vd1',
    referenciaTipo: 'Venda',
    tipo: 'Produto',
    numero: '000105',
    status: 'emitida',
    data: '03/07/2026',
    valorTotal: 145.00,
    clienteNome: 'Carlos Eduardo Silva'
  },
  {
    id: 'nf3',
    referenciaId: '1002',
    referenciaTipo: 'OS',
    tipo: 'Mista',
    numero: '000106',
    status: 'emitida',
    data: '08/07/2026',
    valorTotal: 1310.00,
    clienteNome: 'Transportes Rápidos Ltda'
  },
  {
    id: 'nf4',
    referenciaId: '1003',
    referenciaTipo: 'OS',
    tipo: 'Mista',
    numero: '000107',
    status: 'pendente',
    data: '13/07/2026',
    valorTotal: 640.00,
    clienteNome: 'Ana Beatriz Souza'
  }
];

export const defaultConfiguracoes: Configuracoes = {
  nomeOficina: 'OficinaPro',
  telefone: '(11) 3344-9988',
  cnpj: '12.345.678/0001-00',
  email: 'gerencia@oficinapro.com.br',
  endereco: {
    cep: '01311-000',
    rua: 'Avenida Paulista',
    numero: '1500',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP'
  },
  nomeUsuario: ' Gabriel Gustavo',
  logoUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200'
};
