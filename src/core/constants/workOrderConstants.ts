import { WorkOrderStatus, OrderPriority, DispatchStatus } from '../../types';

export interface StatusStyleConfig {
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColorClass: string;
}

export const WORK_ORDER_STATUS_CONFIG: Record<WorkOrderStatus, StatusStyleConfig> = {
  ABERTA: {
    label: 'Aberta / Pendente',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
    dotColorClass: 'bg-amber-500',
  },
  AGENDADA: {
    label: 'Agendada',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    dotColorClass: 'bg-blue-500',
  },
  EM_DESLOCAMENTO: {
    label: 'Em Deslocamento',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-800',
    borderClass: 'border-cyan-300',
    dotColorClass: 'bg-cyan-500',
  },
  EM_ATENDIMENTO: {
    label: 'Em Atendimento',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
    dotColorClass: 'bg-indigo-600',
  },
  AGUARDANDO: {
    label: 'Aguardando / Peça',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-300',
    dotColorClass: 'bg-purple-500',
  },
  CONCLUIDA: {
    label: 'Concluída / Paga',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    dotColorClass: 'bg-emerald-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300',
    dotColorClass: 'bg-slate-400',
  },
};

export const ORDER_PRIORITY_CONFIG: Record<OrderPriority, { label: string; badgeClass: string; color: string }> = {
  BAIXA: {
    label: 'Baixa',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    color: '#64748b',
  },
  MEDIA: {
    label: 'Média',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    color: '#3b82f6',
  },
  ALTA: {
    label: 'Alta',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    color: '#f59e0b',
  },
  URGENTE: {
    label: 'Urgente / Emergência',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse',
    color: '#ef4444',
  },
};

export const DISPATCH_STATUS_CONFIG: Record<DispatchStatus, { label: string; badgeClass: string }> = {
  PENDING_ACK: {
    label: 'Aguardando Confirmação',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  ACCEPTED_EN_ROUTE: {
    label: 'Aceito / Em Deslocamento',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
  },
  ACCEPTED_IN_PROGRESS: {
    label: 'Aceito / Em Atendimento',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  },
  BUSY: {
    label: 'Técnico Ocupado',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
  },
  OTHER_SERVICE: {
    label: 'Em Outro Atendimento',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export function getWorkOrderStatusStyle(status?: string): StatusStyleConfig {
  if (!status) return WORK_ORDER_STATUS_CONFIG.ABERTA;
  const s = status as WorkOrderStatus;
  return WORK_ORDER_STATUS_CONFIG[s] || WORK_ORDER_STATUS_CONFIG.ABERTA;
}

