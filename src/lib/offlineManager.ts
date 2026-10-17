// Offline Manager for CR Serviços Gerais
// Gerencia armazenamento local, modo offline, sincronização 100% AUTOMÁTICA ao reconectar à internet.

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

const OFFLINE_DB_KEY = 'cr_offline_database';
const OFFLINE_MODE_KEY = 'cr_offline_mode_active';
const OFFLINE_QUEUE_KEY = 'cr_offline_action_queue';

class OfflineManager {
  private listeners: Array<() => void> = [];
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private offlineModeManual: boolean = false;
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Garantir limpeza definitiva de dados mock antigos em cache local do navegador
      if (localStorage.getItem('cr_data_reset_v3') !== 'true') {
        try {
          localStorage.removeItem(OFFLINE_DB_KEY);
          localStorage.removeItem(OFFLINE_QUEUE_KEY);
          localStorage.setItem(OFFLINE_MODE_KEY, 'false');
          localStorage.setItem('cr_data_reset_v3', 'true');
        } catch {
          // ignore
        }
      }

      this.offlineModeManual = localStorage.getItem(OFFLINE_MODE_KEY) === 'true';

      window.addEventListener('online', async () => {
        this.isOnlineStatus = true;
        this.notify();
        // Sincronização 100% automática ao detectar internet:
        await this.autoSync();
      });

      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
        this.notify();
      });

      // Verificação periódica suave de conexão e auto-sync
      setInterval(() => {
        if (navigator.onLine && !this.offlineModeManual && this.getQueue().length > 0) {
          this.autoSync();
        }
      }, 10000);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public isOffline(): boolean {
    return this.offlineModeManual || !this.isOnlineStatus;
  }

  public isManualOfflineMode(): boolean {
    return this.offlineModeManual;
  }

  public isNetworkOnline(): boolean {
    return this.isOnlineStatus;
  }

  public setOfflineMode(enabled: boolean): void {
    this.offlineModeManual = enabled;
    localStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
    this.notify();
    if (!enabled && this.isOnlineStatus) {
      this.autoSync();
    }
  }

  public toggleOfflineMode(): boolean {
    const next = !this.offlineModeManual;
    this.setOfflineMode(next);
    return next;
  }

  public saveDatabase(data: any): void {
    try {
      if (data && typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Erro ao salvar banco offline:', err);
    }
  }

  public getDatabase(): any | null {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(OFFLINE_DB_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Erro ao ler banco offline:', err);
    }
    return null;
  }

  public queueAction(type: string, payload: any): void {
    try {
      const queue = this.getQueue();
      queue.push({
        id: `off-act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        payload,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notify();
    } catch (err) {
      console.warn('Erro ao enfileirar ação offline:', err);
    }
  }

  public getQueue(): OfflineAction[] {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public clearQueue(): void {
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      this.notify();
    } catch {
      // ignore
    }
  }

  public clearDatabase(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(OFFLINE_DB_KEY);
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  public resetAllLocalData(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(OFFLINE_DB_KEY);
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        this.setOfflineMode(false);
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  // Sincronização automática em background sem necessidade de confirmação do operador
  public async autoSync(): Promise<number> {
    if (this.isSyncing) return 0;
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    this.isSyncing = true;
    let synced = 0;

    try {
      // Ordenar: primeiro cadastros de clientes e serviços, depois ordens de serviço
      const sortedQueue = [...queue].sort((a, b) => {
        if (a.type === 'CREATE_CUSTOMER' && b.type !== 'CREATE_CUSTOMER') return -1;
        if (a.type !== 'CREATE_CUSTOMER' && b.type === 'CREATE_CUSTOMER') return 1;
        if (a.type === 'CREATE_SERVICE' && b.type === 'CREATE_WORK_ORDER') return -1;
        if (a.type === 'CREATE_WORK_ORDER' && b.type === 'CREATE_SERVICE') return 1;
        return 0;
      });

      for (const item of sortedQueue) {
        try {
          if (item.type === 'CREATE_CUSTOMER') {
            await fetch('/api/customers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            synced++;
          } else if (item.type === 'CREATE_WORK_ORDER') {
            await fetch('/api/work-orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            synced++;
          } else if (item.type === 'CREATE_SERVICE') {
            await fetch('/api/services', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            synced++;
          }
        } catch (itemErr) {
          console.warn('Falha pontual na sincronização de item:', itemErr);
        }
      }

      this.clearQueue();

      // Dispara evento global para o app atualizar a interface automaticamente
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cr-offline-synced', { detail: { count: synced } }));
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return synced;
  }
}

export const offlineManager = new OfflineManager();
