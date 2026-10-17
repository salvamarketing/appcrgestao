import React from 'react';
import { AuditLog } from '../../types';
import { formatDateTimePTBR } from '../../core/utils/dateFormatter';
import { Clock, User, Shield, Activity } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
  entityCode?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, entityCode }) => {
  const filteredLogs = entityCode
    ? logs.filter((log) => log.entityCode === entityCode || log.entityId === entityCode)
    : logs;

  if (!filteredLogs || filteredLogs.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium">Nenhum registro de auditoria encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Trilha de Auditoria e Histórico Imutável
        </h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
          {filteredLogs.length} evento(s)
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredLogs.map((log) => (
          <div key={log.id} className="relative group">
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {log.userName}{' '}
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    {log.userRole}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatDateTimePTBR(log.timestamp)}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-800 mb-0.5">
                [{log.action}] - {log.description}
              </div>

              {log.details && Object.keys(log.details).length > 0 && (
                <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100 font-mono text-slate-600 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
