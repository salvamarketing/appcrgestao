import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Wrench,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Phone,
  MessageSquare,
  Shield,
  ShieldAlert,
  Activity,
  Flame,
  ChevronRight,
  Plus,
  DollarSign,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkOrder, Technician, Customer, Quote, ServiceItem, FinancialTransaction } from '../types';
import { api } from '../lib/api';
import { InteractivePeakChart } from '../components/dashboard/InteractivePeakChart';
import { formatCurrencyBRL } from '../core';

export type DashboardPeriod = 'hoje' | '7dias' | '30dias' | 'mes' | 'anterior';

interface DashboardPageProps {
  onNavigatePage: (page: any) => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onOpenNewWorkOrder: () => void;
  onOpenNewQuote: () => void;
  customers: Customer[];
  services: ServiceItem[];
  workOrders?: WorkOrder[];
  transactions?: FinancialTransaction[];
  quotes?: Quote[];
  technicians?: Technician[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigatePage,
  onSelectWorkOrder,
  onOpenNewWorkOrder,
  onOpenNewQuote,
  customers,
  services,
  workOrders = [],
  transactions = [],
  quotes = [],
  technicians = [],
}) => {
  const { user } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState<DashboardPeriod>('hoje');
  const [summary, setSummary] = useState<{
    todayOrdersCount: number;
    inProgressCount: number;
    pendingQuotesCount: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyPending: number;
    monthlyBalance: number;
    todayOrders: WorkOrder[];
    technicians: Technician[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workOrders, transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_ATENDIMENTO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            EM ATENDIMENTO
          </span>
        );
      case 'EM_DESLOCAMENTO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            EM DESLOCAMENTO
          </span>
        );
      case 'AGENDADA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            AGENDADA
          </span>
        );
      case 'CONCLUIDA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            CONCLUÍDA
          </span>
        );
      case 'AGUARDANDO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            AGUARDANDO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getTechnicianStatusBadge = (status: string) => {
    switch (status) {
      case 'Em atendimento':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Em deslocamento':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Disponível':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper para verificar se uma data pertence ao período selecionado
  const isDateInPeriod = (dateStr?: string, period: DashboardPeriod = 'hoje') => {
    if (!dateStr) return false;
    const cleanDate = dateStr.slice(0, 10);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMonth = todayStr.slice(0, 7);

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    if (period === 'hoje') {
      return cleanDate === todayStr;
    }
    if (period === 'mes') {
      return cleanDate.startsWith(currentMonth);
    }
    if (period === 'anterior') {
      return cleanDate.startsWith(prevMonth);
    }

    const target = new Date(cleanDate + 'T00:00:00').getTime();
    const todayT = new Date(todayStr + 'T00:00:00').getTime();
    const diffDays = Math.floor((todayT - target) / (1000 * 60 * 60 * 24));

    if (period === '7dias') {
      return diffDays >= 0 && diffDays <= 7;
    }
    if (period === '30dias') {
      return diffDays >= 0 && diffDays <= 30;
    }
    return false;
  };

  // Dados consolidados dinâmicos por período calculados estritamente dos dados reais do banco
  const currentMetrics = useMemo(() => {
    // 1. Filtrar ordens reais do banco para o período
    const periodWorkOrders = workOrders.filter((w) => {
      const targetDate = w.scheduledDate || w.createdAt;
      return isDateInPeriod(targetDate, filterPeriod);
    });

    // 2. Filtrar transações financeiras reais do período
    const periodTransactions = transactions.filter((t) => {
      return isDateInPeriod(t.date || t.createdAt, filterPeriod);
    });

    const realRevenue = periodTransactions
      .filter((t) => (t.type || '').toUpperCase() === 'RECEITA' && (t.status === 'pago' || !t.status))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const realExpenses = periodTransactions
      .filter((t) => (t.type || '').toUpperCase() === 'DESPESA')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const realPendingRevenue = periodWorkOrders
      .filter((w) => w.paymentStatus === 'pending' && w.status !== 'CANCELADA')
      .reduce((sum, w) => sum + (Number(w.value) || 0), 0);

    const periodQuotes = quotes.filter((q) => isDateInPeriod(q.createdAt, filterPeriod));
    const completedOrders = periodWorkOrders.filter((w) => w.status === 'CONCLUIDA');
    const pendingOrders = periodWorkOrders.filter((w) => w.status !== 'CONCLUIDA' && w.status !== 'CANCELADA');

    // Categorias calculadas a partir das ordens reais do período
    const categoriesMap: Record<string, { count: number; revenue: number; name: string }> = {};
    const categoryColors: Record<string, string> = {
      desentupimento: '#2563eb',
      hidrojateamento: '#7c3aed',
      limpeza_fossa: '#ea580c',
      hidraulica: '#0d9488',
      eletrica: '#f59e0b',
      outros: '#64748b',
    };

    periodWorkOrders.forEach((wo) => {
      const srv = services.find((s) => wo.serviceIds?.includes(s.id));
      const catKey = (srv?.category || wo.problemDescription || 'Geral').toLowerCase().replace(/\s+/g, '_');
      const catName = srv?.name || srv?.category || wo.problemDescription || 'Serviço';
      if (!categoriesMap[catKey]) {
        categoriesMap[catKey] = { count: 0, revenue: 0, name: catName };
      }
      categoriesMap[catKey].count += 1;
      categoriesMap[catKey].revenue += Number(wo.value) || 0;
    });

    const totalCatRevenue = Object.values(categoriesMap).reduce((sum, c) => sum + c.revenue, 0);
    const colorKeys = Object.keys(categoryColors);
    const categories = Object.entries(categoriesMap).map(([key, val], idx) => {
      const percent = totalCatRevenue > 0 ? Math.round((val.revenue / totalCatRevenue) * 100) : 0;
      return {
        id: key,
        name: val.name,
        shortName: val.name.slice(0, 18),
        color: categoryColors[key] || colorKeys[idx % colorKeys.length],
        percent,
        revenue: val.revenue,
        count: val.count,
        ticket: val.count > 0 ? Math.round(val.revenue / val.count) : 0,
      };
    });

    const periodLabels: Record<DashboardPeriod, { label: string; desc: string; tableTitle: string; tableSubtitle: string }> = {
      hoje: {
        label: 'Hoje',
        desc: 'Hoje',
        tableTitle: 'Ordens de Serviço de Hoje',
        tableSubtitle: 'Atendimentos e despachos programados para o dia',
      },
      '7dias': {
        label: '7 dias',
        desc: 'Últimos 7 dias',
        tableTitle: 'Ordens de Serviço dos Últimos 7 Dias',
        tableSubtitle: 'Atendimentos realizados e em andamento na última semana',
      },
      '30dias': {
        label: '30 dias',
        desc: 'Últimos 30 dias',
        tableTitle: 'Ordens de Serviço dos Últimos 30 Dias',
        tableSubtitle: 'Atendimentos consolidados no período de 30 dias',
      },
      mes: {
        label: 'Este mês',
        desc: 'Mês Atual',
        tableTitle: 'Ordens de Serviço deste Mês',
        tableSubtitle: 'Atendimentos realizados no mês corrente',
      },
      anterior: {
        label: 'Mês anterior',
        desc: 'Mês Anterior',
        tableTitle: 'Ordens de Serviço do Mês Anterior',
        tableSubtitle: 'Histórico consolidado de ordens concluídas no mês passado',
      },
    };

    const pMeta = periodLabels[filterPeriod] || periodLabels.hoje;
    const gross = realRevenue;
    const expenses = realExpenses;
    const pending = realPendingRevenue;
    const received = gross;
    const balance = gross - expenses;

    return {
      periodLabel: pMeta.label,
      periodDesc: pMeta.desc,
      revenueLabel: `Faturamento (${pMeta.label})`,
      revenue: gross,
      pendingOrdersCount: pendingOrders.length,
      pendingOrdersLabel: `OS Pendentes (${pMeta.label})`,
      quotesCount: periodQuotes.length,
      quotesLabel: `Orçamentos (${pMeta.label})`,
      fieldTeamsCount: completedOrders.length,
      fieldTeamsLabel: `Serviços Concluídos (${pMeta.label})`,
      tableTitle: pMeta.tableTitle,
      tableSubtitle: pMeta.tableSubtitle,
      orders: periodWorkOrders,
      financial: {
        gross,
        received,
        pending,
        expenses,
        balance,
      },
      categories,
    };
  }, [filterPeriod, workOrders, transactions, quotes, services]);

  // Gradient dinâmico do Donut baseado nas categorias calculadas do período
  const donutGradient = useMemo(() => {
    if (!currentMetrics.categories || currentMetrics.categories.length === 0) {
      return '#e2e8f0'; // Círculo cinza neutro quando zerado
    }
    let currentPct = 0;
    const parts = currentMetrics.categories.map((s) => {
      const start = currentPct;
      const end = currentPct + s.percent;
      currentPct = end;
      return `${s.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [currentMetrics.categories]);

  // Ordenação dos serviços mais lucrativos por maior faturamento
  const rankedServices = useMemo(() => {
    return [...currentMetrics.categories].sort((a, b) => b.revenue - a.revenue);
  }, [currentMetrics.categories]);

  return (
    <div className="space-y-6">
      {/* Topo Limpo e Direto para o Operador com Filtro de Período Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
              Painel Operacional
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentMetrics.periodDesc}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Lançamento de atendimentos, estatísticas e visão consolidada por período.
          </p>
        </div>

        <div className="flex items-center">
          {/* Barra de Seleção de Período (Muda todos os números, gráficos e tabelas) */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'mes', label: 'Este mês' },
              { id: 'anterior', label: 'Mês anterior' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterPeriod(item.id as DashboardPeriod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPeriod === item.id
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200 font-extrabold ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Linha 1: 4 Cartões Superiores (Em 2x2 no Mobile para Economizar Espaço e Facilitar Leitura) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        
        {/* Cartão 1: Faturamento do Período */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="p-5 flex justify-between items-start flex-grow">
            <div>
              <h3 className="text-2xl font-bold text-orange-500 tabular-nums">
                {formatCurrencyBRL(currentMetrics.revenue)}
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {currentMetrics.revenueLabel}
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded-full text-orange-500">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* Cartão 2: OS Pendentes / Agendadas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="p-5 flex justify-between items-start flex-grow">
            <div>
              <h3 className="text-2xl font-bold text-red-500 tabular-nums">
                {String(currentMetrics.pendingOrdersCount).padStart(2, '0')}
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {currentMetrics.pendingOrdersLabel}
              </p>
            </div>
            <div className="p-2 bg-red-50 rounded-full text-red-500">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* Cartão 3: Orçamentos Aprovados */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="p-5 flex justify-between items-start flex-grow">
            <div>
              <h3 className="text-2xl font-bold text-emerald-500 tabular-nums">
                {String(currentMetrics.quotesCount).padStart(2, '0')}
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {currentMetrics.quotesLabel}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-full text-emerald-500">
              <FileText size={20} />
            </div>
          </div>
        </div>

        {/* Cartão 4: Serviços Feitos / Equipas em Campo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="p-5 flex justify-between items-start flex-grow">
            <div>
              <h3 className="text-2xl font-bold text-blue-600 tabular-nums">
                {String(currentMetrics.fieldTeamsCount).padStart(2, '0')}
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {currentMetrics.fieldTeamsLabel}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
              <Wrench size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* Linha 2: Gráficos e Barras de Progresso que mudam conforme o clique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gráfico Azul Interativo (Atendimentos por Dia / Período, Horário de Pico e Faturamento) */}
        <InteractivePeakChart
          todayOrders={summary?.todayOrders || []}
          allWorkOrders={workOrders}
          services={services}
          defaultTodayRevenue={currentMetrics.revenue}
          defaultTodayCount={currentMetrics.fieldTeamsCount}
          period={filterPeriod}
        />

        {/* Gráfico Circular: Origem da Receita (Muda Conforme Período) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Origem da Receita ({currentMetrics.periodLabel})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Participação por categoria de serviço executado</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Operacional
            </span>
          </div>
          
          {/* Gráfico de anel (Donut) usando CSS Conic Gradient dinâmico dos serviços */}
          <div className="flex flex-col items-center justify-center my-2">
            <div
              className="relative w-36 h-36 rounded-full shadow-xs flex items-center justify-center shrink-0 transition-transform hover:scale-105 duration-200"
              style={{ background: donutGradient }}
            >
              <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xs font-black text-slate-800">
                  {currentMetrics.categories.length > 0 ? '100%' : '0%'}
                </span>
                <span className="text-[9px] font-semibold text-blue-600">Serviços</span>
              </div>
            </div>
          </div>
          
          {/* Legenda dos Serviços Feitos */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100 mt-2">
            {currentMetrics.categories.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-slate-400 py-3">
                Nenhum serviço registrado neste período.
              </div>
            ) : (
              currentMetrics.categories.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-800 truncate text-[11px]">{item.shortName}</span>
                  </div>
                  <span className="font-bold text-xs shrink-0 ml-1" style={{ color: item.color }}>
                    {item.percent}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Barras de Progresso: Serviços Mais Lucrativos (Muda Conforme Período) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Serviços Mais Lucrativos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ranking e volume em {currentMetrics.periodLabel}</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ranking
            </span>
          </div>
          
          <div className="space-y-4 my-auto">
            {rankedServices.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">
                Nenhum faturamento registrado neste período.
              </div>
            ) : (
              rankedServices.map((item, idx) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                      {idx === 0 && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Top 1
                        </span>
                      )}
                    </span>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900">{item.percent}%</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                        (R$ {item.revenue.toLocaleString('pt-BR')})
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-600 font-medium pt-0.5">
                    <span>{item.count} ordens executadas</span>
                    <span className="text-slate-600">Ticket Médio: R$ {item.ticket.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main Operational View: Work Orders & Field Technicians */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ordens de Serviço do Período */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{currentMetrics.tableTitle}</h3>
                <p className="text-xs text-slate-500">{currentMetrics.tableSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigatePage('work-orders')}
                className="text-xs text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Ver todas as ordens</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Carregando ordens de serviço...</div>
            ) : !currentMetrics.orders || currentMetrics.orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Nenhuma ordem de serviço registrada para {currentMetrics.periodLabel}.
                <div className="mt-3">
                  <button
                    onClick={onOpenNewWorkOrder}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    + Criar nova OS
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Visualização Mobile: Cards com Flechinha Direta para Entrar */}
                <div className="md:hidden divide-y divide-slate-100">
                  {currentMetrics.orders.map((wo) => {
                    const cust = customers.find((c) => c.id === wo.customerId);
                    const tech = (technicians.length > 0 ? technicians : summary?.technicians || []).find((t) => t.id === wo.technicianId);
                    const mainService = services.find((s) => wo.serviceIds?.includes(s.id));

                    return (
                      <div
                        key={wo.id}
                        onClick={() => onSelectWorkOrder(wo)}
                        className="p-3.5 hover:bg-blue-50/40 active:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              {wo.code}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">
                              {wo.scheduledTime || '09:00'}
                            </span>
                            <div className="ml-auto">
                              {getStatusBadge(wo.status)}
                            </div>
                          </div>

                          <p className="font-bold text-slate-900 text-sm truncate">
                            {cust?.name || 'Cliente'}
                          </p>

                          <p className="text-xs text-slate-500 truncate">
                            {mainService?.name || wo.problemDescription || 'Atendimento Operacional'}
                          </p>

                          <div className="flex items-center justify-between pt-0.5 text-xs">
                            <span className="text-[11px] text-slate-500 font-medium truncate">
                              Técnico: <strong className="text-slate-700">{tech?.name ? tech.name.split(' ')[0] : 'Não atribuído'}</strong>
                            </span>
                            <span className="font-mono font-black text-emerald-700">
                              R$ {Number(wo.value || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Flechinha para nós entrar */}
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visualização Desktop: Tabela Completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Serviço</th>
                        <th className="p-3.5">Técnico</th>
                        <th className="p-3.5">Horário</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Valor</th>
                        <th className="p-3.5 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentMetrics.orders.map((wo) => {
                        const cust = customers.find((c) => c.id === wo.customerId);
                        const tech = (technicians.length > 0 ? technicians : summary?.technicians || []).find((t) => t.id === wo.technicianId);
                        const mainService = services.find((s) => wo.serviceIds?.includes(s.id));

                        return (
                          <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-blue-600 text-sm">
                              {wo.code}
                            </td>
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900 max-w-[170px] truncate text-sm">
                                {cust?.name || 'Cliente'}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[170px]">
                                {cust?.neighborhood || ''}
                              </p>
                            </td>
                            <td className="p-3.5 max-w-[160px] truncate text-slate-700 text-sm">
                              {mainService?.name || wo.problemDescription}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-medium text-slate-700 text-sm">
                                {tech?.name ? tech.name.split(' ')[0] : 'Não atribuído'}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 whitespace-nowrap text-sm tabular-nums">
                              {wo.scheduledTime || '--:--'}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {getStatusBadge(wo.status)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-700 whitespace-nowrap text-sm tabular-nums">
                              R$ {Number(wo.value || 0).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => onSelectWorkOrder(wo)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                  title="Abrir detalhes e laudo"
                                >
                                  <span>Abrir</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                {cust?.whatsapp && (
                                  <a
                                    href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(cust.name)},%20aqui%20é%20da%20CR%20Serviços%20Gerais%20sobre%20seu%20atendimento%20(${wo.code}).`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                    title="Avisar cliente via WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Técnicos em Campo */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Técnicos em Campo</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigatePage('audit-logs')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  title="Ver logs de auditoria e atividades dos técnicos"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Auditoria</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => onNavigatePage('team')}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Equipe
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {((technicians.length > 0 ? technicians : (summary?.technicians || [])).length === 0) ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="font-semibold text-slate-600">Nenhum técnico cadastrado na equipe ainda.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cadastre seus colaboradores operacionais para escalação em OS.</p>
                  <button
                    onClick={() => onNavigatePage('team')}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    + Cadastrar Colaborador
                  </button>
                </div>
              ) : (
                (technicians.length > 0 ? technicians : (summary?.technicians || [])).map((tech) => (
                  <div
                    key={tech.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={tech.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={tech.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{tech.name}</p>
                        <p className="text-xs text-slate-500 truncate">{tech.role}</p>
                        {tech.activeWorkOrderCode && (
                          <p className="text-xs text-blue-700 font-mono mt-0.5">
                            Atuando na: <strong>{tech.activeWorkOrderCode}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getTechnicianStatusBadge(
                          tech.status
                        )}`}
                      >
                        {tech.status}
                      </span>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">
                        {tech.completedCount} OS concluídas
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé do Card: Conexão Direta com Auditoria dos Técnicos */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Auditoria 100% Conectada
              </span>
              <button
                type="button"
                onClick={() => onNavigatePage('audit-logs')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Auditoria Completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Quick Overview Bar com Valores Dinâmicos do Período */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Faturamento & Saldo Operacional • {currentMetrics.periodLabel}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Valores calculados em tempo real com base no período de {currentMetrics.periodDesc}
            </p>
          </div>
          <button
            onClick={() => onNavigatePage('financial')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
          >
            Abrir Gestão Financeira Completa <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Faturamento Bruto</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {formatCurrencyBRL(currentMetrics.financial.gross)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Total Recebido</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {formatCurrencyBRL(currentMetrics.financial.received)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">A Receber</span>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight tabular-nums">
              {formatCurrencyBRL(currentMetrics.financial.pending)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-1">Despesas</span>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-700 tracking-tight tabular-nums">
              {formatCurrencyBRL(currentMetrics.financial.expenses)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Saldo Líquido</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-700 tracking-tight tabular-nums">
              {formatCurrencyBRL(currentMetrics.financial.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
