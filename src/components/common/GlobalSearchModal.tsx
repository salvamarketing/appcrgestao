import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ClipboardList, Users, FileText, Wrench, ArrowRight } from 'lucide-react';
import { Customer, ServiceItem, Quote, WorkOrder } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  workOrders: WorkOrder[];
  quotes: Quote[];
  services: ServiceItem[];
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onSelectCustomer: (c: Customer) => void;
  onSelectQuote: (q: Quote) => void;
  onSelectService: (s: ServiceItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  customers,
  workOrders,
  quotes,
  services,
  onSelectWorkOrder,
  onSelectCustomer,
  onSelectQuote,
  onSelectService
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && !isOpen) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          // can trigger open from parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const filteredWorkOrders = cleanQuery
    ? workOrders.filter(
        (wo) =>
          wo.code.toLowerCase().includes(cleanQuery) ||
          wo.problemDescription.toLowerCase().includes(cleanQuery) ||
          wo.scheduledDate.includes(cleanQuery)
      )
    : [];

  const filteredCustomers = cleanQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.phone.includes(cleanQuery) ||
          c.whatsapp.includes(cleanQuery) ||
          c.neighborhood.toLowerCase().includes(cleanQuery) ||
          c.street.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredQuotes = cleanQuery
    ? quotes.filter(
        (q) =>
          q.code.toLowerCase().includes(cleanQuery) ||
          (q.notes && q.notes.toLowerCase().includes(cleanQuery))
      )
    : [];

  const filteredServices = cleanQuery
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.category.toLowerCase().includes(cleanQuery) ||
          s.description.toLowerCase().includes(cleanQuery)
      )
    : [];

  const hasResults =
    filteredWorkOrders.length > 0 ||
    filteredCustomers.length > 0 ||
    filteredQuotes.length > 0 ||
    filteredServices.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código de OS, cliente, telefone, endereço, serviço..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-white text-slate-500 hover:text-slate-900 border border-slate-200 shadow-2xs"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!cleanQuery ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Digite ao menos uma palavra, código (ex: "OS-0125", "Aurora", "Pia") ou telefone para buscar em toda a base.
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhum resultado encontrado para <span className="text-slate-900 font-semibold">"{query}"</span>.
            </div>
          ) : (
            <>
              {/* Work Orders */}
              {filteredWorkOrders.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                    Ordens de Serviço ({filteredWorkOrders.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredWorkOrders.map((wo) => {
                      const cust = customers.find((c) => c.id === wo.customerId);
                      return (
                        <div
                          key={wo.id}
                          onClick={() => {
                            onSelectWorkOrder(wo);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-blue-600 font-mono">{wo.code}</span>
                              <span className="text-xs text-slate-900 font-semibold">
                                {cust?.name || 'Cliente'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {wo.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                              {wo.problemDescription}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-600">
                              R$ {wo.value.toFixed(2)}
                            </span>
                            <p className="text-[10px] text-slate-400">{wo.scheduledDate}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customers */}
              {filteredCustomers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Clientes ({filteredCustomers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all shadow-2xs"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">
                            {c.neighborhood} • {c.street}, {c.number}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500 shrink-0">
                          <p>{c.phone}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">{c.whatsapp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {filteredQuotes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Orçamentos ({filteredQuotes.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredQuotes.map((q) => {
                      const cust = customers.find((c) => c.id === q.customerId);
                      return (
                        <div
                          key={q.id}
                          onClick={() => {
                            onSelectQuote(q);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 cursor-pointer transition-all shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-amber-600 font-mono">{q.code}</span>
                              <span className="text-xs text-slate-900 font-medium">{cust?.name || 'Cliente'}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Status: <span className="text-slate-700 font-medium">{q.status}</span>
                            </p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">
                            R$ {q.total.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Services */}
              {filteredServices.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    Catálogo de Serviços ({filteredServices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredServices.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectService(s);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all shadow-2xs"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.category} • Duração est.: {s.estimatedDuration}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600">
                          R$ {s.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
