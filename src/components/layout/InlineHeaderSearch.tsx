import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ClipboardList,
  Users,
  Wrench,
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';
import { Customer, ServiceItem, Quote, WorkOrder } from '../../types';

interface InlineHeaderSearchProps {
  customers?: Customer[];
  workOrders?: WorkOrder[];
  quotes?: Quote[];
  services?: ServiceItem[];
  onSelectWorkOrder?: (wo: WorkOrder) => void;
  onSelectCustomer?: (c: Customer) => void;
  onSelectQuote?: (q: Quote) => void;
  onSelectService?: (s: ServiceItem) => void;
  className?: string;
}

export const InlineHeaderSearch: React.FC<InlineHeaderSearchProps> = ({
  customers = [],
  workOrders = [],
  quotes = [],
  services = [],
  onSelectWorkOrder,
  onSelectCustomer,
  onSelectQuote,
  onSelectService,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown quando clica fora do container
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalho de teclado ESC para fechar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const cleanQuery = query.trim().toLowerCase();

  // Filtragem de dados em tempo real
  const filteredWorkOrders = cleanQuery
    ? workOrders
        .filter((wo) => {
          const cust = customers.find((c) => c.id === wo.customerId);
          return (
            wo.code.toLowerCase().includes(cleanQuery) ||
            wo.problemDescription.toLowerCase().includes(cleanQuery) ||
            wo.scheduledDate.includes(cleanQuery) ||
            (cust && cust.name.toLowerCase().includes(cleanQuery)) ||
            (wo.locationAddress && wo.locationAddress.toLowerCase().includes(cleanQuery))
          );
        })
        .slice(0, 5)
    : [];

  const filteredCustomers = cleanQuery
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(cleanQuery) ||
            c.phone.includes(cleanQuery) ||
            (c.whatsapp && c.whatsapp.includes(cleanQuery)) ||
            (c.neighborhood && c.neighborhood.toLowerCase().includes(cleanQuery)) ||
            (c.street && c.street.toLowerCase().includes(cleanQuery))
        )
        .slice(0, 4)
    : [];

  const filteredServices = cleanQuery
    ? services
        .filter(
          (s) =>
            s.name.toLowerCase().includes(cleanQuery) ||
            s.category.toLowerCase().includes(cleanQuery) ||
            (s.description && s.description.toLowerCase().includes(cleanQuery))
        )
        .slice(0, 4)
    : [];

  const filteredQuotes = cleanQuery
    ? quotes
        .filter(
          (q) =>
            q.code.toLowerCase().includes(cleanQuery) ||
            (q.notes && q.notes.toLowerCase().includes(cleanQuery))
        )
        .slice(0, 3)
    : [];

  const hasResults =
    filteredWorkOrders.length > 0 ||
    filteredCustomers.length > 0 ||
    filteredServices.length > 0 ||
    filteredQuotes.length > 0;

  const totalResultsCount =
    filteredWorkOrders.length +
    filteredCustomers.length +
    filteredServices.length +
    filteredQuotes.length;

  // Sugestões rápidas de ordens ativas para quando o campo estiver focado mas vazio
  const recentWorkOrders = workOrders
    .filter((wo) => wo.status === 'EM_ATENDIMENTO' || wo.status === 'EM_DESLOCAMENTO' || wo.status === 'AGENDADA')
    .slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_ATENDIMENTO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EM_DESLOCAMENTO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AGENDADA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONCLUIDA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Campo de Busca Inline com placeholder estrito "Buscar" conforme solicitado */}
      <div className="relative flex items-center group">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none group-focus-within:text-blue-600 transition-colors shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar"
          className="w-44 sm:w-56 md:w-64 lg:w-72 focus:w-64 sm:focus:w-72 md:focus:w-80 lg:focus:w-96 pl-9 pr-8 py-2 rounded-xl bg-slate-100/90 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium transition-all shadow-2xs focus:shadow-md focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown de Resultados Direto Embaixo do Campo (Sem abrir modal ou nova aba) */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[340px] sm:w-[440px] md:w-[500px] lg:w-[540px] max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Cabeçalho do Dropdown */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              {cleanQuery ? (
                <span>
                  Resultados para <strong className="text-blue-700 font-extrabold">"{query}"</strong> ({totalResultsCount})
                </span>
              ) : (
                <span>Busca Rápida de Ordens, Clientes e Serviços</span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ESC fecha</span>
          </div>

          {/* Área de Rolagem dos Resultados */}
          <div className="max-h-[65vh] overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
            {/* Estado 1: Nenhum texto digitado ainda -> Apresenta atalhos e dicas */}
            {!cleanQuery && (
              <div className="space-y-2.5 py-1">
                <p className="text-[11px] text-slate-500 px-2 leading-relaxed">
                  Digite para buscar instantaneamente por <strong>código de OS</strong>, <strong>nome de cliente</strong>, <strong>bairro</strong>, <strong>telefone</strong> ou <strong>tipo de serviço</strong>.
                </p>

                {recentWorkOrders.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                      Ordens de Serviço em Destaque / Hoje:
                    </span>
                    <div className="space-y-1">
                      {recentWorkOrders.map((wo) => {
                        const cust = customers.find((c) => c.id === wo.customerId);
                        return (
                          <div
                            key={wo.id}
                            onClick={() => {
                              onSelectWorkOrder?.(wo);
                              setIsOpen(false);
                              setQuery('');
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs font-mono text-blue-700 group-hover:underline">
                                  {wo.code}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadge(wo.status)}`}>
                                  {wo.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                {cust?.name || 'Cliente'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {wo.problemDescription}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-slate-900 block font-mono">
                                R$ {Number(wo.value).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                                <Clock className="w-2.5 h-2.5" />
                                {wo.scheduledTime}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estado 2: Texto digitado mas sem resultados */}
            {cleanQuery && !hasResults && (
              <div className="py-8 text-center px-4 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Nenhum resultado encontrado para "{query}"
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Verifique a digitação ou busque por parte do nome do cliente, código da OS (ex: 0125), rua ou serviço.
                </p>
              </div>
            )}

            {/* Estado 3: Resultados Encontrados por Categoria */}
            {cleanQuery && hasResults && (
              <div className="space-y-3">
                {/* 1. Ordens de Serviço */}
                {filteredWorkOrders.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        Ordens de Serviço ({filteredWorkOrders.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {filteredWorkOrders.map((wo) => {
                        const cust = customers.find((c) => c.id === wo.customerId);
                        return (
                          <div
                            key={wo.id}
                            onClick={() => {
                              onSelectWorkOrder?.(wo);
                              setIsOpen(false);
                              setQuery('');
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs font-mono text-blue-700 group-hover:underline">
                                  {wo.code}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadge(wo.status)}`}>
                                  {wo.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                {cust?.name || 'Cliente'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {wo.problemDescription}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-slate-900 block font-mono">
                                R$ {Number(wo.value).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {wo.scheduledDate}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Clientes */}
                {filteredCustomers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Clientes ({filteredCustomers.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            onSelectCustomer?.(cust);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className="p-2.5 rounded-xl hover:bg-purple-50/80 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-700">
                              {cust.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {cust.phone} {cust.whatsapp ? `• Whats: ${cust.whatsapp}` : ''}
                            </p>
                            {(cust.street || cust.neighborhood) && (
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                {cust.street ? `${cust.street}, ${cust.number || 'S/N'}` : ''} {cust.neighborhood ? `- ${cust.neighborhood}` : ''}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Catálogo de Serviços */}
                {filteredServices.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Serviços do Catálogo ({filteredServices.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {filteredServices.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => {
                            onSelectService?.(srv);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className="p-2.5 rounded-xl hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800">
                                {srv.name}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200 shrink-0">
                                {srv.category}
                              </span>
                            </div>
                            {srv.description && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {srv.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-emerald-700 block font-mono">
                              R$ {Number(srv.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {srv.estimatedDuration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Orçamentos */}
                {filteredQuotes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Orçamentos ({filteredQuotes.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {filteredQuotes.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => {
                            onSelectQuote?.(q);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className="p-2.5 rounded-xl hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-xs font-mono text-emerald-700 group-hover:underline">
                              {q.code}
                            </span>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {q.notes || 'Orçamento cadastrado'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-slate-900 block font-mono">
                              R$ {Number(q.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé informativo */}
          <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span>Clique para abrir o registro selecionado</span>
            <span className="text-slate-400 font-medium">CR Serviços Gerais</span>
          </div>
        </div>
      )}
    </div>
  );
};
