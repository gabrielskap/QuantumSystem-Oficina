import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ItemVenda } from '../types';
import { formatCurrency } from '../utils';
import { 
  ShoppingCart, Plus, Trash2, CheckCircle, Search, User, CreditCard, ChevronRight, X, Info, Printer, Receipt,
  Cpu, FileCheck
} from 'lucide-react';
import { EmitirNotaModal } from '../components/EmitirNotaModal';

export const VendasView: React.FC = () => {
  const { 
    vendas, clientes, produtos, recibos, addVenda, deleteVenda, searchQuery,
    showToast, confirmAction
  } = useApp();

  // Mode: 'list' (shows recent sales) or 'new' (pos cash register)
  const [activeMode, setActiveMode] = useState<'list' | 'new'>('new');
  const [localSearch, setLocalSearch] = useState('');

  // Receipt viewing modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Nota fiscal modal state
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [notaTargetVenda, setNotaTargetVenda] = useState<any | null>(null);

  const handleEmitirNotaFromVenda = (venda: any) => {
    setNotaTargetVenda(venda);
    setIsNotaModalOpen(true);
  };

  const handleViewReceipt = (v: any) => {
    const rc = recibos.find(r => r.referenciaId === v.id && r.referenciaTipo === 'Venda');
    if (rc) {
      setSelectedReceipt(rc);
    } else {
      // Dynamic fallback
      const client = clientes.find(c => c.id === v.clienteId);
      setSelectedReceipt({
        id: `V-${v.id}`,
        referenciaId: v.id,
        referenciaTipo: 'Venda',
        valor: v.valorTotal,
        formaPagamento: v.formaPagamento,
        data: v.data,
        clienteNome: client ? client.nome : 'Consumidor Final'
      });
    }
  };

  // POS Form State
  const [clienteId, setClienteId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [cartItems, setCartItems] = useState<ItemVenda[]>([]);

  // Item Picker State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Error messaging
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetPOS = () => {
    setClienteId('');
    setFormaPagamento('Pix');
    setCartItems([]);
    setSelectedProductId('');
    setSelectedQty(1);
    setErrorMsg('');
  };

  // Add item to active sale cart
  const handleAddToCart = () => {
    if (!selectedProductId) return;
    setErrorMsg('');

    const product = produtos.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check stock
    if (product.estoqueAtual < selectedQty) {
      setErrorMsg(`Estoque insuficiente. Estoque disponível: ${product.estoqueAtual} unidades.`);
      return;
    }

    const existingIndex = cartItems.findIndex(item => item.produtoId === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantidade + selectedQty;
      
      if (product.estoqueAtual < newQty) {
        setErrorMsg(`Não foi possível adicionar. Qtd total no carrinho (${newQty}) excede o estoque disponível.`);
        return;
      }

      updated[existingIndex].quantidade = newQty;
      setCartItems(updated);
    } else {
      const newItem: ItemVenda = {
        produtoId: selectedProductId,
        nome: product.nome,
        quantidade: selectedQty,
        valorUnitario: product.precoVenda
      };
      setCartItems([...cartItems, newItem]);
    }

    // Reset item pickers
    setSelectedProductId('');
    setSelectedQty(1);
  };

  // Remove from cart
  const handleRemoveFromCart = (idx: number) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const totalCart = cartItems.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);

  // Conclude Sale
  const handleConcludeSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('O carrinho de compras está vazio.');
      return;
    }

    addVenda({
      clienteId: clienteId || undefined,
      itens: cartItems,
      formaPagamento
    });

    showToast('Venda registrada com sucesso!', 'success');
    setSuccessMsg('Venda registrada com sucesso! Recibo e Nota Fiscal foram gerados automaticamente.');
    resetPOS();
    
    // Switch to history or keep POS active
    setTimeout(() => {
      setSuccessMsg('');
      setActiveMode('list');
    }, 2500);
  };

  const handleDeleteSale = (id: string) => {
    confirmAction({
      title: 'Excluir Venda',
      message: `Tem certeza de que deseja remover permanentemente o registro da venda nº ${id}? Esta ação é irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteVenda(id);
        showToast('Registro de venda removido com sucesso!', 'success');
      }
    });
  };

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredVendas = vendas.filter(v => {
    const client = clientes.find(c => c.id === v.clienteId);
    if (!combinedSearch) return true;
    return (
      v.id.includes(combinedSearch) ||
      v.formaPagamento.toLowerCase().includes(combinedSearch) ||
      (client && client.nome.toLowerCase().includes(combinedSearch))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ShoppingCart size={22} className="text-[#0F4C5C]" />
            Venda Direta / Balcão
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans">
            Registro de faturamento rápido para clientes que compram autopeças e acessórios direto no balcão da recepção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('new')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
              activeMode === 'new' 
                ? 'bg-[#0F4C5C] text-white border-transparent' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={{ minHeight: '38px' }}
          >
            Caixa de Vendas (PDV)
          </button>
          <button
            onClick={() => setActiveMode('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
              activeMode === 'list' 
                ? 'bg-[#0F4C5C] text-white border-transparent' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={{ minHeight: '38px' }}
          >
            Histórico de Vendas
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <CheckCircle className="text-emerald-600 shrink-0" size={22} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* POS SYSTEM FORM */}
      {activeMode === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Middle: Cart builder */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Item Selection Picker */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                1. Selecionar Peças / Acessórios
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label htmlFor="pos-item" className="block text-xs font-bold text-gray-700 mb-1.5">Escolha a Peça</label>
                  <select
                    id="pos-item"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                  >
                    <option value="">-- Escolha uma peça do estoque --</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({formatCurrency(p.precoVenda)} - Disponível: {p.estoqueAtual})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label htmlFor="pos-qty" className="block text-xs font-bold text-gray-700 mb-1.5">Quant.</label>
                    <input
                      id="pos-qty"
                      type="number"
                      min={1}
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 text-center font-mono font-bold"
                    />
                  </div>
                  <div className="w-1/2 self-end">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full text-sm font-bold text-white bg-[#0F4C5C] hover:bg-[#0C3D4A] p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                      style={{ minHeight: '42px' }}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-md flex items-center gap-1">
                  <Info size={14} />
                  {errorMsg}
                </div>
              )}
            </div>

            {/* 2. Interactive shopping cart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                2. Carrinho de Compras
              </h3>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Descrição da Peça</th>
                      <th className="p-3 text-center">Quantidade</th>
                      <th className="p-3 text-right">Valor Unitário</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                          O carrinho de compras está vazio. Selecione peças acima para adicionar.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold">{item.nome}</td>
                          <td className="p-3 text-center font-mono font-bold">{item.quantidade}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(item.valorUnitario)}</td>
                          <td className="p-3 text-right font-mono font-bold text-gray-800">
                            {formatCurrency(item.quantidade * item.valorUnitario)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveFromCart(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                              aria-label="Excluir item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-3">
                Resumo e Pagamento
              </h3>

              <form onSubmit={handleConcludeSale} className="space-y-4">
                {/* Optional customer linking */}
                <div>
                  <label htmlFor="pos-cliente-id" className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <User size={14} /> Cliente Proprietário (Opcional)
                  </label>
                  <select
                    id="pos-cliente-id"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                  >
                    <option value="">-- Consumidor Final (Sem Cadastro) --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.documento})</option>
                    ))}
                  </select>
                </div>

                {/* Form of Payment */}
                <div>
                  <label htmlFor="pos-pagamento" className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <CreditCard size={14} /> Forma de Pagamento *
                  </label>
                  <select
                    id="pos-pagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                  >
                    <option value="Pix">Pix (Instantâneo)</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro físico</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                  </select>
                </div>

                {/* Sub-total dashboard */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>Qtd de Itens:</span>
                    <span className="font-mono font-bold text-gray-700">
                      {cartItems.reduce((acc, curr) => acc + curr.quantidade, 0)} peças
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-800">
                    <span>Valor Total Geral:</span>
                    <span className="font-mono text-lg text-[#0F4C5C]">{formatCurrency(totalCart)}</span>
                  </div>
                </div>

                {/* Confirm Sale Button */}
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                    cartItems.length === 0 
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                      : 'bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white cursor-pointer'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  Finalizar Venda <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* HISTORIC SALES ARCHIVE */}
      {activeMode === 'list' && (
        filteredVendas.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
            <ShoppingCart size={42} className="mx-auto text-gray-300" />
            <h3 className="text-lg font-bold text-gray-800">Histórico de Vendas Vazio</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {combinedSearch ? 'Nenhuma venda balcão corresponde aos termos pesquisados.' : 'Sua oficina ainda não efetuou nenhuma venda de balcão direta.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">ID Venda</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Data Registro</th>
                    <th className="px-6 py-4">Forma Pagto</th>
                    <th className="px-6 py-4">Peças Vendidas</th>
                    <th className="px-6 py-4 text-right">Valor Total</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredVendas.map(v => {
                    const client = clientes.find(c => c.id === v.clienteId);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#0F4C5C]">
                          #{v.id}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {client ? client.nome : 'Consumidor Final'}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                          {v.data}
                        </td>
                        <td className="px-6 py-4 font-medium text-xs text-gray-600">
                          {v.formaPagamento}
                        </td>
                        <td className="px-6 py-4 font-medium text-xs text-gray-500">
                          {v.itens.length} {v.itens.length === 1 ? 'item' : 'itens'} ({v.itens.reduce((sum, item) => sum + item.quantidade, 0)} unidades)
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                          {formatCurrency(v.valorTotal)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewReceipt(v)}
                              className="p-1.5 text-[#0F4C5C] hover:text-[#0C3D4A] hover:bg-gray-100 rounded transition-colors"
                              title="Gerar / Ver Recibo"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleEmitirNotaFromVenda(v)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Emitir Nota Fiscal"
                            >
                              <FileCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(v.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                              aria-label={`Excluir venda ${v.id}`}
                              title="Excluir Venda"
                            >
                              <Trash2 size={16} />
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
        )
      )}

      {/* SLIP/RECEIPT MODAL VIEW */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-5 py-3.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest">Comprovante de Venda Balcão</span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable body */}
            <div className="p-6 space-y-6 text-center font-sans border-b border-gray-100">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0F4C5C]">OficinaPro</h3>
                <p className="text-[10px] text-gray-400 font-mono">VENDA BALCÃO DE AUTOPEÇAS</p>
                <p className="text-xs text-gray-500 font-medium">Avenida Paulista, 1500 - Bela Vista - SP</p>
              </div>

              <div className="border-y border-dashed border-gray-300 py-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Recibo Nº:</span>
                  <span className="font-mono font-bold text-gray-800">#{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Data de Emissão:</span>
                  <span className="font-mono text-gray-700">{selectedReceipt.data}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Faturamento Ref:</span>
                  <span className="font-mono text-gray-700 font-bold">Venda #{selectedReceipt.referenciaId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Forma de Pago:</span>
                  <span className="text-gray-700 font-medium">{selectedReceipt.formaPagamento}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-gray-800 font-bold">VALOR RECEBIDO:</span>
                  <span className="font-mono text-lg font-black text-[#0F4C5C]">{formatCurrency(selectedReceipt.valor)}</span>
                </div>
              </div>

              <div className="text-left space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">Adquirente</span>
                <p className="font-bold text-gray-800">{selectedReceipt.clienteNome}</p>
                <p className="text-gray-500 leading-relaxed">
                  Confirmamos o recebimento e quitação do valor acima referente à aquisição direta de produtos e autopeças no balcão da OficinaPro.
                </p>
              </div>

              <div className="pt-6">
                <div className="border-t border-gray-300 w-48 mx-auto" />
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-2">Setor de Atendimento / OficinaPro</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ minHeight: '38px' }}
              >
                <Printer size={14} /> Imprimir Via do Cliente
              </button>
            </div>

          </div>
        </div>
      )}

      {isNotaModalOpen && notaTargetVenda && (
        <EmitirNotaModal
          isOpen={isNotaModalOpen}
          onClose={() => {
            setIsNotaModalOpen(false);
            setNotaTargetVenda(null);
          }}
          referenciaId={notaTargetVenda.id}
          referenciaTipo="Venda"
          valorTotal={notaTargetVenda.valorTotal}
          clienteId={notaTargetVenda.clienteId}
          clienteNome={notaTargetVenda.clienteNome}
          itens={notaTargetVenda.itens}
        />
      )}

    </div>
  );
};
