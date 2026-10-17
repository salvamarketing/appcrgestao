import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  Shield,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
  onNavigatePage: (page: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onRefresh,
  onNavigatePage,
}) => {
  const { showToast } = useNotification();

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      showToast('Todas as notificações foram marcadas como lidas.');
      onRefresh();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    }
  };

  const handleMarkOne = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
      if (link) {
        onNavigatePage(link.replace('/', ''));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Central de Avisos & Notificações Operacionais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Alertas em tempo real sobre ordens de serviço, aprovação de orçamentos e plantão 24h
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Marcar Todas como Lidas
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            Nenhuma notificação registrada.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkOne(n.id, n.link)}
              className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                !n.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="mt-1 shrink-0">
                {n.type === 'urgent' && <Flame className="w-5 h-5 text-rose-600" />}
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {n.type === 'info' && <Clock className="w-5 h-5 text-blue-600" />}
                {n.type === 'warning' && <Shield className="w-5 h-5 text-amber-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900">{n.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{n.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
