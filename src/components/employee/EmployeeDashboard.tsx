import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  MessageSquare,
  Plus,
  Calendar,
  Shield,
  ArrowRight,
  MapPin,
  Sparkles,
  Check,
  User,
  DollarSign,
  Wrench,
  Volume2,
  VolumeX,
  Bell,
  AlertTriangle,
  Radio,
  Car,
  CheckCircle2,
  PauseCircle,
  HelpCircle,
  Phone
} from 'lucide-react';
import {
  Customer,
  CustomerLocation,
  ServiceItem,
  WorkOrder,
  Technician,
  DispatchStatus,
  WorkOrderStatus,
  PaymentMethod
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { dispatchAudio } from '../../utils/dispatchAudio';
import { api } from '../../lib/api';
import { AddressGpsLinks } from '../common/AddressGpsLinks';
import { SpontaneousWorkOrderModal } from '../technician/SpontaneousWorkOrderModal';

interface EmployeeDashboardProps {
  customers: Customer[];
  locations: CustomerLocation[];
  services: ServiceItem[];
  workOrders: WorkOrder[];
  technicians: Technician[];
  onRefresh: () => void;
  onNavigatePage: (page: any) => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onOpenNewWorkOrder: () => void;
  onOpenNewCustomer?: () => void;
  onOpenNewLocation?: () => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  customers,
  services = [],
  workOrders,
  technicians,
  onRefresh,
  onNavigatePage,
  onSelectWorkOrder,
  onOpenNewWorkOrder,
  onOpenWhatsApp
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isHandlingDispatch, setIsHandlingDispatch] = useState(false);

  // Modal para lançamento avulso (Fim do Caderno)
  const [spontaneousModalOpen, setSpontaneousModalOpen] = useState(false);

  // Modal de edição de valor da OS pelo técnico
  const [editingPriceWO, setEditingPriceWO] = useState<WorkOrder | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editPriceReason, setEditPriceReason] = useState('');
  const [editPricePaymentMethod, setEditPricePaymentMethod] = useState<PaymentMethod>('PIX');
  const [savingPrice, setSavingPrice] = useState(false);

  // Identifica o técnico correspondente ao usuário logado
  const currentTech = technicians.find(
    (t) =>
      t.id === user?.id ||
      t.id === `tech-${user?.id}` ||
      (user?.name && t.name.toLowerCase().includes(user.name.toLowerCase())) ||
      (user?.name && user.name.toLowerCase().includes(t.name.toLowerCase()))
  );

  // Filtra ordens de serviço pendentes de confirmação do funcionário
  const pendingDispatchOrders = workOrders.filter((wo) => {
    if (wo.dispatchStatus !== 'PENDING_ACK') return false;
    // Se está atribuída ao técnico deste usuário, ou se este é o único funcionário na base
    if (currentTech && wo.technicianId === currentTech.id) return true;
    if (wo.technicianId === user?.id || wo.technicianId === `tech-${user?.id}`) return true;
    const techOfWo = technicians.find((t) => t.id === wo.technicianId);
    if (techOfWo && user?.name && techOfWo.name.toLowerCase().includes(user.name.toLowerCase())) return true;
    if (!wo.technicianId) return true;
    return false;
  });

  const activeDispatch = pendingDispatchOrders[0] || null;
  const dispatchCustomer = activeDispatch ? customers.find((c) => c.id === activeDispatch.customerId) : null;

  // Controle de Som do Chamado: Repete o alarme sonoro até resposta do funcionário
  useEffect(() => {
    if (activeDispatch) {
      if (!isAudioMuted) {
        dispatchAudio.startAlert();
      }
    } else {
      dispatchAudio.stopAlert();
    }
    return () => {
      dispatchAudio.stopAlert();
    };
  }, [activeDispatch, isAudioMuted]);

  const toggleSound = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      dispatchAudio.setMuted(false);
      if (activeDispatch) dispatchAudio.startAlert();
    } else {
      setIsAudioMuted(true);
      dispatchAudio.setMuted(true);
      dispatchAudio.stopAlert();
    }
  };

  // Trata a resposta do funcionário para o chamado
  const handleAcknowledgeDispatch = async (
    action: 'EN_ROUTE' | 'IN_PROGRESS' | 'BUSY' | 'OTHER_SERVICE'
  ) => {
    if (!activeDispatch) return;
    setIsHandlingDispatch(true);
    dispatchAudio.stopAlert();

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const employeeName = user?.name || 'Funcionário';

    let newStatus: WorkOrderStatus = activeDispatch.status;
    let newDispatchStatus: DispatchStatus = 'ACCEPTED_EN_ROUTE';
    let timelineTitle = 'Chamado Aceito';
    let timelineDesc = `${employeeName} aceitou o chamado e está a caminho do local.`;
    let toastMsg = 'Você aceitou o chamado e está a caminho do local!';

    if (action === 'EN_ROUTE') {
      newStatus = 'EM_DESLOCAMENTO';
      newDispatchStatus = 'ACCEPTED_EN_ROUTE';
      timelineTitle = 'A Caminho do Serviço';
      timelineDesc = `${employeeName} aceitou o chamado e iniciou deslocamento para o local.`;
      toastMsg = 'Chamado aceito! Bom deslocamento.';
    } else if (action === 'IN_PROGRESS') {
      newStatus = 'EM_ATENDIMENTO';
      newDispatchStatus = 'ACCEPTED_IN_PROGRESS';
      timelineTitle = 'Atendimento Iniciado';
      timelineDesc = `${employeeName} aceitou o chamado e já iniciou atendimento no local.`;
      toastMsg = 'Chamado aceito! Atendimento iniciado.';
    } else if (action === 'BUSY') {
      newDispatchStatus = 'BUSY';
      timelineTitle = 'Técnico Ocupado';
      timelineDesc = `${employeeName} sinalizou que está ocupado no momento.`;
      toastMsg = 'Status registrado: Ocupado no momento.';
    } else if (action === 'OTHER_SERVICE') {
      newDispatchStatus = 'OTHER_SERVICE';
      timelineTitle = 'Em Outro Atendimento';
      timelineDesc = `${employeeName} sinalizou que já está atendendo outro chamado ativo.`;
      toastMsg = 'Status registrado: Já em outro atendimento.';
    }

    try {
      const updatedTimeline = [
        ...(activeDispatch.timeline || []),
        {
          time: nowTime,
          title: timelineTitle,
          description: timelineDesc,
          userName: employeeName,
        },
      ];

      await api.updateWorkOrder(activeDispatch.id, {
        status: newStatus,
        dispatchStatus: newDispatchStatus,
        dispatchNote: timelineDesc,
        dispatchAcknowledgedAt: new Date().toISOString(),
        timeline: updatedTimeline,
      });

      showToast('Resposta Enviada!', toastMsg, 'success');
      onRefresh();

      // Quando o técnico aceita o chamado (A caminho), abre o WhatsApp apontando para a Administração
      if (action === 'EN_ROUTE') {
        const cust = customers.find((c) => c.id === activeDispatch.customerId);
        const adminCompanyPhone = '5554996224098'; // Número oficial da Administração
        const clientName = cust?.name || 'Cliente';
        const msg = `Chamado Aceito - OS ${activeDispatch.code} - ${clientName}`;
        window.open(`https://wa.me/${adminCompanyPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err: any) {
      showToast('Erro ao atualizar chamado', err.message || 'Tente novamente', 'error');
    } finally {
      setIsHandlingDispatch(false);
    }
  };

  // Traçar rota acionando a API de Geolocalização do dispositivo (navigator.geolocation)
  const handleOpenGpsRoute = (destinationAddress: string) => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
          const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;
          window.open(routeUrl, '_blank');
        },
        (err) => {
          console.warn('Localização GPS não obtida, abrindo rota padrão:', err);
          const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;
          window.open(routeUrl, '_blank');
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;
      window.open(routeUrl, '_blank');
    }
  };

  // Aceitar chamado diretamente do card com WhatsApp para Administração
  const handleAcceptOrderAndOpenRoute = async (wo: WorkOrder) => {
    try {
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const employeeName = user?.name || 'Funcionário';
      const cust = customers.find((c) => c.id === wo.customerId);

      const updatedTimeline = [
        ...(wo.timeline || []),
        {
          time: nowTime,
          title: 'Chamado Aceito',
          description: `${employeeName} aceitou o chamado e iniciou deslocamento para o local.`,
          userName: employeeName,
        },
      ];

      await api.updateWorkOrder(wo.id, {
        status: 'EM_DESLOCAMENTO',
        dispatchStatus: 'ACCEPTED_EN_ROUTE',
        dispatchNote: `${employeeName} aceitou o chamado e iniciou deslocamento.`,
        dispatchAcknowledgedAt: new Date().toISOString(),
        timeline: updatedTimeline,
      });

      showToast('Chamado Aceito!', 'Deslocamento iniciado e aviso enviado para a Administração.', 'success');
      onRefresh();

      const adminCompanyPhone = '5554996224098'; // Número oficial da empresa
      const clientName = cust?.name || 'Cliente';
      const msg = `Chamado Aceito - OS ${wo.code} - ${clientName}`;
      window.open(`https://wa.me/${adminCompanyPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err: any) {
      showToast('Erro ao aceitar chamado', err.message || 'Tente novamente', 'error');
    }
  };

  // Simulação / Teste do Alarme Sonoro de Chamado
  const handleSimulateDispatch = async () => {
    try {
      if (workOrders.length > 0) {
        const targetWo = workOrders[0];
        await api.updateWorkOrder(targetWo.id, {
          dispatchStatus: 'PENDING_ACK',
          technicianId: currentTech?.id || user?.id || targetWo.technicianId,
        });
        showToast('Chamado Despachado!', 'Alarme sonoro acionado no seu painel.', 'info');
        onRefresh();
      } else {
        const newTest = await api.createWorkOrder({
          customerId: customers[0]?.id || '',
          scheduledDate: todayStr,
          scheduledTime: '14:30',
          problemDescription: 'Desentupimento de esgoto com máquina K-50 urgente',
          value: 380,
          technicianId: currentTech?.id || user?.id || '',
          dispatchStatus: 'PENDING_ACK',
          status: 'AGENDADA',
        });
        showToast('Chamado de Teste Criado!', 'Alarme sonoro ativo até confirmação.', 'info');
        onRefresh();
      }
    } catch (e: any) {
      showToast('Erro no teste', e.message, 'error');
    }
  };

  // Filtra SOMENTE as ordens de serviço DIRECIONADAS ao funcionário logado
  const isWoAssignedToMe = (wo: WorkOrder) => {
    if (!wo.technicianId) return false;
    if (currentTech && wo.technicianId === currentTech.id) return true;
    if (user?.id && (wo.technicianId === user.id || wo.technicianId === `tech-${user.id}`)) return true;
    const techOfWo = technicians.find((t) => t.id === wo.technicianId);
    if (techOfWo && user?.name) {
      const uName = user.name.toLowerCase().trim();
      const tName = techOfWo.name.toLowerCase().trim();
      if (tName.includes(uName) || uName.includes(tName)) return true;
    }
    return false;
  };

  const myAssignedOrders = React.useMemo(() => {
    return workOrders.filter(isWoAssignedToMe);
  }, [workOrders, currentTech, user, technicians]);

  // Ordens de hoje direcionadas ao funcionário logado
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayOrders = myAssignedOrders.filter(
    (wo) =>
      wo.scheduledDate === todayStr ||
      wo.status === 'AGENDADA' ||
      wo.status === 'EM_ATENDIMENTO' ||
      wo.status === 'EM_DESLOCAMENTO'
  );

  const myInFieldOrders = myAssignedOrders.filter(
    (wo) => wo.status === 'EM_ATENDIMENTO' || wo.status === 'EM_DESLOCAMENTO'
  );

  return (
    <div className="space-y-4 w-full">
      {/* ALERTA URGENTE: Novo Chamado Despachado pelo Administrador com Som Contínuo */}
      {activeDispatch && (
        <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-amber-700 rounded-3xl p-5 text-white shadow-2xl border-2 border-rose-300 ring-4 ring-rose-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Header do Alerta com Som */}
          <div className="flex items-start justify-between gap-2 border-b border-rose-400/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-5 h-5 text-amber-200 fill-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
                    URGENTE • NOVO CHAMADO
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-200">{activeDispatch.code}</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                  Serviço Encaminhado para Você!
                </h3>
              </div>
            </div>

            {/* Controle de Silenciar Som */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-900/60 text-rose-200 hover:bg-rose-900'
                  : 'bg-white text-rose-700 shadow-md hover:bg-rose-50 animate-pulse'
              }`}
              title={isAudioMuted ? 'Ativar som do alarme' : 'Silenciar som do alarme'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-600" />}
              <span className="hidden sm:inline">{isAudioMuted ? 'Mudo' : 'Tocando'}</span>
            </button>
          </div>

          {/* Dados do Chamado */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3.5 space-y-2 border border-white/10 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-white text-sm flex items-center gap-1.5 truncate">
                <User className="w-4 h-4 text-amber-300 shrink-0" />
                {dispatchCustomer?.name || 'Cliente'}
              </span>
              <span className="font-extrabold text-emerald-300 font-mono text-sm shrink-0">
                R$ {Number(activeDispatch.value).toFixed(2)}
              </span>
            </div>

            <div className="pt-0.5">
              <AddressGpsLinks
                address={
                  activeDispatch.locationAddress ||
                  (dispatchCustomer?.street
                    ? `${dispatchCustomer.street}, ${dispatchCustomer.number || 'S/N'} - ${dispatchCustomer.neighborhood || ''}, ${dispatchCustomer.city || ''}`
                    : '')
                }
                className="text-white [&_a]:text-amber-200 [&_a:hover]:text-white [&_span]:text-white"
              />
            </div>

            <p className="text-amber-100 font-semibold bg-white/10 p-2.5 rounded-xl border border-white/10 line-clamp-2">
              <strong>Serviço:</strong> {activeDispatch.problemDescription || 'Atendimento Operacional'}
            </p>

            <div className="flex items-center justify-between text-[11px] text-rose-200 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-300" />
                {activeDispatch.scheduledDate} às {activeDispatch.scheduledTime}
              </span>
              <span className="text-[10px] bg-rose-900/60 px-2 py-0.5 rounded-full text-rose-200">
                Aguardando sua confirmação
              </span>
            </div>
          </div>

          {/* Instrução sonora */}
          <div className="flex items-center gap-2 text-[11px] text-rose-100 bg-rose-900/40 p-2 rounded-xl border border-rose-400/30">
            <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            <span>O alarme sonoro toca continuamente até você selecionar uma das opções abaixo:</span>
          </div>

          {/* 4 BOTÕES DE RESPOSTA DO FUNCIONÁRIO */}
          <div className="space-y-2 pt-1">
            {/* Opção 1: Aceitar e Deslocar (Destaque Principal) */}
            <button
              type="button"
              disabled={isHandlingDispatch}
              onClick={() => handleAcknowledgeDispatch('EN_ROUTE')}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-200"
            >
              <Car className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Aceitar e Estou a Caminho do Serviço</span>
            </button>

            {/* Opção 2: Aceitar no Local */}
            <button
              type="button"
              disabled={isHandlingDispatch}
              onClick={() => handleAcknowledgeDispatch('IN_PROGRESS')}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400"
            >
              <Wrench className="w-4 h-4 stroke-[2.5]" />
              <span>Já no Local / Iniciar Atendimento Agora</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Opção 3: Ocupado */}
              <button
                type="button"
                disabled={isHandlingDispatch}
                onClick={() => handleAcknowledgeDispatch('BUSY')}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-100 font-bold text-xs border border-rose-400/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Ocupado no Momento</span>
              </button>

              {/* Opção 4: Em outro atendimento */}
              <button
                type="button"
                disabled={isHandlingDispatch}
                onClick={() => handleAcknowledgeDispatch('OTHER_SERVICE')}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-100 font-bold text-xs border border-rose-400/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Em Outro Serviço</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Employee Welcome Header (Somente Olá e Nome do Funcionário Conforme Solicitado) */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
          Olá, {user?.name || 'Funcionário'}!
        </h2>
      </div>

      {/* 3. METRICS: Compact & Mobile-First (Direcionadas ao Funcionário) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Metric 1: Minhas OS */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Minhas OS
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
              {String(myTodayOrders.length).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-semibold text-blue-600">para você</span>
          </div>
        </div>

        {/* Metric 2: Em Atendimento no Campo */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Em Campo
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight tabular-nums">
              {String(myInFieldOrders.length).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-semibold text-amber-700">ativas suas</span>
          </div>
        </div>
      </div>

      {/* 4. WORK ORDERS LIST: Somente Ordens Direcionadas ao Funcionário */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Minhas Ordens Atribuídas
            </h3>
            <p className="text-[11px] text-slate-500">
              Serviços direcionados exclusivamente para você
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigatePage('work-orders')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-blue-50 transition-colors"
            title="Ver minhas ordens de serviço atribuídas"
          >
            <span>Minhas Ordens de Serviço</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myAssignedOrders.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Nenhuma OS direcionada a você no momento</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Todas as ordens em execução na empresa podem ser acompanhadas na aba <strong>Ordens</strong>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => onNavigatePage('work-orders')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Ver Todas as Ordens do Dia
              </button>
              <button
                type="button"
                onClick={onOpenNewWorkOrder}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                + Lançar Nova OS
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {myAssignedOrders.map((wo) => {
              const customer = customers.find((c) => c.id === wo.customerId);
              const tech = technicians.find((t) => t.id === wo.technicianId);

              const statusColor =
                wo.status === 'EM_ATENDIMENTO'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : wo.status === 'EM_DESLOCAMENTO'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : wo.status === 'CONCLUIDA'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={wo.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                >
                  {/* Card Header: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-blue-700 tracking-tight">
                      {wo.code}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {wo.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer & Location com GPS Deep Links */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{customer?.name || 'Cliente'}</span>
                    </p>
                    <div className="pt-0.5">
                      <AddressGpsLinks
                        address={
                          wo.locationAddress ||
                          (customer?.street
                            ? `${customer.street}, ${customer.number || 'S/N'} - ${customer.neighborhood || ''}, ${customer.city || ''}`
                            : '')
                        }
                      />
                    </div>
                  </div>

                  {/* Problem Description */}
                  {wo.problemDescription && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      {wo.problemDescription}
                    </p>
                  )}

                  {/* Meta: Schedule Date & Value com botão de Ajustar Valor pelo Técnico */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wo.scheduledDate}</span>
                      <span className="text-slate-300">•</span>
                      <span>{wo.scheduledTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 font-extrabold text-slate-900 tracking-tight tabular-nums">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>R$ {Number(wo.value).toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriceWO(wo);
                          setEditPriceValue(String(wo.value || ''));
                          setEditPriceReason(wo.customPriceReason || '');
                          setEditPricePaymentMethod(wo.paymentMethod || 'PIX');
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                        title="Ajustar valor final cobrado (cobrança por metro, upsell)"
                      >
                        Ajustar Valor
                      </button>
                    </div>
                  </div>

                  {/* Botão de Aceitar Chamado & Abrir Rota no Maps para ordens agendadas / despachadas */}
                  {(wo.status === 'AGENDADA' || wo.dispatchStatus === 'PENDING_ACK') && (
                    <button
                      type="button"
                      onClick={() => handleAcceptOrderAndOpenRoute(wo)}
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                      <span>Aceitar e estou a caminho do Serviço</span>
                    </button>
                  )}

                  {/* Touch-Friendly Action Buttons (Min height 48px) */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectWorkOrder(wo)}
                      className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 shrink-0" />
                      <span className="truncate">Ver Detalhes</span>
                    </button>

                    {/* Botão Direto da Rota no Google Maps com Geolocalização do Técnico */}
                    <button
                      type="button"
                      onClick={() => {
                        const addr =
                          wo.locationAddress ||
                          (customer?.street
                            ? `${customer.street}, ${customer.number || 'S/N'} - ${customer.neighborhood || ''}, ${customer.city || 'Caxias do Sul'}`
                            : 'Caxias do Sul');
                        handleOpenGpsRoute(addr);
                      }}
                      className="min-h-[46px] px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Traçar rota no Google Maps a partir da sua localização atual"
                    >
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Rota</span>
                    </button>

                    {onOpenWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp({ customer, workOrder: wo })}
                        className="w-11 min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.95] text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                        title="Enviar no WhatsApp com Link do Maps"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Lançamento Avulso pelo Técnico (Fim do Caderno) */}
      <SpontaneousWorkOrderModal
        isOpen={spontaneousModalOpen}
        onClose={() => setSpontaneousModalOpen(false)}
        technician={currentTech || null}
        technicianName={user?.name || currentTech?.name || 'Técnico Operacional'}
        customers={customers}
        services={services}
        onCreatedSuccess={() => {
          onRefresh();
          showToast('Serviço gravado!', 'O lançamento avulso foi adicionado à lista e ao faturamento.', 'success');
        }}
      />

      {/* Modal Rápido de Edição de Valor da OS pelo Técnico */}
      {editingPriceWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-5 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Ajustar Valor Final da OS
                  </h3>
                  <span className="text-xs text-blue-700 font-mono font-bold">
                    {editingPriceWO.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPriceWO(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Altere o valor deste atendimento caso tenha realizado cobrança por metragem adicional, troca de peça ou serviço extra no local. O dashboard financeiro atualizará automaticamente em tempo real.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const num = parseFloat(editPriceValue.replace(',', '.')) || 0;
                if (num <= 0) {
                  showToast('Valor inválido', 'Informe um valor maior que zero.', 'error');
                  return;
                }
                try {
                  setSavingPrice(true);
                  await api.updateWorkOrder(editingPriceWO.id, {
                    value: num,
                    paymentMethod: editPricePaymentMethod,
                    customPriceReason: editPriceReason.trim() || 'Preço reajustado em campo pelo técnico (metragem/upsell)',
                  });
                  showToast('Valor e Pagamento Atualizados!', `Novo valor: R$ ${num.toFixed(2)} (${editPricePaymentMethod}). Sincronizado com o financeiro.`, 'success');
                  setEditingPriceWO(null);
                  onRefresh();
                } catch (err: any) {
                  showToast('Erro ao atualizar', err.message, 'error');
                } finally {
                  setSavingPrice(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Valor Total (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editPriceValue}
                    onChange={(e) => setEditPriceValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Forma de Pagamento Negociada no Local:
                </label>
                <select
                  value={editPricePaymentMethod}
                  onChange={(e) => setEditPricePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="PIX">PIX (Chave ou QR Code)</option>
                  <option value="DINHEIRO">Dinheiro em Espécie</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito (Maquininha)</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito (Maquininha)</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="FATURADO">Faturado / Convênio Empresa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo do Reajuste (Metragem / Upsell):
                </label>
                <input
                  type="text"
                  value={editPriceReason}
                  onChange={(e) => setEditPriceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Cobrança de 5 metros adicionais com máquina K-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceWO(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer"
                >
                  {savingPrice ? 'Salvando...' : 'Salvar Novo Valor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
