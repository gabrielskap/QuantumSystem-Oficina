import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { 
  FileText, Users, ShoppingCart, AlertTriangle, 
  Plus, Play, CheckCircle, Car, ArrowRight, TrendingUp,
  DollarSign, Clock, Calendar, ClipboardList, Activity, Award,
  ChevronRight, PackageOpen, AlertCircle, Sparkles, TrendingDown, ClipboardCheck, Settings, Wrench, Package
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardViewProps {
  setActiveTab?: (tab: string) => void;
  onNewOS?: () => void;
  onNewClient?: () => void;
  onNewSale?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab: propSetActiveTab,
  onNewOS,
  onNewClient,
  onNewSale,
}) => {
  const { 
    clientes, 
    veiculos,
    ordensServico, 
    produtos, 
    vendas,
    orcamentos,
    setActiveTab: contextSetActiveTab
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Resolve active tab setter from props or context
  const handleSetActiveTab = propSetActiveTab || contextSetActiveTab;

  // Stable target for Today's Date: 13/07/2026
  const today = useMemo(() => {
    // Current local time metadata says 2026-07-13, we align with that
    const d = new Date();
    // Normalise to midnight to perform exact date-to-date calendar diffs
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(() => today.getMonth() + 1, [today]); // 7 (July)
  const currentYear = useMemo(() => today.getFullYear(), [today]); // 2026

  // Helper to parse "DD/MM/YYYY" strings into real JS Dates
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to check if a date is within the current month/year
  const isCurrentMonth = (dateStr: string, m: number, y: number) => {
    if (!dateStr) return false;
    const [_, month, year] = dateStr.split('/').map(Number);
    return month === m && year === y;
  };

  // ==========================================
  // KPIs CALCULATIONS
  // ==========================================

  // 1. Faturamento do mês (OS concluídas/entregues + vendas no mês)
  const faturamentoMes = useMemo(() => {
    const osFaturamento = ordensServico
      .filter(os => (os.status === 'concluida' || os.status === 'entregue') && isCurrentMonth(os.dataEntrada, currentMonth, currentYear))
      .reduce((sum, os) => sum + os.valorTotal, 0);

    const vendasFaturamento = vendas
      .filter(v => isCurrentMonth(v.data, currentMonth, currentYear))
      .reduce((sum, v) => sum + v.valorTotal, 0);

    return osFaturamento + vendasFaturamento;
  }, [ordensServico, vendas, currentMonth, currentYear]);

  // 2. Ticket Médio (Faturamento / (OS concluídas/entregues + Vendas))
  const ticketMedio = useMemo(() => {
    const osCount = ordensServico.filter(os => 
      (os.status === 'concluida' || os.status === 'entregue') && 
      isCurrentMonth(os.dataEntrada, currentMonth, currentYear)
    ).length;

    const vendasCount = vendas.filter(v => 
      isCurrentMonth(v.data, currentMonth, currentYear)
    ).length;

    const totalCount = osCount + vendasCount;
    return totalCount > 0 ? faturamentoMes / totalCount : 0;
  }, [faturamentoMes, ordensServico, vendas, currentMonth, currentYear]);

  // 3. OS por status no mês atual (Abertas, Em Andamento, Concluídas/Entregues)
  const osStatsMes = useMemo(() => {
    const abertas = ordensServico.filter(os => 
      os.status === 'aberta' && isCurrentMonth(os.dataEntrada, currentMonth, currentYear)
    ).length;

    const emAndamento = ordensServico.filter(os => 
      os.status === 'em_andamento' && isCurrentMonth(os.dataEntrada, currentMonth, currentYear)
    ).length;

    const concluidas = ordensServico.filter(os => 
      (os.status === 'concluida' || os.status === 'entregue') && 
      isCurrentMonth(os.dataEntrada, currentMonth, currentYear)
    ).length;

    return { abertas, emAndamento, concluidas };
  }, [ordensServico, currentMonth, currentYear]);

  // 4. Orçamentos pendentes (total ativo sem aprovar/recusar)
  const orcamentosPendentes = useMemo(() => {
    return orcamentos.filter(o => o.status === 'pendente').length;
  }, [orcamentos]);

  // 5. Clientes ativos
  const totalClientes = useMemo(() => clientes.length, [clientes]);

  // ==========================================
  // CHART DATA CALCULATIONS
  // ==========================================

  // Chart 1: Faturamento Mensal (Últimos 6 meses)
  const faturamentoChartData = useMemo(() => {
    const data = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${monthNames[m - 1]}/${String(y).slice(-2)}`;

      const osTotal = ordensServico
        .filter(os => (os.status === 'concluida' || os.status === 'entregue') && isCurrentMonth(os.dataEntrada, m, y))
        .reduce((sum, os) => sum + os.valorTotal, 0);

      const vendasTotal = vendas
        .filter(v => isCurrentMonth(v.data, m, y))
        .reduce((sum, v) => sum + v.valorTotal, 0);

      data.push({
        name: label,
        'Ordens de Serviço': osTotal,
        'Vendas Balcão': vendasTotal,
        'Total': osTotal + vendasTotal
      });
    }
    return data;
  }, [ordensServico, vendas, today]);

  // Chart 2: OS por Status (Gráfico de rosca)
  const osStatusChartData = useMemo(() => {
    const counts = {
      aberta: ordensServico.filter(o => o.status === 'aberta').length,
      em_andamento: ordensServico.filter(o => o.status === 'em_andamento').length,
      concluida: ordensServico.filter(o => o.status === 'concluida').length,
      entregue: ordensServico.filter(o => o.status === 'entregue').length,
      cancelada: ordensServico.filter(o => o.status === 'cancelada').length,
    };

    return [
      { name: 'Aberta', value: counts.aberta, color: '#3B82F6' },
      { name: 'Em Andamento', value: counts.em_andamento, color: '#F59E0B' },
      { name: 'Concluída', value: counts.concluida, color: '#10B981' },
      { name: 'Entregue', value: counts.entregue, color: '#14B8A6' },
      { name: 'Cancelada', value: counts.cancelada, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [ordensServico]);

  // Chart 3: Serviços mais realizados (Top 5)
  const servicosMaisRealizados = useMemo(() => {
    const counts: Record<string, number> = {};
    ordensServico
      .filter(os => os.status !== 'cancelada')
      .forEach(os => {
        os.itens.forEach(item => {
          if (item.tipo === 'servico') {
            counts[item.descricao] = (counts[item.descricao] || 0) + item.quantidade;
          }
        });
      });

    return Object.entries(counts)
      .map(([descricao, quantidade]) => ({ name: descricao, quantity: quantidade }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [ordensServico]);

  // Chart 4: Produtos/Peças mais vendidos (Top 5)
  const produtosMaisVendidos = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Pieces inside OS
    ordensServico
      .filter(os => os.status !== 'cancelada')
      .forEach(os => {
        os.itens.forEach(item => {
          if (item.tipo === 'peca') {
            counts[item.descricao] = (counts[item.descricao] || 0) + item.quantidade;
          }
        });
      });

    // Over-the-counter sales
    vendas.forEach(v => {
      v.itens.forEach(item => {
        counts[item.nome] = (counts[item.nome] || 0) + item.quantidade;
      });
    });

    return Object.entries(counts)
      .map(([nome, quantidade]) => ({ name: nome, quantity: quantidade }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [ordensServico, vendas]);


  // ==========================================
  // OPERATIONAL ALERTS / NOTIFICATIONS
  // ==========================================

  // 1. OS Atrasadas (Status aberta ou em_andamento e previsão < hoje)
  const osAtrasadas = useMemo(() => {
    return ordensServico
      .filter(os => {
        if (os.status === 'concluida' || os.status === 'entregue' || os.status === 'cancelada') {
          return false;
        }
        const prevDate = parseDate(os.previsaoEntrega);
        return prevDate < today;
      })
      .map(os => {
        const cliente = clientes.find(c => c.id === os.clienteId);
        const veiculo = veiculos.find(v => v.id === os.veiculoId);
        const diffTime = today.getTime() - parseDate(os.previsaoEntrega).getTime();
        const diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...os,
          clienteNome: cliente?.nome || 'Cliente não cadastrado',
          veiculoNome: veiculo ? `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : 'Veículo não cadastrado',
          diasAtraso
        };
      })
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [ordensServico, clientes, veiculos, today]);

  // 2. Estoque baixo (estoqueAtual <= estoqueMinimo)
  const estoqueBaixo = useMemo(() => {
    return produtos
      .filter(p => p.estoqueAtual <= p.estoqueMinimo)
      .sort((a, b) => a.estoqueAtual - b.estoqueAtual);
  }, [produtos]);

  // 3. Orçamentos prestes a vencer (pendentes com validade expirada ou expira em até 3 dias)
  const orcamentosPrestesVencer = useMemo(() => {
    return orcamentos
      .filter(o => o.status === 'pendente')
      .map(o => {
        const valDate = parseDate(o.validade);
        const diffTime = valDate.getTime() - today.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const cliente = clientes.find(c => c.id === o.clienteId);
        const veiculo = veiculos.find(v => v.id === o.veiculoId);
        return {
          ...o,
          clienteNome: cliente?.nome || 'Cliente não cadastrado',
          veiculoNome: veiculo ? `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : 'Veículo não cadastrado',
          diasRestantes
        };
      })
      .filter(o => o.diasRestantes <= 3)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [orcamentos, clientes, veiculos, today]);

  // 4. Últimas atividades (feed unificado de atividades recentes de OS, vendas e orçamentos)
  const ultimasAtividades = useMemo(() => {
    const list: Array<{
      id: string;
      tipo: 'OS' | 'Venda' | 'Orçamento';
      dateObj: Date;
      dateStr: string;
      title: string;
      description: string;
      value: number;
      statusLabel: string;
      statusColor: string;
    }> = [];

    // Add OSs
    ordensServico.forEach(os => {
      const cliente = clientes.find(c => c.id === os.clienteId);
      const dateObj = parseDate(os.dataEntrada);
      
      let statusLabel = 'Aberta';
      let statusColor = 'text-blue-600 bg-blue-50 border-blue-100';
      if (os.status === 'em_andamento') { statusLabel = 'Em Andamento'; statusColor = 'text-amber-600 bg-amber-50 border-amber-100'; }
      if (os.status === 'concluida') { statusLabel = 'Concluída'; statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100'; }
      if (os.status === 'entregue') { statusLabel = 'Entregue'; statusColor = 'text-teal-600 bg-teal-50 border-teal-100'; }
      if (os.status === 'cancelada') { statusLabel = 'Cancelada'; statusColor = 'text-rose-600 bg-rose-50 border-rose-100'; }

      list.push({
        id: os.numero,
        tipo: 'OS',
        dateObj,
        dateStr: os.dataEntrada,
        title: `Ordem de Serviço #${os.numero}`,
        description: `Cliente: ${cliente?.nome || 'Consumidor'} • Responsável: ${os.mecanicoResponsavel}`,
        value: os.valorTotal,
        statusLabel,
        statusColor
      });
    });

    // Add Vendas
    vendas.forEach(v => {
      const cliente = clientes.find(c => c.id === v.clienteId);
      const dateObj = parseDate(v.data);
      list.push({
        id: v.id,
        tipo: 'Venda',
        dateObj,
        dateStr: v.data,
        title: `Venda de Balcão #${v.id}`,
        description: `Cliente: ${cliente?.nome || 'Consumidor Final'} • Pagamento: ${v.formaPagamento}`,
        value: v.valorTotal,
        statusLabel: 'Realizada',
        statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      });
    });

    // Add Orçamentos
    orcamentos.forEach(o => {
      const cliente = clientes.find(c => c.id === o.clienteId);
      const dateObj = parseDate(o.data);
      
      let statusLabel = 'Pendente';
      let statusColor = 'text-indigo-600 bg-indigo-50 border-indigo-100';
      if (o.status === 'aprovado') { statusLabel = 'Aprovado'; statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100'; }
      if (o.status === 'recusado') { statusLabel = 'Recusado'; statusColor = 'text-rose-600 bg-rose-50 border-rose-100'; }

      list.push({
        id: o.numero,
        tipo: 'Orçamento',
        dateObj,
        dateStr: o.data,
        title: `Orçamento #${o.numero}`,
        description: `Cliente: ${cliente?.nome || 'Consumidor'} • Validade: ${o.validade}`,
        value: o.valorTotal,
        statusLabel,
        statusColor
      });
    });

    // Sort descending by dateObj
    return list
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 8);
  }, [ordensServico, vendas, orcamentos, clientes]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0F4C5C] rounded-full animate-spin"></div>
          <Wrench size={20} className="absolute text-[#0F4C5C] animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-gray-500 font-mono animate-pulse">Carregando painel de controle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#0F4C5C] to-[#1E677B] text-white p-6 rounded-2xl shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#176275]" id="welcome-banner">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#E39B00] text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              SISTEMA ATIVO
            </span>
            <span className="text-white/60 text-xs font-mono">Julho 2026</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mt-2 font-sans">Painel Executivo da Oficina</h2>
          <p className="text-white/85 mt-1 text-sm max-w-2xl">
            Resumo operacional, financeiro e controle de estoque integrado. Todos os indicadores atualizam em tempo real conforme você opera o sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0 z-10" id="quick-actions-bar">
          <button
            onClick={() => onNewOS ? onNewOS() : handleSetActiveTab('os')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E39B00] hover:bg-[#C98700] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            style={{ minHeight: '40px' }}
          >
            <Plus size={14} />
            Nova OS
          </button>
          <button
            onClick={() => onNewClient ? onNewClient() : handleSetActiveTab('clientes')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition-all border border-white/10"
            style={{ minHeight: '40px' }}
          >
            <Users size={14} />
            Novo Cliente
          </button>
          <button
            onClick={() => onNewSale ? onNewSale() : handleSetActiveTab('vendas')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition-all border border-white/10"
            style={{ minHeight: '40px' }}
          >
            <ShoppingCart size={14} />
            Nova Venda
          </button>
        </div>
        {/* Subtle geometric pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="kpi-cards-grid">
        {/* 1. Faturamento do Mês */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-emerald-500" id="kpi-faturamento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Faturamento (Mês)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-gray-800 font-mono block tracking-tight">
              {formatCurrency(faturamentoMes)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">
              OS concluídas + vendas
            </span>
          </div>
        </div>

        {/* 2. Ticket Médio */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-blue-500" id="kpi-ticket-medio">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Médio</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-gray-800 font-mono block tracking-tight">
              {formatCurrency(ticketMedio)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">
              Valor médio por operação
            </span>
          </div>
        </div>

        {/* 3. OS do Mês Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-amber-500" id="kpi-os-breakdown">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">OS do Mês</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Abertas
              </span>
              <span className="font-mono font-bold text-gray-700">{osStatsMes.abertas}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Em Execução
              </span>
              <span className="font-mono font-bold text-gray-700">{osStatsMes.emAndamento}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Concluídas
              </span>
              <span className="font-mono font-bold text-gray-700">{osStatsMes.concluidas}</span>
            </div>
          </div>
        </div>

        {/* 4. Orçamentos Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-indigo-500" id="kpi-orcamentos">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orçamentos</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-gray-800 font-mono block tracking-tight">
              {orcamentosPendentes}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">
              Pendentes de aprovação
            </span>
          </div>
        </div>

        {/* 5. Clientes Ativos */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-teal-500" id="kpi-clientes">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clientes Ativos</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-gray-800 font-mono block tracking-tight">
              {totalClientes}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block mt-1">
              Cadastrados no sistema
            </span>
          </div>
        </div>
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
        {/* Chart 1: Revenue Line/Bar Chart (Left) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs lg:col-span-2 flex flex-col h-[350px]" id="chart-faturamento-container">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#0F4C5C]" />
                Histórico de Faturamento (Últimos 6 Meses)
              </h3>
              <p className="text-xs text-gray-500">Valores faturados acumulados mensais</p>
            </div>
          </div>
          <div className="flex-1 w-full text-xs">
            {faturamentoChartData.every(d => d.Total === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <DollarSign size={32} className="text-gray-300" />
                <p>Nenhum faturamento registrado nos últimos 6 meses.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faturamentoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Ordens de Serviço" stackId="a" fill="#0F4C5C" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Vendas Balcão" stackId="a" fill="#E39B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: OS Status Pie Chart (Right) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[350px]" id="chart-os-status-container">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={16} className="text-[#0F4C5C]" />
                Ordens de Serviço por Status
              </h3>
              <p className="text-xs text-gray-500">Distribuição total das OS</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
            {osStatusChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <FileText size={32} className="text-gray-300" />
                <p>Nenhuma OS ativa no sistema.</p>
              </div>
            ) : (
              <>
                <div className="relative w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={osStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {osStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} OS`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-700 font-mono">
                      {ordensServico.length}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total OS</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full" id="os-status-labels">
                  {osStatusChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rankings Row: Top Services & Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="rankings-row">
        {/* Ranking 1: Top Services */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col" id="top-services-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-[#0F4C5C]" />
                Serviços Mais Realizados (Top 5)
              </h3>
              <p className="text-xs text-gray-500">Demanda acumulada de serviços em OS</p>
            </div>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Wrench size={16} />
            </span>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {servicosMaisRealizados.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhum serviço registrado em ordens de serviço ativas.
              </div>
            ) : (
              servicosMaisRealizados.map((service, index) => {
                const maxQty = Math.max(...servicosMaisRealizados.map(s => s.quantity)) || 1;
                const pct = (service.quantity / maxQty) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-700 truncate max-w-[80%]">
                        {index + 1}. {service.name}
                      </span>
                      <span className="font-mono text-[#0F4C5C] font-bold bg-[#0F4C5C]/5 px-2 py-0.5 rounded-md">
                        {service.quantity} {service.quantity === 1 ? 'execução' : 'execuções'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0F4C5C] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ranking 2: Top Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col" id="top-products-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-[#E39B00]" />
                Produtos & Peças Mais Vendidos (Top 5)
              </h3>
              <p className="text-xs text-gray-500">Vendas acumuladas (OS + balcão)</p>
            </div>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Package size={16} />
            </span>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {produtosMaisVendidos.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhum produto vendido ou peça aplicada no sistema.
              </div>
            ) : (
              produtosMaisVendidos.map((prod, index) => {
                const maxQty = Math.max(...produtosMaisVendidos.map(p => p.quantity)) || 1;
                const pct = (prod.quantity / maxQty) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-700 truncate max-w-[80%]">
                        {index + 1}. {prod.name}
                      </span>
                      <span className="font-mono text-[#E39B00] font-bold bg-[#E39B00]/5 px-2 py-0.5 rounded-md">
                        {prod.quantity} {prod.quantity === 1 ? 'unidade' : 'unidades'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E39B00] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Operational Alerts / Notifications Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="alerts-activities-row">
        {/* Alerts Column (Late OSs + Low Stock + Expiring Budgets) */}
        <div className="lg:col-span-2 space-y-6" id="alerts-column">
          {/* 1. OS Atrasadas Alerta */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs" id="late-os-alert-panel">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-rose-50 text-rose-600 rounded-md">
                  <Clock size={16} />
                </span>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Ordens de Serviço Atrasadas ({osAtrasadas.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Vencidas</span>
            </div>

            {osAtrasadas.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                Nenhuma ordem de serviço com prazo vencido!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" id="late-os-list">
                {osAtrasadas.map((os) => (
                  <div 
                    key={os.numero} 
                    className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs hover:bg-rose-50/80 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-700">OS #{os.numero}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-semibold">{os.clienteNome}</span>
                      </div>
                      <div className="text-gray-500 text-[11px] font-medium">
                        {os.veiculoNome}
                      </div>
                      <div className="text-rose-700 font-semibold text-[11px] flex items-center gap-1 mt-0.5">
                        <AlertCircle size={12} />
                        Entrega prevista para: {os.previsaoEntrega} ({os.diasAtraso} {os.diasAtraso === 1 ? 'dia' : 'dias'} de atraso)
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetActiveTab('os')}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-colors cursor-pointer"
                      title="Ver OS"
                      style={{ minHeight: '32px', minWidth: '32px' }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Estoque Baixo Alerta */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs" id="low-stock-alert-panel">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-50 text-amber-600 rounded-md">
                  <PackageOpen size={16} />
                </span>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Alerta de Estoque Baixo ({estoqueBaixo.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Abaixo do Mínimo</span>
            </div>

            {estoqueBaixo.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                Estoque 100% regularizado!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" id="low-stock-list">
                {estoqueBaixo.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl flex items-center justify-between text-xs hover:bg-amber-50/60 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-md font-bold">{prod.codigo}</span>
                        <span className="text-gray-700 font-bold">{prod.nome}</span>
                      </div>
                      <div className="text-gray-500 text-[11px] font-medium">
                        Categoria: {prod.categoria} • Preço de Venda: {formatCurrency(prod.precoVenda)}
                      </div>
                      <div className="text-amber-800 font-semibold text-[11px] flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={12} className="text-amber-600" />
                        Estoque atual: <span className="text-red-600 font-bold">{prod.estoqueAtual}</span> (Mínimo recomendado: {prod.estoqueMinimo})
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetActiveTab('produtos')}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors cursor-pointer"
                      title="Ver Produtos"
                      style={{ minHeight: '32px', minWidth: '32px' }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Orçamentos Prestes a Vencer Alerta */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs" id="expiring-budgets-panel">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                  <Calendar size={16} />
                </span>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Orçamentos Prestes a Vencer ({orcamentosPrestesVencer.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Validade</span>
            </div>

            {orcamentosPrestesVencer.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                Nenhum orçamento pendente prestes a expirar.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" id="expiring-budgets-list">
                {orcamentosPrestesVencer.map((o) => (
                  <div 
                    key={o.numero} 
                    className={`p-3 border rounded-xl flex items-center justify-between text-xs hover:opacity-90 transition-opacity ${
                      o.diasRestantes < 0 
                        ? 'bg-rose-50/30 border-rose-100' 
                        : 'bg-indigo-50/30 border-indigo-100'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-700">Orçamento #{o.numero}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-semibold">{o.clienteNome}</span>
                      </div>
                      <div className="text-gray-500 text-[11px] font-medium">
                        {o.veiculoNome} • Valor Total: <span className="font-bold text-gray-700">{formatCurrency(o.valorTotal)}</span>
                      </div>
                      <div className={`font-semibold text-[11px] flex items-center gap-1 mt-0.5 ${
                        o.diasRestantes < 0 ? 'text-red-600' : 'text-indigo-600'
                      }`}>
                        <Calendar size={12} />
                        {o.diasRestantes < 0 ? (
                          <span>Vencido em: {o.validade} ({Math.abs(o.diasRestantes)} {Math.abs(o.diasRestantes) === 1 ? 'dia' : 'dias'} atrás)</span>
                        ) : o.diasRestantes === 0 ? (
                          <span>Vence hoje! ({o.validade})</span>
                        ) : (
                          <span>Vence em: {o.validade} ({o.diasRestantes} {o.diasRestantes === 1 ? 'dia' : 'dias'} restante)</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetActiveTab('orcamentos')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        o.diasRestantes < 0 
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800' 
                          : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                      }`}
                      title="Ver Orçamentos"
                      style={{ minHeight: '32px', minWidth: '32px' }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Combined Unified Activity Log */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col" id="activity-log-panel">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#0F4C5C]/5 text-[#0F4C5C] rounded-md">
                <Activity size={16} />
              </span>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Linha do Tempo Operacional
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Tempo Real</span>
          </div>

          <div className="flex-1 space-y-4 max-h-[580px] overflow-y-auto pr-1" id="activities-timeline">
            {ultimasAtividades.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhuma atividade operacional registrada.
              </div>
            ) : (
              ultimasAtividades.map((act, index) => (
                <div key={`${act.tipo}-${act.id}-${index}`} className="relative pl-6 pb-2.5 last:pb-0 text-xs">
                  {/* Vertical Timeline Bar */}
                  {index !== ultimasAtividades.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-[1.5px] bg-gray-100" />
                  )}
                  {/* Node Circle icon overlay */}
                  <div className={`absolute left-0.5 top-1 w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center z-10 ${
                    act.tipo === 'OS' 
                      ? 'bg-blue-500 text-white' 
                      : act.tipo === 'Venda' 
                      ? 'bg-[#E39B00] text-white' 
                      : 'bg-indigo-500 text-white'
                  }`}>
                    {act.tipo === 'OS' ? (
                      <FileText size={10} />
                    ) : act.tipo === 'Venda' ? (
                      <ShoppingCart size={10} />
                    ) : (
                      <ClipboardList size={10} />
                    )}
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-800 truncate block">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                        {act.dateStr}
                      </span>
                    </div>
                    <p className="text-gray-500 leading-relaxed text-[11px] font-medium">
                      {act.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-gray-100">
                      <span className="font-bold text-gray-700 font-mono">
                        {formatCurrency(act.value)}
                      </span>
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${act.statusColor}`}>
                        {act.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
