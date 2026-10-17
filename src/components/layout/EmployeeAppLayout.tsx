import React, { useState, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  Calendar,
  LogOut,
  Bell,
  Smartphone,
  Shield,
  Wrench,
  Users,
  Wifi,
  WifiOff,
  Plus
} from 'lucide-react';
import { User } from '../../types';
import { NavigationPage } from './Sidebar';
import { offlineManager } from '../../lib/offlineManager';

interface EmployeeAppLayoutProps {
  user: User | null;
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  onOpenNewWorkOrder: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  children: React.ReactNode;
  modals?: React.ReactNode;
}

export const EmployeeAppLayout: React.FC<EmployeeAppLayoutProps> = ({
  user,
  activePage,
  onSelectPage,
  onOpenNewWorkOrder,
  onLogout,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  children,
  modals
}) => {
  const [isOffline, setIsOffline] = useState(offlineManager.isOffline());

  useEffect(() => {
    return offlineManager.subscribe(() => {
      setIsOffline(offlineManager.isOffline());
    });
  }, []);

  // Navigation tabs para o funcionário: Início, Ordens, Serviços e Clientes
  const navTabs: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'work-orders', label: 'Ordens', icon: ClipboardList },
    { id: 'services', label: 'Serviços', icon: Wrench },
    { id: 'customers', label: 'Clientes', icon: Users }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center sm:py-6 p-0 font-sans antialiased text-slate-800 select-none">
      {/* Visual device simulator pill (Desktop only) */}
      <div className="hidden sm:flex items-center gap-2 mb-3 text-slate-400 text-xs font-mono">
        <Smartphone className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-slate-300">CR Serviços Gerais • Operacional</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
          Mobile
        </span>
      </div>

      {/* Smartphone Device Simulator Container (Desktop: 430px centered frame / Mobile: 100% full screen) */}
      <div className="w-full sm:max-w-[430px] h-[100dvh] sm:h-[880px] bg-slate-50 sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] sm:ring-1 sm:ring-slate-700/50 flex flex-col overflow-hidden relative transform-gpu">
        {/* Smartphone top speaker notch (Desktop only) */}
        <div className="hidden sm:flex justify-center items-center h-6 bg-slate-800 shrink-0 select-none">
          <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-700" />
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Mobile App Header - Com Logo da CR Centralizada Bem no Meio */}
        <header className="relative bg-white border-b border-slate-200/90 px-3.5 py-2.5 shrink-0 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center shrink-0 z-20">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Funcionário
            </span>
          </div>


          {/* User profile & quick actions */}
          <div className="flex items-center gap-2 z-20">
            {isOffline ? (
              <button
                type="button"
                onClick={() => offlineManager.toggleOfflineMode()}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black border border-rose-700 shadow-2xs cursor-pointer"
                title="Modo Offline (Vermelho). Toque para alternar para Online."
              >
                <WifiOff className="w-3 h-3" />
                Offline
              </button>
            ) : (
              <button
                type="button"
                onClick={() => offlineManager.toggleOfflineMode()}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-300 shadow-2xs cursor-pointer"
                title="Modo Online (Verde). Toque para alternar para Offline."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3 h-3 text-emerald-600" />
                Online
              </button>
            )}

            {/* Notificações e Perfil */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-100 text-blue-700 border border-blue-200 shrink-0 flex items-center justify-center font-bold text-xs">
                {user?.name?.[0] || 'F'}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Mobile Content Area (100% vertical single-column) */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 custom-scrollbar pb-24 w-full">
          {children}
        </main>

        {/* Bottom Navigation Bar: Início, Ordens, [ + BOLA AZUL NO MEIO ], Serviços, Clientes */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-40 flex items-center justify-between shadow-lg">
          {/* 1. Início */}
          <button
            type="button"
            onClick={() => onSelectPage('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'dashboard'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Home className={`w-5 h-5 ${activePage === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Início</span>
          </button>

          {/* 2. Ordens */}
          <button
            type="button"
            onClick={() => onSelectPage('work-orders')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'work-orders'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <ClipboardList className={`w-5 h-5 ${activePage === 'work-orders' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Ordens</span>
          </button>

          {/* 3. BOTÃO NO MEIO: Bola azul com (+) e animação de pulso (pulsing) para incentivar lançamento rápido de serviço avulso sem caderno */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Anel de Pulso Animado (Pulsing Ping Effect) */}
            <span className="absolute -top-7 w-14 h-14 rounded-full bg-blue-500/40 animate-ping pointer-events-none" />
            <button
              type="button"
              onClick={onOpenNewWorkOrder}
              className="absolute -top-7 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white shadow-xl shadow-blue-600/50 border-4 border-white flex items-center justify-center cursor-pointer transition-transform animate-pulse z-10"
              title="Lançar Nova Ordem de Serviço (Rápido / Sem Caderno)"
            >
              <Plus className="w-8 h-8 stroke-[3]" />
            </button>
            <div className="h-7" />
          </div>

          {/* 4. Serviços */}
          <button
            type="button"
            onClick={() => onSelectPage('services')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'services'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Wrench className={`w-5 h-5 ${activePage === 'services' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Serviços</span>
          </button>

          {/* 5. Clientes */}
          <button
            type="button"
            onClick={() => onSelectPage('customers')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'customers'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Users className={`w-5 h-5 ${activePage === 'customers' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Clientes</span>
          </button>
        </nav>

        {/* Modais contidos estritamente no formato mobile do smartphone */}
        {modals}
      </div>
    </div>
  );
};
