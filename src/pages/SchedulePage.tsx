import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Wrench,
  AlertCircle,
  CalendarCheck2,
  Filter,
  CheckCircle2,
  Eye,
  CalendarDays,
  ListFilter
} from 'lucide-react';
import { WorkOrder, Technician, Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import { AddressGpsLinks } from '../components/common/AddressGpsLinks';

interface SchedulePageProps {
  workOrders: WorkOrder[];
  technicians: Technician[];
  customers: Customer[];
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onRefresh: () => void;
  onOpenNewWorkOrder?: () => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  workOrders,
  technicians,
  customers,
  onSelectWorkOrder,
  onRefresh,
  onOpenWhatsApp
}) => {
  const { user } = useAuth();

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDateObj = useMemo(() => new Date(), []);

  // Current viewed Month & Year state
  const [currentYear, setCurrentYear] = useState(() => todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => todayDateObj.getMonth()); // 0-indexed (0 = Jan, 11 = Dec)

  // Selected date for day view / details
  const [selectedDate, setSelectedDate] = useState(() => {
    const hasToday = workOrders.some((w) => w.scheduledDate === todayIso);
    if (hasToday) return todayIso;
    const datesWithOrders = Array.from(
      new Set(workOrders.map((w) => w.scheduledDate).filter(Boolean))
    ).sort();
    return datesWithOrders.length > 0 ? datesWithOrders[datesWithOrders.length - 1] : todayIso;
  });

  const [selectedTechFilter, setSelectedTechFilter] = useState('TODOS');
  const [calendarViewMode, setCalendarViewMode] = useState<'MONTH' | 'DAY'>('MONTH');

  // Month names in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDayFullNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // Navigation handlers for month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayIso);
  };

  // Map of orders grouped by date (filtered by technician if selected)
  const ordersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    workOrders.forEach((wo) => {
      if (!wo.scheduledDate) return;
      if (selectedTechFilter !== 'TODOS' && wo.technicianId !== selectedTechFilter) return;

      if (!map[wo.scheduledDate]) {
        map[wo.scheduledDate] = [];
      }
      map[wo.scheduledDate].push(wo);
    });

    // Sort orders of each day by time
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
    });

    return map;
  }, [workOrders, selectedTechFilter]);

  // Calendar Grid Days Calculation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    interface DayCell {
      dayNumber: number;
      dateIso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      orders: WorkOrder[];
    }

    const cells: DayCell[] = [];

    // 1. Previous month leading days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateIso = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNumber: dayNum,
        dateIso,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isSelected: dateIso === selectedDate,
        orders: ordersByDate[dateIso] || []
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNumber: dayNum,
        dateIso,
        isCurrentMonth: true,
        isToday: dateIso === todayIso,
        isSelected: dateIso === selectedDate,
        orders: ordersByDate[dateIso] || []
      });
    }

    // 3. Next month trailing days to complete 35 or 42 cells
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateIso = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      cells.push({
        dayNumber: nextDay,
        dateIso,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isSelected: dateIso === selectedDate,
        orders: ordersByDate[dateIso] || []
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayIso, selectedDate, ordersByDate]);

  // Selected date details
  const selectedDateDetails = useMemo(() => {
    if (!selectedDate) return { day: '', month: '', year: 0, weekday: '', full: '' };
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return {
      day: String(d).padStart(2, '0'),
      month: monthNames[m - 1],
      year: y,
      weekday: weekDayFullNames[dateObj.getDay()],
      isToday: selectedDate === todayIso,
      full: `${weekDayFullNames[dateObj.getDay()]}, ${d} de ${monthNames[m - 1]} de ${y}`
    };
  }, [selectedDate, todayIso]);

  // Orders for selected day
  const selectedDayOrders = useMemo(() => {
    return ordersByDate[selectedDate] || [];
  }, [ordersByDate, selectedDate]);

  // Check for time collisions on same technician on selected date
  const collisionAlerts = useMemo(() => {
    const alerts: Array<{ time: string; techName: string; codes: string[] }> = [];
    const techTimeMap: Record<string, string[]> = {};

    selectedDayOrders.forEach((wo) => {
      if (!wo.technicianId || !wo.scheduledTime) return;
      const key = `${wo.technicianId}-${wo.scheduledTime}`;
      if (!techTimeMap[key]) {
        techTimeMap[key] = [];
      }
      techTimeMap[key].push(wo.code);
    });

    Object.entries(techTimeMap).forEach(([key, codes]) => {
      if (codes.length > 1) {
        const [techId, time] = key.split('-');
        const tech = technicians.find((t) => t.id === techId);
        alerts.push({
          time,
          techName: tech?.name || 'Técnico',
          codes
        });
      }
    });

    return alerts;
  }, [selectedDayOrders, technicians]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ATENDIMENTO':
        return {
          chip: 'bg-blue-600 text-white',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-600',
          label: 'EM ATENDIMENTO'
        };
      case 'EM_DESLOCAMENTO':
        return {
          chip: 'bg-amber-600 text-white',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'EM DESLOCAMENTO'
        };
      case 'AGENDADA':
        return {
          chip: 'bg-purple-600 text-white',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          label: 'AGENDADA'
        };
      case 'CONCLUIDA':
        return {
          chip: 'bg-emerald-600 text-white',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'CONCLUÍDA'
        };
      default:
        return {
          chip: 'bg-slate-500 text-white',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  // Month total orders count
  const monthTotalOrders = useMemo(() => {
    return Object.entries(ordersByDate).reduce((total, [dateStr, list]) => {
      if (dateStr.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)) {
        return total + list.length;
      }
      return total;
    }, 0);
  }, [ordersByDate, currentYear, currentMonth]);

  return (
    <div className="space-y-5 w-full">
      {/* 1. HEADER & CONTROLES DO CALENDÁRIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Calendário de Atendimentos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
                  {monthTotalOrders} OS neste mês
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Visão mensal completa de atendimentos reais, escalas das equipes e rotas programadas.
              </p>
            </div>
          </div>

          {/* Seletor de Modo de Visualização */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setCalendarViewMode('MONTH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calendarViewMode === 'MONTH'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200 ring-1 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Mês Completo (Grade)</span>
            </button>

            <button
              type="button"
              onClick={() => setCalendarViewMode('DAY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calendarViewMode === 'DAY'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200 ring-1 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Agenda do Dia</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação do Mês (Real Month Navigator) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-display min-w-[190px] sm:min-w-[220px]">
              {monthNames[currentMonth]} {currentYear}
            </h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleGoToToday}
              className="ml-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Filtro por Técnico Responsável */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Técnico:
            </span>
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Técnicos</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. VISUALIZAÇÃO 1: GRADE COMPLETA DO MÊS (FULL MONTH CALENDAR GRID) */}
      {calendarViewMode === 'MONTH' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center">
            {weekDayNames.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2.5 text-xs font-black uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-slate-400 bg-slate-100/50' : 'text-slate-600'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Grade de 35 ou 42 Células com Dias Reais */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/50">
            {calendarGrid.map((cell, idx) => {
              const hasOrders = cell.orders.length > 0;
              const isSelectedDay = cell.dateIso === selectedDate;

              return (
                <div
                  key={`${cell.dateIso}-${idx}`}
                  onClick={() => {
                    setSelectedDate(cell.dateIso);
                  }}
                  className={`min-h-[95px] sm:min-h-[120px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer group ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-300'
                  } ${
                    isSelectedDay
                      ? 'ring-2 ring-blue-600 ring-inset bg-blue-50/40 shadow-xs'
                      : 'hover:bg-blue-50/20'
                  }`}
                >
                  {/* Topo da Célula: Número do Dia + Indicador de Hoje / Badge de OS */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-extrabold flex items-center justify-center w-6 h-6 rounded-full ${
                        cell.isToday
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : cell.isCurrentMonth
                          ? isSelectedDay
                            ? 'text-blue-700 bg-blue-100 font-black'
                            : 'text-slate-800'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasOrders && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 tabular-nums">
                        {cell.orders.length} {cell.orders.length === 1 ? 'OS' : 'OS'}
                      </span>
                    )}
                  </div>

                  {/* Corpo da Célula: Chips das Ordens de Serviço (No desktop) e Bolinhas coloridas (no mobile) */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {/* Visualização Desktop: Mini cards com hora e código */}
                    <div className="hidden sm:flex flex-col gap-1 max-h-[75px] overflow-hidden">
                      {cell.orders.slice(0, 3).map((wo) => {
                        const statusColor = getStatusColor(wo.status);
                        const cust = customers.find((c) => c.id === wo.customerId);
                        return (
                          <div
                            key={wo.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(cell.dateIso);
                              onSelectWorkOrder(wo);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate transition-transform hover:scale-[1.02] flex items-center gap-1 shadow-2xs ${statusColor.chip}`}
                            title={`${wo.code} (${wo.scheduledTime}) - ${cust?.name || 'Cliente'}: ${wo.problemDescription || ''}`}
                          >
                            <span className="font-mono font-bold shrink-0">{wo.scheduledTime || '09:00'}</span>
                            <span className="truncate">{wo.code}</span>
                          </div>
                        );
                      })}
                      {cell.orders.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-500 pl-1">
                          +{cell.orders.length - 3} mais...
                        </span>
                      )}
                    </div>

                    {/* Visualização Mobile: Indicadores Coloridos por Status */}
                    <div className="flex sm:hidden items-center gap-1 flex-wrap pt-1">
                      {cell.orders.slice(0, 4).map((wo) => {
                        const statusColor = getStatusColor(wo.status);
                        return (
                          <span
                            key={wo.id}
                            className={`w-2 h-2 rounded-full ${statusColor.dot}`}
                            title={`${wo.code} - ${wo.status}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Rodapé da Célula: Indicador quando selecionado */}
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    {cell.isToday && (
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                        Hoje
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONFLITO DE HORÁRIOS NA DATA SELECIONADA */}
      {collisionAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <h4 className="font-extrabold text-sm text-rose-900">
              Conflito de Horário Detectado na Data Selecionada!
            </h4>
          </div>
          <div className="space-y-1.5 text-xs text-rose-800">
            {collisionAlerts.map((alert, idx) => (
              <p key={idx} className="bg-white/80 p-2.5 rounded-xl border border-rose-200">
                O colaborador <strong>{alert.techName}</strong> possui <strong>{alert.codes.length} OS agendadas</strong> exatamente no mesmo horário das{' '}
                <span className="font-mono font-bold">{alert.time}</span> ({alert.codes.join(', ')}).
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 4. DETALHAMENTO DAS ORDENS DA DATA SELECIONADA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header da data selecionada */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Atendimentos em {selectedDateDetails.full}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDayOrders.length === 0
                ? 'Nenhum chamado programado para este dia.'
                : `${selectedDayOrders.length} serviço(s) programado(s) para execução.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
              {selectedDateDetails.day}/{selectedDateDetails.month.slice(0, 3)}/{selectedDateDetails.year}
            </span>
          </div>
        </div>

        {/* Listagem das Ordens do Dia Selecionado */}
        {selectedDayOrders.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs space-y-2">
            <CalendarCheck2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-semibold text-slate-600 text-sm">Nenhum atendimento agendado para esta data</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Selecione outro dia na grade do calendário ou crie uma nova OS através do botão "+ Nova OS" no cabeçalho.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDayOrders.map((wo) => {
              const cust = customers.find((c) => c.id === wo.customerId);
              const tech = technicians.find((t) => t.id === wo.technicianId);
              const status = getStatusColor(wo.status);

              return (
                <div
                  key={wo.id}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-2xs transition-all space-y-3 relative flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header do Card com Horário e Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-black text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-xl border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{wo.scheduledTime || '09:00'}</span>
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {wo.code}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Cliente e Endereço */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">{cust?.name || 'Cliente'}</span>
                      </h4>

                      <div className="pt-1">
                        <AddressGpsLinks
                          address={
                            wo.locationAddress ||
                            (cust?.street
                              ? `${cust.street}, ${cust.number || 'S/N'} - ${cust.neighborhood || ''}, ${cust.city || 'Caxias do Sul'}`
                              : 'Caxias do Sul')
                          }
                        />
                      </div>
                    </div>

                    {/* Descrição do Serviço */}
                    {wo.problemDescription && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 line-clamp-2">
                        <strong>Serviço:</strong> {wo.problemDescription}
                      </p>
                    )}
                  </div>

                  {/* Técnico Atribuído, Valor e Ações */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium truncate">
                        Técnico: <strong className="text-slate-800">{tech?.name || 'Não atribuído'}</strong>
                      </span>
                      <span className="font-mono font-black text-emerald-700">
                        R$ {Number(wo.value).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectWorkOrder(wo)}
                        className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalhes</span>
                      </button>

                      {cust?.phone && onOpenWhatsApp && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp({ customer: cust, workOrder: wo })}
                          className="min-h-[40px] px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Falar com o Cliente no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
