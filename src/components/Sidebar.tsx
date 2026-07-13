import React from 'react';
import { 
  LayoutDashboard, Users, Car, FileText, ClipboardCheck, 
  Package, ShoppingCart, Receipt, FileCheck, Settings, X, Wrench 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  nomeOficina: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  nomeOficina 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Car },
    { id: 'os', label: 'Ordens de Serviço', icon: FileText },
    { id: 'orcamentos', label: 'Orçamentos', icon: ClipboardCheck },
    { id: 'produtos', label: 'Produtos e Estoque', icon: Package },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'recibos', label: 'Recibos', icon: Receipt },
    { id: 'notas-fiscais', label: 'Notas Fiscais', icon: FileCheck },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setIsOpen(false); // Close on mobile
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0F4C5C] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen`}
        aria-label="Menu Principal"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#176275]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E39B00] rounded-lg text-white">
              <Wrench size={20} aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight font-sans text-white">{nomeOficina}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/80 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-none" aria-label="Navegação Lateral">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E39B00] ${
                  isActive
                    ? 'bg-[#E39B00] text-white shadow-md font-semibold'
                    : 'text-white/80 hover:bg-[#176275] hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
                style={{ minHeight: '44px' }} // WCAG 2.1 Target Size AA
              >
                <IconComponent size={20} className={isActive ? 'text-white' : 'text-white/70'} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#176275] text-xs text-white/50 text-center">
          <p>© 2026 {nomeOficina}</p>
          <p className="mt-1 font-mono text-[10px]">v1.0.0 (Protótipo)</p>
        </div>
      </aside>
    </>
  );
};
