import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Produto, Servico } from '../types';
import { formatCurrency } from '../utils';
import { 
  Package, Plus, Search, Edit2, Trash2, X, Wrench, AlertTriangle, Check, Layers, Clock 
} from 'lucide-react';

export const ProdutosView: React.FC = () => {
  const { 
    produtos, servicos, 
    addProduto, updateProduto, deleteProduto,
    addServico, updateServico, deleteServico,
    searchQuery, showToast, confirmAction
  } = useApp();

  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'servicos'>('produtos');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // PRODUCT Form state
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [prodCodigo, setProdCodigo] = useState('');
  const [prodNome, setProdNome] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Filtros');
  const [prodPrecoVenda, setProdPrecoVenda] = useState<number>(0);
  const [prodEstoqueAtual, setProdEstoqueAtual] = useState<number>(0);
  const [prodEstoqueMinimo, setProdEstoqueMinimo] = useState<number>(0);

  // SERVICE Form state
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [servDescricao, setServDescricao] = useState('');
  const [servValorPadrao, setServValorPadrao] = useState<number>(0);
  const [servTempoEstimado, setServTempoEstimado] = useState<number>(0.5);

  // Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset Product Form
  const resetProductForm = () => {
    setEditingProduto(null);
    setProdCodigo('');
    setProdNome('');
    setProdCategoria('Filtros');
    setProdPrecoVenda(0);
    setProdEstoqueAtual(0);
    setProdEstoqueMinimo(0);
    setFormErrors({});
  };

  // Reset Service Form
  const resetServiceForm = () => {
    setEditingServico(null);
    setServDescricao('');
    setServValorPadrao(0);
    setServTempoEstimado(0.5);
    setFormErrors({});
  };

  // Open Edit Product
  const handleEditProduct = (p: Produto) => {
    setEditingProduto(p);
    setProdCodigo(p.codigo);
    setProdNome(p.nome);
    setProdCategoria(p.categoria);
    setProdPrecoVenda(p.precoVenda);
    setProdEstoqueAtual(p.estoqueAtual);
    setProdEstoqueMinimo(p.estoqueMinimo);
    setFormErrors({});
    setIsProductFormOpen(true);
  };

  // Open Edit Service
  const handleEditService = (s: Servico) => {
    setEditingServico(s);
    setServDescricao(s.descricao);
    setServValorPadrao(s.valorPadrao);
    setServTempoEstimado(s.tempoEstimado);
    setFormErrors({});
    setIsServiceFormOpen(true);
  };

  // Submit Product Form
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!prodCodigo.trim()) errors.codigo = 'Código do produto é obrigatório.';
    if (!prodNome.trim()) errors.nome = 'Nome do produto é obrigatório.';
    if (prodPrecoVenda <= 0) errors.precoVenda = 'Preço de venda deve ser maior que zero.';
    if (prodEstoqueAtual < 0) errors.estoqueAtual = 'Estoque atual não pode ser negativo.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const prodData = {
      codigo: prodCodigo,
      nome: prodNome,
      categoria: prodCategoria,
      precoVenda: Number(prodPrecoVenda),
      estoqueAtual: Number(prodEstoqueAtual),
      estoqueMinimo: Number(prodEstoqueMinimo)
    };

    if (editingProduto) {
      updateProduto(editingProduto.id, prodData);
      showToast('Produto atualizado com sucesso!', 'success');
    } else {
      addProduto(prodData);
      showToast('Produto cadastrado com sucesso!', 'success');
    }

    setIsProductFormOpen(false);
    resetProductForm();
  };

  // Submit Service Form
  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!servDescricao.trim()) errors.descricao = 'Descrição do serviço é obrigatória.';
    if (servValorPadrao <= 0) errors.valorPadrao = 'O valor padrão deve ser maior que zero.';
    if (servTempoEstimado <= 0) errors.tempoEstimado = 'O tempo estimado deve ser maior que zero.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const servData = {
      descricao: servDescricao,
      valorPadrao: Number(servValorPadrao),
      tempoEstimado: Number(servTempoEstimado)
    };

    if (editingServico) {
      updateServico(editingServico.id, servData);
      showToast('Serviço atualizado com sucesso!', 'success');
    } else {
      addServico(servData);
      showToast('Serviço cadastrado com sucesso!', 'success');
    }

    setIsServiceFormOpen(false);
    resetServiceForm();
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    const p = produtos.find(item => item.id === id);
    confirmAction({
      title: 'Excluir Produto',
      message: `Tem certeza de que deseja remover a peça/produto "${p ? p.nome : ''}" do estoque? Esta ação é irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteProduto(id);
        showToast('Produto removido com sucesso!', 'success');
      }
    });
  };

  // Delete Service
  const handleDeleteService = (id: string) => {
    const s = servicos.find(item => item.id === id);
    confirmAction({
      title: 'Excluir Serviço',
      message: `Tem certeza de que deseja remover o serviço "${s ? s.descricao : ''}" da tabela padrão? Esta ação é irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteServico(id);
        showToast('Serviço removido com sucesso!', 'success');
      }
    });
  };

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();

  // Dynamic list of unique categories in stock
  const categoriasDisponiveis = ['todas', ...Array.from(new Set(produtos.map(p => p.categoria)))];

  const filteredProdutos = produtos.filter(p => {
    const matchesCategory = selectedCategory === 'todas' || p.categoria.toLowerCase() === selectedCategory.toLowerCase();
    if (!matchesCategory) return false;

    if (!combinedSearch) return true;
    return (
      p.codigo.toLowerCase().includes(combinedSearch) ||
      p.nome.toLowerCase().includes(combinedSearch) ||
      p.categoria.toLowerCase().includes(combinedSearch)
    );
  });

  const filteredServicos = servicos.filter(s => {
    if (!combinedSearch) return true;
    return s.descricao.toLowerCase().includes(combinedSearch);
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Package size={22} className="text-[#0F4C5C]" />
            Produtos, Peças e Serviços
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans">
            Gerenciamento do catálogo de serviços técnicos e controle de estoque de autopeças.
          </p>
        </div>

        {activeSubTab === 'produtos' ? (
          <button
            onClick={() => { resetProductForm(); setIsProductFormOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            style={{ minHeight: '44px' }}
          >
            <Plus size={18} />
            <span>Cadastrar Peça/Produto</span>
          </button>
        ) : (
          <button
            onClick={() => { resetServiceForm(); setIsServiceFormOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            style={{ minHeight: '44px' }}
          >
            <Plus size={18} />
            <span>Cadastrar Serviço Padrão</span>
          </button>
        )}
      </div>

      {/* Selector and Search bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Sub Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-100" role="tablist">
            <button
              role="tab"
              aria-selected={activeSubTab === 'produtos'}
              onClick={() => { setActiveSubTab('produtos'); setLocalSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeSubTab === 'produtos'
                  ? 'bg-[#0F4C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
              }`}
              style={{ minHeight: '34px' }}
            >
              <Layers size={14} /> Peças e Produtos ({produtos.length})
            </button>
            <button
              role="tab"
              aria-selected={activeSubTab === 'servicos'}
              onClick={() => { setActiveSubTab('servicos'); setLocalSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeSubTab === 'servicos'
                  ? 'bg-[#0F4C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
              }`}
              style={{ minHeight: '34px' }}
            >
              <Wrench size={14} /> Tabela de Serviços ({servicos.length})
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-400">
            {activeSubTab === 'produtos' 
              ? `${filteredProdutos.length} de ${produtos.length} itens do estoque`
              : `${filteredServicos.length} de ${servicos.length} serviços cadastrados`}
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="catalog-search" className="sr-only">Pesquisar no catálogo</label>
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
            <input
              id="catalog-search"
              type="search"
              placeholder={
                activeSubTab === 'produtos' 
                  ? 'Buscar por código, nome da peça, categoria...' 
                  : 'Buscar por descrição do serviço...'
              }
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            />
          </div>
          {activeSubTab === 'produtos' && (
            <div className="w-full sm:w-56">
              <label htmlFor="category-filter" className="sr-only">Filtrar por Categoria</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] font-semibold text-gray-700 bg-white"
                style={{ minHeight: '38px' }}
              >
                <option value="todas">Todas as Categorias</option>
                {categoriasDisponiveis.filter(c => c !== 'todas').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCTS TAB CONTENT */}
      {activeSubTab === 'produtos' && (
        filteredProdutos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
            <Package size={42} className="mx-auto text-gray-300" />
            <h3 className="text-lg font-bold text-gray-800">Nenhum produto encontrado</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {combinedSearch ? 'Não encontramos produtos correspondentes ao termo digitado.' : 'Sua oficina ainda não possui peças ou produtos cadastrados no estoque.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Peça / Item</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4 text-center">Estoque Atual</th>
                    <th className="px-6 py-4 text-right">Preço de Venda</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredProdutos.map(p => {
                    const isLowStock = p.estoqueAtual <= p.estoqueMinimo;
                    const isCriticalStock = p.estoqueAtual < 5;
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors ${
                          isCriticalStock 
                            ? 'bg-red-50/60 hover:bg-red-100/40 border-l-4 border-l-red-500' 
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#0F4C5C]">
                          {p.codigo}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{p.nome}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {isCriticalStock && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded-md">
                                <AlertTriangle size={10} /> Estoque Crítico (&lt; 5)
                              </span>
                            )}
                            {isLowStock && !isCriticalStock && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                <AlertTriangle size={10} /> Reposição Necessária (Mín: {p.estoqueMinimo})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-xs text-gray-500 uppercase">
                          {p.categoria}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold">
                          <span className={`px-2.5 py-0.5 rounded-md border ${
                            isCriticalStock 
                              ? 'bg-red-600 text-white border-transparent font-black shadow-xs' 
                              : isLowStock 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-gray-100 text-gray-700 border-transparent'
                          }`}>
                            {p.estoqueAtual} unid
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                          {formatCurrency(p.precoVenda)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-md"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-md"
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
        )
      )}

      {/* SERVICES TAB CONTENT */}
      {activeSubTab === 'servicos' && (
        filteredServicos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
            <Wrench size={42} className="mx-auto text-gray-300" />
            <h3 className="text-lg font-bold text-gray-800">Nenhum serviço encontrado</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {combinedSearch ? 'Não encontramos serviços de mão de obra correspondentes.' : 'Não há tabela de preços de serviços cadastrada.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Serviço Técnico / Descrição</th>
                    <th className="px-6 py-4">Tempo Estimado</th>
                    <th className="px-6 py-4 text-right">Valor de Referência (Mão de Obra)</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredServicos.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {s.descricao}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        <span className="flex items-center gap-1 text-xs">
                          <Clock size={14} className="text-gray-400" />
                          {s.tempoEstimado} {s.tempoEstimado === 1 ? 'hora' : 'horas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                        {formatCurrency(s.valorPadrao)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditService(s)}
                            className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-md"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-md"
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
          </div>
        )
      )}

      {/* PRODUCT DIALOG FORM */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="prod-form-title">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="prod-form-title" className="text-lg font-bold text-gray-800">
                {editingProduto ? 'Editar Cadastro de Produto' : 'Cadastrar Nova Peça no Estoque'}
              </h3>
              <button onClick={() => setIsProductFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="form-prod-cod" className="block text-xs font-bold text-gray-700 mb-1">Código da Peça *</label>
                  <input
                    id="form-prod-cod"
                    type="text"
                    placeholder="Ex: PE-0010"
                    value={prodCodigo}
                    onChange={(e) => setProdCodigo(e.target.value.toUpperCase())}
                    className={`w-full text-sm border rounded-lg p-2.5 font-mono ${formErrors.codigo ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.codigo && <span className="text-xs text-red-600 font-semibold block mt-1">{formErrors.codigo}</span>}
                </div>
                <div>
                  <label htmlFor="form-prod-cat" className="block text-xs font-bold text-gray-700 mb-1">Categoria *</label>
                  <select
                    id="form-prod-cat"
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value="Filtros">Filtros</option>
                    <option value="Lubrificantes">Lubrificantes</option>
                    <option value="Freios">Freios</option>
                    <option value="Ignição">Ignição</option>
                    <option value="Suspensão">Suspensão</option>
                    <option value="Arrefecimento">Arrefecimento</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Motor">Componentes de Motor</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="form-prod-nome" className="block text-xs font-bold text-gray-700 mb-1">Nome Comercial do Produto *</label>
                <input
                  id="form-prod-nome"
                  type="text"
                  placeholder="Ex: Filtro de Óleo Fram PH5548"
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  className={`w-full text-sm border rounded-lg p-2.5 ${formErrors.nome ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.nome && <span className="text-xs text-red-600 font-semibold block mt-1">{formErrors.nome}</span>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="form-prod-preco" className="block text-xs font-bold text-gray-700 mb-1">Preço Venda (R$) *</label>
                  <input
                    id="form-prod-preco"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={prodPrecoVenda}
                    onChange={(e) => setProdPrecoVenda(Number(e.target.value))}
                    className={`w-full text-sm border rounded-lg p-2.5 font-mono ${formErrors.precoVenda ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.precoVenda && <span className="text-xs text-red-600 font-semibold block mt-1">{formErrors.precoVenda}</span>}
                </div>
                <div>
                  <label htmlFor="form-prod-estoque" className="block text-xs font-bold text-gray-700 mb-1">Estoque Inicial</label>
                  <input
                    id="form-prod-estoque"
                    type="number"
                    placeholder="0"
                    value={prodEstoqueAtual}
                    onChange={(e) => setProdEstoqueAtual(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="form-prod-min" className="block text-xs font-bold text-gray-700 mb-1">Alerta Mínimo</label>
                  <input
                    id="form-prod-min"
                    type="number"
                    placeholder="0"
                    value={prodEstoqueMinimo}
                    onChange={(e) => setProdEstoqueMinimo(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsProductFormOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-bold shadow-xs">Salvar Peça</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE DIALOG FORM */}
      {isServiceFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="serv-form-title">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="serv-form-title" className="text-lg font-bold text-gray-800">
                {editingServico ? 'Editar Serviço Técnico' : 'Adicionar Novo Serviço Padrão'}
              </h3>
              <button onClick={() => setIsServiceFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="form-serv-desc" className="block text-xs font-bold text-gray-700 mb-1">Descrição do Serviço / Mão de Obra *</label>
                <input
                  id="form-serv-desc"
                  type="text"
                  placeholder="Ex: Troca de pastilhas de freio dianteiras"
                  value={servDescricao}
                  onChange={(e) => setServDescricao(e.target.value)}
                  className={`w-full text-sm border rounded-lg p-2.5 ${formErrors.descricao ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.descricao && <span className="text-xs text-red-600 font-semibold block mt-1">{formErrors.descricao}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="form-serv-preco" className="block text-xs font-bold text-gray-700 mb-1">Valor do Serviço (R$) *</label>
                  <input
                    id="form-serv-preco"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={servValorPadrao}
                    onChange={(e) => setServValorPadrao(Number(e.target.value))}
                    className={`w-full text-sm border rounded-lg p-2.5 font-mono ${formErrors.valorPadrao ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.valorPadrao && <span className="text-xs text-red-600 font-semibold block mt-1">{formErrors.valorPadrao}</span>}
                </div>
                <div>
                  <label htmlFor="form-serv-tempo" className="block text-xs font-bold text-gray-700 mb-1">Tempo Estimado (Horas)</label>
                  <input
                    id="form-serv-tempo"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={servTempoEstimado}
                    onChange={(e) => setServTempoEstimado(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsServiceFormOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-bold shadow-xs">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
