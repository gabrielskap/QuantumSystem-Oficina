import React from 'react';
import { Menu, Search, User, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  setSidebarOpen,
  title 
}) => {
  const { configuracoes, searchQuery, setSearchQuery } = useApp();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:text-[#0F4C5C] hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] lg:hidden"
          aria-label={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu size={22} />
        </button>

        {/* Dynamic Page Title (For mobile or screenreaders) */}
        <h1 className="text-lg font-bold text-gray-800 lg:hidden">
          {title}
        </h1>
        
        {/* Global Search Bar (Only shown on medium screens and up) */}
        <div className="hidden md:flex items-center relative w-80">
          <label htmlFor="global-search" className="sr-only">Busca rápida global</label>
          <div className="absolute left-3 text-gray-400 pointer-events-none">
            <Search size={18} aria-hidden="true" />
          </div>
          <input
            id="global-search"
            type="search"
            placeholder="Busca rápida em todo o app..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Search button for small screens */}
        <div className="md:hidden relative">
          <label htmlFor="mobile-search" className="sr-only">Buscar</label>
          <input
            id="mobile-search"
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-28 sm:w-40 pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
          <div className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none">
            <Search size={12} aria-hidden="true" />
          </div>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-gray-700">{configuracoes.nomeUsuario}</span>
            <span className="text-xs text-gray-500 font-mono">Gestor / Admin</span>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] border border-[#0F4C5C]/20">
            <User size={18} aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
};
