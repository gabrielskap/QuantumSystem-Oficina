import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cliente, TipoCliente, Veiculo, OrdemServico, Orçamento } from '../types';
import { 
  formatDocument, formatPhone, formatCEP, formatCurrency,
  validateCPF, validateCNPJ, getAddressByCEP, 
  parseUnstructuredText 
} from '../utils';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Check, Info, FileText, 
  MapPin, Phone, Mail, FileSignature, Car, Sparkles, Clock, 
  AlertTriangle, Eye, ArrowRight, CheckCircle, ListFilter, ShieldAlert
} from 'lucide-react';

export const ClientesView: React.FC = () => {
  const { 
    clientes, veiculos, ordensServico, orcamentos,
    addCliente, updateCliente, deleteCliente, searchQuery,
    setActiveTab, setPrefilledClienteId, showToast, confirmAction
  } = useApp();
  
  // View states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  
  // Filtering states
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'PF' | 'PJ'>('Todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('Todas');

  // Form fields
  const [tipo, setTipo] = useState<TipoCliente>('PF');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Intelligent text parsing states
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [smartSuccess, setSmartSuccess] = useState(false);

  // CEP loading state
  const [isCepLoading, setIsCepLoading] = useState(false);

  // Form errors and warnings
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Dynamic list of cities for filters
  const cidadesDisponiveis = Array.from(
    new Set(clientes.map(c => c.endereco?.cidade).filter(Boolean))
  ).sort();

  // Reset form
  const resetForm = () => {
    setTipo('PF');
    setNome('');
    setDocumento('');
    setTelefone('');
    setEmail('');
    setCep('');
    setRua('');
    setNumero('');
    setBairro('');
    setCidade('');
    setUf('');
    setObservacoes('');
    setFormErrors({});
    setDuplicateWarning(null);
    setEditingCliente(null);
    setShowSmartPaste(false);
    setSmartText('');
    setSmartSuccess(false);
  };

  // Open edit modal
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setTipo(cliente.tipo);
    setNome(cliente.nome);
    setDocumento(cliente.documento);
    setTelefone(cliente.telefone);
    setEmail(cliente.email);
    setCep(cliente.endereco.cep);
    setRua(cliente.endereco.rua);
    setNumero(cliente.endereco.numero);
    setBairro(cliente.endereco.bairro);
    setCidade(cliente.endereco.cidade);
    setUf(cliente.endereco.uf);
    setObservacoes(cliente.observacoes);
    setFormErrors({});
    setDuplicateWarning(null);
    setShowSmartPaste(false);
    setIsFormOpen(true);
  };

  // Handle document mask as typed
  const handleDocChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let masked = clean;
    if (tipo === 'PF') {
      // CPF: 000.000.000-00
      if (clean.length > 3) masked = clean.slice(0, 3) + '.' + clean.slice(3);
      if (clean.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
      if (clean.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11, 13);
      setDocumento(masked.slice(0, 14));
      
      // Perform immediate duplicate checking
      const dup = checkDuplicate(clean, 'PF');
      setDuplicateWarning(dup);
    } else {
      // CNPJ: 00.000.000/0001-00
      if (clean.length > 2) masked = clean.slice(0, 2) + '.' + clean.slice(2);
      if (clean.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
      if (clean.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
      if (clean.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15, 17);
      setDocumento(masked.slice(0, 18));

      // Perform immediate duplicate checking
      const dup = checkDuplicate(clean, 'PJ');
      setDuplicateWarning(dup);
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let masked = clean;
    if (clean.length > 0) masked = '(' + clean;
    if (clean.length > 2) masked = '(' + clean.slice(0, 2) + ') ' + clean.slice(2);
    if (clean.length > 7) {
      if (clean.length === 11) {
        masked = '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 7) + '-' + clean.slice(7, 11);
      } else {
        masked = '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 6) + '-' + clean.slice(6, 10);
      }
    }
    setTelefone(masked.slice(0, 15));
  };

  const handleCEPChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let masked = clean;
    if (clean.length > 5) {
      masked = clean.slice(0, 5) + '-' + clean.slice(5, 8);
    }
    setCep(masked.slice(0, 9));

    // Simulated autofill of address on reaching 8 digits
    if (clean.length === 8) {
      setIsCepLoading(true);
      setTimeout(() => {
        const addr = getAddressByCEP(clean);
        if (addr) {
          setRua(addr.rua);
          setBairro(addr.bairro);
          setCidade(addr.cidade);
          setUf(addr.uf);
          // Clear error on cep if valid
          setFormErrors(prev => {
            const copy = { ...prev };
            delete copy.cep;
            delete copy.rua;
            delete copy.bairro;
            delete copy.cidade;
            delete copy.uf;
            return copy;
          });
        }
        setIsCepLoading(false);
      }, 450);
    }
  };

  // Helper to check for existing customer duplicate CPF/CNPJ
  const checkDuplicate = (cleanDoc: string, docTipo: TipoCliente): string | null => {
    if (!cleanDoc) return null;
    const dup = clientes.find(c => {
      const cClean = c.documento.replace(/\D/g, '');
      return cClean === cleanDoc && c.id !== editingCliente?.id;
    });
    
    if (dup) {
      return `Atenção: Já existe outro cliente cadastrado com este ${docTipo === 'PF' ? 'CPF' : 'CNPJ'} (${dup.nome}).`;
    }
    return null;
  };

  // Run the "Cadastro Inteligente" Text Parsing engine
  const handleProcessSmartText = () => {
    if (!smartText.trim()) return;
    
    const parsed = parseUnstructuredText(smartText);
    
    if (parsed.tipo) setTipo(parsed.tipo);
    if (parsed.nome) setNome(parsed.nome);
    if (parsed.email) setEmail(parsed.email);
    
    if (parsed.documento) {
      // Reformat the document according to PF/PJ rules
      const cleanDoc = parsed.documento.replace(/\D/g, '');
      if (parsed.tipo === 'PF') {
        let masked = cleanDoc;
        if (cleanDoc.length > 3) masked = cleanDoc.slice(0, 3) + '.' + cleanDoc.slice(3);
        if (cleanDoc.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
        if (cleanDoc.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11, 13);
        setDocumento(masked.slice(0, 14));
      } else {
        let masked = cleanDoc;
        if (cleanDoc.length > 2) masked = cleanDoc.slice(0, 2) + '.' + cleanDoc.slice(2);
        if (cleanDoc.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
        if (cleanDoc.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
        if (cleanDoc.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15, 17);
        setDocumento(masked.slice(0, 18));
      }
      
      const dup = checkDuplicate(cleanDoc, parsed.tipo || 'PF');
      setDuplicateWarning(dup);
    }
    
    if (parsed.telefone) {
      const cleanPhone = parsed.telefone.replace(/\D/g, '');
      let masked = cleanPhone;
      if (cleanPhone.length > 0) masked = '(' + cleanPhone;
      if (cleanPhone.length > 2) {
        if (cleanPhone.startsWith('55') && cleanPhone.length > 4) {
          const cut = cleanPhone.slice(2);
          masked = '(' + cut.slice(0, 2) + ') ' + cut.slice(2);
        } else {
          masked = '(' + cleanPhone.slice(0, 2) + ') ' + cleanPhone.slice(2);
        }
      }
      if (cleanPhone.length > 7) {
        const cleanNoDdd = cleanPhone.replace(/^55/, '');
        const ddd = cleanNoDdd.slice(0, 2);
        const rest = cleanNoDdd.slice(2);
        if (rest.length === 9) {
          masked = `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
        } else {
          masked = `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
        }
      }
      setTelefone(masked.slice(0, 15));
    }
    
    if (parsed.cep) {
      const cleanCep = parsed.cep.replace(/\D/g, '');
      let masked = cleanCep;
      if (cleanCep.length > 5) {
        masked = cleanCep.slice(0, 5) + '-' + cleanCep.slice(5, 8);
      }
      setCep(masked.slice(0, 9));
      
      // Perform CEP autofill lookup
      if (cleanCep.length === 8) {
        const addr = getAddressByCEP(cleanCep);
        if (addr) {
          setRua(addr.rua);
          setBairro(addr.bairro);
          setCidade(addr.cidade);
          setUf(addr.uf);
        }
      }
    }
    
    setSmartSuccess(true);
    setTimeout(() => setSmartSuccess(false), 3000);
  };

  // Validation before Save
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanDoc = documento.replace(/\D/g, '');
    const cleanPhone = telefone.replace(/\D/g, '');
    const cleanCep = cep.replace(/\D/g, '');

    if (!nome.trim()) {
      errors.nome = tipo === 'PF' ? 'Nome Completo é obrigatório.' : 'Razão Social é obrigatório.';
    }

    // Real CPF and CNPJ Check Digit validation
    if (!documento.trim()) {
      errors.documento = tipo === 'PF' ? 'CPF é obrigatório.' : 'CNPJ é obrigatório.';
    } else {
      if (tipo === 'PF') {
        if (cleanDoc.length !== 11) {
          errors.documento = 'CPF deve conter 11 dígitos.';
        } else if (!validateCPF(cleanDoc)) {
          errors.documento = 'CPF inválido (Dígitos verificadores incorretos).';
        }
      } else {
        if (cleanDoc.length !== 14) {
          errors.documento = 'CNPJ deve conter 14 dígitos.';
        } else if (!validateCNPJ(cleanDoc)) {
          errors.documento = 'CNPJ inválido (Dígitos verificadores incorretos).';
        }
      }
    }

    // Phone validation
    if (!telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório.';
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.telefone = 'Telefone inválido. Deve ter 10 ou 11 dígitos (com DDD).';
    }

    // Email optional but validated
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Endereço de e-mail inválido.';
    }

    // CEP validation
    if (!cep.trim()) {
      errors.cep = 'CEP é obrigatório.';
    } else if (cleanCep.length !== 8) {
      errors.cep = 'CEP inválido. Deve conter 8 dígitos.';
    }

    // Address lines
    if (!rua.trim()) errors.rua = 'Rua é obrigatória.';
    if (!numero.trim()) errors.numero = 'Nº é obrigatório.';
    if (!bairro.trim()) errors.bairro = 'Bairro é obrigatório.';
    if (!cidade.trim()) errors.cidade = 'Cidade é obrigatória.';
    if (!uf.trim()) errors.uf = 'UF é obrigatória.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Final duplicate check warning block (strictly require user awareness if duplicated)
    const cleanDoc = documento.replace(/\D/g, '');
    const dupWarning = checkDuplicate(cleanDoc, tipo);
    if (dupWarning && !window.confirm(`${dupWarning}\n\nDeseja forçar a gravação deste registro mesmo duplicado?`)) {
      return;
    }

    const clienteData = {
      tipo,
      nome,
      documento,
      telefone,
      email,
      endereco: {
        cep,
        rua,
        numero,
        bairro,
        cidade,
        uf: uf.toUpperCase(),
      },
      observacoes,
    };

    if (editingCliente) {
      updateCliente(editingCliente.id, clienteData);
      showToast('Cliente atualizado com sucesso!', 'success');
    } else {
      addCliente(clienteData);
      showToast('Cliente cadastrado com sucesso!', 'success');
    }

    setIsFormOpen(false);
    resetForm();
  };

  // Safely delete client
  const handleDelete = (id: string, name: string) => {
    // Check if customer has registered vehicles
    const clientVehicles = veiculos.filter(v => v.clienteId === id);
    const vehicleMsg = clientVehicles.length > 0 
      ? ` ATENÇÃO: Este cliente possui ${clientVehicles.length} veículo(s) cadastrado(s) que perderão o vínculo principal.`
      : '';

    confirmAction({
      title: 'Excluir Cliente',
      message: `Tem certeza de que deseja excluir o cliente "${name}"?${vehicleMsg} Esta ação é irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteCliente(id);
        showToast(`Cliente "${name}" excluído com sucesso!`, 'success');
        if (selectedCliente?.id === id) {
          setSelectedCliente(null);
        }
      }
    });
  };

  // Comprehensive Search logic (By Name, Document, Phone, or Vehicle License Plate)
  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredClientes = clientes.filter(c => {
    // 1. Filter by Search Query
    let matchesSearch = true;
    if (combinedSearch) {
      const cleanDocSearch = combinedSearch.replace(/\D/g, '');
      const cleanPhoneSearch = combinedSearch.replace(/\D/g, '');

      const matchNome = c.nome.toLowerCase().includes(combinedSearch);
      const matchDoc = c.documento.replace(/\D/g, '').includes(cleanDocSearch) || c.documento.toLowerCase().includes(combinedSearch);
      const matchEmail = c.email.toLowerCase().includes(combinedSearch);
      const matchPhone = c.telefone.replace(/\D/g, '').includes(cleanPhoneSearch) || c.telefone.includes(combinedSearch);
      
      // Match by license plate of ANY vehicle registered to this client
      const clientVehicles = veiculos.filter(v => v.clienteId === c.id);
      const matchPlaca = clientVehicles.some(v => v.placa.toLowerCase().includes(combinedSearch));

      matchesSearch = matchNome || matchDoc || matchEmail || matchPhone || matchPlaca;
    }

    // 2. Filter by Type (PF/PJ)
    const matchesTipo = filtroTipo === 'Todos' || c.tipo === filtroTipo;

    // 3. Filter by City
    const matchesCidade = filtroCidade === 'Todas' || c.endereco?.cidade === filtroCidade;

    return matchesSearch && matchesTipo && matchesCidade;
  });

  // Simple statistics
  const countPF = clientes.filter(c => c.tipo === 'PF').length;
  const countPJ = clientes.filter(c => c.tipo === 'PJ').length;

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Clientes Totais</div>
          <div className="text-2xl font-black text-[#0F4C5C] mt-1">{clientes.length}</div>
          <div className="text-[10px] text-gray-400 mt-1 font-semibold">Proprietários ativos</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Pessoas Físicas (PF)</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{countPF}</div>
          <div className="text-[10px] text-gray-400 mt-1 font-semibold">{(clientes.length > 0 ? (countPF / clientes.length * 100).toFixed(0) : 0)}% do total</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Pessoas Jurídicas (PJ)</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{countPJ}</div>
          <div className="text-[10px] text-gray-400 mt-1 font-semibold">{(clientes.length > 0 ? (countPJ / clientes.length * 100).toFixed(0) : 0)}% do total</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Veículos Vinculados</div>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-2">
            <Car size={24} className="text-amber-500" />
            {veiculos.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1 font-semibold">Média de {(clientes.length > 0 ? (veiculos.length / clientes.length).toFixed(1) : 0)} por cliente</div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="main-title" className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-[#0F4C5C]" />
            Clientes da Oficina
          </h2>
          <p className="text-xs text-gray-500 font-medium">Cadastre proprietários de veículos, gerencie contatos, placas associadas e consulte o histórico financeiro e de ordens de serviço.</p>
        </div>

        <button
          id="btn-novo-cliente"
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-[#E39B00] cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Filters and Search Bar Container */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="search-input" className="sr-only">Pesquisar por nome, documento, fone ou placa de veículo</label>
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
          <input
            id="search-input"
            type="search"
            placeholder="Buscar por nome, fone, placa..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
        </div>

        {/* Dynamic Filters Layout */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          
          {/* Tipo Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap flex items-center gap-1">
              <ListFilter size={14} /> Tipo:
            </span>
            <select
              id="filtro-tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-semibold text-gray-700 focus:ring-1 focus:ring-[#0F4C5C]"
            >
              <option value="Todos">Todos (PF e PJ)</option>
              <option value="PF">Pessoa Física (PF)</option>
              <option value="PJ">Pessoa Jurídica (PJ)</option>
            </select>
          </div>

          {/* Cidade Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap flex items-center gap-1">
              <MapPin size={14} /> Cidade:
            </span>
            <select
              id="filtro-cidade"
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-semibold text-gray-700 focus:ring-1 focus:ring-[#0F4C5C]"
            >
              <option value="Todas">Todas as Cidades</option>
              {cidadesDisponiveis.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Info Badge */}
          <div className="text-xs font-mono text-gray-500 font-semibold self-center mt-2 sm:mt-0 bg-gray-100 px-2 py-1 rounded">
            {filteredClientes.length} registros
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredClientes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-[#0F4C5C]/5 text-[#0F4C5C] flex items-center justify-center rounded-full mx-auto">
            <Users size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800">Nenhum cliente correspondente</h3>
            <p className="text-sm text-gray-500 mt-1">
              {combinedSearch || filtroTipo !== 'Todos' || filtroCidade !== 'Todas'
                ? 'Nenhum resultado corresponde à sua pesquisa e filtros atuais. Experimente limpar os filtros ou buscar por outros termos.' 
                : 'Cadastre o seu primeiro cliente proprietário para começar a abrir ordens de serviço e emitir orçamentos na oficina.'}
            </p>
          </div>
          {(combinedSearch || filtroTipo !== 'Todos' || filtroCidade !== 'Todas') ? (
            <button
              onClick={() => { setLocalSearch(''); setFiltroTipo('Todos'); setFiltroCidade('Todas'); }}
              className="inline-flex items-center gap-1.5 text-xs text-[#0F4C5C] font-bold hover:underline bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Limpar Filtros e Busca
            </button>
          ) : (
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-[#0F4C5C] cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <Plus size={18} />
              <span>Cadastrar Primeiro Cliente</span>
            </button>
          )}
        </div>
      ) : (
        /* Customers List Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Documento (CPF/CNPJ)</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Localização (Cidade/UF)</th>
                  <th className="px-6 py-4 text-center">Nº Veículos</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredClientes.map((c) => {
                  const clientVehicles = veiculos.filter(v => v.clienteId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/55 transition-colors">
                      <td className="px-6 py-4">
                        <div 
                          onClick={() => setSelectedCliente(c)}
                          className="font-bold text-gray-800 hover:text-[#0F4C5C] hover:underline cursor-pointer"
                        >
                          {c.nome}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${
                            c.tipo === 'PF' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {c.tipo === 'PF' ? 'PF (Física)' : 'PJ (Jurídica)'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Cadastrado em {c.dataCadastro}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-gray-600">
                        {formatDocument(c.documento)}
                      </td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="text-xs text-gray-600 font-mono font-medium">{formatPhone(c.telefone)}</div>
                        <div className="text-xs text-gray-400 font-medium">{c.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700 text-xs uppercase">{c.endereco?.cidade || '—'} / {c.endereco?.uf || '—'}</div>
                        <div className="text-[11px] text-gray-400">{c.endereco?.bairro || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                          clientVehicles.length > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-500'
                        }`}>
                          <Car size={13} />
                          {clientVehicles.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver Ficha */}
                          <button
                            onClick={() => setSelectedCliente(c)}
                            className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Ver ficha completa de ${c.nome}`}
                            aria-label={`Ver ficha de ${c.nome}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
                          >
                            <Eye size={16} />
                          </button>
                          {/* Editar */}
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Editar cadastro de ${c.nome}`}
                            aria-label={`Editar ${c.nome}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Excluir */}
                          <button
                            onClick={() => handleDelete(c.id, c.nome)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Excluir cliente ${c.nome}`}
                            aria-label={`Excluir ${c.nome}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
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
      )}

      {/* Customer Ficha / Profile Detail Slide-over Modal */}
      {selectedCliente && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end p-0 md:p-4">
          <div className="bg-white w-full max-w-3xl h-full md:h-[95vh] md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Profile Header */}
            <div className="bg-[#0F4C5C] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center font-black text-lg border border-white/20">
                  {selectedCliente.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{selectedCliente.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold bg-[#E39B00] px-1.5 py-0.5 rounded text-white">
                      {selectedCliente.tipo}
                    </span>
                    <span className="text-xs text-white/80 font-mono">
                      Doc: {formatDocument(selectedCliente.documento)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white"
                aria-label="Fechar ficha do cliente"
              >
                <X size={22} />
              </button>
            </div>

            {/* Profile Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50 text-sm">
              
              {/* Grid 1: Basic Contact & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Contact Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-[#0F4C5C] uppercase text-xs flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Phone size={14} /> Dados de Contato
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-semibold w-20">Telefone:</span>
                      <a 
                        href={`tel:${selectedCliente.telefone.replace(/\D/g, '')}`} 
                        className="font-mono text-gray-700 font-bold hover:underline text-xs"
                      >
                        {formatPhone(selectedCliente.telefone)}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-semibold w-20">E-mail:</span>
                      {selectedCliente.email ? (
                        <a 
                          href={`mailto:${selectedCliente.email}`} 
                          className="font-medium text-blue-600 hover:underline text-xs"
                        >
                          {selectedCliente.email}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Não informado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-semibold w-20">Cadastro:</span>
                      <span className="font-mono text-gray-600 text-xs">{selectedCliente.dataCadastro}</span>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-[#0F4C5C] uppercase text-xs flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <MapPin size={14} /> Endereço Completo
                  </h4>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="font-bold text-gray-800">
                      {selectedCliente.endereco?.rua}, nº {selectedCliente.endereco?.numero}
                    </div>
                    <div>
                      {selectedCliente.endereco?.bairro} • {selectedCliente.endereco?.cidade} / {selectedCliente.endereco?.uf}
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 mt-1">
                      CEP: {formatCEP(selectedCliente.endereco?.cep || '')}
                    </div>
                  </div>
                </div>

              </div>

              {/* Remarks/Observations box */}
              {selectedCliente.observacoes && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-800 uppercase text-xs flex items-center gap-1">
                    <FileSignature size={14} /> Observações de Atendimento
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {selectedCliente.observacoes}
                  </p>
                </div>
              )}

              {/* Linked Vehicles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-800 uppercase text-xs flex items-center gap-1.5">
                    <Car size={15} className="text-amber-500" /> 
                    Veículos Vinculados ({veiculos.filter(v => v.clienteId === selectedCliente.id).length})
                  </h4>
                  <button
                    onClick={() => {
                      setPrefilledClienteId(selectedCliente.id);
                      setActiveTab('veiculos');
                      setSelectedCliente(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                    style={{ minHeight: '32px' }}
                  >
                    <Plus size={12} />
                    <span>Adicionar veículo</span>
                  </button>
                </div>

                {veiculos.filter(v => v.clienteId === selectedCliente.id).length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-400 text-xs italic">
                    Nenhum veículo vinculado a este cliente. Cadastre um veículo na aba correspondente associando-o a este cliente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {veiculos.filter(v => v.clienteId === selectedCliente.id).map(v => (
                      <div key={v.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex gap-3 items-start">
                        
                        {/* Plate visual badge */}
                        <div className="flex flex-col items-center border border-gray-400 rounded bg-blue-50 font-mono font-bold text-gray-800 w-20 flex-shrink-0 shadow-2xs">
                          <div className="w-full h-1 bg-[#0F4C5C]/90 rounded-t-[3px]" />
                          <div className="py-0.5 text-[11px] tracking-wider">{v.placa}</div>
                        </div>

                        {/* Vehicle text description */}
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-gray-800">{v.marca} {v.modelo}</div>
                          <div className="text-gray-400 font-medium">Ano: {v.ano} • Cor: {v.cor}</div>
                          <div className="font-mono text-[10px] text-gray-500">
                            KM: {v.quilometragem.toLocaleString('pt-BR')} km
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History: Service Orders and Budgets Tabulation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* OS History Card */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 uppercase text-xs flex items-center gap-1.5">
                    <FileText size={15} className="text-[#0F4C5C]" /> 
                    Ordens de Serviço ({ordensServico.filter(o => o.clienteId === selectedCliente.id).length})
                  </h4>

                  {ordensServico.filter(o => o.clienteId === selectedCliente.id).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-400 text-xs italic">
                      Nenhuma ordem de serviço.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {ordensServico.filter(o => o.clienteId === selectedCliente.id).map(o => (
                        <div key={o.numero} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs hover:border-gray-300 transition-colors">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-700">OS #{o.numero}</div>
                            <div className="text-[10px] font-mono text-gray-400">Entrada: {o.dataEntrada}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-bold text-[#0F4C5C]">{formatCurrency(o.valorTotal)}</div>
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${
                              o.status === 'entregue' ? 'bg-green-100 text-green-800' :
                              o.status === 'concluida' ? 'bg-blue-100 text-blue-800' :
                              o.status === 'em_andamento' ? 'bg-amber-100 text-amber-800' :
                              o.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {o.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budgets History Card */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 uppercase text-xs flex items-center gap-1.5">
                    <Clock size={15} className="text-blue-500" /> 
                    Orçamentos ({orcamentos.filter(o => o.clienteId === selectedCliente.id).length})
                  </h4>

                  {orcamentos.filter(o => o.clienteId === selectedCliente.id).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-400 text-xs italic">
                      Nenhum orçamento.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {orcamentos.filter(o => o.clienteId === selectedCliente.id).map(o => (
                        <div key={o.numero} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs hover:border-gray-300 transition-colors">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-700">Orc #{o.numero}</div>
                            <div className="text-[10px] font-mono text-gray-400">Validade: {o.validade}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-bold text-gray-700">{formatCurrency(o.valorTotal)}</div>
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${
                              o.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                              o.status === 'recusado' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Profile Footer */}
            <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => { setSelectedCliente(null); }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                style={{ minHeight: '40px' }}
              >
                Voltar à Lista
              </button>
              <button
                onClick={() => { handleEdit(selectedCliente); setSelectedCliente(null); }}
                className="px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                style={{ minHeight: '40px' }}
              >
                <Edit2 size={13} />
                Editar Cadastro
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Form Modal for Adding and Editing Customers */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#0F4C5C]" />
                <h3 id="modal-title" className="text-base font-black text-gray-800 uppercase tracking-tight">
                  {editingCliente ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            {/* Smart Paste Collapse Selector (Cadastro Inteligente) */}
            {!editingCliente && (
              <div className="px-6 pt-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <Sparkles size={16} className="text-[#E39B00] animate-pulse" />
                      <span>✨ Preenchimento Inteligente (Texto Solto)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSmartPaste(!showSmartPaste)}
                      className="text-xs font-bold text-[#0F4C5C] hover:underline cursor-pointer"
                    >
                      {showSmartPaste ? 'Ocultar Campo' : 'Utilizar Preenchimento'}
                    </button>
                  </div>

                  {showSmartPaste && (
                    <div className="space-y-3 text-xs">
                      <p className="text-gray-500 font-medium leading-relaxed">
                        Cole qualquer texto solto contendo dados do cliente (ex.: "Ana de Souza, 11 99122-3344, anabea@gmail.com, CPF 234.567.890-11, CEP 22040-010"). O sistema irá identificar, separar e preencher os campos do formulário abaixo automaticamente.
                      </p>
                      <textarea
                        id="smart-paste-area"
                        placeholder="Cole aqui o texto solto..."
                        value={smartText}
                        onChange={(e) => setSmartText(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs focus:ring-1 focus:ring-[#0F4C5C] font-sans"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSmartText('')}
                          className="px-2.5 py-1.5 border border-gray-300 rounded text-gray-600 font-semibold hover:bg-gray-100 cursor-pointer"
                        >
                          Limpar
                        </button>
                        <button
                          type="button"
                          onClick={handleProcessSmartText}
                          className="px-3.5 py-1.5 bg-[#0F4C5C] text-white font-bold rounded-lg hover:bg-[#0C3D4A] flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Separar e Preencher</span>
                        </button>
                      </div>
                      
                      {smartSuccess && (
                        <div className="flex items-center gap-1.5 text-green-700 font-bold bg-green-50 p-2 rounded-lg animate-fade-in border border-green-200">
                          <CheckCircle size={15} />
                          <span>Dados processados e preenchidos no formulário abaixo! Revise antes de salvar.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Duplicate CPF/CNPJ warning */}
              {duplicateWarning && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2 items-start text-xs text-red-800 font-medium animate-pulse">
                  <ShieldAlert size={18} className="text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Aviso de Duplicidade:</span> {duplicateWarning}
                  </div>
                </div>
              )}

              {/* Seção 1: Identificação */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  1. Identificação Cadastral
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tipo de Cliente */}
                  <div>
                    <label htmlFor="form-tipo" className="block text-xs font-bold text-gray-700 mb-1.5">Tipo de Registro</label>
                    <select
                      id="form-tipo"
                      value={tipo}
                      onChange={(e) => {
                        const newTipo = e.target.value as TipoCliente;
                        setTipo(newTipo);
                        setDocumento('');
                        setDuplicateWarning(null);
                        setFormErrors(prev => {
                          const copy = { ...prev };
                          delete copy.documento;
                          return copy;
                        });
                      }}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] font-semibold text-gray-700"
                    >
                      <option value="PF">Pessoa Física (PF)</option>
                      <option value="PJ">Pessoa Jurídica (PJ)</option>
                    </select>
                  </div>

                  {/* Nome Completo / Razão Social */}
                  <div className="sm:col-span-2">
                    <label htmlFor="form-nome" className="block text-xs font-bold text-gray-700 mb-1.5">
                      {tipo === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                    </label>
                    <input
                      id="form-nome"
                      type="text"
                      placeholder={tipo === 'PF' ? 'Nome do proprietário' : 'Nome oficial da empresa'}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.nome ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-medium text-gray-800'
                      }`}
                      aria-describedby={formErrors.nome ? "error-nome" : undefined}
                    />
                    {formErrors.nome && (
                      <span id="error-nome" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.nome}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Documento (CPF / CNPJ) */}
                  <div>
                    <label htmlFor="form-documento" className="block text-xs font-bold text-gray-700 mb-1.5">
                      {tipo === 'PF' ? 'CPF *' : 'CNPJ *'}
                    </label>
                    <input
                      id="form-documento"
                      type="text"
                      placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                      value={documento}
                      onChange={(e) => handleDocChange(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] font-mono ${
                        formErrors.documento ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-semibold'
                      }`}
                      aria-describedby={formErrors.documento ? "error-documento" : undefined}
                    />
                    {formErrors.documento && (
                      <span id="error-documento" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.documento}</span>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label htmlFor="form-telefone" className="block text-xs font-bold text-gray-700 mb-1.5">Telefone (com DDD) *</label>
                    <input
                      id="form-telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] font-mono ${
                        formErrors.telefone ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-semibold'
                      }`}
                      aria-describedby={formErrors.telefone ? "error-telefone" : undefined}
                    />
                    {formErrors.telefone && (
                      <span id="error-telefone" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.telefone}</span>
                    )}
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label htmlFor="form-email" className="block text-xs font-bold text-gray-700 mb-1.5">Endereço de E-mail</label>
                  <input
                    id="form-email"
                    type="email"
                    placeholder="cliente@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                      formErrors.email ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-medium text-gray-700'
                    }`}
                    aria-describedby={formErrors.email ? "error-email" : undefined}
                  />
                  {formErrors.email && (
                    <span id="error-email" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.email}</span>
                  )}
                </div>
              </div>

              {/* Seção 2: Endereço */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  2. Endereço e Logística
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* CEP */}
                  <div className="relative">
                    <label htmlFor="form-cep" className="block text-xs font-bold text-gray-700 mb-1.5">CEP *</label>
                    <input
                      id="form-cep"
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] font-mono ${
                        formErrors.cep ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-semibold'
                      }`}
                      aria-describedby={formErrors.cep ? "error-cep" : undefined}
                    />
                    {isCepLoading && (
                      <span className="absolute right-2.5 top-[34px] flex h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-[#0F4C5C]" />
                    )}
                    {formErrors.cep && (
                      <span id="error-cep" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.cep}</span>
                    )}
                  </div>

                  {/* Rua */}
                  <div className="sm:col-span-2">
                    <label htmlFor="form-rua" className="block text-xs font-bold text-gray-700 mb-1.5">Rua / Logradouro *</label>
                    <input
                      id="form-rua"
                      type="text"
                      placeholder="Rua, Avenida, etc."
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.rua ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-medium text-gray-700'
                      }`}
                      aria-describedby={formErrors.rua ? "error-rua" : undefined}
                    />
                    {formErrors.rua && (
                      <span id="error-rua" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.rua}</span>
                    )}
                  </div>

                  {/* Número */}
                  <div>
                    <label htmlFor="form-numero" className="block text-xs font-bold text-gray-700 mb-1.5">Número *</label>
                    <input
                      id="form-numero"
                      type="text"
                      placeholder="Ex: 1540"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] font-mono ${
                        formErrors.numero ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-semibold'
                      }`}
                      aria-describedby={formErrors.numero ? "error-numero" : undefined}
                    />
                    {formErrors.numero && (
                      <span id="error-numero" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.numero}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bairro */}
                  <div>
                    <label htmlFor="form-bairro" className="block text-xs font-bold text-gray-700 mb-1.5">Bairro *</label>
                    <input
                      id="form-bairro"
                      type="text"
                      placeholder="Ex: Copacabana"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.bairro ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-medium text-gray-700'
                      }`}
                      aria-describedby={formErrors.bairro ? "error-bairro" : undefined}
                    />
                    {formErrors.bairro && (
                      <span id="error-bairro" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.bairro}</span>
                    )}
                  </div>

                  {/* Cidade */}
                  <div>
                    <label htmlFor="form-cidade" className="block text-xs font-bold text-gray-700 mb-1.5">Cidade *</label>
                    <input
                      id="form-cidade"
                      type="text"
                      placeholder="Ex: Rio de Janeiro"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.cidade ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-medium text-gray-700'
                      }`}
                      aria-describedby={formErrors.cidade ? "error-cidade" : undefined}
                    />
                    {formErrors.cidade && (
                      <span id="error-cidade" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.cidade}</span>
                    )}
                  </div>

                  {/* UF */}
                  <div>
                    <label htmlFor="form-uf" className="block text-xs font-bold text-gray-700 mb-1.5">Estado (UF) *</label>
                    <input
                      id="form-uf"
                      type="text"
                      maxLength={2}
                      placeholder="Ex: RJ"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] font-mono uppercase ${
                        formErrors.uf ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white font-semibold'
                      }`}
                      aria-describedby={formErrors.uf ? "error-uf" : undefined}
                    />
                    {formErrors.uf && (
                      <span id="error-uf" className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.uf}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 3: Observações */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  3. Observações Adicionais
                </h4>
                <div>
                  <label htmlFor="form-obs" className="block text-xs font-bold text-gray-700 mb-1.5">Instruções ou Preferências (Opcional)</label>
                  <textarea
                    id="form-obs"
                    placeholder="Ex: Prefere faturamento mensal, restrições de horários de entrega, etc."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] font-medium text-gray-700"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-bold shadow-xs transition-colors focus:ring-2 focus:ring-[#0F4C5C] cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  {editingCliente ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
