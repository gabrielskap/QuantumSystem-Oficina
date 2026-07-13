import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { ClientesView } from './views/ClientesView';
import { VeiculosView } from './views/VeiculosView';
import { OSView } from './views/OSView';
import { OrcamentosView } from './views/OrcamentosView';
import { ProdutosView } from './views/ProdutosView';
import { VendasView } from './views/VendasView';
import { RecibosView } from './views/RecibosView';
import { NotasFiscaisView } from './views/NotasFiscaisView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

function AppContent() {
  const { 
    configuracoes, activeTab, setActiveTab, 
    toast, setToast, confirmConfig, setConfirmConfig 
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto dismiss toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  const handleConfirm = () => {
    if (confirmConfig) {
      confirmConfig.onConfirm();
      setConfirmConfig(null);
    }
  };

  const handleCancel = () => {
    setConfirmConfig(null);
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Painel Executivo';
      case 'clientes': return 'Clientes Cadastrados';
      case 'veiculos': return 'Veículos Relacionados';
      case 'os': return 'Ordens de Serviço';
      case 'orcamentos': return 'Orçamentos de Clientes';
      case 'produtos': return 'Produtos, Peças e Serviços';
      case 'vendas': return 'Vendas Balcão';
      case 'recibos': return 'Recibos Emitidos';
      case 'notas-fiscais': return 'Notas Fiscais DANFE';
      case 'configuracoes': return 'Configurações do Sistema';
      default: return 'Painel OficinaPro';
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'clientes': return <ClientesView />;
      case 'veiculos': return <VeiculosView />;
      case 'os': return <OSView />;
      case 'orcamentos': return <OrcamentosView />;
      case 'produtos': return <ProdutosView />;
      case 'vendas': return <VendasView />;
      case 'recibos': return <RecibosView />;
      case 'notas-fiscais': return <NotasFiscaisView />;
      case 'configuracoes': return <ConfiguracoesView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F6F7F9] overflow-hidden font-sans antialiased text-gray-700">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        nomeOficina={configuracoes?.nomeOficina || 'OficinaPro'}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={getPageTitle(activeTab)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-hidden" id="main-content" tabIndex={-1}>
          {renderActiveView()}
        </main>
      </div>

      {/* Centralized Accessible Toast Notification */}
      {toast && (
        <div 
          className="fixed top-4 right-4 z-[999] max-w-sm w-full bg-white rounded-xl shadow-lg border border-gray-150 p-4 flex gap-3 items-start animate-fade-in focus-within:ring-2 focus-within:ring-[#0F4C5C]"
          role="status"
          aria-live="polite"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
            {toast.type === 'error' && <AlertTriangle className="text-rose-500" size={20} />}
            {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Fechar notificação"
            style={{ minWidth: '24px', minHeight: '24px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Centralized Accessible Confirmation Modal */}
      {confirmConfig && (
        <div 
          className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900 tracking-tight">
                  {confirmConfig.title}
                </h3>
              </div>
              <p id="confirm-dialog-desc" className="text-sm text-gray-500 leading-relaxed">
                {confirmConfig.message}
              </p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-300"
                style={{ minHeight: '44px' }}
                autoFocus
              >
                {confirmConfig.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-bold transition-colors cursor-pointer text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F4C5C]"
                style={{ minHeight: '44px' }}
              >
                {confirmConfig.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
