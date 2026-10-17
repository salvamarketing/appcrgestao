import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpDown,
  FileText,
  DollarSign,
  Wrench,
  Settings,
  Database
} from 'lucide-react';
import { AuditLog, AuditAction, AuditEntity } from '../types';
import { useNotification } from '../context/NotificationContext';
import { getRoleBadge } from '../utils/permissions';

interface AuditLogsPageProps {
  logs: AuditLog[];
  onRefresh?: () => void;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs = [], onRefresh }) => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [onlyTechnicians, setOnlyTechnicians] = useState<boolean>(false);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === '' ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityCode && log.entityCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchEntity = selectedEntity === 'ALL' || log.entity === selectedEntity;
    const matchTech = !onlyTechnicians || (
      log.userRole === 'employee' ||
      log.userRole === 'technician' ||
      log.description.toLowerCase().includes('técnico') ||
      log.description.toLowerCase().includes('em campo') ||
      log.description.toLowerCase().includes('avulso')
    );

    return matchSearch && matchAction && matchEntity && matchTech;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CRIACAO':
        return { label: 'Criação', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'EDICAO':
        return { label: 'Edição', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'STATUS_ALTERADO':
        return { label: 'Status Alterado', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'EXCLUSAO':
        return { label: 'Exclusão', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CONVERSAO':
        return { label: 'Conversão', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PAGAMENTO':
        return { label: 'Pagamento', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'BACKUP':
      case 'RESTAURACAO':
        return { label: 'Sistema / Backup', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getEntityIcon = (entity: AuditEntity) => {
    switch (entity) {
      case 'Ordem de Serviço':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'Orçamento':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'Cliente':
        return <User className="w-4 h-4 text-emerald-600" />;
      case 'Financeiro':
        return <DollarSign className="w-4 h-4 text-teal-600" />;
      case 'Configurações':
        return <Settings className="w-4 h-4 text-slate-500" />;
      case 'Sistema':
        return <Database className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleExportCSV = () => {
    const headers = 'Data_Hora,Usuario,Perfil,Acao,Entidade,Codigo_Ref,Descricao\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${new Date(l.timestamp).toLocaleString('pt-BR')}","${l.userName}","${l.userRole}","${l.action}","${l.entity}","${l.entityCode || ''}","${l.description.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cr-logs-auditoria-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de auditoria exportado com sucesso!', '', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Logs e Histórico de Alterações do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreabilidade completa de todas as operações, alterações de status e pagamentos com data, hora e responsável
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar Logs (Excel / CSV)
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total de Eventos</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">{logs.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Alterados</span>
          <p className="text-xl font-bold text-amber-700 font-mono mt-1 tabular-nums">
            {logs.filter((l) => l.action === 'STATUS_ALTERADO').length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pagamentos Gravados</span>
          <p className="text-xl font-bold text-teal-700 font-mono mt-1 tabular-nums">
            {logs.filter((l) => l.action === 'PAGAMENTO').length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Orçamentos Convertidos</span>
          <p className="text-xl font-bold text-purple-700 font-mono mt-1 tabular-nums">
            {logs.filter((l) => l.action === 'CONVERSAO').length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, usuário, código da OS ou cliente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Type Filter */}
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todas as Ações</option>
          <option value="CRIACAO">Criação</option>
          <option value="EDICAO">Edição</option>
          <option value="STATUS_ALTERADO">Mudança de Status</option>
          <option value="CONVERSAO">Conversão (Orçamento → OS)</option>
          <option value="PAGAMENTO">Pagamento / Recebimento</option>
          <option value="EXCLUSAO">Exclusão</option>
          <option value="RESTAURACAO">Backup / Restauração</option>
        </select>

        {/* Entity Type Filter */}
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todas as Entidades</option>
          <option value="Ordem de Serviço">Ordem de Serviço</option>
          <option value="Orçamento">Orçamento</option>
          <option value="Cliente">Cliente</option>
          <option value="Financeiro">Financeiro</option>
          <option value="Configurações">Configurações</option>
          <option value="Sistema">Sistema</option>
        </select>

        {/* Botão de Destaque: Apenas Auditoria de Técnicos / Campo */}
        <button
          type="button"
          onClick={() => setOnlyTechnicians(!onlyTechnicians)}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            onlyTechnicians
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
          title="Filtrar apenas atividades executadas por técnicos e funcionários em campo"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Auditoria dos Técnicos</span>
          {onlyTechnicians && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Responsável</th>
                <th className="p-3.5">Ação</th>
                <th className="p-3.5">Módulo / Ref</th>
                <th className="p-3.5">Descrição do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const roleBadge = getRoleBadge(log.userRole);
                  const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {formattedDate}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{log.userName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${roleBadge.colorClass}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${actionBadge.color}`}>
                          {actionBadge.label}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getEntityIcon(log.entity)}
                          <span className="font-semibold text-slate-900">{log.entity}</span>
                          {log.entityCode && (
                            <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {log.entityCode}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700 leading-relaxed font-medium">
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
