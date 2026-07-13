import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Recibo } from '../types';
import { formatCurrency, valorPorExtenso } from '../utils';
import { 
  Receipt, Search, Trash2, Printer, X, Check, FileText, ShoppingCart, 
  Plus, Calendar, Filter, DollarSign, ListFilter, CreditCard, ChevronRight, CheckCircle, Info
} from 'lucide-react';

export const RecibosView: React.FC = () => {
  const { 
    recibos, deleteRecibo, addRecibo, ordensServico, vendas, clientes, veiculos, configuracoes, searchQuery,
    showToast, confirmAction
  } = useApp();
  
  // Local States
  const [localSearch, setLocalSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [viewingRecibo, setViewingRecibo] = useState<Recibo | null>(null);
  
  // Receipt Creation Modal States
  const [isCreating, setIsCreating] = useState(false);
  const [sourceType, setSourceType] = useState<'OS' | 'Venda'>('OS');
  const [sourceId, setSourceId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [dateStr, setDateStr] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Richer customer info states
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');

  // Get current date in dd/mm/aaaa
  const getTodayDateStr = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Excluir Recibo',
      message: 'Tem certeza de que deseja excluir este recibo de pagamento permanentemente? Esta ação é irreversível.',
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteRecibo(id);
        showToast('Recibo excluído com sucesso!', 'success');
      }
    });
  };

  // Convert dd/mm/aaaa to Date for comparison
  const parsePtBrDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  
  // Apply filtering
  const filteredRecibos = recibos.filter(r => {
    // 1. Text Search Filter (id, client, reference ID)
    if (combinedSearch) {
      const matchSearch = (
        r.id.toLowerCase().includes(combinedSearch) ||
        r.clienteNome.toLowerCase().includes(combinedSearch) ||
        r.referenciaId.toLowerCase().includes(combinedSearch)
      );
      if (!matchSearch) return false;
    }

    // 2. Reference Type Filter
    if (selectedType !== 'todos') {
      if (r.referenciaTipo.toLowerCase() !== selectedType.toLowerCase()) return false;
    }

    // 3. Date Range Filter
    if (startDate || endDate) {
      const recDate = parsePtBrDate(r.data);
      if (!recDate) return false;

      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (recDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (recDate > end) return false;
      }
    }

    return true;
  });

  // Calculate stats based on filtered receipts
  const totalReceived = filteredRecibos.reduce((sum, r) => sum + r.valor, 0);
  const countReceipts = filteredRecibos.length;
  const avgReceiptValue = countReceipts > 0 ? totalReceived / countReceipts : 0;

  // Handle manual selection from reference dropdown
  const handleReferenceChange = (id: string, type: 'OS' | 'Venda') => {
    setSourceId(id);
    if (!id) {
      resetReferenceFields();
      return;
    }

    if (type === 'OS') {
      const os = ordensServico.find(o => o.numero === id);
      if (os) {
        const client = clientes.find(c => c.id === os.clienteId);
        const name = client ? client.nome : 'Cliente Não Cadastrado';
        setClienteNome(name);
        setValor(os.valorTotal);
        setFormaPagamento('Pix'); // default fallback

        if (client) {
          setClienteDocumento(client.documento || '');
          setClienteTelefone(client.telefone || '');
          setClienteEmail(client.email || '');
          const e = client.endereco;
          if (e && e.rua) {
            setClienteEndereco(`${e.rua}, ${e.numero}${e.bairro ? ' - ' + e.bairro : ''}, ${e.cidade}/${e.uf}`);
          } else {
            setClienteEndereco('');
          }
        } else {
          setClienteDocumento('');
          setClienteTelefone('');
          setClienteEmail('');
          setClienteEndereco('');
        }

        // Generate nice detailed description
        const servicosList = os.itens.filter(i => i.tipo === 'servico').map(i => i.descricao).join(', ');
        const pecasList = os.itens.filter(i => i.tipo === 'peca').map(i => i.descricao).join(', ');
        const veiculo = veiculos.find(v => v.id === os.veiculoId);
        const veiculoStr = veiculo ? ` para o veículo ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : '';

        let desc = `Serviços técnicos e peças faturados na Ordem de Serviço nº ${os.numero}${veiculoStr}.`;
        if (servicosList) desc += ` Serviços realizados: ${servicosList}.`;
        if (pecasList) desc += ` Peças instaladas: ${pecasList}.`;
        setDescricao(desc);
      }
    } else {
      const vd = vendas.find(v => v.id === id);
      if (vd) {
        const client = vd.clienteId ? clientes.find(c => c.id === vd.clienteId) : null;
        const name = client ? client.nome : 'Consumidor Final';
        setClienteNome(name);
        setValor(vd.valorTotal);
        setFormaPagamento(vd.formaPagamento || 'Pix');

        if (client) {
          setClienteDocumento(client.documento || '');
          setClienteTelefone(client.telefone || '');
          setClienteEmail(client.email || '');
          const e = client.endereco;
          if (e && e.rua) {
            setClienteEndereco(`${e.rua}, ${e.numero}${e.bairro ? ' - ' + e.bairro : ''}, ${e.cidade}/${e.uf}`);
          } else {
            setClienteEndereco('');
          }
        } else {
          setClienteDocumento('');
          setClienteTelefone('');
          setClienteEmail('');
          setClienteEndereco('');
        }

        const produtosList = vd.itens.map(i => i.nome).join(', ');
        setDescricao(`Venda de produtos e autopeças faturada na Venda Balcão nº ${vd.id}. Itens adquiridos: ${produtosList}.`);
      }
    }
  };

  const resetReferenceFields = () => {
    setClienteNome('');
    setValor(0);
    setFormaPagamento('Pix');
    setDescricao('');
    setClienteDocumento('');
    setClienteTelefone('');
    setClienteEmail('');
    setClienteEndereco('');
  };

  // Open modal for creation
  const handleOpenCreateModal = () => {
    setIsCreating(true);
    setSourceType('OS');
    setSourceId('');
    resetReferenceFields();
    setDateStr(getTodayDateStr());
  };

  // Save manual receipt
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId) {
      alert('Por favor, selecione uma OS ou Venda de referência.');
      return;
    }
    if (!clienteNome) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    if (valor <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    addRecibo({
      referenciaId: sourceId,
      referenciaTipo: sourceType,
      valor: Number(valor),
      formaPagamento,
      data: dateStr || getTodayDateStr(),
      clienteNome,
      descricao: descricao || undefined,
      clienteDocumento: clienteDocumento || undefined,
      clienteTelefone: clienteTelefone || undefined,
      clienteEmail: clienteEmail || undefined,
      clienteEndereco: clienteEndereco || undefined,
    });

    showToast('Recibo de faturamento emitido com sucesso!', 'success');
    setIsCreating(false);
  };

  // Gather details dynamically (handles legacy and new receipts alike)
  const getReceiptDetails = (r: Recibo) => {
    let doc = r.clienteDocumento || '';
    let tel = r.clienteTelefone || '';
    let email = r.clienteEmail || '';
    let endereco = r.clienteEndereco || '';
    let desc = r.descricao || '';
    let itemsList: { desc: string; qtd: number; unit: number; total: number }[] = [];

    if (r.referenciaTipo === 'OS') {
      const os = ordensServico.find(o => o.numero === r.referenciaId);
      if (os) {
        const client = clientes.find(c => c.id === os.clienteId);
        if (client) {
          if (!doc) doc = client.documento;
          if (!tel) tel = client.telefone;
          if (!email) email = client.email;
          if (!endereco && client.endereco) {
            const e = client.endereco;
            endereco = `${e.rua}, ${e.numero}${e.bairro ? ' - ' + e.bairro : ''}, ${e.cidade}/${e.uf}`;
          }
        }
        
        // Look up vehicle info
        const veiculo = veiculos.find(v => v.id === os.veiculoId);
        const veiculoStr = veiculo ? ` - Veículo: ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : '';

        if (!desc) {
          const servicosList = os.itens.filter(i => i.tipo === 'servico').map(i => i.descricao).join(', ');
          const pecasList = os.itens.filter(i => i.tipo === 'peca').map(i => i.descricao).join(', ');
          
          desc = `Serviços de manutenção automotiva realizados conforme Ordem de Serviço nº ${os.numero}${veiculoStr}.`;
          if (servicosList) desc += ` Serviços: ${servicosList}.`;
          if (pecasList) desc += ` Peças/Produtos: ${pecasList}.`;
        }

        itemsList = os.itens.map(i => ({
          desc: i.descricao,
          qtd: i.quantidade,
          unit: i.valorUnitario,
          total: i.quantidade * i.valorUnitario
        }));
        
        if (os.valorMaoDeObra > 0) {
          itemsList.push({
            desc: 'Mão de Obra Técnica',
            qtd: 1,
            unit: os.valorMaoDeObra,
            total: os.valorMaoDeObra
          });
        }
        if (os.desconto > 0) {
          itemsList.push({
            desc: 'Desconto Concedido',
            qtd: 1,
            unit: -os.desconto,
            total: -os.desconto
          });
        }
      }
    } else if (r.referenciaTipo === 'Venda') {
      const vd = vendas.find(v => v.id === r.referenciaId);
      if (vd) {
        if (vd.clienteId) {
          const client = clientes.find(c => c.id === vd.clienteId);
          if (client) {
            if (!doc) doc = client.documento;
            if (!tel) tel = client.telefone;
            if (!email) email = client.email;
            if (!endereco && client.endereco) {
              const e = client.endereco;
              endereco = `${e.rua}, ${e.numero}${e.bairro ? ' - ' + e.bairro : ''}, ${e.cidade}/${e.uf}`;
            }
          }
        }
        
        if (!desc) {
          const produtosList = vd.itens.map(i => i.nome).join(', ');
          desc = `Venda de produtos e autopeças realizada conforme Venda Balcão nº ${vd.id}. Itens: ${produtosList}.`;
        }

        itemsList = vd.itens.map(i => ({
          desc: i.nome,
          qtd: i.quantidade,
          unit: i.valorUnitario,
          total: i.quantidade * i.valorUnitario
        }));
      }
    }

    // Elegant Fallbacks
    if (!doc) doc = 'Não informado';
    if (!tel) tel = 'Não informado';
    if (!email) email = 'Não informado';
    if (!endereco) endereco = 'Não informado';
    if (!desc) desc = `Referente ao recebimento de valores para a referência de ${r.referenciaTipo} nº ${r.referenciaId}.`;

    return { doc, tel, email, endereco, desc, itemsList };
  };

  return (
    <div className="space-y-6">
      {/* Printable Area CSS Injection */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide the layout completely */
          #root, main, aside, header, nav, button, .no-print {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Show ONLY the printable receipt block */
          #printable-receipt-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-receipt-modal * {
            visibility: visible !important;
          }
          .print-border-dashed {
            border-style: dashed !important;
            border-color: #000000 !important;
          }
        }
      `}</style>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Receipt size={22} className="text-[#0F4C5C]" />
            Recibos de Pagamento
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans mt-0.5">
            Histórico financeiro, faturamento de vendas e comprovantes de quitação de OS prontos para impressão ou PDF.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#0F4C5C] hover:bg-[#0A3440] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 shadow-sm active:scale-95"
          style={{ minHeight: '38px' }}
        >
          <Plus size={16} />
          Emitir Novo Recibo
        </button>
      </div>

      {/* METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#0F4C5C]/10 text-[#0F4C5C] rounded-lg">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Faturamento Caixa (Filtrado)</span>
            <span className="text-xl font-black text-[#0F4C5C]">{formatCurrency(totalReceived)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Comprovantes Emitidos</span>
            <span className="text-xl font-black text-gray-800">{countReceipts} recibos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Ticket Médio Recebido</span>
            <span className="text-xl font-black text-gray-800">{formatCurrency(avgReceiptValue)}</span>
          </div>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Filter size={14} className="text-[#0F4C5C]" />
            Filtros e Ferramentas de Busca
          </span>
          {(localSearch || startDate || endDate || selectedType !== 'todos') && (
            <button
              onClick={() => {
                setLocalSearch('');
                setStartDate('');
                setEndDate('');
                setSelectedType('todos');
              }}
              className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <div className="space-y-1">
            <label htmlFor="search-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Busca Textual</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search size={16} />
              </div>
              <input
                id="search-input"
                type="text"
                placeholder="Nº recibo, cliente, ref..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-medium"
              />
            </div>
          </div>

          {/* Reference Type Filter */}
          <div className="space-y-1">
            <label htmlFor="type-filter" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origem / Tipo</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <ListFilter size={16} />
              </div>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-medium appearance-none"
              >
                <option value="todos">Todos as Origens</option>
                <option value="os">Ordem de Serviço (OS)</option>
                <option value="venda">Venda de Produtos</option>
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label htmlFor="start-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data Inicial</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Calendar size={16} />
              </div>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-mono font-medium"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label htmlFor="end-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data Final</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Calendar size={16} />
              </div>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-mono font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table / List */}
      {filteredRecibos.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <Receipt size={42} className="mx-auto text-gray-300 animate-pulse" />
          <h3 className="text-lg font-bold text-gray-800">Nenhum recibo correspondente</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {combinedSearch || startDate || endDate || selectedType !== 'todos'
              ? 'Nenhum recibo corresponde aos critérios de pesquisa ou período informados. Tente ajustar seus filtros.'
              : 'Os recibos de pagamento são emitidos de forma integrada quando uma OS é marcada como concluída ou quando uma venda balcão é efetuada.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nº Recibo</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Data Emissão</th>
                  <th className="px-6 py-4">Referência</th>
                  <th className="px-6 py-4">Meio de Pagamento</th>
                  <th className="px-6 py-4 text-right">Valor Quitado</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-sans">
                {filteredRecibos.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0F4C5C]">
                      RC-{r.id.replace('rec', '').padStart(5, '0')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {r.clienteNome}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {r.data}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md font-mono">
                        {r.referenciaTipo === 'OS' ? <FileText size={12} className="text-[#0F4C5C]" /> : <ShoppingCart size={12} className="text-emerald-600" />}
                        {r.referenciaTipo} #{r.referenciaId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {r.formaPagamento}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-[#0F4C5C]">
                      {formatCurrency(r.valor)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingRecibo(r)}
                          title="Visualizar e Imprimir Recibo"
                          className="p-1.5 text-[#0F4C5C] hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          title="Excluir Recibo"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 font-bold font-mono flex justify-between items-center">
            <span>Resultados: {filteredRecibos.length} recibos de caixa</span>
            <span>Total Caixa: {formatCurrency(totalReceived)}</span>
          </div>
        </div>
      )}

      {/* RECEPT MANUAL CREATION MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Receipt size={18} className="text-[#0F4C5C]" />
                  Emitir Recibo de Pagamento Avulso
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">Selecione uma referência de venda ou OS concluída para preencher o faturamento.</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Selection */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">1. Tipo de Referência</span>
                  <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('OS');
                        setSourceId('');
                        resetReferenceFields();
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        sourceType === 'OS'
                          ? 'bg-white text-[#0F4C5C] shadow-xs'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Ordem de Serviço (OS)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('Venda');
                        setSourceId('');
                        resetReferenceFields();
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        sourceType === 'Venda'
                          ? 'bg-white text-[#0F4C5C] shadow-xs'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Venda de Produtos
                    </button>
                  </div>
                </div>

                {/* Reference ID Select */}
                <div className="space-y-1">
                  <label htmlFor="source-select" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">2. Selecionar Documento Origem</label>
                  <select
                    id="source-select"
                    value={sourceId}
                    onChange={(e) => handleReferenceChange(e.target.value, sourceType)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-semibold"
                    required
                  >
                    <option value="">-- Escolha um registro --</option>
                    {sourceType === 'OS' ? (
                      ordensServico.map(os => {
                        const isFinished = os.status === 'concluida' || os.status === 'entregue';
                        const clientName = clientes.find(c => c.id === os.clienteId)?.nome || 'Cliente não identificado';
                        return (
                          <option key={os.numero} value={os.numero}>
                            OS #{os.numero} - {clientName} ({formatCurrency(os.valorTotal)}) {isFinished ? '✓ Concluída' : '⚠ Em aberto'}
                          </option>
                        );
                      })
                    ) : (
                      vendas.map(vd => {
                        const clientName = vd.clienteId ? (clientes.find(c => c.id === vd.clienteId)?.nome || 'Cliente') : 'Consumidor Final';
                        return (
                          <option key={vd.id} value={vd.id}>
                            Venda #{vd.id} - {clientName} ({formatCurrency(vd.valorTotal)}) - {vd.data}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              {sourceId && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h4 className="text-[11px] font-bold text-[#0F4C5C] uppercase tracking-wider">3. Conferência de Dados</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Name (Editable) */}
                    <div className="space-y-1">
                      <label htmlFor="client-name-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nome do Cliente / Favorecido</label>
                      <input
                        id="client-name-input"
                        type="text"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-medium"
                        required
                      />
                    </div>

                    {/* Client Document */}
                    <div className="space-y-1">
                      <label htmlFor="client-doc-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CPF ou CNPJ do Cliente</label>
                      <input
                        id="client-doc-input"
                        type="text"
                        placeholder="Ex: 000.000.000-00"
                        value={clienteDocumento}
                        onChange={(e) => setClienteDocumento(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-mono"
                      />
                    </div>

                    {/* Client Phone & Email */}
                    <div className="space-y-1">
                      <label htmlFor="client-tel-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Telefone de Contato</label>
                      <input
                        id="client-tel-input"
                        type="text"
                        placeholder="Ex: (11) 99999-9999"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="client-email-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">E-mail do Cliente</label>
                      <input
                        id="client-email-input"
                        type="email"
                        placeholder="Ex: cliente@email.com"
                        value={clienteEmail}
                        onChange={(e) => setClienteEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                      />
                    </div>

                    {/* Full Address */}
                    <div className="space-y-1 md:col-span-2">
                      <label htmlFor="client-addr-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Endereço Completo</label>
                      <input
                        id="client-addr-input"
                        type="text"
                        placeholder="Ex: Rua das Rosas, 123 - Centro - São Paulo/SP"
                        value={clienteEndereco}
                        onChange={(e) => setClienteEndereco(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                      />
                    </div>

                    {/* Amount & Date & Payment */}
                    <div className="space-y-1">
                      <label htmlFor="amount-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valor do Recibo (R$)</label>
                      <input
                        id="amount-input"
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-mono font-bold text-[#0F4C5C]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="payment-select" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Forma de Pagamento</label>
                      <select
                        id="payment-select"
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-semibold"
                        required
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Boleto Bancário">Boleto Bancário</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="date-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Data de Emissão (dd/mm/aaaa)</label>
                      <input
                        id="date-input"
                        type="text"
                        placeholder="Ex: 13/07/2026"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-mono font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Written value (Live preview) */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-xs">
                    <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block">Visualização do Valor por Extenso</span>
                    <p className="font-bold text-gray-700 italic">
                      ({valorPorExtenso(valor)})
                    </p>
                  </div>

                  {/* Rich Description */}
                  <div className="space-y-1">
                    <label htmlFor="description-textarea" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Histórico / Descrição no Recibo</label>
                    <textarea
                      id="description-textarea"
                      rows={3}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição detalhada sobre os serviços ou produtos quitados..."
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-sans"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 -mx-6 -mb-6 mt-6 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                  style={{ minHeight: '38px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!sourceId}
                  className="px-5 py-2 bg-[#0F4C5C] hover:bg-[#0A3440] disabled:bg-gray-300 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  style={{ minHeight: '38px' }}
                >
                  <Check size={14} /> Emitir Comprovante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RICH RECEIPT SLIP PRINTING PREVIEW MODAL */}
      {viewingRecibo && (() => {
        const r = viewingRecibo;
        // Lookup real details
        const details = getReceiptDetails(r);

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh]">
              {/* Modal control bar */}
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100 no-print">
                <span className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Receipt size={14} />
                  Visualização de Documento Comercial
                </span>
                <button
                  onClick={() => setViewingRecibo(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* PRINTABLE EMBEDDED RECEIPT SHELL */}
              <div className="overflow-y-auto p-8 bg-gray-100 flex-1 flex justify-center">
                <div 
                  id="printable-receipt-modal" 
                  className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md rounded-xs border border-gray-300 text-black font-sans flex flex-col justify-between"
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* TOP HEADER */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 border-gray-300 print-border-dashed">
                      <div className="space-y-1.5">
                        <h3 className="text-2xl font-black tracking-tight text-[#0F4C5C] print:text-black uppercase">
                          {configuracoes.nomeOficina || 'OficinaPro'}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 print:text-black tracking-wider uppercase">
                          SERVIÇOS DE MANUTENÇÃO AUTOMOTIVA E PEÇAS
                        </p>
                        <div className="text-xs text-gray-500 print:text-black space-y-0.5 font-medium leading-relaxed">
                          <p>CNPJ: {configuracoes.cnpj || '00.000.000/0001-00'}</p>
                          <p>Endereço: {configuracoes.endereco?.rua || 'Avenida Paulista'}, {configuracoes.endereco?.numero || '1500'} - {configuracoes.endereco?.bairro || 'Bela Vista'}</p>
                          <p>{configuracoes.endereco?.cidade || 'São Paulo'} / {configuracoes.endereco?.uf || 'SP'} - CEP: {configuracoes.endereco?.cep || '01311-000'}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Recibo de Quitação</span>
                        <h4 className="text-xl font-mono font-black text-[#0F4C5C] print:text-black">
                          RC-{r.id.replace('rec', '').padStart(5, '0')}
                        </h4>
                        <div className="text-xs font-mono text-gray-500">
                          Data: <span className="font-semibold text-gray-800">{r.data}</span>
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          Ref: <span className="font-bold text-gray-800">{r.referenciaTipo} #{r.referenciaId}</span>
                        </div>
                      </div>
                    </div>

                    {/* VALOR RECEBIDO BOX */}
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">VALOR QUITADO</span>
                        <span className="text-2xl font-mono font-black text-[#0F4C5C] print:text-black">
                          {formatCurrency(r.valor)}
                        </span>
                      </div>
                      <div className="text-left sm:text-right bg-white px-3 py-1.5 border rounded-md text-xs font-bold text-gray-600 border-gray-200">
                        Meio: {r.formaPagamento}
                      </div>
                    </div>

                    {/* RECEIPT CONTENT STATEMENT */}
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 leading-relaxed text-justify">
                        Declaramos para os devidos fins que recebemos de <strong>{r.clienteNome}</strong>, inscrito no CPF/CNPJ sob o nº <strong>{details.doc}</strong>, com endereço em <strong>{details.endereco}</strong>, fone <strong>{details.tel}</strong>, o valor de <strong>{formatCurrency(r.valor)}</strong> (<span className="italic font-bold text-gray-800">{valorPorExtenso(r.valor)}</span>), correspondente a quitação da <strong>{r.referenciaTipo === 'OS' ? 'Ordem de Serviço' : 'Venda Balcão'} nº {r.referenciaId}</strong>.
                      </p>

                      {/* DETAILED DESCRIPTION BLOCK */}
                      <div className="space-y-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Histórico de Quitação</span>
                        <p className="text-xs text-gray-600 font-sans leading-relaxed">
                          {details.desc}
                        </p>
                      </div>

                      {/* RICH ITEMS BREAKDOWN LIST */}
                      {details.itemsList && details.itemsList.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <th className="px-4 py-2.5">Descrição do Item faturado</th>
                                <th className="px-4 py-2.5 text-center w-16">Qtd</th>
                                <th className="px-4 py-2.5 text-right w-24">Vl. Unit</th>
                                <th className="px-4 py-2.5 text-right w-28">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600 font-mono text-[11px]">
                              {details.itemsList.map((item, idx) => (
                                <tr key={idx} className={item.unit < 0 ? 'bg-red-50 text-red-700 font-semibold' : ''}>
                                  <td className="px-4 py-2 font-sans font-medium">{item.desc}</td>
                                  <td className="px-4 py-2 text-center">{item.qtd}</td>
                                  <td className="px-4 py-2 text-right">{formatCurrency(item.unit)}</td>
                                  <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM BLOCK WITH SIGNATURES */}
                  <div className="space-y-8 pt-12">
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
                      <div className="text-xs text-gray-500 font-medium">
                        <p>{configuracoes.endereco?.cidade || 'São Paulo'}, {r.data}</p>
                      </div>
                      
                      <div className="text-center space-y-1 bg-white p-2">
                        <div className="border-t border-gray-400 w-64 mx-auto pt-1.5" />
                        <p className="text-[10px] text-gray-800 font-bold uppercase tracking-wider">
                          {configuracoes.nomeOficina || 'OficinaPro'}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          Setor Financeiro / Caixa Comercial
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono print-border-dashed">
                      <span>Emitido por: {configuracoes.nomeUsuario || 'Administrador'}</span>
                      <span className="font-bold flex items-center gap-1">
                        <Info size={10} /> Documento gerado eletronicamente para fins fiscais e de controle de caixa.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 no-print">
                <button
                  onClick={() => setViewingRecibo(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                  style={{ minHeight: '38px' }}
                >
                  Fechar Visualização
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#0F4C5C] hover:bg-[#0A3440] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors active:scale-95"
                  style={{ minHeight: '38px' }}
                >
                  <Printer size={14} /> Imprimir Comprovante (A4)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
