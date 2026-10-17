import { WorkOrderStatus } from '../types';

export const VALID_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  ABERTA: ['AGENDADA', 'EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CANCELADA'],
  AGENDADA: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CANCELADA'],
  EM_DESLOCAMENTO: ['EM_ATENDIMENTO', 'AGUARDANDO', 'CANCELADA'],
  EM_ATENDIMENTO: ['AGUARDANDO', 'CONCLUIDA', 'CANCELADA'],
  AGUARDANDO: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [], // Estado final
  CANCELADA: ['ABERTA'], // Permitir reabertura pelo admin se necessário
};

export function canTransitionWorkOrder(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowedNextStates = VALID_WORK_ORDER_TRANSITIONS[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

export function getAvailableStatusActions(currentStatus: WorkOrderStatus): WorkOrderStatus[] {
  return VALID_WORK_ORDER_TRANSITIONS[currentStatus] || [];
}
