import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrdemServico, ItemOS, StatusOS } from '../types';
import { formatCurrency, formatPhone, formatDocument } from '../utils';
import { 
  FileText, Plus, Search, Edit2, Trash2, X, Check, 
  Car, User, Calendar, Wrench, ChevronDown, Printer, AlertTriangle, Play,
  List, Kanban, Cpu, FileCheck
} from 'lucide-react';
import { EmitirNotaModal } from '../components/EmitirNotaModal';

export const OSView: React.FC = () => {
  const { 
    ordensServico, clientes, veiculos, produtos, servicos, 
    addOS, updateOS, deleteOS, alterarStatusOS, searchQuery,
    showToast, confirmAction
  } = useApp();

  // Navigation / View states
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeFilter, setActiveFilter] = useState<StatusOS | 'todas'>('todas');
  const [localSearch, setLocalSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  
  // Active viewing OS details (printable sheet)
  const [viewingOS, setViewingOS] = useState<OrdemServico | null>(null);

  // Nota fiscal modal state
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [notaTargetOS, setNotaTargetOS] = useState<OrdemServico | null>(null);

  const handleEmitirNotaFromOS = (os: OrdemServico) => {
    setNotaTargetOS(os);
    setIsNotaModalOpen(true);
  };

  // Helper to format today's date as dd/mm/aaaa
  const getFormattedDate = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Form Fields
  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [status, setStatus] = useState<StatusOS>('aberta');
  const [mecanicoResponsavel, setMecanicoResponsavel] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [valorMaoDeObra, setValorMaoDeObra] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  
  // OS Items Form State
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'servico' | 'peca'>('servico');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  // Form Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset OS Form
  const resetForm = () => {
    setClienteId(clientes[0]?.id || '');
    // Select first vehicle of that client if exists
    const firstCliId = clientes[0]?.id || '';
    const cliVehs = veiculos.filter(v => v.clienteId === firstCliId);
    setVeiculoId(cliVehs[0]?.id || '');
    setDataEntrada(getFormattedDate());
    setPrevisaoEntrega('');
    setStatus('aberta');
    setMecanicoResponsavel('');
    setDiagnostico('');
    setValorMaoDeObra(0);
    setDesconto(0);
    setItens([]);
    setFormErrors({});
    setEditingOS(null);
  };

  // Open edit
  const handleEdit = (os: OrdemServico) => {
    setEditingOS(os);
    setClienteId(os.clienteId);
    setVeiculoId(os.veiculoId);
    setDataEntrada(os.dataEntrada);
    setPrevisaoEntrega(os.previsaoEntrega);
    setStatus(os.status);
    setMecanicoResponsavel(os.mecanicoResponsavel);
    setDiagnostico(os.diagnostico);
    setValorMaoDeObra(os.valorMaoDeObra);
    setDesconto(os.desconto);
    setItens(os.itens);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Update chosen client & auto-filter vehicles
  const handleClienteChange = (id: string) => {
    setClienteId(id);
    const cliVehicles = veiculos.filter(v => v.clienteId === id);
    setVeiculoId(cliVehicles[0]?.id || '');
  };

  // Handle adding an item to the OS lists
  const handleAddItem = () => {
    if (!selectedItemId) return;
    
    // Find item details
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

    // Check if already exists in list
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

    // Reset item picker
    setSelectedItemId('');
    setItemQty(1);
    setItemPrice(0);
  };

  // Remove item from OS list
  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  // Dynamic values calculation
  const totalItens = itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
  const totalOS = Math.max(0, totalItens + Number(valorMaoDeObra) - Number(desconto));

  // Validate
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!clienteId) errors.clienteId = 'Por favor, selecione um cliente.';
    if (!veiculoId) errors.veiculoId = 'Por favor, associe um veículo.';
    if (!dataEntrada.trim()) errors.dataEntrada = 'Data de entrada é obrigatória.';
    if (!previsaoEntrega.trim()) errors.previsaoEntrega = 'Previsão de entrega é obrigatória.';
    if (!mecanicoResponsavel.trim()) errors.mecanicoResponsavel = 'Nome do mecânico responsável é obrigatório.';
    if (itens.length === 0) errors.itens = 'Adicione ao menos um serviço ou peça à Ordem de Serviço.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit OS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const osData = {
      clienteId,
      veiculoId,
      dataEntrada,
      previsaoEntrega,
      status,
      itens,
      valorMaoDeObra: Number(valorMaoDeObra),
      desconto: Number(desconto),
      mecanicoResponsavel,
      diagnostico
    };

    if (editingOS) {
      updateOS(editingOS.numero, osData);
      showToast(`Ordem de Serviço nº ${editingOS.numero} atualizada com sucesso!`, 'success');
    } else {
      const generatedNum = addOS(osData);
      showToast(`Ordem de Serviço nº ${generatedNum} aberta com sucesso!`, 'success');
    }

    setIsFormOpen(false);
    resetForm();
  };

  // Delete
  const handleDelete = (num: string) => {
    confirmAction({
      title: 'Excluir Ordem de Serviço',
      message: `Tem certeza de que deseja excluir permanentemente a OS nº ${num}? Esta ação removerá o histórico técnico associado.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteOS(num);
        showToast(`Ordem de Serviço nº ${num} excluída com sucesso!`, 'success');
      }
    });
  };

  // Quick action buttons for status
  const handleStatusChangeAction = (num: string, newStatus: StatusOS) => {
    alterarStatusOS(num, newStatus);
    showToast(`Status da OS nº ${num} alterado para "${newStatus.replace('_', ' ').toUpperCase()}"`, 'success');
  };

  // Filter & Search OS
  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredOS = ordensServico.filter(os => {
    const client = clientes.find(c => c.id === os.clienteId);
    const vehicle = veiculos.find(v => v.id === os.veiculoId);
    
    // Status filter
    if (activeFilter !== 'todas' && os.status !== activeFilter) return false;

    // Search query filter
    if (!combinedSearch) return true;
    return (
      os.numero.includes(combinedSearch) ||
      os.mecanicoResponsavel.toLowerCase().includes(combinedSearch) ||
      (client && client.nome.toLowerCase().includes(combinedSearch)) ||
      (vehicle && vehicle.modelo.toLowerCase().includes(combinedSearch)) ||
      (vehicle && vehicle.placa.toLowerCase().includes(combinedSearch))
    );
  });

  // Render items based on selection type
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
          {p.nome} - Cód: {p.codigo} ({formatCurrency(p.precoVenda)} - Est: {p.estoqueAtual})
        </option>
      ));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-[#0F4C5C]" />
            Ordens de Serviço (OS)
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans">
            Abertura, acompanhamento de progresso, orçamento aprovado e finalização técnica das manutenções.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-[#E39B00]"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} />
          <span>Criar Nova OS</span>
        </button>
      </div>

      {/* Tabs Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100" role="tablist">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'aberta', label: 'Abertas' },
              { id: 'em_andamento', label: 'Em Andamento' },
              { id: 'concluida', label: 'Concluídas' },
              { id: 'entregue', label: 'Entregues' },
              { id: 'cancelada', label: 'Canceladas' }
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeFilter === tab.id}
                onClick={() => setActiveFilter(tab.id as StatusOS | 'todas')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeFilter === tab.id 
                    ? 'bg-[#0F4C5C] text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
                style={{ minHeight: '32px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* List / Kanban View Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-800 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                style={{ minHeight: '32px' }}
              >
                <List size={14} /> Lista
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-800 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                style={{ minHeight: '32px' }}
              >
                <Kanban size={14} /> Kanban
              </button>
            </div>

            <div className="text-xs font-semibold text-gray-500">
              {filteredOS.length} Ordens encontradas
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <label htmlFor="os-search" className="sr-only">Pesquisar por OS, mecânico, cliente ou carro</label>
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
          <input
            id="os-search"
            type="search"
            placeholder="Buscar por nº OS, cliente, placa, modelo do carro ou mecânico..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredOS.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-[#0F4C5C]/5 text-[#0F4C5C] flex items-center justify-center rounded-full mx-auto">
            <FileText size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800">Nenhuma Ordem de Serviço</h3>
            <p className="text-sm text-gray-500 mt-1">
              {combinedSearch 
                ? 'Nenhuma ordem de serviço corresponde aos filtros ou pesquisa fornecidos. Redefina o filtro de abas ou limpe a caixa de pesquisa.' 
                : 'Não há ordens de serviço registradas nesta seção. Registre uma nova OS para iniciar o fluxo técnico.'}
            </p>
          </div>
          {!combinedSearch && (
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-semibold transition-colors"
              style={{ minHeight: '44px' }}
            >
              <Plus size={18} />
              <span>Abrir Primeira OS</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* OS List Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nº OS</th>
                  <th className="px-6 py-4">Cliente e Veículo</th>
                  <th className="px-6 py-4">Prazos</th>
                  <th className="px-6 py-4">Mecânico</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOS.map((os) => {
                  const client = clientes.find(c => c.id === os.clienteId);
                  const vehicle = veiculos.find(v => v.id === os.veiculoId);
                  
                  // Status stylings
                  const statusStyles: Record<string, string> = {
                    aberta: 'bg-blue-50 text-blue-700 border-blue-200',
                    em_andamento: 'bg-amber-50 text-amber-700 border-amber-200',
                    concluida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    entregue: 'bg-teal-50 text-teal-700 border-teal-200',
                    cancelada: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  const statusLabels: Record<string, string> = {
                    aberta: 'Aberta',
                    em_andamento: 'Em Andamento',
                    concluida: 'Concluída',
                    entregue: 'Entregue',
                    cancelada: 'Cancelada'
                  };

                  return (
                    <tr key={os.numero} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        #{os.numero}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{client?.nome || '—'}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">
                          {vehicle ? `${vehicle.marca} ${vehicle.modelo} [${vehicle.placa}]` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600"><span className="font-semibold text-gray-400 uppercase mr-1">Entrada:</span> {os.dataEntrada}</div>
                        <div className="text-xs text-gray-600 mt-1"><span className="font-semibold text-gray-400 uppercase mr-1">Previsão:</span> {os.previsaoEntrega}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700 text-xs">{os.mecanicoResponsavel}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[os.status]}`}>
                          {statusLabels[os.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                        {formatCurrency(os.valorTotal)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick trigger workflow buttons depending on state */}
                          {os.status === 'aberta' && (
                            <button
                              onClick={() => handleStatusChangeAction(os.numero, 'em_andamento')}
                              title="Iniciar Serviço"
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded-md"
                            >
                              <Play size={16} />
                            </button>
                          )}
                          {os.status === 'em_andamento' && (
                            <button
                              onClick={() => handleStatusChangeAction(os.numero, 'concluida')}
                              title="Concluir Serviço"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          
                          {/* Details/Print Button */}
                          <button
                            onClick={() => setViewingOS(os)}
                            title="Ver Detalhes / Ficha de Impressão"
                            className="p-1.5 text-[#0F4C5C] hover:bg-gray-100 rounded-lg"
                          >
                            <Printer size={16} />
                          </button>

                          {/* Emitir Nota Fiscal Button */}
                          <button
                            onClick={() => handleEmitirNotaFromOS(os)}
                            title="Emitir Nota Fiscal"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                          >
                            <FileCheck size={16} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(os)}
                            title="Editar OS"
                            className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(os.numero)}
                            title="Excluir OS"
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
      ) : (
        /* OS Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
          {[
            { id: 'aberta' as StatusOS, label: 'Aberta', color: 'border-t-4 border-t-blue-500 bg-blue-50/20' },
            { id: 'em_andamento' as StatusOS, label: 'Em Andamento', color: 'border-t-4 border-t-amber-500 bg-amber-50/20' },
            { id: 'concluida' as StatusOS, label: 'Concluída', color: 'border-t-4 border-t-emerald-500 bg-emerald-50/20' },
            { id: 'entregue' as StatusOS, label: 'Entregue', color: 'border-t-4 border-t-teal-500 bg-teal-50/20' }
          ].map((column) => {
            const columnOS = filteredOS.filter(o => o.status === column.id);
            return (
              <div key={column.id} className={`flex flex-col rounded-xl border border-gray-200 p-3 min-h-[450px] ${column.color}`}>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200/60">
                  <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    {column.label}
                    <span className="bg-gray-200 text-gray-700 font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                      {columnOS.length}
                    </span>
                  </h4>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] pr-1">
                  {columnOS.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs italic py-10 bg-white/40 rounded-lg border border-dashed border-gray-300">
                      Nenhuma OS
                    </div>
                  ) : (
                    columnOS.map((os) => {
                      const client = clientes.find(c => c.id === os.clienteId);
                      const vehicle = veiculos.find(v => v.id === os.veiculoId);
                      return (
                        <div key={os.numero} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:shadow-md transition-all space-y-3 group relative">
                          {/* OS header info */}
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-black text-xs text-[#0F4C5C] bg-[#0F4C5C]/5 px-2 py-0.5 rounded">
                              #{os.numero}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(os)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setViewingOS(os)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0F4C5C] transition-colors"
                                title="Imprimir/Ver Ficha"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Client and Car */}
                          <div>
                            <div className="font-bold text-gray-800 text-xs line-clamp-1">{client?.nome || '—'}</div>
                            <div className="text-[11px] text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                              <Car size={12} className="text-gray-400" />
                              <span className="line-clamp-1">{vehicle ? `${vehicle.marca} ${vehicle.modelo} [${vehicle.placa}]` : '—'}</span>
                            </div>
                          </div>

                          {/* Dates and Mechanic */}
                          <div className="text-[11px] text-gray-500 space-y-1 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-gray-400" />
                              <span className="font-semibold line-clamp-1">Mec: {os.mecanicoResponsavel}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-gray-400" />
                              <span>Prev: {os.previsaoEntrega}</span>
                            </div>
                          </div>

                          {/* Price and Next Status Action Button */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                            <span className="font-mono font-extrabold text-xs text-[#0F4C5C]">
                              {formatCurrency(os.valorTotal)}
                            </span>

                            {/* Quick status progress actions */}
                            {os.status === 'aberta' && (
                              <button
                                onClick={() => handleStatusChangeAction(os.numero, 'em_andamento')}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                                title="Iniciar Manutenção"
                              >
                                <span>Iniciar</span> <Play size={9} />
                              </button>
                            )}
                            {os.status === 'em_andamento' && (
                              <button
                                onClick={() => handleStatusChangeAction(os.numero, 'concluida')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                                title="Concluir Manutenção"
                              >
                                <span>Concluir</span> <Check size={10} />
                              </button>
                            )}
                            {os.status === 'concluida' && (
                              <button
                                onClick={() => handleStatusChangeAction(os.numero, 'entregue')}
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                                title="Entregar Automóvel"
                              >
                                <span>Entregar</span> <Check size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW OS SHEETS / PRINT PREVIEW MODAL */}
      {viewingOS && (() => {
        const os = viewingOS;
        const client = clientes.find(c => c.id === os.clienteId);
        const vehicle = veiculos.find(v => v.id === os.veiculoId);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-8">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider font-mono">Visualizar Ficha Técnica (Impressão)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEmitirNotaFromOS(os)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-xs font-semibold"
                    style={{ minHeight: '36px' }}
                  >
                    <Cpu size={14} /> Emitir Nota
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-semibold"
                    style={{ minHeight: '36px' }}
                  >
                    <Printer size={14} /> Imprimir / PDF
                  </button>
                  <button
                    onClick={() => setViewingOS(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]" id="printable-area">
                {/* Header Sheet */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#0F4C5C]">OficinaPro</h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">Gestão de Serviços Mecânicos Integrados</p>
                    <p className="text-xs text-gray-500 mt-2 font-semibold">Fone: (11) 3344-9988</p>
                    <p className="text-xs text-gray-500">CNPJ: 12.345.678/0001-00</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-lg font-bold text-gray-800 font-mono">ORDEM DE SERVIÇO</h4>
                    <span className="text-xl font-black text-[#E39B00] font-mono">Nº {os.numero}</span>
                    <p className="text-xs text-gray-500 mt-2"><span className="font-semibold">Entrada:</span> {os.dataEntrada}</p>
                    <p className="text-xs text-gray-500"><span className="font-semibold">Previsão:</span> {os.previsaoEntrega}</p>
                    <p className="text-xs text-gray-500 mt-1 font-bold">Status: <span className="uppercase">{os.status}</span></p>
                  </div>
                </div>

                {/* Cliente & Veículo grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">CLIENTE</h5>
                    <p className="text-sm font-bold text-gray-800">{client?.nome || '—'}</p>
                    <p className="text-xs text-gray-600 font-mono">Doc: {client ? formatDocument(client.documento) : '—'}</p>
                    <p className="text-xs text-gray-600 font-mono">Cel: {client ? formatPhone(client.telefone) : '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">End: {client?.endereco.rua}, {client?.endereco.numero} - {client?.endereco.bairro}</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">VEÍCULO</h5>
                    <p className="text-sm font-bold text-gray-800">{vehicle?.marca} {vehicle?.modelo}</p>
                    <p className="text-xs font-bold text-gray-600 font-mono">Placa: {vehicle?.placa || '—'}</p>
                    <p className="text-xs text-gray-500 font-mono">Ano: {vehicle?.ano || '—'} • Cor: {vehicle?.cor || '—'} • Comb: {vehicle?.combustivel}</p>
                    <p className="text-xs text-gray-500 font-mono">KM Atual: {vehicle?.quilometragem.toLocaleString('pt-BR')} km</p>
                  </div>
                </div>

                {/* Técnico & Diagnóstico */}
                <div className="space-y-2 border-l-4 border-l-[#0F4C5C] pl-4">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">RESPONSÁVEL TÉCNICO</h5>
                  <p className="text-sm font-bold text-gray-800">{os.mecanicoResponsavel}</p>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">DIAGNÓSTICO / OBSERVAÇÕES</h5>
                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed italic">
                    {os.diagnostico || 'Nenhum laudo técnico especificado.'}
                  </p>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">RELAÇÃO DE SERVIÇOS E PEÇAS</h5>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-gray-200 text-gray-600 uppercase">
                          <th className="p-3">Descrição do Item</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3 text-center">Quant.</th>
                          <th className="p-3 text-right">Unitário</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {os.itens.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-semibold">{item.descricao}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                item.tipo === 'servico' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                              }`}>
                                {item.tipo === 'servico' ? 'Serviço' : 'Peça'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">{item.quantidade}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing / Calculations */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Mão de Obra Técnica:</span>
                      <span className="font-mono">{formatCurrency(os.valorMaoDeObra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Desconto Concedido:</span>
                      <span className="font-mono text-red-600">-{formatCurrency(os.desconto)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-800">
                      <span>VALOR TOTAL GERAL:</span>
                      <span className="font-mono text-[#0F4C5C] text-base">{formatCurrency(os.valorTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-12 text-center text-[10px] text-gray-400">
                  <div className="border-t border-gray-300 pt-3">
                    <p className="font-bold uppercase text-gray-600">{os.mecanicoResponsavel}</p>
                    <p className="mt-0.5">Assinatura do Técnico / Mecânico</p>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <p className="font-bold uppercase text-gray-600">{client?.nome || 'Cliente'}</p>
                    <p className="mt-0.5">Assinatura de Retirada do Proprietário</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SERVICE ORDER CREATION / EDITING FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="os-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 id="os-modal-title" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Wrench size={18} className="text-[#0F4C5C]" />
                {editingOS ? `Editar OS nº ${editingOS.numero}` : 'Abrir Nova Ordem de Serviço'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Seção 1: Cliente e Veículo */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  1. Cliente e Vínculo de Veículo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Cliente */}
                  <div>
                    <label htmlFor="os-cliente" className="block text-xs font-bold text-gray-700 mb-1.5">Cliente Proprietário *</label>
                    <select
                      id="os-cliente"
                      value={clienteId}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.clienteId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selecione o cliente --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.documento})</option>
                      ))}
                    </select>
                    {formErrors.clienteId && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.clienteId}</span>
                    )}
                  </div>

                  {/* Select Veículo */}
                  <div>
                    <label htmlFor="os-veiculo" className="block text-xs font-bold text-gray-700 mb-1.5">Automóvel Relacionado *</label>
                    <select
                      id="os-veiculo"
                      value={veiculoId}
                      onChange={(e) => setVeiculoId(e.target.value)}
                      disabled={!clienteId}
                      className={`w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.veiculoId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Escolha o automóvel --</option>
                      {veiculos
                        .filter(v => v.clienteId === clienteId)
                        .map(v => (
                          <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                        ))}
                    </select>
                    {formErrors.veiculoId && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.veiculoId}</span>
                    )}
                    {clienteId && veiculos.filter(v => v.clienteId === clienteId).length === 0 && (
                      <span className="text-[11px] text-amber-600 font-semibold mt-1.5 block">
                        Este cliente não possui veículos cadastrados. Crie primeiro na aba Veículos.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 2: Especificações Técnicas */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  2. Atribuição Técnica e Prazo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Data de Entrada */}
                  <div>
                    <label htmlFor="os-entrada" className="block text-xs font-bold text-gray-700 mb-1.5">Data de Entrada *</label>
                    <input
                      id="os-entrada"
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={dataEntrada}
                      onChange={(e) => setDataEntrada(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.dataEntrada ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.dataEntrada && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.dataEntrada}</span>
                    )}
                  </div>

                  {/* Previsão de Entrega */}
                  <div>
                    <label htmlFor="os-previsao" className="block text-xs font-bold text-gray-700 mb-1.5">Previsão de Entrega *</label>
                    <input
                      id="os-previsao"
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={previsaoEntrega}
                      onChange={(e) => setPrevisaoEntrega(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.previsaoEntrega ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.previsaoEntrega && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.previsaoEntrega}</span>
                    )}
                  </div>

                  {/* Mecânico Responsável */}
                  <div>
                    <label htmlFor="os-mecanico" className="block text-xs font-bold text-gray-700 mb-1.5">Mecânico Alocado *</label>
                    <input
                      id="os-mecanico"
                      type="text"
                      placeholder="Ex: Luiz Gustavo"
                      value={mecanicoResponsavel}
                      onChange={(e) => setMecanicoResponsavel(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.mecanicoResponsavel ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.mecanicoResponsavel && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.mecanicoResponsavel}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="os-status" className="block text-xs font-bold text-gray-700 mb-1.5">Status da OS</label>
                    <select
                      id="os-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusOS)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    >
                      <option value="aberta">Aberta</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                {/* Diagnóstico técnico */}
                <div>
                  <label htmlFor="os-diag" className="block text-xs font-bold text-gray-700 mb-1.5">Laudo de Diagnóstico / Observações</label>
                  <textarea
                    id="os-diag"
                    rows={3}
                    placeholder="Sintomas relatados pelo cliente, testes efetuados e observações gerais..."
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
              </div>

              {/* Seção 3: Adição Dinâmica de Itens */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  3. Inclusão de Peças e Serviços executados
                </h4>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  {/* Select Item Type */}
                  <div>
                    <label htmlFor="item-tipo" className="block text-[11px] font-bold text-gray-600 mb-1">Categoria</label>
                    <select
                      id="item-tipo"
                      value={selectedItemType}
                      onChange={(e) => {
                        setSelectedItemType(e.target.value as 'servico' | 'peca');
                        setSelectedItemId('');
                      }}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="servico">Serviço Técnico</option>
                      <option value="peca">Peça / Produto</option>
                    </select>
                  </div>

                  {/* Select Predefined Item */}
                  <div className="sm:col-span-2">
                    <label htmlFor="item-id" className="block text-[11px] font-bold text-gray-600 mb-1">Escolher Item</label>
                    <select
                      id="item-id"
                      value={selectedItemId}
                      onChange={(e) => {
                        setSelectedItemId(e.target.value);
                        // Auto-fill price
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
                      <option value="">-- Selecione o item --</option>
                      {renderItemSelectorOptions()}
                    </select>
                  </div>

                  {/* Qty and price */}
                  <div className="flex gap-2 w-full">
                    <div className="w-1/2">
                      <label htmlFor="item-qty" className="block text-[11px] font-bold text-gray-600 mb-1">Qtd</label>
                      <input
                        id="item-qty"
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
                        className="w-full text-xs font-bold text-white bg-[#0F4C5C] hover:bg-[#0C3D4A] p-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        style={{ minHeight: '36px' }}
                      >
                        <Plus size={14} /> Incluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items list table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold border-b border-gray-200 text-gray-600 uppercase">
                        <th className="p-3">Descrição do Item</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Valor Unit.</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {itens.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                            Nenhum item incluído na Ordem de Serviço ainda.
                          </td>
                        </tr>
                      ) : (
                        itens.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="p-3 font-semibold">{item.descricao}</td>
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
                                aria-label="Remover item"
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

              {/* Seção 4: Valores Financeiros Finais */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  4. Fechamento Financeiro
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Mão de Obra */}
                  <div>
                    <label htmlFor="os-mao-obra" className="block text-xs font-bold text-gray-700 mb-1.5">Mão de Obra Adicional (R$)</label>
                    <input
                      id="os-mao-obra"
                      type="number"
                      min={0}
                      placeholder="0.00"
                      value={valorMaoDeObra}
                      onChange={(e) => setValorMaoDeObra(Number(e.target.value))}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  </div>

                  {/* Desconto */}
                  <div>
                    <label htmlFor="os-desc" className="block text-xs font-bold text-gray-700 mb-1.5">Desconto Concedido (R$)</label>
                    <input
                      id="os-desc"
                      type="number"
                      min={0}
                      placeholder="0.00"
                      value={desconto}
                      onChange={(e) => setDesconto(Number(e.target.value))}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  </div>

                  {/* Total Calculations summary board */}
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 self-end text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Valor Total Geral</span>
                    <span className="text-xl font-black text-[#0F4C5C] font-mono block mt-0.5">
                      {formatCurrency(totalOS)}
                    </span>
                  </div>
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
                  className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-bold shadow-xs transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  {editingOS ? 'Salvar OS' : 'Emitir Ordem de Serviço'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {isNotaModalOpen && notaTargetOS && (() => {
        const client = clientes.find(c => c.id === notaTargetOS.clienteId);
        return (
          <EmitirNotaModal
            isOpen={isNotaModalOpen}
            onClose={() => {
              setIsNotaModalOpen(false);
              setNotaTargetOS(null);
            }}
            referenciaId={notaTargetOS.numero}
            referenciaTipo="OS"
            valorTotal={notaTargetOS.valorTotal}
            clienteId={notaTargetOS.clienteId}
            clienteNome={client ? client.nome : 'Cliente Não Identificado'}
            itens={notaTargetOS.itens}
          />
        );
      })()}

    </div>
  );
};
