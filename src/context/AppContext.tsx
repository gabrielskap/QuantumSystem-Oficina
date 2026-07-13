import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Cliente, Veiculo, Produto, Servico, OrdemServico, Orçamento, 
  VendaProduto, Recibo, NotaFiscal, Configuracoes 
} from '../types';
import { 
  getStoredState, setStoredState, stateKeys, initializeAppState 
} from '../utils';
import { 
  initialClientes, initialVeiculos, initialProdutos, initialServicos, 
  initialOrdensServico, initialOrcamentos, initialVendas, initialRecibos, 
  initialNotasFiscais, defaultConfiguracoes 
} from '../initialData';

interface AppContextType {
  clientes: Cliente[];
  veiculos: Veiculo[];
  produtos: Produto[];
  servicos: Servico[];
  ordensServico: OrdemServico[];
  orcamentos: Orçamento[];
  vendas: VendaProduto[];
  recibos: Recibo[];
  notasFiscais: NotaFiscal[];
  configuracoes: Configuracoes;
  
  // Clientes
  addCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Veiculos
  addVeiculo: (veiculo: Omit<Veiculo, 'id'>) => void;
  updateVeiculo: (id: string, veiculo: Partial<Veiculo>) => void;
  deleteVeiculo: (id: string) => void;

  // Produtos
  addProduto: (produto: Omit<Produto, 'id'>) => void;
  updateProduto: (id: string, produto: Partial<Produto>) => void;
  deleteProduto: (id: string) => void;

  // Servicos
  addServico: (servico: Omit<Servico, 'id'>) => void;
  updateServico: (id: string, servico: Partial<Servico>) => void;
  deleteServico: (id: string) => void;

  // Ordens de Serviço
  addOS: (os: Omit<OrdemServico, 'numero' | 'dataEntrada' | 'valorTotal'> & { dataEntrada?: string }) => string;
  updateOS: (numero: string, os: Partial<OrdemServico>) => void;
  deleteOS: (numero: string) => void;
  alterarStatusOS: (numero: string, status: OrdemServico['status']) => void;

  // Orçamentos
  addOrcamento: (orcamento: Omit<Orçamento, 'numero' | 'data' | 'valorTotal'>) => string;
  updateOrcamento: (numero: string, orcamento: Partial<Orçamento>) => void;
  deleteOrcamento: (numero: string) => void;
  aprovarOrcamento: (numero: string) => void;
  recusarOrcamento: (numero: string) => void;

  // Vendas
  addVenda: (venda: Omit<VendaProduto, 'id' | 'data' | 'valorTotal'>) => void;
  deleteVenda: (id: string) => void;

  // Recibos
  addRecibo: (recibo: Omit<Recibo, 'id'> & { data?: string }) => void;
  deleteRecibo: (id: string) => void;

  // Notas Fiscais
  addNotaFiscal: (nota: Omit<NotaFiscal, 'id' | 'data'>) => void;
  updateNotaFiscalStatus: (id: string, status: NotaFiscal['status']) => void;
  deleteNotaFiscal: (id: string) => void;

  // Configurações
  updateConfiguracoes: (config: Partial<Configuracoes>) => void;

  // Global search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Global Navigation & Prefill
  activeTab: string;
  setActiveTab: (tab: string) => void;
  prefilledClienteId: string;
  setPrefilledClienteId: (id: string) => void;

  // Centralized Toast and Confirm Feedback
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  confirmConfig: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null;
  setConfirmConfig: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize states
  useEffect(() => {
    initializeAppState();
  }, []);

  const [clientes, setClientes] = useState<Cliente[]>(() => getStoredState(stateKeys.CLIENTES, initialClientes));
  const [veiculos, setVeiculos] = useState<Veiculo[]>(() => getStoredState(stateKeys.VEICULOS, initialVeiculos));
  const [produtos, setProdutos] = useState<Produto[]>(() => getStoredState(stateKeys.PRODUTOS, initialProdutos));
  const [servicos, setServicos] = useState<Servico[]>(() => getStoredState(stateKeys.SERVICOS, initialServicos));
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>(() => getStoredState(stateKeys.OS, initialOrdensServico));
  const [orcamentos, setOrcamentos] = useState<Orçamento[]>(() => getStoredState(stateKeys.ORCAMENTOS, initialOrcamentos));
  const [vendas, setVendas] = useState<VendaProduto[]>(() => getStoredState(stateKeys.VENDAS, initialVendas));
  const [recibos, setRecibos] = useState<Recibo[]>(() => getStoredState(stateKeys.RECIBOS, initialRecibos));
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>(() => getStoredState(stateKeys.NOTAS_FISCAIS, initialNotasFiscais));
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(() => getStoredState(stateKeys.CONFIGURACOES, defaultConfiguracoes));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefilledClienteId, setPrefilledClienteId] = useState('');

  // Centralized Feedbacks
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const confirmAction = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmConfig(options);
  };

  // Persist state updates to localStorage
  useEffect(() => { setStoredState(stateKeys.CLIENTES, clientes); }, [clientes]);
  useEffect(() => { setStoredState(stateKeys.VEICULOS, veiculos); }, [veiculos]);
  useEffect(() => { setStoredState(stateKeys.PRODUTOS, produtos); }, [produtos]);
  useEffect(() => { setStoredState(stateKeys.SERVICOS, servicos); }, [servicos]);
  useEffect(() => { setStoredState(stateKeys.OS, ordensServico); }, [ordensServico]);
  useEffect(() => { setStoredState(stateKeys.ORCAMENTOS, orcamentos); }, [orcamentos]);
  useEffect(() => { setStoredState(stateKeys.VENDAS, vendas); }, [vendas]);
  useEffect(() => { setStoredState(stateKeys.RECIBOS, recibos); }, [recibos]);
  useEffect(() => { setStoredState(stateKeys.NOTAS_FISCAIS, notasFiscais); }, [notasFiscais]);
  useEffect(() => { setStoredState(stateKeys.CONFIGURACOES, configuracoes); }, [configuracoes]);

  // Current date helper (dd/mm/aaaa)
  const getFormattedDate = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // CLIENTES
  const addCliente = (newCliente: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const id = 'c' + (Math.max(...clientes.map(c => parseInt(c.id.replace('c', '')) || 0), 0) + 1);
    const dataCadastro = getFormattedDate();
    const client: Cliente = { ...newCliente, id, dataCadastro };
    setClientes(prev => [client, ...prev]);
  };

  const updateCliente = (id: string, updatedFields: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    // Optionally delete related vehicles as well, but standard is keep for safety or soft-delete
  };

  // VEICULOS
  const addVeiculo = (newVeiculo: Omit<Veiculo, 'id'>) => {
    const id = 'v' + (Math.max(...veiculos.map(v => parseInt(v.id.replace('v', '')) || 0), 0) + 1);
    const vehicle: Veiculo = { ...newVeiculo, id };
    setVeiculos(prev => [vehicle, ...prev]);
  };

  const updateVeiculo = (id: string, updatedFields: Partial<Veiculo>) => {
    setVeiculos(prev => prev.map(v => v.id === id ? { ...v, ...updatedFields } : v));
  };

  const deleteVeiculo = (id: string) => {
    setVeiculos(prev => prev.filter(v => v.id !== id));
  };

  // PRODUTOS
  const addProduto = (newProduto: Omit<Produto, 'id'>) => {
    const id = 'p' + (Math.max(...produtos.map(p => parseInt(p.id.replace('p', '')) || 0), 0) + 1);
    const product: Produto = { ...newProduto, id };
    setProdutos(prev => [product, ...prev]);
  };

  const updateProduto = (id: string, updatedFields: Partial<Produto>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduto = (id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  // SERVICOS
  const addServico = (newServico: Omit<Servico, 'id'>) => {
    const id = 's' + (Math.max(...servicos.map(s => parseInt(s.id.replace('s', '')) || 0), 0) + 1);
    const service: Servico = { ...newServico, id };
    setServicos(prev => [service, ...prev]);
  };

  const updateServico = (id: string, updatedFields: Partial<Servico>) => {
    setServicos(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteServico = (id: string) => {
    setServicos(prev => prev.filter(s => s.id !== id));
  };

  // ORDENS DE SERVIÇO
  const addOS = (newOS: Omit<OrdemServico, 'numero' | 'dataEntrada' | 'valorTotal'> & { dataEntrada?: string }) => {
    const nextNum = String(Math.max(...ordensServico.map(o => parseInt(o.numero) || 0), 1000) + 1);
    const dataEntrada = newOS.dataEntrada || getFormattedDate();
    
    // Calculate total
    const itemTotal = newOS.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
    const valorTotal = itemTotal + newOS.valorMaoDeObra - newOS.desconto;

    const os: OrdemServico = {
      ...newOS,
      numero: nextNum,
      dataEntrada,
      valorTotal
    };

    setOrdensServico(prev => [os, ...prev]);
    return nextNum;
  };

  const updateOS = (numero: string, updatedFields: Partial<OrdemServico>) => {
    const existingOS = ordensServico.find(o => o.numero === numero);
    if (!existingOS) return;

    const oldStatus = existingOS.status;
    const newStatus = updatedFields.status;

    setOrdensServico(prev => prev.map(o => {
      if (o.numero === numero) {
        const merged = { ...o, ...updatedFields };
        // Recalculate totals if items or mão de obra or desconto changed
        const itemTotal = merged.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
        merged.valorTotal = itemTotal + merged.valorMaoDeObra - merged.desconto;
        return merged;
      }
      return o;
    }));

    // If status transitions to "concluida" or "entregue", perform stock deductions and receipts/invoices
    const transitionedToComplete = (newStatus === 'concluida' || newStatus === 'entregue') && 
                                   (oldStatus !== 'concluida' && oldStatus !== 'entregue');

    if (transitionedToComplete) {
      const latestOS = { ...existingOS, ...updatedFields };
      const cliente = clientes.find(c => c.id === latestOS.clienteId);
      const clienteNome = cliente ? cliente.nome : 'Cliente Não Identificado';
      
      const itemTotal = latestOS.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
      const valorTotal = itemTotal + (latestOS.valorMaoDeObra || 0) - (latestOS.desconto || 0);

      // Check if receipt already exists for this OS
      const receiptExists = recibos.some(r => r.referenciaId === numero && r.referenciaTipo === 'OS');
      if (!receiptExists) {
        const nextRecId = 'rec' + (Math.max(...recibos.map(r => parseInt(r.id.replace('rec', '')) || 0), 0) + 1);
        const novoRecibo: Recibo = {
          id: nextRecId,
          referenciaId: numero,
          referenciaTipo: 'OS',
          valor: valorTotal,
          formaPagamento: 'Pix',
          data: getFormattedDate(),
          clienteNome
        };
        setRecibos(prev => [novoRecibo, ...prev]);
      }

      // Check if Invoice (Nota Fiscal) already exists for this OS
      const nfExists = notasFiscais.some(n => n.referenciaId === numero && n.referenciaTipo === 'OS');
      if (!nfExists) {
        const nextNfId = 'nf' + (Math.max(...notasFiscais.map(n => parseInt(n.id.replace('nf', '')) || 0), 0) + 1);
        const nextNfNum = String(Math.max(...notasFiscais.map(n => parseInt(n.numero) || 0), 100) + 1).padStart(6, '0');
        const novaNF: NotaFiscal = {
          id: nextNfId,
          referenciaId: numero,
          referenciaTipo: 'OS',
          tipo: 'Mista',
          numero: nextNfNum,
          status: 'emitida',
          data: getFormattedDate(),
          valorTotal: valorTotal,
          clienteNome
        };
        setNotasFiscais(prev => [novaNF, ...prev]);
      }

      // Deduct items from stock if they are pieces!
      latestOS.itens.forEach(item => {
        if (item.tipo === 'peca') {
          setProdutos(prev => prev.map(p => {
            if (p.id === item.id) {
              const novoEstoque = Math.max(0, p.estoqueAtual - item.quantidade);
              return { ...p, estoqueAtual: novoEstoque };
            }
            return p;
          }));
        }
      });
    }
  };

  const deleteOS = (numero: string) => {
    setOrdensServico(prev => prev.filter(o => o.numero !== numero));
  };

  const alterarStatusOS = (numero: string, status: OrdemServico['status']) => {
    const os = ordensServico.find(o => o.numero === numero);
    if (!os) return;

    setOrdensServico(prev => prev.map(o => o.numero === numero ? { ...o, status } : o));

    // If status becomes "concluida" or "entregue", let's make sure a Receipt and NF are created if they don't exist
    if (status === 'concluida' || status === 'entregue') {
      const cliente = clientes.find(c => c.id === os.clienteId);
      const clienteNome = cliente ? cliente.nome : 'Cliente Não Identificado';

      // Check if receipt already exists for this OS
      const receiptExists = recibos.some(r => r.referenciaId === numero && r.referenciaTipo === 'OS');
      if (!receiptExists) {
        const nextRecId = 'rec' + (Math.max(...recibos.map(r => parseInt(r.id.replace('rec', '')) || 0), 0) + 1);
        const novoRecibo: Recibo = {
          id: nextRecId,
          referenciaId: numero,
          referenciaTipo: 'OS',
          valor: os.valorTotal,
          formaPagamento: 'Pix', // default fallback
          data: getFormattedDate(),
          clienteNome
        };
        setRecibos(prev => [novoRecibo, ...prev]);
      }

      // Check if Invoice (Nota Fiscal) already exists for this OS
      const nfExists = notasFiscais.some(n => n.referenciaId === numero && n.referenciaTipo === 'OS');
      if (!nfExists) {
        const nextNfId = 'nf' + (Math.max(...notasFiscais.map(n => parseInt(n.id.replace('nf', '')) || 0), 0) + 1);
        const nextNfNum = String(Math.max(...notasFiscais.map(n => parseInt(n.numero) || 0), 100) + 1).padStart(6, '0');
        const novaNF: NotaFiscal = {
          id: nextNfId,
          referenciaId: numero,
          referenciaTipo: 'OS',
          tipo: 'Mista',
          numero: nextNfNum,
          status: 'emitida',
          data: getFormattedDate(),
          valorTotal: os.valorTotal,
          clienteNome
        };
        setNotasFiscais(prev => [novaNF, ...prev]);
      }

      // Deduct items from stock if they are pieces!
      os.itens.forEach(item => {
        if (item.tipo === 'peca') {
          setProdutos(prev => prev.map(p => {
            if (p.id === item.id) {
              const novoEstoque = Math.max(0, p.estoqueAtual - item.quantidade);
              return { ...p, estoqueAtual: novoEstoque };
            }
            return p;
          }));
        }
      });
    }
  };

  // ORÇAMENTOS
  const addOrcamento = (newOrcamento: Omit<Orçamento, 'numero' | 'data' | 'valorTotal'>) => {
    const nextNum = String(Math.max(...orcamentos.map(o => parseInt(o.numero) || 0), 2000) + 1);
    const data = getFormattedDate();
    const itemTotal = newOrcamento.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
    const valorTotal = Math.max(0, itemTotal + (newOrcamento.valorMaoDeObra || 0) - (newOrcamento.desconto || 0));

    const orc: Orçamento = {
      ...newOrcamento,
      numero: nextNum,
      data,
      valorTotal
    };

    setOrcamentos(prev => [orc, ...prev]);
    return nextNum;
  };

  const updateOrcamento = (numero: string, updatedFields: Partial<Orçamento>) => {
    setOrcamentos(prev => prev.map(o => {
      if (o.numero === numero) {
        const merged = { ...o, ...updatedFields };
        const itemTotal = merged.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
        merged.valorTotal = Math.max(0, itemTotal + (merged.valorMaoDeObra || 0) - (merged.desconto || 0));
        return merged;
      }
      return o;
    }));
  };

  const deleteOrcamento = (numero: string) => {
    setOrcamentos(prev => prev.filter(o => o.numero !== numero));
  };

  const aprovarOrcamento = (numero: string) => {
    const orc = orcamentos.find(o => o.numero === numero);
    if (!orc) return;

    setOrcamentos(prev => prev.map(o => o.numero === numero ? { ...o, status: 'aprovado' } : o));

    // Convert to an OS!
    const services = orc.itens.filter(item => item.tipo === 'servico');
    const valorMaoDeObra = orc.valorMaoDeObra !== undefined ? orc.valorMaoDeObra : services.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);
    const desconto = orc.desconto !== undefined ? orc.desconto : 0;

    const osData: Omit<OrdemServico, 'numero' | 'dataEntrada' | 'valorTotal'> = {
      clienteId: orc.clienteId,
      veiculoId: orc.veiculoId,
      previsaoEntrega: getFormattedDate(), // Set default to today or let user change
      status: 'aberta',
      itens: orc.itens,
      valorMaoDeObra,
      desconto,
      mecanicoResponsavel: 'A Definir',
      diagnostico: `OS gerada a partir do orçamento aprovado nº ${numero}. ` + (orc.observacoes || '')
    };

    addOS(osData);
  };

  const recusarOrcamento = (numero: string) => {
    setOrcamentos(prev => prev.map(o => o.numero === numero ? { ...o, status: 'recusado' } : o));
  };

  // VENDAS DE PRODUTOS
  const addVenda = (newVenda: Omit<VendaProduto, 'id' | 'data' | 'valorTotal'>) => {
    const id = 'vd' + (Math.max(...vendas.map(v => parseInt(v.id.replace('vd', '')) || 0), 0) + 1);
    const data = getFormattedDate();
    const valorTotal = newVenda.itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0);

    const venda: VendaProduto = {
      ...newVenda,
      id,
      data,
      valorTotal
    };

    setVendas(prev => [venda, ...prev]);

    // Create Receipt and Invoice!
    const cliente = clientes.find(c => c.id === newVenda.clienteId);
    const clienteNome = cliente ? cliente.nome : 'Consumidor Final';

    // Create Receipt
    const nextRecId = 'rec' + (Math.max(...recibos.map(r => parseInt(r.id.replace('rec', '')) || 0), 0) + 1);
    const novoRecibo: Recibo = {
      id: nextRecId,
      referenciaId: id,
      referenciaTipo: 'Venda',
      valor: valorTotal,
      formaPagamento: newVenda.formaPagamento,
      data,
      clienteNome
    };
    setRecibos(prev => [novoRecibo, ...prev]);

    // Create Invoice
    const nextNfId = 'nf' + (Math.max(...notasFiscais.map(n => parseInt(n.id.replace('nf', '')) || 0), 0) + 1);
    const nextNfNum = String(Math.max(...notasFiscais.map(n => parseInt(n.numero) || 0), 100) + 1).padStart(6, '0');
    const novaNF: NotaFiscal = {
      id: nextNfId,
      referenciaId: id,
      referenciaTipo: 'Venda',
      tipo: 'Produto',
      numero: nextNfNum,
      status: 'emitida',
      data,
      valorTotal,
      clienteNome
    };
    setNotasFiscais(prev => [novaNF, ...prev]);

    // Deduct items from stock!
    newVenda.itens.forEach(item => {
      setProdutos(prev => prev.map(p => {
        if (p.id === item.produtoId) {
          const novoEstoque = Math.max(0, p.estoqueAtual - item.quantidade);
          return { ...p, estoqueAtual: novoEstoque };
        }
        return p;
      }));
    });
  };

  const deleteVenda = (id: string) => {
    setVendas(prev => prev.filter(v => v.id !== id));
  };

  // RECIBOS
  const addRecibo = (newRecibo: Omit<Recibo, 'id'> & { data?: string }) => {
    const id = 'rec' + (Math.max(...recibos.map(r => parseInt(r.id.replace('rec', '')) || 0), 0) + 1);
    const data = newRecibo.data || getFormattedDate();
    const rec: Recibo = { ...newRecibo, id, data };
    setRecibos(prev => [rec, ...prev]);
  };

  const deleteRecibo = (id: string) => {
    setRecibos(prev => prev.filter(r => r.id !== id));
  };

  // NOTAS FISCAIS
  const addNotaFiscal = (newNF: Omit<NotaFiscal, 'id' | 'data'>) => {
    const id = 'nf' + (Math.max(...notasFiscais.map(n => parseInt(n.id.replace('nf', '')) || 0), 0) + 1);
    const data = getFormattedDate();
    const nf: NotaFiscal = { ...newNF, id, data };
    setNotasFiscais(prev => [nf, ...prev]);
  };

  const updateNotaFiscalStatus = (id: string, status: NotaFiscal['status']) => {
    setNotasFiscais(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const deleteNotaFiscal = (id: string) => {
    setNotasFiscais(prev => prev.filter(n => n.id !== id));
  };

  // CONFIGURACOES
  const updateConfiguracoes = (updatedFields: Partial<Configuracoes>) => {
    setConfiguracoes(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AppContext.Provider value={{
      clientes, veiculos, produtos, servicos, ordensServico, orcamentos, vendas, recibos, notasFiscais, configuracoes,
      addCliente, updateCliente, deleteCliente,
      addVeiculo, updateVeiculo, deleteVeiculo,
      addProduto, updateProduto, deleteProduto,
      addServico, updateServico, deleteServico,
      addOS, updateOS, deleteOS, alterarStatusOS,
      addOrcamento, updateOrcamento, deleteOrcamento, aprovarOrcamento, recusarOrcamento,
      addVenda, deleteVenda,
      addRecibo, deleteRecibo,
      addNotaFiscal, updateNotaFiscalStatus, deleteNotaFiscal,
      updateConfiguracoes,
      searchQuery, setSearchQuery,
      activeTab, setActiveTab,
      prefilledClienteId, setPrefilledClienteId,
      showToast, confirmAction,
      toast, setToast,
      confirmConfig, setConfirmConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
