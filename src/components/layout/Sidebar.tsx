import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  MapPin,
  Wrench,
  FileText,
  DollarSign,
  BarChart3,
  FolderArchive,
  Settings,
  ChevronLeft,
  PhoneCall,
  UserCheck,
  ShieldAlert,
  Smartphone,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationPage =
  | 'dashboard'
  | 'work-orders'
  | 'schedule'
  | 'customers'
  | 'locations'
  | 'services'
  | 'quotes'
  | 'financial'
  | 'reports'
  | 'documents'
  | 'team'
  | 'notifications'
  | 'users'
  | 'settings'
  | 'audit-logs'
  | 'technician-mobile';

interface SidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeWorkOrdersCount?: number;
  pendingQuotesCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  mobileOpen,
  onCloseMobile,
  activeWorkOrdersCount = 0,
  pendingQuotesCount = 0,
}) => {
  const { user, hasRole } = useAuth();
  const isTechnician = user?.role === 'technician';

  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = (page: NavigationPage) => {
    onSelectPage(page);
    setIsHovered(false);
    onCloseMobile();
  };

  // Nav Item Renderer: Adapts dynamically whether hovered (expanded) or icon-only
  const renderNavItem = (
    page: NavigationPage,
    label: string,
    IconComponent: React.ElementType,
    badgeCount: number = 0,
    iconColorClass: string = 'text-slate-600'
  ) => {
    const isActive = currentPage === page;

    return (
      <button
        type="button"
        onClick={() => handleNavClick(page)}
        className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer group relative px-3 py-2.5 gap-3.5 justify-start ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`}
      >
        <IconComponent
          className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
            isActive ? 'text-blue-600' : iconColorClass
          }`}
        />

        <span className="truncate whitespace-nowrap text-left flex-1">{label}</span>
        {badgeCount > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Sensor invisível na borda esquerda da tela para desktop abrir suavemente ao passar o mouse */}
      <div
        className="fixed top-0 bottom-0 left-0 w-3 z-40 hidden lg:block"
        onMouseEnter={handleMouseEnter}
      />

      {/* Backdrop para mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => {
            setIsHovered(false);
            onCloseMobile();
          }}
        />
      )}

      {/* Sidebar: Recolhe 100% ao fechar e surge com animação suave e sombra apenas ao passar o mouse por cima */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 text-slate-700 transition-all duration-300 ease-out select-none w-[270px] shadow-2xl ${
          isHovered || mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo Limpo: Loguinho da CR e botão para recolher */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-cr.svg" alt="CR Serviços Gerais" className="h-5 w-auto max-w-[105px] object-contain shrink-0 select-none" />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsHovered(false);
              onCloseMobile();
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
            title="Fechar menu lateral"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Lista de Ícones / Itens de Menu */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-2.5 py-3 space-y-4 custom-scrollbar">
          {/* Grupo: Operação */}
          <div className="space-y-1">
            {(isHovered || mobileOpen) && (
              <p className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mb-1">
                Operação
              </p>
            )}
            {renderNavItem('dashboard', 'Dashboard', LayoutDashboard, 0, 'text-blue-600')}
            {renderNavItem('work-orders', 'Ordens de Serviço', ClipboardList, activeWorkOrdersCount, 'text-slate-600')}
            {renderNavItem('schedule', 'Agenda & Escala', Calendar, 0, 'text-indigo-600')}
            {!isTechnician && (
              <>
                {renderNavItem('customers', 'Clientes', Users, 0, 'text-slate-600')}
                {renderNavItem('services', 'Catálogo de Serviços', Wrench, 0, 'text-amber-600')}
              </>
            )}
          </div>

          {/* Grupo: Gestão */}
          {!isTechnician && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              {(isHovered || mobileOpen) && (
                <p className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mb-1">
                  Gestão & Vendas
                </p>
              )}
              {renderNavItem('quotes', 'Orçamentos', FileText, pendingQuotesCount, 'text-blue-600')}
              {hasRole(['admin', 'manager']) && renderNavItem('financial', 'Financeiro', DollarSign, 0, 'text-emerald-600')}
              {hasRole(['admin', 'manager']) && renderNavItem('reports', 'Relatórios', BarChart3, 0, 'text-purple-600')}
              {renderNavItem('documents', 'Documentos & Termos', FolderArchive, 0, 'text-slate-600')}
              {hasRole(['admin', 'manager']) && renderNavItem('team', 'Equipe Técnica', UserCheck, 0, 'text-blue-600')}
            </div>
          )}

          {/* Grupo: Sistema */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            {(isHovered || mobileOpen) && (
              <p className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mb-1">
                Sistema
              </p>
            )}
            {renderNavItem('technician-mobile', 'Modo Campo (PWA)', Smartphone, 0, 'text-emerald-600')}
            {hasRole(['admin', 'manager']) && renderNavItem('audit-logs', 'Serviços dos Técnicos', ShieldAlert, 0, 'text-indigo-600')}
            {hasRole(['admin']) && renderNavItem('users', 'Gerenciar Usuários', UserCheck, 0, 'text-purple-600')}
            {hasRole(['admin']) && renderNavItem('settings', 'Configurações', Settings, 0, 'text-slate-600')}
          </div>
        </div>

        {/* Rodapé: Conexão / Telefone */}
        <div className={`border-t border-slate-200 bg-slate-50 transition-all ${
          isHovered || mobileOpen ? 'p-3 space-y-2' : 'p-2 flex flex-col items-center justify-center'
        }`}>
          {isHovered || mobileOpen ? (
            <>
              {user?.role === 'employee' && (
                <div className="px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-800 flex items-start gap-1">
                  <Lock className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Funcionário:</strong> OS, Clientes e Catálogo liberados.
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700 text-[11px]">Sistema Operacional Ativo</span>
              </div>
              <a
                href="https://wa.me/5554996224098"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-mono font-medium text-[11px]">(54) 99622-4098</span>
              </a>
            </>
          ) : (
            <div className="py-1" title="Sistema Operacional Conectado">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
