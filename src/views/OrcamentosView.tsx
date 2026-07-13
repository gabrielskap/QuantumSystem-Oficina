import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Orçamento, ItemOS, StatusOrcamento, OrdemServico } from '../types';
import { formatCurrency, formatPhone, formatDocument, formatCEP } from '../utils';
import { 
  ClipboardCheck, Plus, Search, Edit2, Trash2, X, Check, Info, FileText, Ban,
  Printer, Share2, Send, Mail, AlertTriangle, Clock, ArrowRight, Copy, CheckSquare,
  User, Car, Calendar, DollarSign, Wrench, FileCheck2, Sparkles, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OrcamentosView: React.FC = () => {
  const { 
    orcamentos, clientes, veiculos, produtos, servicos, configuracoes,
    addOrcamento, updateOrcamento, deleteOrcamento, aprovarOrcamento, recusarOrcamento, searchQuery,
    showToast, confirmAction
  } = useApp();

  // Navigation & Filtering
  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusOrcamento | 'todos'>('todos');
  const [filterBadge, setFilterBadge] = useState<'all' | 'expired' | 'near_expiry'>('all');

  // Form Open State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orçamento | null>(null);

  // Sharing Modal State
  const [sharingOrcamento, setSharingOrcamento] = useState<Orçamento | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied_wa' | 'copied_mail'>('idle');

  // Commercial View Modal State
  const [viewingOrcamento, setViewingOrcamento] = useState<Orçamento | null>(null);

  // Form Fields State
  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [validadePreset, setValidadePreset] = useState<string>('15');
  const [validade, setValidade] = useState('');
  const [status, setStatus] = useState<StatusOrcamento>('pendente');
  const [observacoes, setObservacoes] = useState('');
  const [valorMaoDeObra, setValorMaoDeObra] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  
  // Items State in Form
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'servico' | 'peca'>('servico');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper date parsing & manipulation
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    if (!d1 || !d2) return 0;
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = d1.getTime() - d2.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTodayDateStr = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const addDaysToDate = (dateStr: string, days: number): string => {
    const date = parseDate(dateStr) || new Date();
    date.setDate(date.getDate() + days);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Pre-calculate statistics
  const todayStr = getTodayDateStr();
  const pendingOrcamentos = orcamentos.filter(o => o.status === 'pendente');
  
  const expiredCount = pendingOrcamentos.filter(o => {
    const diff = getDaysDifference(o.validade, todayStr);
    return diff < 0;
  }).length;

  const nearExpiryCount = pendingOrcamentos.filter(o => {
    const diff = getDaysDifference(o.validade, todayStr);
    return diff >= 0 && diff <= 3;
  }).length;

  const activePendingCount = pendingOrcamentos.length - expiredCount;

  // Auto calculate date when preset changes
  useEffect(() => {
    if (validadePreset !== 'custom' && isFormOpen) {
      const days = parseInt(validadePreset, 10);
      setValidade(addDaysToDate(getTodayDateStr(), days));
    }
  }, [validadePreset, isFormOpen]);

  const resetForm = () => {
    setClienteId(clientes[0]?.id || '');
    const firstCliId = clientes[0]?.id || '';
    const cliVehs = veiculos.filter(v => v.clienteId === firstCliId);
    setVeiculoId(cliVehs[0]?.id || '');
    setValidadePreset('15');
    setValidade(addDaysToDate(getTodayDateStr(), 15));
    setStatus('pendente');
    setObservacoes('');
    setItens([]);
    setValorMaoDeObra(0);
    setDesconto(0);
    setFormErrors({});
    setEditingOrcamento(null);
  };

  const handleEdit = (orc: Orçamento) => {
    setEditingOrcamento(orc);
    setClienteId(orc.clienteId);
    setVeiculoId(orc.veiculoId);
    setValidade(orc.validade);
    setValidadePreset('custom'); // Choose custom to display loaded date
    setStatus(orc.status);
    setObservacoes(orc.observacoes || '');
    setItens(orc.itens);
    setValorMaoDeObra(orc.valorMaoDeObra || 0);
    setDesconto(orc.desconto || 0);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleClienteChange = (id: string) => {
    setClienteId(id);
    const cliVehicles = veiculos.filter(v => v.clienteId === id);
    setVeiculoId(cliVehicles[0]?.id || '');
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;
    
    let name = '';
    let price = itemPrice;

    if (selectedItemType === 'servico') {
      const s = servicos.find(x => x.id === selectedItemId);
      name = s ? s.descricao : '';
      if (price === 0 && s) price = s.valorPadrao;
    } else {
      const p = produtos.find(x => x.id === selectedItemId);
      name = p ? p.nome : '';
      if (price === 0 && p) price = p.precoVenda;
    }

    const existingIndex = itens.findIndex(i => i.id === selectedItemId && i.tipo === selectedItemType);
    if (existingIndex > -1) {
      const updated = [...itens];
      updated[existingIndex].quantidade += itemQty;
      setItens(updated);
    } else {
      const newItem: ItemOS = {
        id: selectedItemId,
        tipo: selectedItemType,
        descricao: name,
        quantidade: itemQty,
        valorUnitario: price
      };
      setItens([...itens, newItem]);
    }

    setSelectedItemId('');
    setItemQty(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const totalItens = itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
  const calculatedGrandTotal = Math.max(0, totalItens + Number(valorMaoDeObra) - Number(desconto));

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!clienteId) errors.clienteId = 'Por favor, selecione um cliente.';
    if (!veiculoId) errors.veiculoId = 'Por favor, associe um veículo.';
    
    if (!validade.trim()) {
      errors.validade = 'Validade do orçamento é obrigatória.';
    } else {
      const parsed = parseDate(validade);
      if (!parsed) {
        errors.validade = 'Insira uma data válida no formato dd/mm/aaaa.';
      }
    }
    
    if (itens.length === 0) errors.itens = 'Adicione ao menos um item de serviço ou peça.';
    if (isNaN(Number(valorMaoDeObra)) || Number(valorMaoDeObra) < 0) errors.valorMaoDeObra = 'Insira um valor válido para Mão de Obra.';
    if (isNaN(Number(desconto)) || Number(desconto) < 0) errors.desconto = 'Insira um desconto válido.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const orcData = {
      clienteId,
      veiculoId,
      itens,
      validade,
      status,
      observacoes,
      valorMaoDeObra: Number(valorMaoDeObra),
      desconto: Number(desconto)
    };

    if (editingOrcamento) {
      updateOrcamento(editingOrcamento.numero, orcData);
      showToast(`Orçamento nº ${editingOrcamento.numero} atualizado com sucesso!`, 'success');
    } else {
      const nextNum = addOrcamento(orcData);
      showToast(`Orçamento nº ${nextNum} gerado com sucesso!`, 'success');
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDelete = (num: string) => {
    confirmAction({
      title: 'Excluir Orçamento',
      message: `Tem certeza de que deseja excluir permanentemente o orçamento nº ${num}? Esta ação é irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteOrcamento(num);
        showToast(`Orçamento nº ${num} excluído com sucesso!`, 'success');
      }
    });
  };

  const handleConverterEmOS = (num: string) => {
    confirmAction({
      title: 'Aprovar Orçamento e Gerar OS',
      message: `Deseja aprovar o orçamento nº ${num} e convertê-lo automaticamente em uma Ordem de Serviço (OS)?`,
      confirmText: 'Aprovar e Gerar OS',
      cancelText: 'Voltar',
      onConfirm: () => {
        aprovarOrcamento(num);
        showToast(`Orçamento nº ${num} aprovado! Uma nova Ordem de Serviço foi gerada.`, 'success');
      }
    });
  };

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredOrcamentos = orcamentos.filter(orc => {
    const client = clientes.find(c => c.id === orc.clienteId);
    const vehicle = veiculos.find(v => v.id === orc.veiculoId);

    // Filter by tab
    if (activeTab !== 'todos' && orc.status !== activeTab) return false;

    // Filter by expiration metrics (when clicking dashboard cards)
    if (orc.status === 'pendente') {
      const diffDays = getDaysDifference(orc.validade, todayStr);
      if (filterBadge === 'expired' && diffDays >= 0) return false;
      if (filterBadge === 'near_expiry' && (diffDays < 0 || diffDays > 3)) return false;
    } else {
      if (filterBadge !== 'all') return false; // Approved or Recused can't be expired
    }

    // Filter search text
    if (!combinedSearch) return true;
    return (
      orc.numero.includes(combinedSearch) ||
      (client && client.nome.toLowerCase().includes(combinedSearch)) ||
      (vehicle && vehicle.modelo.toLowerCase().includes(combinedSearch)) ||
      (vehicle && vehicle.placa.toLowerCase().includes(combinedSearch))
    );
  });

  const renderItemSelectorOptions = () => {
    if (selectedItemType === 'servico') {
      return servicos.map(s => (
        <option key={s.id} value={s.id}>
          {s.descricao} ({formatCurrency(s.valorPadrao)})
        </option>
      ));
    } else {
      return produtos.map(p => (
        <option key={p.id} value={p.id}>
          {p.nome} ({formatCurrency(p.precoVenda)} - Est: {p.estoqueAtual})
        </option>
      ));
    }
  };

  // Helper to determine expiry status of pending budgets
  const getBudgetExpiryInfo = (orc: Orçamento) => {
    if (orc.status !== 'pendente') {
      return { label: orc.status === 'aprovado' ? 'Aprovado' : 'Recusado', style: orc.status === 'aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-300' };
    }

    const diffDays = getDaysDifference(orc.validade, todayStr);
    if (diffDays < 0) {
      return { 
        label: `Vencido (${Math.abs(diffDays)}d)`, 
        style: 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300 animate-pulse font-bold',
        icon: <AlertTriangle size={12} className="inline mr-1 text-rose-600" />
      };
    } else if (diffDays <= 3) {
      return { 
        label: `Vence em ${diffDays === 0 ? 'hoje' : diffDays + 'd'}`, 
        style: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
        icon: <Clock size={12} className="inline mr-1 text-amber-700" />
      };
    }

    return { 
      label: 'Pendente', 
      style: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: null
    };
  };

  // Generating sharing templates
  const getWhatsAppShareLink = (orc: Orçamento) => {
    const client = clientes.find(c => c.id === orc.clienteId);
    const vehicle = veiculos.find(v => v.id === orc.veiculoId);
    if (!client) return '';

    const vehicleText = vehicle ? `*${vehicle.marca} ${vehicle.modelo} [${vehicle.placa}]*` : 'veículo';
    const itemsText = orc.itens.map(item => `• _${item.descricao}_ (x${item.quantidade}): ${formatCurrency(item.valorUnitario)}`).join('\n');
    const partsSum = orc.itens.filter(i => i.tipo === 'peca').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
    const servicesSum = orc.itens.filter(i => i.tipo === 'servico').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);

    const message = `*ORÇAMENTO Nº ${orc.numero} - ${configuracoes.nomeOficina}*\n\n` +
      `Olá, *${client.nome}*! Segue o detalhamento do orçamento para o seu ${vehicleText}:\n\n` +
      `*ITENS DO ORÇAMENTO:*\n${itemsText}\n\n` +
      `*RESUMO DE VALORES:*\n` +
      `• Total de Peças/Serviços: ${formatCurrency(partsSum + servicesSum)}\n` +
      `• Mão de Obra: ${formatCurrency(orc.valorMaoDeObra || 0)}\n` +
      `• Desconto: -${formatCurrency(orc.desconto || 0)}\n` +
      `*VALOR TOTAL ESTIMADO: ${formatCurrency(orc.valorTotal)}*\n\n` +
      `*CONDIÇÕES:*\n` +
      `📅 Validade do Orçamento: ${orc.validade}\n` +
      `${orc.observacoes ? `📝 Observações: _${orc.observacoes}_\n` : ''}\n` +
      `Para aprovar os serviços ou tirar qualquer dúvida, basta responder esta mensagem. Obrigado pela preferência!`;

    return `https://wa.me/${client.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getEmailShareData = (orc: Orçamento) => {
    const client = clientes.find(c => c.id === orc.clienteId);
    const vehicle = veiculos.find(v => v.id === orc.veiculoId);
    if (!client) return { subject: '', body: '' };

    const vehicleText = vehicle ? `${vehicle.marca} ${vehicle.modelo} (Placa: ${vehicle.placa})` : 'veículo';
    const itemsText = orc.itens.map(item => `- ${item.descricao} | Qtd: ${item.quantidade} | ${formatCurrency(item.valorUnitario)}`).join('\n');
    const partsSum = orc.itens.filter(i => i.tipo === 'peca').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
    const servicesSum = orc.itens.filter(i => i.tipo === 'servico').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);

    const subject = `Orçamento nº ${orc.numero} - ${configuracoes.nomeOficina}`;
    const body = `Olá, ${client.nome},\n\n` +
      `Agradecemos a oportunidade de atendê-lo. Segue o detalhamento do orçamento elaborado para o seu veículo ${vehicleText}:\n\n` +
      `DETALHAMENTO DOS ITENS:\n${itemsText}\n\n` +
      `RESUMO DOS VALORES:\n` +
      `- Peças e Serviços: ${formatCurrency(partsSum + servicesSum)}\n` +
      `- Valor da Mão de Obra: ${formatCurrency(orc.valorMaoDeObra || 0)}\n` +
      `- Desconto concedido: ${formatCurrency(orc.desconto || 0)}\n` +
      `-------------------------------------------\n` +
      `VALOR TOTAL DO ORÇAMENTO: ${formatCurrency(orc.valorTotal)}\n\n` +
      `CONDIÇÕES GERAIS:\n` +
      `- Orçamento válido até: ${orc.validade}\n` +
      `${orc.observacoes ? `- Observações: ${orc.observacoes}\n` : ''}\n` +
      `Caso queira aprovar a execução dos serviços, por favor entre em contato conosco por este e-mail ou no telefone ${configuracoes.telefone}.\n\n` +
      `Atenciosamente,\n` +
      `Equipe ${configuracoes.nomeOficina}\n` +
      `CNPJ: ${configuracoes.cnpj}\n` +
      `Telefone: ${configuracoes.telefone}\n` +
      `E-mail: ${configuracoes.email}`;

    return { subject, body };
  };

  const copyTextToClipboard = (text: string, type: 'wa' | 'mail') => {
    navigator.clipboard.writeText(text);
    setCopyStatus(type === 'wa' ? 'copied_wa' : 'copied_mail');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck size={22} className="text-[#0F4C5C]" />
            Módulo de Orçamentos
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans">
            Elabore propostas comerciais, acompanhe vencimentos e converta orçamentos aprovados em Ordens de Serviço instantaneamente.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-[#E39B00]"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} />
          <span>Elaborar Orçamento</span>
        </button>
      </div>

      {/* Expiration Indicators & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric card 1: Active Pendings */}
        <div 
          onClick={() => {
            setActiveTab('pendente');
            setFilterBadge('all');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pendente' && filterBadge === 'all'
              ? 'bg-sky-50 border-sky-400 shadow-sm ring-1 ring-sky-300'
              : 'bg-white border-gray-200 hover:border-sky-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Pendentes no Prazo</span>
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-800">{activePendingCount}</span>
            <span className="text-xs text-gray-500">orçamentos ativos</span>
          </div>
        </div>

        {/* Metric card 2: Expired Budgets */}
        <div 
          onClick={() => {
            setActiveTab('pendente');
            setFilterBadge('expired');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pendente' && filterBadge === 'expired'
              ? 'bg-rose-50 border-rose-400 shadow-sm ring-1 ring-rose-300'
              : 'bg-white border-gray-200 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Orçamentos Vencidos</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${expiredCount > 0 ? 'bg-rose-200 text-rose-800 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${expiredCount > 0 ? 'text-rose-600' : 'text-gray-800'}`}>{expiredCount}</span>
            <span className="text-xs text-gray-500">requerem atenção</span>
          </div>
        </div>

        {/* Metric card 3: Near Expiry Budgets */}
        <div 
          onClick={() => {
            setActiveTab('pendente');
            setFilterBadge('near_expiry');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pendente' && filterBadge === 'near_expiry'
              ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-gray-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Próximos do Vencimento</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-800">{nearExpiryCount}</span>
            <span className="text-xs text-gray-500">vencem em até 3 dias</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100" role="tablist">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'pendente', label: 'Pendentes' },
              { id: 'aprovado', label: 'Aprovados' },
              { id: 'recusado', label: 'Recusados' }
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id as StatusOrcamento | 'todos');
                  setFilterBadge('all'); // reset expiry filter badge when clicking standard tabs
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab.id && filterBadge === 'all'
                    ? 'bg-[#0F4C5C] text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
                style={{ minHeight: '32px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-500">
            {filteredOrcamentos.length} Orçamentos filtrados {filterBadge !== 'all' ? `(${filterBadge === 'expired' ? 'vencidos' : 'perto de vencer'})` : ''}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <label htmlFor="orc-search" className="sr-only">Pesquisar por Orçamento, Cliente ou Placa</label>
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
          <input
            id="orc-search"
            type="search"
            placeholder="Buscar por nº orçamento, cliente ou placa do veículo..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredOrcamentos.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-[#0F4C5C]/5 text-[#0F4C5C] flex items-center justify-center rounded-full mx-auto">
            <ClipboardCheck size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800">Nenhum orçamento encontrado</h3>
            <p className="text-sm text-gray-500 mt-1">
              {combinedSearch 
                ? 'Nenhum orçamento corresponde aos seus critérios de busca.' 
                : 'Não há orçamentos registrados com este status ou filtro.'}
            </p>
          </div>
          {!combinedSearch && filterBadge === 'all' && (
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-semibold transition-colors"
              style={{ minHeight: '44px' }}
            >
              <Plus size={18} />
              <span>Emitir Primeiro Orçamento</span>
            </button>
          )}
          {filterBadge !== 'all' && (
            <button
              onClick={() => { setFilterBadge('all'); }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              style={{ minHeight: '44px' }}
            >
              <span>Ver Todos os Orçamentos</span>
            </button>
          )}
        </div>
      ) : (
        /* Estimates List Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nº Orçamento</th>
                  <th className="px-6 py-4">Cliente e Veículo</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Seguimento de Custos</th>
                  <th className="px-6 py-4 text-center">Status / Prazo</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOrcamentos.map((orc) => {
                  const client = clientes.find(c => c.id === orc.clienteId);
                  const vehicle = veiculos.find(v => v.id === orc.veiculoId);
                  const expiryInfo = getBudgetExpiryInfo(orc);
                  
                  return (
                    <tr key={orc.numero} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        #{orc.numero}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{client?.nome || '—'}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">
                          {vehicle ? `${vehicle.marca} ${vehicle.modelo} [${vehicle.placa}]` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600"><span className="font-semibold text-gray-400 mr-1">Gerado:</span> {orc.data}</div>
                        <div className="text-xs text-gray-600 mt-1 font-semibold"><span className="font-semibold text-gray-400 mr-1">Vence:</span> {orc.validade}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {orc.itens.length} itens ({orc.itens.filter(i => i.tipo === 'servico').length} srv. / {orc.itens.filter(i => i.tipo === 'peca').length} pçs)
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          M.Obra: {formatCurrency(orc.valorMaoDeObra || 0)} | Desc: -{formatCurrency(orc.desconto || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${expiryInfo.style}`}>
                          {expiryInfo.icon}
                          {expiryInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                        {formatCurrency(orc.valorTotal)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Approve and Converter em OS for Pending */}
                          {orc.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleConverterEmOS(orc.numero)}
                                title="Converter em OS (Aprovar)"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 hover:border-emerald-300"
                              >
                                <FileCheck2 size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Tem certeza de que deseja recusar o orçamento nº ${orc.numero}?`)) {
                                    recusarOrcamento(orc.numero);
                                    showToast(`Orçamento nº ${orc.numero} marcado como Recusado.`);
                                  }
                                }}
                                title="Recusar Orçamento"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}

                          {/* Print Commercial Document */}
                          <button
                            onClick={() => setViewingOrcamento(orc)}
                            title="Gerar orçamento comercial (Impressão)"
                            className="p-1.5 text-[#0F4C5C] hover:bg-sky-50 rounded-lg transition-colors border border-sky-100"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={() => setSharingOrcamento(orc)}
                            title="Compartilhar no WhatsApp / E-mail"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-colors"
                          >
                            <Share2 size={15} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(orc)}
                            title="Editar Orçamento"
                            className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(orc.numero)}
                            title="Excluir Orçamento"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPARTILHAR MODAL */}
      <AnimatePresence>
        {sharingOrcamento && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Share2 size={18} className="text-[#0F4C5C]" />
                  <h3 className="text-base font-bold text-gray-800">
                    Compartilhar Orçamento #{sharingOrcamento.numero}
                  </h3>
                </div>
                <button
                  onClick={() => setSharingOrcamento(null)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* WHATSAPP CONTAINER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Send size={14} className="text-emerald-600" />
                      Template para WhatsApp (Texto com negrito do app)
                    </span>
                    <button
                      onClick={() => {
                        const tempText = getWhatsAppShareLink(sharingOrcamento).split('text=')[1];
                        copyTextToClipboard(decodeURIComponent(tempText || ''), 'wa');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                    >
                      <Copy size={12} />
                      {copyStatus === 'copied_wa' ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap text-gray-600 leading-relaxed">
                    {sharingOrcamento && decodeURIComponent(getWhatsAppShareLink(sharingOrcamento).split('text=')[1] || '')}
                  </div>
                  <a
                    href={getWhatsAppShareLink(sharingOrcamento)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                    style={{ minHeight: '38px' }}
                  >
                    <Send size={14} />
                    <span>Enviar direto para WhatsApp</span>
                  </a>
                </div>

                {/* EMAIL CONTAINER */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Mail size={14} className="text-indigo-600" />
                      Template para E-mail Comercial
                    </span>
                    <button
                      onClick={() => {
                        const mailData = getEmailShareData(sharingOrcamento);
                        copyTextToClipboard(mailData.body, 'mail');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                    >
                      <Copy size={12} />
                      {copyStatus === 'copied_mail' ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap text-gray-600 leading-relaxed">
                    <strong>Assunto:</strong> {getEmailShareData(sharingOrcamento).subject}
                    <br /><br />
                    {getEmailShareData(sharingOrcamento).body}
                  </div>
                  <a
                    href={`mailto:${clientes.find(c => c.id === sharingOrcamento.clienteId)?.email || ''}?subject=${encodeURIComponent(getEmailShareData(sharingOrcamento).subject)}&body=${encodeURIComponent(getEmailShareData(sharingOrcamento).body)}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
                    style={{ minHeight: '38px' }}
                  >
                    <Mail size={14} />
                    <span>Enviar por Cliente de E-mail (mailto)</span>
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSharingOrcamento(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold"
                  style={{ minHeight: '36px' }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GERAR ORÇAMENTO COMERCIAL (A4 PREMIUM VIEW) */}
      <AnimatePresence>
        {viewingOrcamento && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Inject print-specific styling dynamically */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-budget, #printable-budget * {
                  visibility: visible !important;
                }
                #printable-budget {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 20px !important;
                  box-shadow: none !important;
                  background: white !important;
                }
              }
            `}</style>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
              role="dialog"
            >
              {/* Header Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0F4C5C]" />
                  <span className="text-sm font-bold text-gray-700">Visualização de Proposta Comercial para Impressão</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    <Printer size={14} />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                  <button
                    onClick={() => setViewingOrcamento(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-8 flex-1 bg-gray-100 overflow-y-auto print:bg-white print:p-0">
                <div 
                  id="printable-budget" 
                  className="bg-white mx-auto p-10 max-w-[210mm] border border-gray-300 shadow-md font-sans text-gray-800 print:border-none print:shadow-none print:p-0"
                >
                  {/* Workshop Information & Budget Identifier */}
                  <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-gray-800 pb-6 gap-6">
                    <div className="space-y-1">
                      <h1 className="text-2xl font-black text-[#0F4C5C] tracking-tight">{configuracoes.nomeOficina}</h1>
                      <p className="text-xs text-gray-500 font-bold">SOLUÇÕES AUTOMOTIVAS PROFISSIONAIS</p>
                      <div className="text-xs text-gray-600 space-y-0.5 pt-2">
                        <div><strong>CNPJ:</strong> {configuracoes.cnpj}</div>
                        <div><strong>Endereço:</strong> {configuracoes.endereco.rua}, {configuracoes.endereco.numero} - {configuracoes.endereco.bairro}</div>
                        <div>{configuracoes.endereco.cidade} - {configuracoes.endereco.uf} | CEP: {formatCEP(configuracoes.endereco.cep)}</div>
                        <div><strong>Telefone:</strong> {formatPhone(configuracoes.telefone)} | <strong>E-mail:</strong> {configuracoes.email}</div>
                      </div>
                    </div>

                    <div className="text-right space-y-1 bg-gray-50 p-4 border border-gray-200 rounded-lg min-w-[220px]">
                      <div className="text-xs text-[#0F4C5C] uppercase tracking-wider font-extrabold">PROPOSTA DE ORÇAMENTO</div>
                      <div className="text-xl font-mono font-black text-gray-800">Nº {viewingOrcamento.numero}</div>
                      <div className="text-[11px] text-gray-500 space-y-0.5 pt-2">
                        <div><strong>Data de Emissão:</strong> {viewingOrcamento.data}</div>
                        <div><strong>Válido até:</strong> {viewingOrcamento.validade}</div>
                        <div><strong>Status:</strong> <span className="uppercase font-bold">{viewingOrcamento.status}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Customer and Vehicle Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-b border-gray-200 pb-6">
                    {/* Customer */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#0F4C5C] uppercase tracking-wider border-b border-gray-200 pb-1">
                        DADOS DO CLIENTE
                      </h3>
                      {(() => {
                        const client = clientes.find(c => c.id === viewingOrcamento.clienteId);
                        if (!client) return <p className="text-xs text-gray-400">Cliente não identificado.</p>;
                        return (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="text-sm font-bold text-gray-800">{client.nome}</div>
                            <div><strong>CPF/CNPJ:</strong> {formatDocument(client.documento)}</div>
                            <div><strong>Telefone:</strong> {formatPhone(client.telefone)}</div>
                            <div><strong>E-mail:</strong> {client.email}</div>
                            <div><strong>Endereço:</strong> {client.endereco.rua}, {client.endereco.numero} - {client.endereco.bairro}, {client.endereco.cidade} - {client.endereco.uf}</div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Vehicle */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#0F4C5C] uppercase tracking-wider border-b border-gray-200 pb-1">
                        IDENTIFICAÇÃO DO VEÍCULO
                      </h3>
                      {(() => {
                        const vehicle = veiculos.find(v => v.id === viewingOrcamento.veiculoId);
                        if (!vehicle) return <p className="text-xs text-gray-400">Veículo não identificado.</p>;
                        return (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="text-sm font-bold text-gray-800">{vehicle.marca} {vehicle.modelo}</div>
                            <div><strong>Placa:</strong> <span className="font-mono bg-gray-50 px-1 py-0.5 border border-gray-200 rounded font-bold">{vehicle.placa}</span></div>
                            <div><strong>Ano Fabricação:</strong> {vehicle.ano} | <strong>Cor:</strong> {vehicle.cor}</div>
                            <div><strong>Combustível:</strong> {vehicle.combustivel}</div>
                            <div><strong>Km Atual:</strong> {vehicle.quilometragem.toLocaleString()} km</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xs font-black text-[#0F4C5C] uppercase tracking-wider">
                      DESCRIÇÃO DOS SERVIÇOS E PEÇAS SOLICITADOS
                    </h3>
                    
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-y-2 border-gray-300 text-gray-700">
                          <th className="p-3">Descrição do Item</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3 text-center">Quantidade</th>
                          <th className="p-3 text-right">Valor Unitário</th>
                          <th className="p-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-600">
                        {viewingOrcamento.itens.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-semibold text-gray-800">{item.descricao}</td>
                            <td className="p-3 capitalize">{item.tipo === 'servico' ? 'Serviço' : 'Peça'}</td>
                            <td className="p-3 text-center font-mono">{item.quantidade}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="p-3 text-right font-mono font-bold text-gray-800">
                              {formatCurrency(item.quantidade * item.valorUnitario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Costs Section */}
                  <div className="mt-8 flex flex-col items-end">
                    <div className="w-full sm:w-[350px] space-y-2 text-xs border-t-2 border-gray-300 pt-4">
                      {(() => {
                        const partsTotal = viewingOrcamento.itens.filter(i => i.tipo === 'peca').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
                        const servicesTotal = viewingOrcamento.itens.filter(i => i.tipo === 'servico').reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
                        return (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span>Soma das Peças:</span>
                              <span className="font-mono">{formatCurrency(partsTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Soma dos Serviços:</span>
                              <span className="font-mono">{formatCurrency(servicesTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Mão de Obra Geral:</span>
                              <span className="font-mono">{formatCurrency(viewingOrcamento.valorMaoDeObra || 0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Desconto Especial:</span>
                              <span className="font-mono text-rose-600">-{formatCurrency(viewingOrcamento.desconto || 0)}</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-[#0F4C5C] pt-2 border-t border-gray-200">
                              <span>VALOR ESTIMADO GERAL:</span>
                              <span className="font-mono text-lg">{formatCurrency(viewingOrcamento.valorTotal)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mt-8 bg-gray-50 border border-gray-200 p-4 rounded-lg text-[11px] leading-relaxed text-gray-500">
                    <h4 className="font-bold text-[#0F4C5C] uppercase mb-1">CONDIÇÕES DE FORNECIMENTO</h4>
                    <p>1. Este documento trata-se de uma estimativa de preços prévia, válida até a data limite expressa no cabeçalho.</p>
                    <p>2. Havendo necessidade de serviços ou peças adicionais após a desmontagem do veículo, o cliente será consultado previamente.</p>
                    <p>3. Garantia legal de 3 meses para serviços prestados e peças novas aplicadas, contados a partir da data de entrega do veículo.</p>
                    {viewingOrcamento.observacoes && (
                      <p className="mt-2 text-gray-700 italic"><strong>Instruções do Orçamento:</strong> {viewingOrcamento.observacoes}</p>
                    )}
                  </div>

                  {/* Signature block */}
                  <div className="grid grid-cols-2 gap-12 mt-12 pt-8 text-center text-xs text-gray-500">
                    <div className="space-y-1">
                      <div className="border-t border-gray-400 w-full mx-auto pt-2 max-w-[220px]"></div>
                      <p className="font-bold">{configuracoes.nomeOficina}</p>
                      <p className="text-[10px]">Representante Autorizado</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-t border-gray-400 w-full mx-auto pt-2 max-w-[220px]"></div>
                      <p className="font-bold">{clientes.find(c => c.id === viewingOrcamento.clienteId)?.nome || 'Assinatura do Cliente'}</p>
                      <p className="text-[10px]">De acordo com os valores expressos</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Printable footer print controls */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => setViewingOrcamento(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold"
                  style={{ minHeight: '38px' }}
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white font-bold rounded-lg text-xs transition-colors"
                  style={{ minHeight: '38px' }}
                >
                  <Printer size={14} />
                  <span>Imprimir Orçamento</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ESTIMATE CREATION / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orc-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 id="orc-modal-title" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-[#E39B00]" />
                {editingOrcamento ? `Editar Orçamento nº ${editingOrcamento.numero}` : 'Elaborar Proposta de Orçamento'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Cliente and Veículo */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  1. Cliente e Veículo Relacionado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="orc-form-cliente" className="block text-xs font-bold text-gray-700 mb-1.5">Cliente Dono *</label>
                    <select
                      id="orc-form-cliente"
                      value={clienteId}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.clienteId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Escolha o cliente --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.documento})</option>
                      ))}
                    </select>
                    {formErrors.clienteId && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.clienteId}</span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="orc-form-veiculo" className="block text-xs font-bold text-gray-700 mb-1.5">Automóvel Relacionado *</label>
                    <select
                      id="orc-form-veiculo"
                      value={veiculoId}
                      onChange={(e) => setVeiculoId(e.target.value)}
                      disabled={!clienteId}
                      className={`w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.veiculoId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Escolha o veículo --</option>
                      {veiculos
                        .filter(v => v.clienteId === clienteId)
                        .map(v => (
                          <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                        ))}
                    </select>
                    {formErrors.veiculoId && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.veiculoId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Specs and Validation dates */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  2. Condições e Validade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="orc-form-preset" className="block text-xs font-bold text-gray-700 mb-1.5">Prazo de Validade</label>
                    <select
                      id="orc-form-preset"
                      value={validadePreset}
                      onChange={(e) => setValidadePreset(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    >
                      <option value="7">7 dias</option>
                      <option value="15">15 dias</option>
                      <option value="30">30 dias</option>
                      <option value="custom">Data Personalizada</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="orc-form-validade" className="block text-xs font-bold text-gray-700 mb-1.5">Validade do Orçamento *</label>
                    <input
                      id="orc-form-validade"
                      type="text"
                      placeholder="Ex: 28/07/2026"
                      value={validade}
                      onChange={(e) => setValidade(e.target.value)}
                      disabled={validadePreset !== 'custom'}
                      className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                        validadePreset !== 'custom' ? 'bg-gray-100 text-gray-600' : 'bg-white'
                      } ${
                        formErrors.validade ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.validade && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.validade}</span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="orc-form-status" className="block text-xs font-bold text-gray-700 mb-1.5">Status da Negociação</label>
                    <select
                      id="orc-form-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusOrcamento)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="recusado">Recusado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="orc-form-obs" className="block text-xs font-bold text-gray-700 mb-1.5">Observações Internas / Termos de Garantia</label>
                  <textarea
                    id="orc-form-obs"
                    rows={2}
                    placeholder="Valores válidos por 15 dias. Garantia de 3 meses para as peças novas aplicadas."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
              </div>

              {/* Items adder */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  3. Serviços e Peças Orçados
                </h4>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label htmlFor="orc-item-tipo" className="block text-[11px] font-bold text-gray-600 mb-1">Tipo de Item</label>
                    <select
                      id="orc-item-tipo"
                      value={selectedItemType}
                      onChange={(e) => {
                        setSelectedItemType(e.target.value as 'servico' | 'peca');
                        setSelectedItemId('');
                      }}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="servico">Serviço</option>
                      <option value="peca">Peça</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="orc-item-id" className="block text-[11px] font-bold text-gray-600 mb-1">Selecionar Item</label>
                    <select
                      id="orc-item-id"
                      value={selectedItemId}
                      onChange={(e) => {
                        setSelectedItemId(e.target.value);
                        if (selectedItemType === 'servico') {
                          const s = servicos.find(x => x.id === e.target.value);
                          setItemPrice(s ? s.valorPadrao : 0);
                        } else {
                          const p = produtos.find(x => x.id === e.target.value);
                          setItemPrice(p ? p.precoVenda : 0);
                        }
                      }}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="">-- Escolha o item --</option>
                      {renderItemSelectorOptions()}
                    </select>
                  </div>

                  <div className="flex gap-2 w-full">
                    <div className="w-1/2">
                      <label htmlFor="orc-item-qty" className="block text-[11px] font-bold text-gray-600 mb-1">Qtd</label>
                      <input
                        id="orc-item-qty"
                        type="number"
                        min={1}
                        value={itemQty}
                        onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-mono text-center"
                      />
                    </div>
                    <div className="w-1/2 self-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full text-xs font-bold text-white bg-[#0F4C5C] hover:bg-[#0C3D4A] p-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        style={{ minHeight: '36px' }}
                      >
                        + Incluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold border-b border-gray-200 text-gray-600 uppercase">
                        <th className="p-3">Descrição do Item</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {itens.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                            Nenhum item adicionado ao orçamento.
                          </td>
                        </tr>
                      ) : (
                        itens.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-gray-800">{item.descricao}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                item.tipo === 'servico' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                              }`}>
                                {item.tipo === 'servico' ? 'Serviço' : 'Peça'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">{item.quantidade}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {formErrors.itens && (
                  <span className="text-xs text-red-600 font-semibold block">{formErrors.itens}</span>
                )}
              </div>

              {/* Labor (Mão de obra) and Discount (Desconto) - Structural matches with OS */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  4. Custos Gerais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="orc-form-mao-obra" className="block text-xs font-bold text-gray-700 mb-1.5">Mão de Obra Adicional Geral (R$)</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-400 text-xs font-semibold">R$</div>
                      <input
                        id="orc-form-mao-obra"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={valorMaoDeObra || ''}
                        onChange={(e) => setValorMaoDeObra(Number(e.target.value))}
                        className={`w-full text-sm border rounded-lg p-2.5 pl-8 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                          formErrors.valorMaoDeObra ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {formErrors.valorMaoDeObra && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.valorMaoDeObra}</span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="orc-form-desconto" className="block text-xs font-bold text-gray-700 mb-1.5">Desconto Especial (R$)</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-400 text-xs font-semibold">R$</div>
                      <input
                        id="orc-form-desconto"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={desconto || ''}
                        onChange={(e) => setDesconto(Number(e.target.value))}
                        className={`w-full text-sm border rounded-lg p-2.5 pl-8 font-mono text-rose-700 focus:ring-2 focus:ring-[#0F4C5C] ${
                          formErrors.desconto ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {formErrors.desconto && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.desconto}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Valuation sum */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-200 gap-2">
                <div className="text-xs text-gray-500 font-medium">
                  <div>Soma dos Itens: {formatCurrency(totalItens)}</div>
                  <div>Mão de Obra: +{formatCurrency(valorMaoDeObra)}</div>
                  <div>Desconto: -{formatCurrency(desconto)}</div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm font-bold text-gray-600">Total Proposto Geral:</span>
                  <span className="text-2xl font-black text-[#0F4C5C] font-mono">{formatCurrency(calculatedGrandTotal)}</span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  style={{ minHeight: '44px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  {editingOrcamento ? 'Salvar Orçamento' : 'Emitir Orçamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
