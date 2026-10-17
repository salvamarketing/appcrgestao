import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { Sidebar, NavigationPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { PrintDocumentModal } from './components/common/PrintDocumentModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { ServicesPage } from './pages/ServicesPage';
import { QuotesPage } from './pages/QuotesPage';
import { SchedulePage } from './pages/SchedulePage';
import { TeamPage } from './pages/TeamPage';
import { FinancialPage } from './pages/FinancialPage';
import { ReportsPage } from './pages/ReportsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { LocationsPage } from './pages/LocationsPage';
import { UsersPage } from './pages/UsersPage';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { EmployeeAppLayout } from './components/layout/EmployeeAppLayout';
import { MobileTechnicianView } from './components/technician/MobileTechnicianView';
import { WhatsAppModal } from './components/common/WhatsAppModal';

import {
  Customer,
  CustomerLocation,
  ServiceItem,
  Quote,
  WorkOrder,
  Technician,
  FinancialTransaction,
  NotificationItem,
  CompanySettings,
  AuditLog
} from './types';
import { api } from './lib/api';
import { Loader2, Lock, ClipboardList, Plus, MapPin, LayoutDashboard, Users, Menu, Wrench } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Painel Operacional',
  'work-orders': 'Ordens de Serviço',
  schedule: 'Agenda e Despacho',
  customers: 'Cadastro e CRM de Clientes',
  services: 'Catálogo de Serviços',
  quotes: 'Orçamentos e Propostas',
  financial: 'Gestão Financeira e Fluxo de Caixa',
  reports: 'Relatórios Gerenciais e Métricas',
  documents: 'Emissor de Documentos e Termos',
  team: 'Equipe Técnica e Plantão',
  notifications: 'Central de Alertas e Notificações',
  users: 'Gerenciamento de Usuários e Funcionários',
  settings: 'Configurações da Empresa',
  'audit-logs': 'Serviços dos Técnicos (Auditoria de Campo)',
  'technician-mobile': 'Modo Técnico em Campo (Mobile PWA)',
};

const MainApp: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { showToast } = useNotification();

  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Public auth view (Login vs Cadastro de Funcionário)
  const [authView, setAuthView] = useState<'login' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/register' || path === '/cadastro' || hash === '#/register' || hash === '#register') {
        return 'register';
      }
    }
    return 'login';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/register' || path === '/cadastro' || hash === '#/register' || hash === '#register') {
        setAuthView('register');
      } else {
        setAuthView('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToRegister = () => {
    setAuthView('register');
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', '/register');
    }
  };

  const navigateToLogin = () => {
    setAuthView('login');
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', '/');
    }
  };

  // Core system data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<{
    type: 'work-order' | 'quote';
    workOrder?: WorkOrder;
    quote?: Quote;
    customer?: Customer;
    technician?: Technician;
  } | null>(null);

  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    phone?: string;
    recipientName?: string;
    workOrder?: WorkOrder;
    quote?: Quote;
    customer?: Customer;
  } | null>(null);

  const handleOpenWhatsApp = useCallback(
    (payload: {
      phone?: string;
      recipientName?: string;
      customer?: Customer;
      workOrder?: WorkOrder;
      quote?: Quote;
    }) => {
      setWhatsAppModalData({
        isOpen: true,
        phone: payload.phone,
        recipientName: payload.recipientName,
        customer: payload.customer,
        workOrder: payload.workOrder,
        quote: payload.quote,
      });
    },
    []
  );

  // Direct target selection across pages
  const [selectedWOFromExternal, setSelectedWOFromExternal] = useState<WorkOrder | null>(null);
  const [openCreateModalForWO, setOpenCreateModalForWO] = useState<boolean>(false);

  // Load data from Express backend
  const fetchData = useCallback(async () => {
    try {
      const data = await api.getData();
      setCustomers(data.customers || []);
      setLocations(data.locations || []);
      setServices(data.services || []);
      setQuotes(data.quotes || []);
      setWorkOrders(data.workOrders || []);
      setTechnicians(data.technicians || []);
      setTransactions(data.financialTransactions || []);
      setNotifications(data.notifications || []);
      setSettings(data.settings || null);

      try {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs || []);
      } catch (logErr) {
        console.warn('Audit logs not loaded:', logErr);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Sincronização offline 100% automática ao retornar internet
  useEffect(() => {
    const handleAutoSynced = (e: any) => {
      fetchData();
      const count = e?.detail?.count;
      if (count && count > 0) {
        showToast('Sincronização Concluída', `${count} lançamento(s) offline foram sincronizados com sucesso!`, 'success');
      }
    };
    window.addEventListener('cr-offline-synced', handleAutoSynced);
    return () => window.removeEventListener('cr-offline-synced', handleAutoSynced);
  }, [fetchData, showToast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Iniciando sistema seguro CR Serviços Gerais...
        </p>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={navigateToLogin} />;
    }
    return <LoginPage onNavigateToRegister={navigateToRegister} />;
  }

  if (loadingData || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Sincronizando dados operacionais e ordens de serviço...
        </p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const pendingQuotesCount = quotes.filter(
    (q) => q.status === 'pending' || q.status === 'PENDENTE' || q.status === 'sent'
  ).length;
  const pendingWOsCount = workOrders.filter(
    (w) => w.status === 'AGENDADA' || w.status === 'EM_DESLOCAMENTO' || w.status === 'EM_ATENDIMENTO'
  ).length;

  const handleOpenPrintForWO = (wo: WorkOrder) => {
    const cust = customers.find((c) => c.id === wo.customerId);
    const tech = technicians.find((t) => t.id === wo.technicianId);
    setPrintDoc({
      type: 'work-order',
      workOrder: wo,
      customer: cust,
      technician: tech,
    });
  };

  const handleOpenPrintForQuote = (q: Quote) => {
    const cust = customers.find((c) => c.id === q.customerId);
    setPrintDoc({
      type: 'quote',
      quote: q,
      customer: cust,
    });
  };

  const handleSelectWorkOrder = (wo: WorkOrder) => {
    setSelectedWOFromExternal(wo);
    setActivePage('work-orders');
  };

  const handleNavigateToWOsFromQuote = (woId?: string) => {
    if (woId) {
      const found = workOrders.find((w) => w.id === woId);
      if (found) setSelectedWOFromExternal(found);
    }
    setActivePage('work-orders');
  };

  const pageTitle =
    activePage === 'dashboard'
      ? 'CR Serviços Gerais'
      : PAGE_TITLES[activePage] || 'CR Serviços Gerais';

  const isEmployee = user?.role === 'employee';

  const pageContent = (
    <>
      {activePage === 'dashboard' && (
              user?.role === 'employee' ? (
                <EmployeeDashboard
                  customers={customers}
                  locations={locations}
                  services={services}
                  workOrders={workOrders}
                  technicians={technicians}
                  onRefresh={fetchData}
                  onNavigatePage={(p) => setActivePage(p)}
                  onSelectWorkOrder={handleSelectWorkOrder}
                  onOpenNewWorkOrder={() => {
                    setSelectedWOFromExternal(null);
                    setOpenCreateModalForWO(true);
                    setActivePage('work-orders');
                  }}
                  onOpenNewCustomer={() => setActivePage('customers')}
                  onOpenNewLocation={() => setActivePage('locations')}
                  onOpenWhatsApp={handleOpenWhatsApp}
                />
              ) : (
                <DashboardPage
                  onNavigatePage={(p) => setActivePage(p)}
                  onSelectWorkOrder={handleSelectWorkOrder}
                  onOpenNewWorkOrder={() => {
                    setSelectedWOFromExternal(null);
                    setOpenCreateModalForWO(true);
                    setActivePage('work-orders');
                  }}
                  onOpenNewQuote={() => setActivePage('quotes')}
                  customers={customers}
                  services={services}
                  workOrders={workOrders}
                  transactions={transactions}
                  quotes={quotes}
                  technicians={technicians}
                />
              )
            )}

            {activePage === 'work-orders' && (
              <WorkOrdersPage
                workOrders={workOrders}
                customers={customers}
                locations={locations}
                technicians={technicians}
                services={services}
                onRefresh={fetchData}
                onOpenPrintModal={handleOpenPrintForWO}
                onOpenWhatsApp={handleOpenWhatsApp}
                selectedWorkOrderInit={selectedWOFromExternal}
                openCreateModalInit={openCreateModalForWO}
                onCloseCreateModalInit={() => setOpenCreateModalForWO(false)}
              />
            )}

            {activePage === 'customers' && (
              <CustomersPage
                customers={customers}
                locations={locations}
                workOrders={workOrders}
                quotes={quotes}
                onRefresh={fetchData}
                onOpenNewWorkOrderForCustomer={() => {
                  setSelectedWOFromExternal(null);
                  setOpenCreateModalForWO(true);
                  setActivePage('work-orders');
                }}
                onOpenNewQuoteForCustomer={() => {
                  setActivePage('quotes');
                }}
                onSelectWorkOrder={handleSelectWorkOrder}
              />
            )}

            {activePage === 'locations' && (
              <CustomersPage
                customers={customers}
                locations={locations}
                workOrders={workOrders}
                quotes={quotes}
                onRefresh={fetchData}
                onOpenNewWorkOrderForCustomer={() => {
                  setSelectedWOFromExternal(null);
                  setOpenCreateModalForWO(true);
                  setActivePage('work-orders');
                }}
                onOpenNewQuoteForCustomer={() => {
                  setActivePage('quotes');
                }}
                onSelectWorkOrder={handleSelectWorkOrder}
              />
            )}

            {activePage === 'services' && (
              <ServicesPage services={services} onRefresh={fetchData} />
            )}

            {activePage === 'quotes' && (
              <QuotesPage
                quotes={quotes}
                customers={customers}
                services={services}
                onRefresh={fetchData}
                onOpenPrintModal={handleOpenPrintForQuote}
                onOpenWhatsApp={handleOpenWhatsApp}
                onNavigateToWorkOrders={handleNavigateToWOsFromQuote}
              />
            )}

            {activePage === 'schedule' && (
              <SchedulePage
                workOrders={workOrders}
                technicians={technicians}
                customers={customers}
                onSelectWorkOrder={handleSelectWorkOrder}
                onRefresh={fetchData}
                onOpenNewWorkOrder={() => {
                  setSelectedWOFromExternal(null);
                  setOpenCreateModalForWO(true);
                  setActivePage('work-orders');
                }}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}

            {activePage === 'team' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Gestão de Equipe Restrita</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    A visualização e escala da equipe está disponível na aba <strong>Agenda & Escala</strong>. A gestão contratual da equipe técnica é restrita à diretoria.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <TeamPage
                  technicians={technicians}
                  workOrders={workOrders}
                  onRefresh={fetchData}
                  onSelectWorkOrder={handleSelectWorkOrder}
                />
              )
            )}

            {activePage === 'financial' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Acesso Restrito ao Módulo Financeiro</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    O perfil de <strong>Funcionário</strong> possui autorização para lançar serviços, cadastrar clientes e gerenciar locais. O fluxo de caixa, despesas e receitas financeiras são restritos à diretoria.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <FinancialPage transactions={transactions} onRefresh={fetchData} />
              )
            )}

            {activePage === 'reports' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Acesso Restrito aos Relatórios</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Métricas financeiras consolidadas, análises de lucratividade e relatórios de desempenho gerencial são restritos à gerência e diretoria.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <ReportsPage
                  workOrders={workOrders}
                  customers={customers}
                  technicians={technicians}
                  services={services}
                  transactions={transactions}
                />
              )
            )}

            {activePage === 'documents' && <DocumentsPage settings={settings} />}

            {activePage === 'notifications' && (
              <NotificationsPage
                notifications={notifications}
                onRefresh={fetchData}
                onNavigatePage={(p) => setActivePage(p)}
              />
            )}

            {activePage === 'users' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Acesso Restrito ao Gerenciamento de Usuários</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    O módulo de controle de acesso (RBAC), criação de usuários e redefinição de senhas é exclusivo para administradores da CR Serviços Gerais.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <UsersPage onRefresh={fetchData} />
              )
            )}

            {activePage === 'settings' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Acesso Restrito às Configurações</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    A alteração de dados corporativos (CNPJ, chave PIX, garantia padrão) e backup do sistema é restrita à diretoria.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <SettingsPage settings={settings} onRefresh={fetchData} />
              )
            )}

            {activePage === 'audit-logs' && (
              user?.role === 'employee' ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-4 my-12 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Acesso Restrito aos Logs de Auditoria</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    O histórico de alterações do sistema e rastreamento de operações é restrito à gerência e auditoria.
                  </p>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Voltar ao Painel do Funcionário
                  </button>
                </div>
              ) : (
                <AuditLogsPage logs={auditLogs} onRefresh={fetchData} />
              )
            )}

            {activePage === 'technician-mobile' && (
              <div className="max-w-md mx-auto">
                <div className="mb-3 flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300">
                  <span>Modo Técnico em Campo ativo</span>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-500"
                  >
                    Voltar ao Painel
                  </button>
                </div>
                <MobileTechnicianView
                  workOrders={workOrders}
                  customers={customers}
                  technicians={technicians}
                  services={services}
                  settings={settings}
                  onRefresh={fetchData}
                  onOpenWhatsApp={handleOpenWhatsApp}
                  onExitMobileMode={() => setActivePage('dashboard')}
                />
              </div>
            )}
    </>
  );

  const modals = (
    <>
      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        customers={customers}
        workOrders={workOrders}
        quotes={quotes}
        services={services}
        onSelectWorkOrder={handleSelectWorkOrder}
        onSelectCustomer={() => setActivePage('customers')}
        onSelectQuote={() => setActivePage('quotes')}
        onSelectService={() => setActivePage('services')}
      />

      {/* Print Document / PDF Modal */}
      {printDoc && (
        <PrintDocumentModal
          isOpen={Boolean(printDoc)}
          onClose={() => setPrintDoc(null)}
          type={printDoc.type}
          workOrder={printDoc.workOrder}
          quote={printDoc.quote}
          customer={printDoc.customer}
          technician={printDoc.technician}
          services={services}
          settings={settings}
        />
      )}

      {/* WhatsApp Pre-Formatted Templates Modal */}
      {whatsAppModalData?.isOpen && settings && (
        <WhatsAppModal
          isOpen={whatsAppModalData.isOpen}
          onClose={() => setWhatsAppModalData(null)}
          defaultPhone={whatsAppModalData.phone}
          defaultRecipientName={whatsAppModalData.recipientName}
          workOrder={whatsAppModalData.workOrder}
          quote={whatsAppModalData.quote}
          customer={whatsAppModalData.customer}
          technicians={technicians}
          settings={settings}
        />
      )}
    </>
  );

  // 1. Employee Mobile-First Layout (App Experience with Desktop 430px Simulator Frame)
  if (isEmployee) {
    return (
      <EmployeeAppLayout
        user={user}
        activePage={activePage}
        onSelectPage={(page) => {
          setSelectedWOFromExternal(null);
          setActivePage(page);
        }}
        onOpenNewWorkOrder={() => {
          setSelectedWOFromExternal(null);
          setOpenCreateModalForWO(true);
          setActivePage('work-orders');
        }}
        onLogout={logout}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setActivePage('notifications')}
        modals={modals}
      >
        {pageContent}
      </EmployeeAppLayout>
    );
  }

  // 2. Admin / Manager Layout (Traditional Fully Responsive Web Layout with Sidebar)
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPage={activePage}
        onSelectPage={(page) => {
          setSelectedWOFromExternal(null);
          setActivePage(page);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activeWorkOrdersCount={pendingWOsCount}
        pendingQuotesCount={pendingQuotesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Content Area: Ocupa toda a tela sem indentação fixa quando o menu fecha */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          title={pageTitle}
          breadcrumb={['CR Serviços Gerais', pageTitle]}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenGlobalSearch={() => setSearchModalOpen(true)}
          onQuickAction={(action) => {
            if (action === 'new-os') {
              setSelectedWOFromExternal(null);
              setOpenCreateModalForWO(true);
              setActivePage('work-orders');
            } else if (action === 'new-quote') {
              setActivePage('quotes');
            } else if (action === 'new-customer') {
              setActivePage('customers');
            }
          }}
          notifications={notifications}
          onMarkNotificationRead={async (id) => {
            await api.markNotificationRead(id);
            fetchData();
          }}
          onNavigatePage={(p) => setActivePage(p)}
          customers={customers}
          workOrders={workOrders}
          quotes={quotes}
          services={services}
          onSelectWorkOrder={handleSelectWorkOrder}
          onSelectCustomer={() => setActivePage('customers')}
          onSelectQuote={() => setActivePage('quotes')}
          onSelectService={() => setActivePage('services')}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar pb-24 lg:pb-12">
          <div className="max-w-7xl mx-auto">
            {pageContent}
          </div>
        </main>

        {/* Barra de Navegação Inferior Fixa para Administrador / Gestor no Mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-40 flex items-center justify-between shadow-lg select-none">
          {/* 1. Início */}
          <button
            type="button"
            onClick={() => {
              setSelectedWOFromExternal(null);
              setActivePage('dashboard');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'dashboard'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activePage === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Início</span>
          </button>

          {/* 2. Ordens */}
          <button
            type="button"
            onClick={() => {
              setSelectedWOFromExternal(null);
              setActivePage('work-orders');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              activePage === 'work-orders'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <ClipboardList className={`w-5 h-5 ${activePage === 'work-orders' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {pendingWOsCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 min-w-[14px] text-[9px] font-black bg-rose-500 text-white rounded-full text-center">
                  {pendingWOsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Ordens</span>
          </button>

          {/* 3. BOTÃO NO MEIO: Bola azul com (+) para Lançar Nova OS */}
          <div className="flex-1 flex items-center justify-center relative">
            <span className="absolute -top-6 w-13 h-13 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
            <button
              type="button"
              onClick={() => {
                setSelectedWOFromExternal(null);
                setOpenCreateModalForWO(true);
                setActivePage('work-orders');
              }}
              className="absolute -top-6 w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white shadow-xl shadow-blue-600/40 border-3 border-white flex items-center justify-center cursor-pointer transition-transform z-10"
              title="Lançar Nova Ordem de Serviço"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
            <div className="h-6" />
          </div>

          {/* 4. Serviços (Catálogo de Serviços) */}
          <button
            type="button"
            onClick={() => {
              setSelectedWOFromExternal(null);
              setActivePage('services');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activePage === 'services'
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Wrench className={`w-5 h-5 ${activePage === 'services' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Serviços</span>
          </button>

          {/* 5. Menu Completo (Todas as opções da Central: Clientes, Financeiro, etc.) */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              mobileSidebarOpen
                ? 'text-blue-600 font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
            title="Abrir menu de opções"
          >
            <Menu className="w-5 h-5 stroke-2" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
          </button>
        </nav>
      </div>

      {modals}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
