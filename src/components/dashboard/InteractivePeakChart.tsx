import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Wrench,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { WorkOrder, ServiceItem } from '../../types';

interface TimeSlotData {
  id: string;
  label: string; // Ex: '08h - 10h'
  hourRange: string; // Ex: '08:00 às 10:00'
  shortLabel: string; // Ex: '08h'
  count: number;
  revenue: number;
  servicesPerformed: { name: string; category?: string; count: number; color: string }[];
  isPeak: boolean;
  orders: { code: string; customerName?: string; serviceName: string; value: number }[];
}

interface DaySlotData {
  id: string;
  label: string; // Ex: 'Seg', 'Ter', etc.
  dateStr: string;
  count: number;
  revenue: number;
  peakHour: string;
  servicesPerformed: { name: string; count: number; color: string }[];
  isPeak: boolean;
}

interface InteractivePeakChartProps {
  todayOrders?: WorkOrder[];
  allWorkOrders?: WorkOrder[];
  services: ServiceItem[];
  defaultTodayRevenue?: number;
  defaultTodayCount?: number;
  period?: 'hoje' | '7dias' | '30dias' | 'mes' | 'anterior';
}

export const InteractivePeakChart: React.FC<InteractivePeakChartProps> = ({
  todayOrders = [],
  allWorkOrders = [],
  services = [],
  defaultTodayRevenue = 0,
  defaultTodayCount = 0,
  period = 'hoje',
}) => {
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sincroniza o modo visualização automaticamente ao alternar o filtro do painel
  React.useEffect(() => {
    if (period === 'hoje') {
      setViewMode('hourly');
    } else {
      setViewMode('daily');
    }
    setHoveredIndex(null);
  }, [period]);

  // Faixas horárias padrão para distribuição e visualização operacional
  const timeSlots: TimeSlotData[] = useMemo(() => {
    const slotsConfig = [
      {
        id: 'slot-1',
        label: '08h - 10h',
        hourRange: '08:00 às 10:00',
        shortLabel: '08h',
        startHour: 8,
        endHour: 10,
      },
      {
        id: 'slot-2',
        label: '10h - 12h',
        hourRange: '10:00 às 12:00',
        shortLabel: '10h',
        startHour: 10,
        endHour: 12,
      },
      {
        id: 'slot-3',
        label: '12h - 14h',
        hourRange: '12:00 às 14:00',
        shortLabel: '12h',
        startHour: 12,
        endHour: 14,
      },
      {
        id: 'slot-4',
        label: '14h - 16h',
        hourRange: '14:00 às 16:00',
        shortLabel: '14h',
        startHour: 14,
        endHour: 16,
      },
      {
        id: 'slot-5',
        label: '16h - 18h',
        hourRange: '16:00 às 18:00',
        shortLabel: '16h',
        startHour: 16,
        endHour: 18,
      },
      {
        id: 'slot-6',
        label: '18h - 20h',
        hourRange: '18:00 às 20:00',
        shortLabel: '18h',
        startHour: 18,
        endHour: 20,
      },
      {
        id: 'slot-7',
        label: '20h - 22h',
        hourRange: '20:00 às 22:00',
        shortLabel: '20h',
        startHour: 20,
        endHour: 22,
      },
    ];

    // Se houver ordens reais cadastradas hoje, distribuímos elas nos slots
    const activeTodayOrders = todayOrders.filter((w) => w.status !== 'CANCELADA');

    let processedSlots: TimeSlotData[] = slotsConfig.map((slot) => {
      const matchingOrders = activeTodayOrders.filter((wo) => {
        if (!wo.scheduledTime) return false;
        const [hStr] = wo.scheduledTime.split(':');
        const h = parseInt(hStr, 10);
        if (isNaN(h)) return false;
        return h >= slot.startHour && h < slot.endHour;
      });

      if (matchingOrders.length > 0) {
        const rev = matchingOrders.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
        const servicesMap: Record<string, number> = {};

        matchingOrders.forEach((o) => {
          const srv = services.find((s) => o.serviceIds?.includes(s.id));
          const name = srv?.name || o.problemDescription || 'Serviço Operacional';
          servicesMap[name] = (servicesMap[name] || 0) + 1;
        });

        const servicesList = Object.entries(servicesMap).map(([name, count]) => {
          const lower = name.toLowerCase();
          let color = '#60a5fa'; // blue
          if (lower.includes('hidro')) color = '#c084fc'; // purple
          else if (lower.includes('fossa')) color = '#fb923c'; // orange
          else if (lower.includes('caixa')) color = '#34d399'; // teal/emerald
          else if (lower.includes('emergên')) color = '#f43f5e';
          return { name, count, color };
        });

        return {
          id: slot.id,
          label: slot.label,
          hourRange: slot.hourRange,
          shortLabel: slot.shortLabel,
          count: matchingOrders.length,
          revenue: rev,
          servicesPerformed: servicesList,
          isPeak: false,
          orders: matchingOrders.map((o) => ({
            code: o.code,
            serviceName: o.problemDescription || 'Serviço executado',
            value: Number(o.value) || 0,
          })),
        };
      }

      return {
        id: slot.id,
        label: slot.label,
        hourRange: slot.hourRange,
        shortLabel: slot.shortLabel,
        count: 0,
        revenue: 0,
        servicesPerformed: [],
        isPeak: false,
        orders: [],
      };
    });

    // Identificar o horário de pico apenas se houver ordens
    let maxCount = 0;
    let maxRev = 0;
    let peakIdx = -1;

    processedSlots.forEach((slot, idx) => {
      if (slot.count > maxCount || (slot.count === maxCount && slot.revenue > maxRev && slot.count > 0)) {
        maxCount = slot.count;
        maxRev = slot.revenue;
        peakIdx = idx;
      }
    });

    if (peakIdx >= 0 && processedSlots[peakIdx]) {
      processedSlots[peakIdx].isPeak = true;
    }

    return processedSlots;
  }, [todayOrders, services]);

  // Dados para visualização de acordo com o período selecionado
  const daySlots: DaySlotData[] = useMemo(() => {
    const activeOrders = allWorkOrders.filter((w) => w.status !== 'CANCELADA');

    let days: Array<{ id: string; label: string; dateStr: string; count: number; revenue: number; peakHour: string }> = [];

    if (period === '30dias') {
      days = [
        { id: 'w-1', label: 'Sem 1', dateStr: '01 a 07', count: 0, revenue: 0, peakHour: '--' },
        { id: 'w-2', label: 'Sem 2', dateStr: '08 a 14', count: 0, revenue: 0, peakHour: '--' },
        { id: 'w-3', label: 'Sem 3', dateStr: '15 a 21', count: 0, revenue: 0, peakHour: '--' },
        { id: 'w-4', label: 'Sem 4', dateStr: '22 a 30', count: 0, revenue: 0, peakHour: '--' },
      ];
    } else if (period === 'mes') {
      days = [
        { id: 'm-1', label: 'Sem 1', dateStr: '01 a 07 Out', count: 0, revenue: 0, peakHour: '--' },
        { id: 'm-2', label: 'Sem 2', dateStr: '08 a 14 Out', count: 0, revenue: 0, peakHour: '--' },
        { id: 'm-3', label: 'Sem 3', dateStr: '15 a 21 Out', count: 0, revenue: 0, peakHour: '--' },
        { id: 'm-4', label: 'Sem 4', dateStr: '22 a 31 Out', count: 0, revenue: 0, peakHour: '--' },
      ];
    } else if (period === 'anterior') {
      days = [
        { id: 'p-1', label: 'Sem 1', dateStr: '01 a 07 Set', count: 0, revenue: 0, peakHour: '--' },
        { id: 'p-2', label: 'Sem 2', dateStr: '08 a 14 Set', count: 0, revenue: 0, peakHour: '--' },
        { id: 'p-3', label: 'Sem 3', dateStr: '15 a 21 Set', count: 0, revenue: 0, peakHour: '--' },
        { id: 'p-4', label: 'Sem 4', dateStr: '22 a 30 Set', count: 0, revenue: 0, peakHour: '--' },
      ];
    } else {
      // '7dias' ou 'hoje'
      const weekLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayIso = d.toISOString().split('T')[0];
        const dateDisplay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const matching = activeOrders.filter((wo) => (wo.scheduledDate || wo.createdAt || '').startsWith(dayIso));
        const rev = matching.reduce((sum, wo) => sum + (Number(wo.value) || 0), 0);

        return {
          id: `d-${i}`,
          label: i === 6 ? 'Hoje' : weekLabels[d.getDay()],
          dateStr: dateDisplay,
          count: matching.length,
          revenue: rev,
          peakHour: matching.length > 0 ? 'Horário Variável' : '--',
        };
      });
    }

    let maxDayCount = 0;
    let peakDayIdx = -1;

    days.forEach((d, idx) => {
      if (d.count > maxDayCount) {
        maxDayCount = d.count;
        peakDayIdx = idx;
      }
    });

    return days.map((d, idx) => ({
      ...d,
      isPeak: peakDayIdx >= 0 && idx === peakDayIdx && d.count > 0,
      servicesPerformed: [],
    }));
  }, [period, allWorkOrders]);

  // Resumo consolidado do período selecionado
  const periodMeta = useMemo(() => {
    const activeItems = viewMode === 'hourly' ? timeSlots : daySlots;
    const sum = activeItems.reduce((acc, curr) => acc + curr.revenue, 0);
    const cnt = activeItems.reduce((acc, curr) => acc + curr.count, 0);

    if (period === '7dias') {
      return {
        title: 'Atendimentos Diários (7 dias)',
        subtitle: 'Histórico dos últimos 7 dias da semana',
        revenue: sum,
        revenueLabel: 'Faturamento (7 dias)',
        count: cnt,
        countLabel: 'Serviços Feitos (7 dias)',
      };
    }
    if (period === '30dias') {
      return {
        title: 'Atendimentos Semanais (30 dias)',
        subtitle: 'Volume de chamados e faturamento (últimos 30 dias)',
        revenue: sum,
        revenueLabel: 'Faturamento (30 dias)',
        count: cnt,
        countLabel: 'Serviços Feitos (30 dias)',
      };
    }
    if (period === 'mes') {
      return {
        title: 'Atendimentos do Mês',
        subtitle: 'Evolução dos atendimentos no mês atual',
        revenue: sum,
        revenueLabel: 'Faturamento Este Mês',
        count: cnt,
        countLabel: 'Serviços Feitos no Mês',
      };
    }
    if (period === 'anterior') {
      return {
        title: 'Atendimentos Mês Anterior',
        subtitle: 'Consolidado do mês anterior',
        revenue: sum,
        revenueLabel: 'Faturamento Mês Anterior',
        count: cnt,
        countLabel: 'Serviços Feitos (Mês Ant.)',
      };
    }
    // 'hoje'
    return {
      title: 'Atendimentos p/ Horário',
      subtitle: 'Distribuição por horário e pico de chamados',
      revenue: sum,
      revenueLabel: 'Faturamento Hoje',
      count: cnt,
      countLabel: 'Serviços Feitos Hoje',
    };
  }, [period, viewMode, timeSlots, daySlots]);

  // Identificação do pico atual
  const peakSlot = useMemo(() => {
    if (viewMode === 'hourly') {
      return timeSlots.find((s) => s.isPeak) || { label: 'Sem chamados', count: 0, revenue: 0, id: 'none', hourRange: '', shortLabel: '', servicesPerformed: [], isPeak: false, orders: [] };
    }
    return daySlots.find((d) => d.isPeak) || { label: 'Sem chamados', count: 0, revenue: 0, id: 'none', dateStr: '', peakHour: '', isPeak: false, servicesPerformed: [] };
  }, [viewMode, timeSlots, daySlots]);

  // Coordenadas para SVG da curva
  const activeItems = viewMode === 'hourly' ? timeSlots : daySlots;
  const maxVal = Math.max(...activeItems.map((item) => item.count), 1);

  // SVG viewBox settings
  const width = 340;
  const height = 95;
  const paddingX = 20;
  const paddingY = 16;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = useMemo(() => {
    const step = graphWidth / (activeItems.length - 1);
    return activeItems.map((item, idx) => {
      const x = paddingX + idx * step;
      // Normalizar altura (valor maior = y menor)
      const normalizedRatio = item.count / (maxVal * 1.25);
      const y = height - paddingY - normalizedRatio * graphHeight;
      return { x, y, item, idx };
    });
  }, [activeItems, maxVal, graphWidth, graphHeight]);

  // Gerar caminho SVG suave (Curva Bezier Cubic Spline)
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 2;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) / 2;
      const controlY2 = next.y;
      d += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${next.x},${next.y}`;
    }
    return d;
  }, [points]);

  // Área preenchida com gradiente fechando no fundo
  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x},${height} L ${first.x},${height} Z`;
  }, [pathD, points]);

  // Item ativo no hover
  const activeHover = hoveredIndex !== null ? activeItems[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all">
      {/* Topo Azul com Gráfico Interativo */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 sm:p-6 flex-grow relative text-white flex flex-col justify-between overflow-hidden">
        
        {/* Efeito de luz sutil no fundo */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-400/15 rounded-full blur-xl pointer-events-none" />

        {/* Cabeçalho do Card */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base tracking-tight font-display">
                {periodMeta.title}
              </h3>
              {peakSlot && (peakSlot as any).count > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-400/25 border border-amber-300/40 text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                  Pico: {peakSlot.label}
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-100/90 mt-0.5">
              {viewMode === 'hourly'
                ? 'Distribuição por horário e pico de atendimentos'
                : periodMeta.subtitle}
            </p>
          </div>

          {/* Seletor de Modo: Horários vs Visão Período */}
          <div className="flex items-center bg-blue-900/40 p-0.5 rounded-lg border border-blue-400/30 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setViewMode('hourly');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'hourly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
              title="Ver evolução por horários do dia e horário de pico"
            >
              Horários
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('daily');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
              title="Ver visão consolidada do período"
            >
              Período
            </button>
          </div>
        </div>

        {/* Gráfico SVG com Interatividade de Hover e Animações */}
        <div className="relative my-1 select-none z-10">
          <svg
            className="w-full h-28 overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="blueLineGradInteractive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>

              {/* Filtro de brilho para ponto em hover */}
              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Linhas de grade horizontais sutis */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={width - paddingX}
              y2={paddingY}
              stroke="white"
              strokeOpacity="0.08"
              strokeDasharray="2,2"
            />
            <line
              x1={paddingX}
              y1={height - paddingY}
              x2={width - paddingX}
              y2={height - paddingY}
              stroke="white"
              strokeOpacity="0.12"
            />

            {/* Área preenchida sob a curva com gradiente suave */}
            <path
              d={areaD}
              fill="url(#blueLineGradInteractive)"
              className="transition-all duration-300"
            />

            {/* Linha principal da curva */}
            <path
              d={pathD}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 drop-shadow-sm"
            />

            {/* Linha vertical de foco (Guideline) no ponto em hover */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <g className="animate-in fade-in duration-150">
                <line
                  x1={points[hoveredIndex].x}
                  y1={paddingY}
                  x2={points[hoveredIndex].x}
                  y2={height - paddingY}
                  stroke="white"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                {/* Iluminação na coluna do ponto selecionado */}
                <rect
                  x={points[hoveredIndex].x - (graphWidth / (points.length - 1)) / 2}
                  y={paddingY}
                  width={graphWidth / (points.length - 1)}
                  height={graphHeight}
                  fill="white"
                  fillOpacity="0.06"
                  rx="4"
                />
              </g>
            )}

            {/* Pontos interativos: Interatividade e hover acionados ESTRITAMENTE pela bolinha */}
            {points.map((p, idx) => {
              const isHovered = hoveredIndex === idx;
              const isPeak = (p.item as any).isPeak;

              return (
                <g
                  key={p.item.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Área circular de captura sobre a bolinha */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={12}
                    fill="transparent"
                  />

                  {/* Halo sutil no ponto */}
                  {isPeak && !isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={7}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="1.5"
                      strokeOpacity="0.75"
                      className="animate-pulse"
                    />
                  )}

                  {/* Halo expandido suave quando em hover */}
                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={10}
                      fill="white"
                      fillOpacity="0.35"
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Círculo central da bolinha */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : isPeak ? 4.5 : 3.5}
                    fill={isPeak ? '#fbbf24' : 'white'}
                    stroke={isHovered ? '#1e3a8a' : '#2563eb'}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-200 transform"
                  />
                </g>
              );
            })}
          </svg>

          {/* Rótulos dos eixos na base */}
          <div className="flex justify-between items-center text-[10px] text-blue-200/90 font-medium px-2 pt-1 border-t border-white/10">
            {activeItems.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              const isPeak = (item as any).isPeak;

              return (
                <span
                  key={item.id}
                  className={`transition-all font-mono tracking-tight select-none ${
                    isHovered
                      ? 'text-white font-extrabold scale-105'
                      : isPeak
                      ? 'text-amber-300 font-bold'
                      : 'text-blue-100/80'
                  }`}
                >
                  {viewMode === 'hourly' ? (item as TimeSlotData).shortLabel : item.label}
                </span>
              );
            })}
          </div>

          {/* Quadrado Tooltip: Abre com animação somente quando passa o mouse sobre a bolinha */}
          {hoveredIndex !== null && activeHover && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-full max-w-[280px] bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-white/20 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white">
                    {viewMode === 'hourly'
                      ? (activeHover as TimeSlotData).hourRange
                      : `${activeHover.label} (${(activeHover as DaySlotData).dateStr})`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <span className="text-[10px] text-blue-200 block">Atendimentos</span>
                  <span className="text-sm font-extrabold text-white">
                    {activeHover.count} {activeHover.count === 1 ? 'serviço' : 'serviços'}
                  </span>
                </div>
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <span className="text-[10px] text-emerald-300 block">Faturamento</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    R$ {activeHover.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Lista dos Serviços Feitos naquele Horário/Dia */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Serviços Feitos neste Período:
                </span>
                {activeHover.servicesPerformed && activeHover.servicesPerformed.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeHover.servicesPerformed.map((srv, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/15 text-white"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: srv.color }} />
                        {srv.name} {srv.count > 1 ? `(${srv.count}x)` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Nenhum atendimento agendado neste intervalo.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Valores Dinâmicos que mudam com o período */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xl font-bold text-slate-900 tabular-nums font-mono">
            R$ {periodMeta.revenue.toLocaleString('pt-BR')}
          </h4>
          <p className="text-xs text-slate-500 font-medium">{periodMeta.revenueLabel}</p>
        </div>

        <div className="text-right">
          <h4 className="text-xl font-bold text-slate-900 tabular-nums">
            {String(periodMeta.count).padStart(2, '0')}
          </h4>
          <p className="text-xs text-slate-500 font-medium">{periodMeta.countLabel}</p>
        </div>
      </div>
    </div>
  );
};
