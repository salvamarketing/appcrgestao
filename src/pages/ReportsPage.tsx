import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  MapPin,
  Users,
  Wrench,
  FileSpreadsheet,
  CreditCard,
  DollarSign,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { WorkOrder, Customer, Technician, ServiceItem, FinancialTransaction } from '../types';
import { useNotification } from '../context/NotificationContext';

interface ReportsPageProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  technicians: Technician[];
  services: ServiceItem[];
  transactions: FinancialTransaction[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  workOrders,
  customers,
  technicians,
  services,
  transactions,
}) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'services' | 'neighborhoods' | 'technicians' | 'financial'>('services');

  // Completed WOs
  const completedWOs = workOrders.filter((w) => w.status === 'CONCLUIDA');
  const totalRevenue = completedWOs.reduce((acc, w) => acc + (w.value || 0), 0);
  const avgTicket = completedWOs.length > 0 ? totalRevenue / completedWOs.length : 0;

  // Service counts
  const serviceStats: Record<string, { count: number; totalValue: number; name: string }> = {};
  workOrders.forEach((wo) => {
    wo.serviceIds.forEach((sId) => {
      const s = services.find((srv) => srv.id === sId);
      const name = s ? s.name : 'Serviço Personalizado';
      if (!serviceStats[name]) {
        serviceStats[name] = { count: 0, totalValue: 0, name };
      }
      serviceStats[name].count += 1;
      serviceStats[name].totalValue += wo.value / (wo.serviceIds.length || 1);
    });
  });

  // Neighborhood stats
  const neighborhoodStats: Record<string, { count: number; totalRevenue: number }> = {};
  workOrders.forEach((wo) => {
    const cust = customers.find((c) => c.id === wo.customerId);
    const hood = cust?.neighborhood || 'Bairro Não Identificado';
    if (!neighborhoodStats[hood]) {
      neighborhoodStats[hood] = { count: 0, totalRevenue: 0 };
    }
    neighborhoodStats[hood].count += 1;
    neighborhoodStats[hood].totalRevenue += wo.value;
  });

  // Top neighborhood
  const topNeighborhood = Object.entries(neighborhoodStats).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A';

  // Technician performance
  const techStats = technicians.map((tech) => {
    const techWOs = workOrders.filter((w) => w.technicianId === tech.id);
    const completed = techWOs.filter((w) => w.status === 'CONCLUIDA');
    const revenue = completed.reduce((acc, w) => acc + w.value, 0);
    return {
      name: tech.name,
      totalAssigned: techWOs.length,
      completedCount: completed.length,
      revenueGenerated: revenue,
    };
  });

  // Financial payment methods breakdown
  const paymentStats: Record<string, { count: number; totalAmount: number }> = {};
  workOrders.forEach((wo) => {
    const method = wo.paymentMethod || 'Não informado';
    if (!paymentStats[method]) {
      paymentStats[method] = { count: 0, totalAmount: 0 };
    }
    paymentStats[method].count += 1;
    paymentStats[method].totalAmount += wo.value || 0;
  });

  const handleExportCSV = () => {
    let headers = '';
    let rows = '';

    if (activeTab === 'services') {
      headers = 'Serviço;Atendimentos;Receita Estimada (R$)\n';
      rows = Object.values(serviceStats)
        .map((s) => `"${s.name}";${s.count};${s.totalValue.toFixed(2)}`)
        .join('\n');
    } else if (activeTab === 'neighborhoods') {
      headers = 'Bairro;Total Chamados;Faturamento Total (R$)\n';
      rows = Object.entries(neighborhoodStats)
        .map(([hood, val]) => `"${hood}";${val.count};${val.totalRevenue.toFixed(2)}`)
        .join('\n');
    } else if (activeTab === 'technicians') {
      headers = 'Técnico;OS Atribuídas;OS Concluídas;Faturamento Gerado (R$)\n';
      rows = techStats
        .map(
          (t) =>
            `"${t.name}";${t.totalAssigned};${t.completedCount};${t.revenueGenerated.toFixed(2)}`
        )
        .join('\n');
    } else if (activeTab === 'financial') {
      headers = 'Forma de Pagamento;Volume de Transações;Valor Total (R$)\n';
      rows = Object.entries(paymentStats)
        .map(([method, data]) => `"${method}";${data.count};${data.totalAmount.toFixed(2)}`)
        .join('\n');
    }

    // \uFEFF UTF-8 BOM ensures Brazilian Portuguese characters (acentos) appear correctly in Microsoft Excel
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-cr-${activeTab}-${Date.now()}.csv`;
    link.click();
    showToast('Relatório exportado com sucesso para Excel/CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Relatórios Gerenciais e Inteligência Operacional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de desempenho, faturamento por serviço, mapeamento por bairros e exportação Excel/PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel / CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Imprimir
          </button>
        </div>
      </div>

      {/* KPI Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">OS Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-2">
            {String(completedWOs.length).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">De {workOrders.length} ordens no total</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Faturamento Concluído</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums mt-2">
            R$ {totalRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Serviços com baixa e entrega</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-2">
            R$ {avgTicket.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Por chamado concluído</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Bairro com Mais Atendimentos</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-purple-800 tracking-tight mt-2 truncate">
            {topNeighborhood}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Maior densidade de clientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
        {[
          { id: 'services', label: 'Serviços Mais Realizados' },
          { id: 'neighborhoods', label: 'Mapeamento por Bairros' },
          { id: 'technicians', label: 'Produtividade da Equipe' },
          { id: 'financial', label: 'Formas de Pagamento & Receita' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Services Breakdown */}
      {activeTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Demanda por Tipo de Serviço Realizado
          </h3>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Nome do Serviço</th>
                  <th className="p-3.5 text-center">Atendimentos</th>
                  <th className="p-3.5 text-right">Faturamento Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {Object.values(serviceStats)
                  .sort((a, b) => b.count - a.count)
                  .map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3.5 text-center font-bold text-blue-700 font-mono">
                        {s.count}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                        R$ {s.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Neighborhoods */}
      {activeTab === 'neighborhoods' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Concentração de Chamados por Bairro
          </h3>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Bairro</th>
                  <th className="p-3.5 text-center">Volume de Atendimentos</th>
                  <th className="p-3.5 text-right">Faturamento Gerado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {Object.entries(neighborhoodStats)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([hood, val], idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{hood}</td>
                      <td className="p-3.5 text-center font-bold text-blue-700 font-mono">
                        {val.count} chamados
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                        R$ {val.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Technicians Performance */}
      {activeTab === 'technicians' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Produtividade Individual da Equipe
          </h3>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Técnico</th>
                  <th className="p-3.5 text-center">Total de OS Atribuídas</th>
                  <th className="p-3.5 text-center">OS Concluídas com Sucesso</th>
                  <th className="p-3.5 text-right">Receita Total Gerada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {techStats.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600">{t.totalAssigned}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                      {t.completedCount}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      R$ {t.revenueGenerated.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Financial and Payment Methods */}
      {activeTab === 'financial' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            Demonstrativo por Forma de Pagamento
          </h3>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Método de Pagamento</th>
                  <th className="p-3.5 text-center">Transações</th>
                  <th className="p-3.5 text-right">Volume Total (R$)</th>
                  <th className="p-3.5 text-right">% do Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {Object.entries(paymentStats)
                  .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
                  .map(([method, data], idx) => {
                    const pct = totalRevenue > 0 ? (data.totalAmount / totalRevenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          {method}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600">{data.count}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                          R$ {data.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
