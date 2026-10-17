export type UserRole = 'admin' | 'manager' | 'employee' | 'technician';

export type CustomerType = 'residencial' | 'comercial' | 'condominio' | 'imobiliaria';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  phone?: string;
  avatar?: string;
  active: boolean;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  type?: CustomerType;
  cpfCnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  notes?: string;
  locations?: CustomerLocation[];
  createdAt: string;
  updatedAt?: string;
}

export type LocationType = 'residencial' | 'comercial' | 'condominio' | 'industrial' | 'outro';

export interface CustomerLocation {
  id: string;
  customerId: string;
  customerName?: string;
  name: string; // Ex: Matriz, Filial Lourdes, Apartamento 302, Depósito
  type?: LocationType;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  estimatedDuration: string;
  image?: string;
  status?: 'active' | 'inactive';
  active?: boolean;
  updatedAt?: string;
}

export interface QuoteItem {
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'PENDENTE'
  | 'APROVADO'
  | 'RECUSADO'
  | 'CONVERTIDO_OS';

export interface Quote {
  id: string;
  code: string;
  customerId: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  notes?: string;
  status: QuoteStatus;
  convertedToWorkOrderId?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type OrderPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type WorkOrderStatus =
  | 'ABERTA'
  | 'AGENDADA'
  | 'EM_DESLOCAMENTO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface WorkOrderTimelineItem {
  time: string;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
}

export interface WorkOrderReport {
  problemFound: string;
  servicePerformed: string;
  materialsUsed: string;
  technicalNotes?: string;
  beforePhotos?: string[];
  duringPhotos?: string[];
  afterPhotos?: string[];
  result: string;
  warranty: string;
  warrantyCovered?: string;
  warrantyNotCovered?: string;
  warrantyExclusionsReason?: string;
  clientSignatureName?: string;
  clientSignatureDate?: string;
  clientSigned?: boolean;
}

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'FATURADO';

export type DispatchStatus =
  | 'PENDING_ACK'
  | 'ACCEPTED_EN_ROUTE'
  | 'ACCEPTED_IN_PROGRESS'
  | 'BUSY'
  | 'OTHER_SERVICE';

export interface WorkOrder {
  id: string;
  code: string;
  customerId: string;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  serviceIds: string[];
  technicianId: string;
  scheduledDate: string;
  scheduledTime: string;
  problemDescription: string;
  notes?: string;
  photoBefore?: string;
  photoAfter?: string;
  technicalReportText?: string;
  value: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'received';
  status: WorkOrderStatus;
  dispatchStatus?: DispatchStatus;
  dispatchNote?: string;
  dispatchAcknowledgedAt?: string;
  timeline: WorkOrderTimelineItem[];
  report?: WorkOrderReport;
  isSpontaneous?: boolean;
  customPriceReason?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TechnicianStatus =
  | 'Disponível'
  | 'Em deslocamento'
  | 'Em atendimento'
  | 'Finalizado'
  | 'Indisponível'
  | 'Folga';

export interface Technician {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar?: string;
  role: string;
  vehicle?: string;
  specialties?: string[];
  status: TechnicianStatus;
  activeWorkOrderId?: string;
  activeWorkOrderCode?: string;
  completedCount: number;
}

export interface Appointment {
  id: string;
  workOrderId: string;
  workOrderCode: string;
  customerId: string;
  technicianId: string;
  date: string;
  time: string;
  serviceTitle: string;
  status: WorkOrderStatus;
  notes?: string;
}

export type TransactionType = 'RECEITA' | 'DESPESA' | 'receita' | 'despesa';

export type ExpenseType = 'fixo' | 'diario';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  expenseType?: ExpenseType; // 'fixo' (Gasto Fixo) ou 'diario' (Gasto Diário)
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'pago' | 'pendente';
  workOrderId?: string;
  workOrderCode?: string;
  receiptUrl?: string;
  createdByName?: string;
  createdAt?: string;
}

export type ExpenseCategory =
  | 'Combustível'
  | 'Materiais'
  | 'Ferramentas'
  | 'Manutenção'
  | 'Salários'
  | 'Publicidade'
  | 'Aluguel'
  | 'Outros';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  commercialName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  emergency24h: boolean;
  logoUrl: string;
  warrantyDefault: string;
  pixKey: string;
  pixKeyType?: string;
  pixQrCodeUrl?: string;
}

export type AuditAction = 
  | 'CRIACAO'
  | 'EDICAO'
  | 'STATUS_ALTERADO'
  | 'EXCLUSAO'
  | 'CONVERSAO'
  | 'PAGAMENTO'
  | 'BACKUP'
  | 'RESTAURACAO';

export type AuditEntity = 
  | 'Ordem de Serviço'
  | 'Orçamento'
  | 'Cliente'
  | 'Serviço'
  | 'Técnico'
  | 'Financeiro'
  | 'Configurações'
  | 'Sistema';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  entityCode?: string;
  description: string;
  details?: Record<string, any>;
}

export interface SystemBackupInfo {
  timestamp: string;
  version: string;
  author: string;
  counts: {
    workOrders: number;
    quotes: number;
    customers: number;
    services: number;
    technicians: number;
    transactions: number;
    auditLogs: number;
  };
}

