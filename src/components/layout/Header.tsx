import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Shield,
  LogOut,
  ChevronDown,
  Clock,
  CheckCircle2,
  Flame,
  User as UserIcon,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  UserPlus,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem, UserRole, Customer, WorkOrder, Quote, ServiceItem } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { offlineManager } from '../../lib/offlineManager';
import { api } from '../../lib/api';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { InlineHeaderSearch } from './InlineHeaderSearch';
import { getCurrentMonthFormatted } from '../../core';

interface HeaderProps {
  title: string;
  breadcrumb: string[];
  onOpenMobileSidebar: () => void;
  onOpenGlobalSearch?: () => void;
  onQuickAction: (action: 'new-os' | 'new-quote' | 'new-customer') => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onNavigatePage: (page: any) => void;
  customers?: Customer[];
  workOrders?: WorkOrder[];
  quotes?: Quote[];
  services?: ServiceItem[];
  onSelectWorkOrder?: (wo: WorkOrder) => void;
  onSelectCustomer?: (c: Customer) => void;
  onSelectQuote?: (q: Quote) => void;
  onSelectService?: (s: ServiceItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  breadcrumb,
  onOpenMobileSidebar,
  onOpenGlobalSearch,
  onQuickAction,
  notifications,
  onMarkNotificationRead,
  onNavigatePage,
  customers = [],
  workOrders = [],
  quotes = [],
  services = [],
  onSelectWorkOrder,
  onSelectCustomer,
  onSelectQuote,
  onSelectService
}) => {
  const { user, logout, switchQuickRole } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [isOffline, setIsOffline] = useState(offlineManager.isOffline());
  const [queueCount, setQueueCount] = useState(offlineManager.getQueue().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return offlineManager.subscribe(() => {
      setIsOffline(offlineManager.isOffline());
      setQueueCount(offlineManager.getQueue().length);
    });
  }, []);

  const handleToggleOffline = () => {
    offlineManager.toggleOfflineMode();
  };

  const handleSyncOffline = async () => {
    setSyncing(true);
    try {
      await api.syncOfflineQueue();
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter((n) => !n.read);

  const currentMonthFormatted = React.useMemo(() => getCurrentMonthFormatted(), []);

  const hasPendingOrOpenOrders = (workOrders || []).some(
    (wo) => wo.status === 'ABERTA' || wo.status === 'AGENDADA' || wo.status === 'AGUARDANDO' || wo.dispatchStatus === 'PENDING_ACK'
  );
  const shouldAnimateBell = hasPendingOrOpenOrders || unreadNotifications.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manager':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'technician':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="relative sticky top-0 z-30 h-16 sm:h-18 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between transition-all select-none">
      {/* Esquerda: Botão Menu de 3 riscos (Menu Principal) */}
      <div className="flex items-center gap-2 shrink-0 z-20">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
          title="Abrir Menu de Navegação (3 Riscos)"
        >
          <Menu className="w-5 h-5 text-slate-800" />
          <span className="text-xs font-bold hidden md:inline text-slate-800">Menu</span>
        </button>
      </div>


      {/* Direita: Modo Offline (Verde Online / Vermelho Offline), Busca, Notificações e Perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 z-20">
        {/* Opção Modo Offline / Online: VERDE quando Online, VERMELHO (nunca laranja) quando Offline */}
        <div className="flex items-center">
          {isOffline ? (
            <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-rose-50 border border-rose-400 rounded-xl">
              <button
                onClick={handleToggleOffline}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Modo offline ativado (Vermelho). Clique para alternar para Online."
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <WifiOff className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Offline</span>
              </button>
              {queueCount > 0 && (
                <button
                  onClick={handleSyncOffline}
                  disabled={syncing}
                  className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                  title="Sincronizar dados pendentes com o servidor"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="text-[11px]">{queueCount}</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleToggleOffline}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Sistema Conectado (Verde). Clique para alternar para Offline."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-black text-emerald-800 hidden sm:inline">Online</span>
            </button>
          )}
        </div>

        {/* Caixa de Exibição do Mês Atual (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 shadow-2xs shrink-0 select-none">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">Mês Atual</span>
            <span className="text-xs font-bold text-slate-900 leading-tight font-mono">{currentMonthFormatted}</span>
          </div>
        </div>

        {/* Barra de Busca rápida Inline (Desktop) */}
        <div className="hidden md:block">
          <InlineHeaderSearch
            customers={customers}
            workOrders={workOrders}
            quotes={quotes}
            services={services}
            onSelectWorkOrder={onSelectWorkOrder}
            onSelectCustomer={onSelectCustomer}
            onSelectQuote={onSelectQuote}
            onSelectService={onSelectService}
          />
        </div>

        {/* Botão de Busca Compacto (Exclusivo Mobile para não quebrar a tela) */}
        <button
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
          title="Buscar no sistema"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Botão Instalar App PWA (Chromium e iOS Safari - Desktop/Tablet) */}
        <div className="hidden sm:block">
          <PWAInstallButton variant="header" />
        </div>

        {/* Botão Único Nova OS (CTA Primária Global no Cabeçalho - Desktop/Tablet) */}
        {user?.role !== 'technician' && (
          <button
            onClick={() => onQuickAction('new-os')}
            className="hidden sm:flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-[44px] border border-blue-500/20"
            title="Lançar Nova Ordem de Serviço"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span className="tracking-tight">Nova OS</span>
          </button>
        )}

        {/* Notificações com Animação de Sino Balançando e Ponto Vermelho Piscando */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`p-2 rounded-xl transition-all relative cursor-pointer border ${
              shouldAnimateBell
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border-slate-200'
            }`}
            title={shouldAnimateBell ? 'Há ordens de serviço pendentes/abertas!' : 'Notificações'}
          >
            <Bell className={`w-4 h-4 ${shouldAnimateBell ? 'animate-bell-ring text-rose-600' : ''}`} />
            {shouldAnimateBell && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse-glow-red" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Notificações</span>
                  {unreadNotifications.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {unreadNotifications.length} pendentes
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onNavigatePage('notifications')}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Ver todas
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhuma notificação nova.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.link) {
                          onNavigatePage(n.link.replace('/', ''));
                          setNotificationsOpen(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'urgent' && <Flame className="w-4 h-4 text-rose-500" />}
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {n.type === 'info' && <Clock className="w-4 h-4 text-blue-500" />}
                        {n.type === 'warning' && <Shield className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil do Usuário */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[150px] leading-tight">
                {user?.name}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-slate-100 mb-1.5">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate font-mono mt-0.5">{user?.email}</p>
              </div>

              {/* Alternador de Conexão no Mobile: Verde para Online, Vermelho para Offline */}
              <div className="md:hidden px-2 py-1.5 border-b border-slate-100 mb-1">
                <button
                  type="button"
                  onClick={handleToggleOffline}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isOffline
                      ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100 shadow-2xs'
                  }`}
                  title="Alternar entre modo Online (Verde) e Offline (Vermelho)"
                >
                  <span className="flex items-center gap-2">
                    {isOffline ? <WifiOff className="w-4 h-4 text-white" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
                    <span>Status: {isOffline ? 'Offline (Modo Offline Ativo)' : 'Online (Conectado)'}</span>
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`} />
                </button>
              </div>

              {/* Opções de Gerenciamento do Perfil */}
              <div className="py-1 border-b border-slate-100 mb-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors font-medium text-left cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Alterar Minha Senha</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigatePage('users');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-colors font-medium text-left cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    <span>Cadastrar Funcionário</span>
                  </button>
                )}
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => { setProfileOpen(false); onNavigatePage('settings'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-500" />
                  Configurações da Empresa
                </button>
              )}
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1 font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Alteração de Senha Integrado */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
};
