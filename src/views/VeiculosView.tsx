import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Veiculo, Cliente, OrdemServico } from '../types';
import { 
  Car, Plus, Search, Edit2, Trash2, X, Link as LinkIcon, Info,
  User, FileText, Calendar, Check, AlertTriangle, Wrench, ArrowRight,
  ClipboardList, Fuel, Activity, Loader2
} from 'lucide-react';

// Format currency helper
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Mask/format Brazilian Plate dynamically
const formatPlaca = (val: string): string => {
  const clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) return clean;
  
  if (clean.length >= 5) {
    const isLetter = /[A-Z]/.test(clean[4]); // index 4 is the 5th character
    if (isLetter) {
      // Mercosul Standard: ABC1D23 (no hyphen)
      return clean.slice(0, 7);
    } else {
      // Old Standard: ABC-1234 (hyphen after 3rd letter)
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
    }
  }
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
};

// Date parser to sort OS chronologically
const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

interface DadosPlaca {
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  combustivel: string;
}

/**
 * FUNÇÃO DE CONSULTA VEICULAR (SIMULADA)
 * 
 * Espaço isolado e preparado para futura integração com API real de consulta de placas (ex: Sinesp, Keplera, Infocar, etc.)
 * 
 * @param placaStr Placa a ser consultada (já higienizada e formatada)
 * @returns Promise com os dados do veículo ou rejeição se não encontrada
 */
export const consultarPlacaVeiculo = async (placaStr: string): Promise<DadosPlaca> => {
  // Simula o tempo de latência/resposta de rede (1.2 segundos)
  await new Promise(resolve => setTimeout(resolve, 1200));

  const placaLimpa = placaStr.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // SIMULAÇÃO DE "NÃO ENCONTRADO"
  // Simula falha/placa inexistente se começar com 'X', 'Z' ou terminar em '9'
  if (placaLimpa.startsWith('X') || placaLimpa.startsWith('Z') || placaLimpa.endsWith('9')) {
    throw new Error('Placa não encontrada na base nacional de veículos.');
  }

  // Base de dados simulada para testes rápidos com dados 100% realistas
  const bancoDeDadosSimulado: Record<string, DadosPlaca> = {
    'BRA2E19': { marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo Flex', ano: '2021', cor: 'Prata', combustivel: 'Flex' },
    'ABC1234': { marca: 'Mercedes-Benz', modelo: 'Sprinter 415 CDI', ano: '2019', cor: 'Branco', combustivel: 'Diesel' },
    'RIO2A26': { marca: 'Honda', modelo: 'Civic LXS 1.8', ano: '2016', cor: 'Preto', combustivel: 'Flex' },
    'MGB4F88': { marca: 'Volkswagen', modelo: 'T-Cross 1.4 TSI', ano: '2022', cor: 'Cinza Platina', combustivel: 'Flex' },
    'PRT9G11': { marca: 'Fiat', modelo: 'Argo 1.0 Drive', ano: '2020', cor: 'Vermelho', combustivel: 'Flex' },
    'PIL9090': { marca: 'Fiat', modelo: 'Mobi 1.0 Like', ano: '2019', cor: 'Branco', combustivel: 'Flex' },
  };

  // Se a placa consultada constar no nosso banco de dados simulado, use as especificações dela
  if (bancoDeDadosSimulado[placaLimpa]) {
    return bancoDeDadosSimulado[placaLimpa];
  }

  // Gerador dinâmico realista e determinístico para outras placas (garante o mesmo carro para a mesma placa)
  const marcasModelos = [
    { marca: 'Fiat', modelo: 'Argo Drive 1.0', combustivel: 'Flex' },
    { marca: 'Hyundai', modelo: 'HB20 Vision 1.0', combustivel: 'Flex' },
    { marca: 'Volkswagen', modelo: 'Polo Comfortline 1.0 TSI', combustivel: 'Flex' },
    { marca: 'Jeep', modelo: 'Compass Longitude 1.3 Turbo', combustivel: 'Flex' },
    { marca: 'Renault', modelo: 'Kwid Intense 1.0', combustivel: 'Flex' },
    { marca: 'Honda', modelo: 'Civic EXL 2.0', combustivel: 'Flex' },
    { marca: 'Nissan', modelo: 'Kicks Active 1.6', combustivel: 'Flex' },
    { marca: 'Toyota', modelo: 'Corolla XEi 2.0', combustivel: 'Flex' },
    { marca: 'Ford', modelo: 'Ka Hatch SE 1.0', ano: '2020', cor: 'Branco', combustivel: 'Flex' }
  ];

  const cores = ['Branco', 'Preto', 'Cinza', 'Prata', 'Vermelho', 'Azul', 'Grafite'];
  const anos = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

  // Gera um hash determinístico da placa
  let hash = 0;
  for (let i = 0; i < placaLimpa.length; i++) {
    hash = placaLimpa.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const veiculoSelecionado = marcasModelos[hash % marcasModelos.length];
  const corSelecionada = cores[(hash >> 2) % cores.length];
  const anoSelecionado = anos[(hash >> 4) % anos.length];

  return {
    marca: veiculoSelecionado.marca,
    modelo: veiculoSelecionado.modelo,
    ano: anoSelecionado,
    cor: corSelecionada,
    combustivel: veiculoSelecionado.combustivel
  };
};

export const VeiculosView: React.FC = () => {
  const { 
    veiculos, clientes, ordensServico, addVeiculo, updateVeiculo, deleteVeiculo, 
    searchQuery, prefilledClienteId, setPrefilledClienteId, setActiveTab, showToast
  } = useApp();

  // View states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [deletingVeiculoId, setDeletingVeiculoId] = useState<string | null>(null);
  
  // Explicit filters
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');

  // Form fields
  const [clienteId, setClienteId] = useState('');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [combustivel, setCombustivel] = useState('Flex');
  const [chassi, setChassi] = useState('');
  const [renavam, setRenavam] = useState('');
  const [quilometragem, setQuilometragem] = useState<number>(0);

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Plate query states
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [isFromConsulta, setIsFromConsulta] = useState(false);

  // Auto-fill form when redirected with a pre-filled client from ClientesView
  useEffect(() => {
    if (prefilledClienteId) {
      const prefilledClient = clientes.find(c => c.id === prefilledClienteId);
      if (prefilledClient) {
        resetForm();
        setClienteId(prefilledClienteId);
        setIsFormOpen(true);
      }
      // Reset back to empty to avoid infinite loops on view switches
      setPrefilledClienteId('');
    }
  }, [prefilledClienteId, clientes, setPrefilledClienteId]);

  // Unique list of vehicle brands for the search filters
  const uniqueBrands = Array.from(new Set(veiculos.map(v => v.marca))).sort();

  // Reset form helper
  const resetForm = () => {
    setClienteId('');
    setPlaca('');
    setMarca('');
    setModelo('');
    setAno('');
    setCor('');
    setCombustivel('Flex');
    setChassi('');
    setRenavam('');
    setQuilometragem(0);
    setFormErrors({});
    setEditingVeiculo(null);
    setIsFromConsulta(false);
    setConsultaError(null);
    setIsConsulting(false);
  };

  // Open edit form
  const handleEdit = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setClienteId(veiculo.clienteId);
    
    // License plate might be saved with or without hyphen; format it nicely for input masking
    setPlaca(formatPlaca(veiculo.placa));
    
    setMarca(veiculo.marca);
    setModelo(veiculo.modelo);
    setAno(veiculo.ano);
    setCor(veiculo.cor);
    setCombustivel(veiculo.combustivel);
    setChassi(veiculo.chassi);
    setRenavam(veiculo.renavam);
    setQuilometragem(veiculo.quilometragem);
    setFormErrors({});
    setIsFromConsulta(!!veiculo.dadosConsulta);
    setConsultaError(null);
    setIsConsulting(false);
    setIsFormOpen(true);
  };

  // Form input changes
  const handlePlacaChange = (val: string) => {
    setPlaca(formatPlaca(val));
    // Reset consult status if they edit the plate
    setIsFromConsulta(false);
    setConsultaError(null);
  };

  // Consulta Placa logic
  const handleConsultarPlaca = async () => {
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '');
    if (cleanPlaca.length !== 7) {
      setFormErrors(prev => ({
        ...prev,
        placa: 'Digite uma placa com 7 caracteres (Antiga ou Mercosul) para consultar.'
      }));
      return;
    }

    setIsConsulting(true);
    setConsultaError(null);
    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy.placa;
      return copy;
    });

    try {
      const dados = await consultarPlacaVeiculo(cleanPlaca);
      setMarca(dados.marca);
      setModelo(dados.modelo);
      setAno(dados.ano);
      setCor(dados.cor);
      setCombustivel(dados.combustivel);
      setIsFromConsulta(true);
    } catch (err: any) {
      setConsultaError(err.message || 'Placa não cadastrada na base nacional.');
      setIsFromConsulta(false);
    } finally {
      setIsConsulting(false);
    }
  };

  // Validations
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '');

    if (!clienteId) {
      errors.clienteId = 'Campo obrigatório. Vincule o carro a um proprietário.';
    }
    
    if (!placa.trim()) {
      errors.placa = 'A placa é obrigatória.';
    } else if (cleanPlaca.length !== 7) {
      errors.placa = 'A placa deve ter exatamente 7 caracteres (Padrão Mercosul ou Antigo).';
    }
    
    if (!marca.trim()) errors.marca = 'A marca é obrigatória.';
    if (!modelo.trim()) errors.modelo = 'O modelo é obrigatório.';
    
    if (!ano.trim()) {
      errors.ano = 'O ano é obrigatório.';
    } else {
      const year = parseInt(ano, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 2) {
        errors.ano = `Ano modelo inválido (digite entre 1900 e ${currentYear + 1}).`;
      }
    }
    
    if (quilometragem < 0) {
      errors.quilometragem = 'A quilometragem não pode ser negativa.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Standardize license plate in database: remove hyphen to store as clean 7 chars
    const databasePlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const veiculoData = {
      clienteId,
      placa: databasePlaca,
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: ano.trim(),
      cor: cor.trim(),
      combustivel,
      chassi: chassi.trim().toUpperCase(),
      renavam: renavam.trim(),
      quilometragem: Number(quilometragem),
      dadosConsulta: isFromConsulta
    };

    if (editingVeiculo) {
      updateVeiculo(editingVeiculo.id, veiculoData);
      showToast('Veículo atualizado com sucesso!', 'success');
    } else {
      addVeiculo(veiculoData);
      showToast('Veículo cadastrado com sucesso!', 'success');
    }

    setIsFormOpen(false);
    resetForm();
  };



  // Combine searches & filters
  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredVeiculos = veiculos.filter(v => {
    // Busca por placa ou modelo
    let matchesSearch = true;
    if (combinedSearch) {
      matchesSearch = 
        v.placa.toLowerCase().includes(combinedSearch) ||
        v.modelo.toLowerCase().includes(combinedSearch);
    }

    // Filtro por marca
    const matchesBrand = selectedBrand === 'Todas' || v.marca.toLowerCase() === selectedBrand.toLowerCase();

    return matchesSearch && matchesBrand;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Car size={22} className="text-[#0F4C5C]" />
            Veículos da Oficina
          </h2>
          <p className="text-xs text-gray-500 font-medium">Cadastre carros e motos, gerencie dados técnicos e consulte o histórico de serviços executados.</p>
        </div>

        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98600] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-[#E39B00] cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search specifically by Plate or Model */}
        <div className="relative w-full md:w-80">
          <label htmlFor="veiculo-search-input" className="sr-only">Pesquisar por placa ou modelo</label>
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
          <input
            id="veiculo-search-input"
            type="search"
            placeholder="Pesquisar por placa ou modelo..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
        </div>

        {/* Brand Filter Dropdown */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center self-end md:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap flex items-center gap-1">
              Filtrar por Marca:
            </span>
            <select
              id="filtro-marca-veiculo"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-semibold text-gray-700 focus:ring-1 focus:ring-[#0F4C5C]"
            >
              <option value="Todas">Todas as Marcas</option>
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-mono text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded">
            {filteredVeiculos.length} veículos encontrados
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredVeiculos.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-[#0F4C5C]/5 text-[#0F4C5C] flex items-center justify-center rounded-full mx-auto">
            <Car size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800">Nenhum veículo correspondente</h3>
            <p className="text-sm text-gray-500 mt-1">
              {combinedSearch || selectedBrand !== 'Todas'
                ? 'Nenhum veículo corresponde aos critérios de pesquisa ou marca selecionados. Tente limpar os filtros ou realizar uma nova busca.' 
                : 'Cadastre o primeiro veículo do cliente para abrir ordens de serviço (OS) e controlar o histórico de manutenções.'}
            </p>
          </div>
          {(combinedSearch || selectedBrand !== 'Todas') ? (
            <button
              onClick={() => { setLocalSearch(''); setSelectedBrand('Todas'); }}
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
              <span>Registrar Primeiro Veículo</span>
            </button>
          )}
        </div>
      ) : (
        /* Vehicles List Cards/Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Marca / Modelo</th>
                  <th className="px-6 py-4">Proprietário</th>
                  <th className="px-6 py-4">Dados Técnicos</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredVeiculos.map((v) => {
                  const owner = clientes.find(c => c.id === v.clienteId);
                  const formattedPlacaStr = formatPlaca(v.placa);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedVeiculo(v)}
                          className="inline-flex flex-col items-center border border-gray-400 rounded-md bg-blue-50 font-mono font-black text-gray-800 shadow-xs cursor-pointer hover:border-blue-500 hover:scale-[1.03] transition-all"
                          title={`Ver ficha técnica de ${v.modelo}`}
                        >
                          <div className="w-full h-1.5 bg-[#0F4C5C]/90 rounded-t-[4px]" />
                          <div className="px-2.5 py-1 text-sm tracking-widest">{formattedPlacaStr}</div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button 
                            onClick={() => setSelectedVeiculo(v)}
                            className="font-bold text-gray-800 hover:text-[#0F4C5C] hover:underline text-left cursor-pointer"
                          >
                            {v.marca} {v.modelo}
                          </button>
                          {v.dadosConsulta && (
                            <span 
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-sm"
                              title="Dados obtidos automaticamente por consulta de placa"
                            >
                              <Check size={10} /> Consultada
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Ano: {v.ano} • Cor: {v.cor || 'Não informada'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {owner ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-700">{owner.nome}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{owner.documento}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 font-semibold italic">Sem proprietário vinculado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-0.5 text-xs">
                        <div className="text-gray-600 font-mono"><span className="font-bold">KM:</span> {v.quilometragem.toLocaleString('pt-BR')} km</div>
                        <div className="text-[11px] text-gray-400 font-mono"><span className="font-bold">Combustível:</span> {v.combustivel}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver Ficha */}
                          <button
                            onClick={() => setSelectedVeiculo(v)}
                            className="p-1.5 text-gray-500 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Ver ficha completa de ${v.modelo}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
                          >
                            <ClipboardList size={16} />
                          </button>
                          {/* Editar */}
                          <button
                            onClick={() => handleEdit(v)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Editar cadastro de ${v.modelo}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Excluir */}
                          <button
                            onClick={() => setDeletingVeiculoId(v.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title={`Excluir veículo ${v.modelo}`}
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

      {/* Main Form Modal for Registering and Editing Vehicles */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-veiculo-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Car size={20} className="text-[#0F4C5C]" />
                <h3 id="modal-veiculo-title" className="text-base font-black text-gray-800 uppercase tracking-tight">
                  {editingVeiculo ? 'Editar Cadastro do Veículo' : 'Registrar Novo Veículo'}
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

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Seção 1: Proprietário (select input) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                  1. Associação de Proprietário
                </h4>
                
                <div>
                  <label htmlFor="form-cliente-select" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Proprietário do Automóvel *
                  </label>
                  
                  <select
                    id="form-cliente-select"
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      setFormErrors(prev => {
                        const copy = { ...prev };
                        delete copy.clienteId;
                        return copy;
                      });
                    }}
                    className={`w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C] ${
                      formErrors.clienteId ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Selecione o proprietário --</option>
                    {[...clientes].sort((a, b) => a.nome.localeCompare(b.nome)).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.documento})
                      </option>
                    ))}
                  </select>
                  
                  {formErrors.clienteId && (
                    <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.clienteId}</span>
                  )}
                </div>
              </div>

              {/* Seção 2: Dados do Automóvel */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-[#0F4C5C] uppercase tracking-wider border-l-4 border-l-[#0F4C5C] pl-2">
                    2. Características e Dados do Veículo
                  </h4>
                  {isFromConsulta && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold animate-fade-in">
                      <Check size={11} className="text-emerald-600" />
                      <span>Dados obtidos por consulta</span>
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Placa */}
                  <div>
                    <label htmlFor="form-placa" className="block text-xs font-bold text-gray-700 mb-1.5">Placa (Antiga ou Mercosul) *</label>
                    <div className="flex gap-1.5">
                      <input
                        id="form-placa"
                        type="text"
                        placeholder="Ex: BRA-2E19"
                        value={placa}
                        onChange={(e) => handlePlacaChange(e.target.value)}
                        className={`w-full text-sm border rounded-lg p-2.5 font-mono uppercase focus:ring-2 focus:ring-[#0F4C5C] ${
                          formErrors.placa ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                        }`}
                        maxLength={8} // 7 chars + 1 hyphen
                      />
                      <button
                        type="button"
                        onClick={handleConsultarPlaca}
                        disabled={isConsulting}
                        className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] disabled:bg-gray-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Consultar dados do veículo pela placa"
                        style={{ minHeight: '44px' }}
                      >
                        {isConsulting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search size={14} />
                            <span>Consultar placa</span>
                          </>
                        )}
                      </button>
                    </div>
                    {formErrors.placa && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.placa}</span>
                    )}
                    {consultaError && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold flex items-start gap-1.5 mt-2 animate-fade-in">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Aviso: </span>
                          {consultaError} Preenchimento manual liberado.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Marca */}
                  <div>
                    <label htmlFor="form-marca" className="block text-xs font-bold text-gray-700 mb-1.5">Marca / Fabricante *</label>
                    <input
                      id="form-marca"
                      type="text"
                      placeholder="Ex: Chevrolet"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.marca ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.marca && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.marca}</span>
                    )}
                  </div>

                  {/* Modelo */}
                  <div>
                    <label htmlFor="form-modelo" className="block text-xs font-bold text-gray-700 mb-1.5">Modelo *</label>
                    <input
                      id="form-modelo"
                      type="text"
                      placeholder="Ex: Onix 1.0 Turbo"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.modelo ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.modelo && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.modelo}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Ano */}
                  <div>
                    <label htmlFor="form-ano" className="block text-xs font-bold text-gray-700 mb-1.5">Ano Modelo *</label>
                    <input
                      id="form-ano"
                      type="text"
                      placeholder="Ex: 2021"
                      value={ano}
                      onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
                      className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.ano ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                      maxLength={4}
                    />
                    {formErrors.ano && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.ano}</span>
                    )}
                  </div>

                  {/* Cor */}
                  <div>
                    <label htmlFor="form-cor" className="block text-xs font-bold text-gray-700 mb-1.5">Cor</label>
                    <input
                      id="form-cor"
                      type="text"
                      placeholder="Ex: Prata"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  </div>

                  {/* Combustível */}
                  <div>
                    <label htmlFor="form-combustivel" className="block text-xs font-bold text-gray-700 mb-1.5">Combustível</label>
                    <select
                      id="form-combustivel"
                      value={combustivel}
                      onChange={(e) => setCombustivel(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0F4C5C]"
                    >
                      <option value="Flex">Flex (Gasol/Álc)</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Álcool">Álcool</option>
                      <option value="Diesel">Diesel</option>
                      <option value="GNV">GNV</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Elétrico">Elétrico</option>
                    </select>
                  </div>

                  {/* Quilometragem */}
                  <div>
                    <label htmlFor="form-km" className="block text-xs font-bold text-gray-700 mb-1.5">Quilometragem</label>
                    <input
                      id="form-km"
                      type="number"
                      placeholder="0"
                      value={quilometragem || ''}
                      onChange={(e) => setQuilometragem(Number(e.target.value))}
                      className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] ${
                        formErrors.quilometragem ? 'border-red-500 bg-red-50/50' : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors.quilometragem && (
                      <span className="text-xs text-red-600 font-semibold mt-1 block">{formErrors.quilometragem}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chassi */}
                  <div>
                    <label htmlFor="form-chassi" className="block text-xs font-bold text-gray-700 mb-1.5">Número do Chassi</label>
                    <input
                      id="form-chassi"
                      type="text"
                      placeholder="Ex: 9BGXXXXXXXXXXXXXX"
                      value={chassi}
                      onChange={(e) => setChassi(e.target.value.toUpperCase())}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C]"
                      maxLength={17}
                    />
                  </div>

                  {/* Renavam */}
                  <div>
                    <label htmlFor="form-renavam" className="block text-xs font-bold text-gray-700 mb-1.5">Renavam</label>
                    <input
                      id="form-renavam"
                      type="text"
                      placeholder="Ex: 12345678901"
                      value={renavam}
                      onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C]"
                      maxLength={11}
                    />
                  </div>
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
                  {editingVeiculo ? 'Salvar Alterações' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Modal for Vehicle Card (Ficha do Veículo) */}
      {selectedVeiculo && (() => {
        const owner = clientes.find(c => c.id === selectedVeiculo.clienteId);
        const vehicleOS = ordensServico
          .filter(o => o.veiculoId === selectedVeiculo.id)
          .sort((a, b) => parseDate(b.dataEntrada).getTime() - parseDate(a.dataEntrada).getTime());

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end p-0 md:p-4">
            <div className="bg-white w-full max-w-3xl h-full md:h-[95vh] md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
              {/* Header */}
              <div className="bg-[#0F4C5C] text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex flex-col items-center border border-white/40 rounded bg-white text-[#0F4C5C] font-mono font-bold w-20 flex-shrink-0">
                    <div className="w-full h-1 bg-[#E39B00] rounded-t-[3px]" />
                    <div className="py-0.5 text-xs tracking-wider font-extrabold">{formatPlaca(selectedVeiculo.placa)}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{selectedVeiculo.marca} {selectedVeiculo.modelo}</h3>
                    <p className="text-xs text-white/80 font-medium">Ficha Técnica e Histórico de Serviços</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVeiculo(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white cursor-pointer"
                  aria-label="Fechar ficha do veículo"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50 text-sm">
                
                {/* Technical specifications */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
                  <h4 className="font-bold text-[#0F4C5C] uppercase text-xs flex items-center gap-1.5 border-b border-gray-100 pb-2 flex-wrap gap-y-1">
                    <Wrench size={14} /> Dados Técnicos do Veículo
                    {selectedVeiculo.dadosConsulta && (
                      <span 
                        className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-sm uppercase tracking-wide"
                        title="Dados obtidos automaticamente por consulta de placa"
                      >
                        <Check size={10} /> Consultada
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">Marca:</span>
                      <span className="font-bold text-gray-800 text-sm">{selectedVeiculo.marca}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Modelo:</span>
                      <span className="font-bold text-gray-800 text-sm">{selectedVeiculo.modelo}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Ano Modelo:</span>
                      <span className="font-mono font-bold text-gray-800 text-sm">{selectedVeiculo.ano}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Cor:</span>
                      <span className="font-bold text-gray-800 text-sm">{selectedVeiculo.cor || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Combustível:</span>
                      <span className="font-bold text-gray-800 text-sm">{selectedVeiculo.combustivel}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">KM Atual:</span>
                      <span className="font-mono font-bold text-gray-800 text-sm">{selectedVeiculo.quilometragem.toLocaleString('pt-BR')} km</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold block">Chassi:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedVeiculo.chassi || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold block">Renavam:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedVeiculo.renavam || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Owner details */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-[#0F4C5C] uppercase text-xs flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <User size={14} /> Proprietário / Cliente Dono
                  </h4>
                  {owner ? (
                    <div className="flex items-start justify-between text-xs">
                      <div className="space-y-1.5">
                        <div className="font-bold text-gray-800 text-sm text-[#0F4C5C]">
                          {owner.nome}
                        </div>
                        <div className="text-gray-500 font-mono">Doc: {owner.documento}</div>
                        <div className="text-gray-500">Telefone: <span className="font-mono font-bold">{owner.telefone}</span></div>
                        {owner.email && <div className="text-gray-500">E-mail: <span className="font-medium text-blue-600">{owner.email}</span></div>}
                      </div>
                      <button
                        onClick={() => {
                          // Close slide-over, navigate to customers tab
                          setSelectedVeiculo(null);
                          setActiveTab('clientes');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-[#0F4C5C] hover:underline bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors font-semibold cursor-pointer"
                        style={{ minHeight: '36px' }}
                      >
                        Ver Ficha do Cliente
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 italic font-semibold">Este veículo está órfão (sem cliente proprietário vinculado).</p>
                  )}
                </div>

                {/* Service Orders History */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 uppercase text-xs flex items-center gap-1.5">
                    <ClipboardList size={15} className="text-[#0F4C5C]" /> 
                    Histórico de Ordens de Serviço ({vehicleOS.length})
                  </h4>

                  {vehicleOS.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400 text-xs italic space-y-1.5">
                      <p>Nenhuma Ordem de Serviço (OS) registrada para este veículo.</p>
                      <p className="text-[10px] text-gray-400">Quando uma OS for aberta vinculada a este veículo, ela aparecerá aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vehicleOS.map((o) => (
                        <div key={o.numero} className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-800 text-sm">OS #{o.numero}</div>
                              <div className="text-[10px] text-gray-400 font-semibold font-mono">Entrada em: {o.dataEntrada} • Previsão: {o.previsaoEntrega}</div>
                            </div>
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase ${
                              o.status === 'entregue' ? 'bg-green-100 text-green-800 border border-green-200' :
                              o.status === 'concluida' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              o.status === 'em_andamento' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              o.status === 'cancelada' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {o.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Mechanic & Diagnosis */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-400 font-semibold">Mecânico Responsável:</span>
                              <div className="font-bold text-gray-700 mt-0.5">{o.mecanicoResponsavel || 'Não definido'}</div>
                            </div>
                            {o.diagnostico && (
                              <div>
                                <span className="text-gray-400 font-semibold">Relato / Diagnóstico:</span>
                                <div className="text-gray-600 mt-0.5 text-xs italic line-clamp-2" title={o.diagnostico}>{o.diagnostico}</div>
                              </div>
                            )}
                          </div>

                          {/* OS Items summary */}
                          <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1.5">
                            <div className="font-bold text-gray-500 uppercase text-[10px]">Peças & Serviços</div>
                            <div className="divide-y divide-gray-200 max-h-36 overflow-y-auto pr-1">
                              {o.itens.map((item, itemIdx) => (
                                <div key={itemIdx} className="py-1.5 flex justify-between items-center text-[11px]">
                                  <div className="font-medium text-gray-700">
                                    <span className={`inline-block px-1 mr-1 text-[9px] font-bold uppercase rounded-xs ${item.tipo === 'servico' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                      {item.tipo === 'servico' ? 'S' : 'P'}
                                    </span>
                                    {item.descricao} <span className="text-gray-400 font-mono">x{item.quantidade}</span>
                                  </div>
                                  <div className="font-mono text-gray-600 font-semibold">{(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* OS Totals */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="text-xs text-gray-400 font-semibold">Mão de obra: {formatCurrency(o.valorMaoDeObra)} {o.desconto > 0 && `• Desc: ${formatCurrency(o.desconto)}`}</div>
                            <div className="font-bold text-sm text-[#0F4C5C]">Total: {formatCurrency(o.valorTotal)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={() => setSelectedVeiculo(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                  style={{ minHeight: '40px' }}
                >
                  Voltar à Lista
                </button>
                <button
                  onClick={() => {
                    handleEdit(selectedVeiculo);
                    setSelectedVeiculo(null);
                  }}
                  className="px-4 py-2 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  style={{ minHeight: '40px' }}
                >
                  <Edit2 size={13} />
                  Editar Veículo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Deletion Confirmation Modal */}
      {deletingVeiculoId && (() => {
        const v = veiculos.find(v => v.id === deletingVeiculoId);
        if (!v) return null;
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                  <Trash2 size={22} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tem certeza de que deseja remover o veículo <strong className="text-gray-800">{v.marca} {v.modelo} (Placa: {formatPlaca(v.placa)})</strong>?
                Esta ação é irreversível e o veículo deixará de constar no sistema.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingVeiculoId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  style={{ minHeight: '40px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteVeiculo(v.id);
                    setDeletingVeiculoId(null);
                    showToast(`Veículo ${v.marca} ${v.modelo} excluído com sucesso!`, 'success');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  style={{ minHeight: '40px' }}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
