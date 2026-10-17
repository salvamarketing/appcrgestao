import { 
  Customer, 
  CustomerLocation,
  ServiceItem, 
  Quote, 
  WorkOrder, 
  Technician, 
  FinancialTransaction, 
  CompanySettings, 
  NotificationItem,
  User,
  UserRole,
  WorkOrderStatus,
  WorkOrderReport,
  AuditLog
} from '../types';
import { offlineManager } from './offlineManager';

const BASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) 
  ? process.env.VITE_API_URL 
  : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
    ? import.meta.env.VITE_API_URL 
    : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cr_auth_token') || sessionStorage.getItem('cr_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Erro na requisição';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Bulk Data Sync
  getData: async () => {
    if (offlineManager.isManualOfflineMode() && !offlineManager.isNetworkOnline()) {
      const cached = offlineManager.getDatabase();
      if (cached) return cached;
    }
    try {
      const res = await request<{
        customers: Customer[];
        locations: CustomerLocation[];
        services: ServiceItem[];
        quotes: Quote[];
        workOrders: WorkOrder[];
        technicians: Technician[];
        financialTransactions: FinancialTransaction[];
        notifications: NotificationItem[];
        settings: CompanySettings;
        users: User[];
      }>('/data');
      offlineManager.saveDatabase(res);
      return res;
    } catch (err) {
      const cached = offlineManager.getDatabase();
      if (cached) {
        console.warn('Utilizando dados locais offline do dispositivo.');
        return cached;
      }
      throw err;
    }
  },

  // Auth
  login: (email: string, password: string) => 
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
    jobTitle?: string;
    phone?: string;
  }) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: User }>('/auth/me'),

  // Dashboard
  getDashboardSummary: async () => {
    if (offlineManager.isManualOfflineMode() && !offlineManager.isNetworkOnline()) {
      const db = offlineManager.getDatabase();
      if (db) {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = (db.workOrders || []).filter((w: any) => w.scheduledDate === today);
        const inProgress = (db.workOrders || []).filter((w: any) => w.status === 'EM_ATENDIMENTO' || w.status === 'EM_DESLOCAMENTO');
        const pendingQuotes = (db.quotes || []).filter((q: any) => q.status === 'pending' || q.status === 'PENDENTE');
        return {
          todayOrdersCount: todayOrders.length,
          inProgressCount: inProgress.length,
          pendingQuotesCount: pendingQuotes.length,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyPending: 0,
          monthlyBalance: 0,
          todayOrders: todayOrders.slice(0, 10),
          technicians: db.technicians || [],
          notifications: db.notifications || []
        };
      }
    }
    try {
      return await request<{
        todayOrdersCount: number;
        inProgressCount: number;
        pendingQuotesCount: number;
        monthlyRevenue: number;
        monthlyExpenses: number;
        monthlyPending: number;
        monthlyBalance: number;
        todayOrders: WorkOrder[];
        technicians: Technician[];
        notifications: NotificationItem[];
      }>('/dashboard/summary');
    } catch (err) {
      const db = offlineManager.getDatabase();
      if (db) {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = (db.workOrders || []).filter((w: any) => w.scheduledDate === today);
        const inProgress = (db.workOrders || []).filter((w: any) => w.status === 'EM_ATENDIMENTO' || w.status === 'EM_DESLOCAMENTO');
        const pendingQuotes = (db.quotes || []).filter((q: any) => q.status === 'pending' || q.status === 'PENDENTE');
        return {
          todayOrdersCount: todayOrders.length,
          inProgressCount: inProgress.length,
          pendingQuotesCount: pendingQuotes.length,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyPending: 0,
          monthlyBalance: 0,
          todayOrders: todayOrders.slice(0, 10),
          technicians: db.technicians || [],
          notifications: db.notifications || []
        };
      }
      throw err;
    }
  },

  // Customers
  getCustomers: () => request<Customer[]>('/customers'),
  getCustomerHistory: (id: string) => request<{
    customer: Customer;
    workOrders: WorkOrder[];
    quotes: Quote[];
    transactions: FinancialTransaction[];
  }>(`/customers/${id}/history`),
  createCustomer: async (customer: Partial<Customer>) => {
    if (offlineManager.isOffline()) {
      const db = offlineManager.getDatabase() || { customers: [] };
      const newCust: Customer = {
        id: `cust-off-${Date.now()}`,
        name: customer.name || 'Cliente',
        type: customer.type || 'residencial',
        cpfCnpj: customer.cpfCnpj || '',
        phone: customer.phone || '',
        whatsapp: customer.whatsapp || customer.phone || '',
        email: customer.email || '',
        cep: customer.cep || '95000-000',
        state: customer.state || 'RS',
        city: customer.city || 'Caxias do Sul',
        neighborhood: customer.neighborhood || 'Centro',
        street: customer.street || '',
        number: customer.number || '',
        complement: customer.complement || '',
        notes: customer.notes || '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...customer
      } as Customer;
      db.customers = [newCust, ...(db.customers || [])];
      offlineManager.saveDatabase(db);
      offlineManager.queueAction('CREATE_CUSTOMER', newCust);
      return newCust;
    }
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },
  updateCustomer: (id: string, customer: Partial<Customer>) => 
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    }),
  deleteCustomer: (id: string) => 
    request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' }),

  // Customer Locations (Locais de Atendimento)
  getLocations: (customerId?: string) => 
    request<CustomerLocation[]>(customerId ? `/locations?customerId=${customerId}` : '/locations'),
  createLocation: (location: Partial<CustomerLocation>) => 
    request<CustomerLocation>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    }),
  updateLocation: (id: string, location: Partial<CustomerLocation>) => 
    request<CustomerLocation>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(location),
    }),
  deleteLocation: (id: string) => 
    request<{ success: boolean }>(`/locations/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => request<ServiceItem[]>('/services'),
  createService: async (service: Partial<ServiceItem>) => {
    if (offlineManager.isOffline()) {
      const db = offlineManager.getDatabase() || { services: [] };
      const newServ: ServiceItem = {
        id: `serv-off-${Date.now()}`,
        name: service.name || 'Novo Serviço',
        category: service.category || 'Geral',
        description: service.description || '',
        price: Number(service.price) || 250,
        estimatedDuration: service.estimatedDuration || '1h',
        active: service.active ?? true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...service,
      } as ServiceItem;
      db.services = [newServ, ...(db.services || [])];
      offlineManager.saveDatabase(db);
      offlineManager.queueAction('CREATE_SERVICE', newServ);
      return newServ;
    }
    return request<ServiceItem>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  },
  updateService: (id: string, service: Partial<ServiceItem>) => 
    request<ServiceItem>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    }),
  deleteService: (id: string) => 
    request<{ success: boolean }>(`/services/${id}`, { method: 'DELETE' }),

  // Quotes
  getQuotes: () => request<Quote[]>('/quotes'),
  createQuote: (quote: Partial<Quote>) => 
    request<Quote>('/quotes', {
      method: 'POST',
      body: JSON.stringify(quote),
    }),
  updateQuote: (id: string, quote: Partial<Quote>) => 
    request<Quote>(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quote),
    }),
  updateQuoteStatus: (id: string, status: any) =>
    request<Quote>(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  convertQuoteToWorkOrder: (id: string, userName?: string) =>
    request<{ success: boolean; workOrder: WorkOrder; quote: Quote }>(`/quotes/${id}/convert-to-os`, {
      method: 'POST',
      body: JSON.stringify({ userName }),
    }),
  convertToWorkOrder: (id: string, payload: {
    technicianId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    paymentMethod?: string;
    userName?: string;
  }) => 
    request<{ success: boolean; workOrder: WorkOrder; quote: Quote }>(`/quotes/${id}/convert-to-os`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteQuote: (id: string) => 
    request<{ success: boolean }>(`/quotes/${id}`, { method: 'DELETE' }),

  // Work Orders
  getWorkOrders: () => request<WorkOrder[]>('/work-orders'),
  getWorkOrder: (id: string) => request<WorkOrder>(`/work-orders/${id}`),
  createWorkOrder: async (wo: Partial<WorkOrder>) => {
    if (offlineManager.isOffline()) {
      const db = offlineManager.getDatabase() || { workOrders: [] };
      const newWO: WorkOrder = {
        id: `wo-off-${Date.now()}`,
        code: `OS-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        status: wo.status || 'AGENDADA',
        customerId: wo.customerId || '',
        locationId: wo.locationId || '',
        locationAddress: wo.locationAddress || '',
        serviceIds: wo.serviceIds || [],
        technicianId: wo.technicianId || '',
        scheduledDate: wo.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: wo.scheduledTime || '09:00',
        problemDescription: wo.problemDescription || '',
        value: wo.value || 0,
        paymentMethod: wo.paymentMethod || 'PIX',
        paymentStatus: wo.paymentStatus || 'pending',
        notes: wo.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...wo
      } as WorkOrder;
      db.workOrders = [newWO, ...(db.workOrders || [])];
      offlineManager.saveDatabase(db);
      offlineManager.queueAction('CREATE_WORK_ORDER', newWO);
      return newWO;
    }
    return request<WorkOrder>('/work-orders', {
      method: 'POST',
      body: JSON.stringify(wo),
    });
  },
  syncOfflineQueue: async () => {
    const queue = offlineManager.getQueue();
    if (queue.length === 0) return { synced: 0 };
    let successCount = 0;
    for (const item of queue) {
      try {
        if (item.type === 'CREATE_WORK_ORDER') {
          const { id: _, ...payload } = item.payload;
          await request('/work-orders', { method: 'POST', body: JSON.stringify(payload) });
          successCount++;
        }
      } catch (err) {
        console.warn('Erro ao sincronizar item offline:', err);
      }
    }
    offlineManager.clearQueue();
    return { synced: successCount };
  },
  updateWorkOrder: (id: string, wo: Partial<WorkOrder>) => 
    request<WorkOrder>(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wo),
    }),
  updateWorkOrderStatus: (id: string, payload: {
    status: WorkOrderStatus;
    note?: string;
    userName?: string;
    paymentReceived?: boolean;
    paymentMethod?: string;
  }) => 
    request<WorkOrder>(`/work-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateWorkOrderReport: (id: string, report: Partial<WorkOrderReport>) => 
    request<WorkOrder>(`/work-orders/${id}/report`, {
      method: 'PUT',
      body: JSON.stringify(report),
    }),
  deleteWorkOrder: (id: string) => 
    request<{ success: boolean }>(`/work-orders/${id}`, { method: 'DELETE' }),
  analyzeWorkOrderPhotos: (payload: {
    photoBefore?: string;
    photoAfter?: string;
    problemDescription?: string;
    serviceName?: string;
    clientName?: string;
  }) =>
    request<{ laudo: string }>('/ai/analyze-work-order-photos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Technicians & Team
  getTechnicians: () => request<Technician[]>('/technicians'),
  createTechnician: (tech: Partial<Technician>) => 
    request<Technician>('/technicians', {
      method: 'POST',
      body: JSON.stringify(tech),
    }),
  updateTechnician: (id: string, tech: Partial<Technician>) => 
    request<Technician>(`/technicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tech),
    }),
  deleteTechnician: (id: string) =>
    request<{ success: boolean }>(`/technicians/${id}`, { method: 'DELETE' }),

  // Financial
  getFinancialOverview: (month?: string) => 
    request<{
      month: string;
      grossRevenue: number;
      totalExpenses: number;
      pendingReceivables: number;
      netBalance: number;
      transactions: FinancialTransaction[];
      dailyChart: Array<{ date: string; day: string; revenue: number; expense: number; balance: number }>;
    }>(`/financial/overview?month=${month || ''}`),
  getTransactions: () => request<FinancialTransaction[]>('/financial/transactions'),
  createExpense: (expense: Partial<FinancialTransaction>) => 
    request<FinancialTransaction>('/financial/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  createTransaction: (expense: Partial<FinancialTransaction>) => 
    request<FinancialTransaction>('/financial/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  deleteTransaction: (id: string) => 
    request<{ success: boolean }>(`/financial/transactions/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) => 
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  // Settings
  getSettings: () => request<CompanySettings>('/settings'),
  updateSettings: (settings: Partial<CompanySettings>) => 
    request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
  createAuditLog: (log: Partial<AuditLog>) =>
    request<AuditLog>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),

  // Users Management (RBAC)
  getUsers: () => request<User[]>('/users'),
  createUser: (userData: {
    name: string;
    username: string;
    password?: string;
    jobTitle?: string;
    role: UserRole;
    phone?: string;
    email?: string;
  }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id: string, userData: Partial<User>) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  resetUserPassword: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  toggleUserStatus: (id: string) =>
    request<{ success: boolean; active: boolean }>(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  // Backup & Restore & System Reset
  exportBackupUrl: () => `${BASE_URL}/backup/export`,
  restoreBackup: (data: any) =>
    request<{ success: boolean; message: string }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetSystemData: async (payload?: { userId?: string; userName?: string }) => {
    offlineManager.resetAllLocalData();
    return request<{ success: boolean; message: string }>('/system/reset', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  // Upload
  uploadFile: (data: string, filename: string) => 
    request<{ url: string; filename: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ data, filename }),
    }),
};
