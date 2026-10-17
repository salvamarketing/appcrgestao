import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  MessageSquare,
  ArrowRight,
  ClipboardList,
  Edit2,
  Trash2,
  X,
  Send,
  FileSpreadsheet
} from 'lucide-react';
import { Quote, QuoteStatus, Customer, ServiceItem, QuoteItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { hasPermission } from '../utils/permissions';

interface QuotesPageProps {
  quotes: Quote[];
  customers: Customer[];
  services: ServiceItem[];
  onRefresh: () => void;
  onOpenPrintModal: (q: Quote) => void;
  onOpenWhatsApp?: (payload: { quote?: Quote; customer?: Customer }) => void;
  onNavigateToWorkOrders: (woId?: string) => void;
}

export const QuotesPage: React.FC<QuotesPageProps> = ({
  quotes,
  customers,
  services,
  onRefresh,
  onOpenPrintModal,
  onOpenWhatsApp,
  onNavigateToWorkOrders,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Form states
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('2026-09-30');
  const [formNotes, setFormNotes] = useState('');
  const [formDiscount, setFormDiscount] = useState(0);
  const [formItems, setFormItems] = useState<
    { serviceId: string; name: string; quantity: number; unitPrice: number; totalPrice: number }[]
  >([]);

  const filteredQuotes = quotes.filter((q) => {
    const matchesStatus = filterStatus === 'TODOS' || q.status === filterStatus;
    const cust = customers.find((c) => c.id === q.customerId);
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      q.code.toLowerCase().includes(qLower) ||
      (cust && cust.name.toLowerCase().includes(qLower)) ||
      (q.notes && q.notes.toLowerCase().includes(qLower));
    return matchesStatus && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    const initialCust = customers[0]?.id || '';
    const initialService = services[0];
    setFormCustomerId(initialCust);
    setFormValidUntil('2026-09-30');
    setFormNotes('Pagamento 50% no início e 50% após conclusão. Garantia legal de 90 dias.');
    setFormDiscount(0);
    if (initialService) {
      setFormItems([
        {
          serviceId: initialService.id,
          name: initialService.name,
          quantity: 1,
          unitPrice: initialService.price,
          totalPrice: initialService.price,
        },
      ]);
    } else {
      setFormItems([]);
    }
    setModalOpen(true);
  };

  const handleAddItem = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;
    setFormItems((prev) => [
      ...prev,
      {
        serviceId: s.id,
        name: s.name,
        quantity: 1,
        unitPrice: s.price,
        totalPrice: s.price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setFormItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validQty = Math.max(1, qty);
        return {
          ...it,
          quantity: validQty,
          totalPrice: validQty * it.unitPrice,
        };
      })
    );
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setFormItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validPrice = Math.max(0, price);
        return {
          ...it,
          unitPrice: validPrice,
          totalPrice: it.quantity * validPrice,
        };
      })
    );
  };

  const calculateSubtotal = () => formItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const calculateTotal = () => Math.max(0, calculateSubtotal() - Number(formDiscount || 0));

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      showToast('Adicione ao menos um serviço ao orçamento', undefined, 'warning');
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      await api.createQuote({
        customerId: formCustomerId,
        items: formItems,
        subtotal,
        discount: Number(formDiscount),
        total,
        status: 'PENDENTE',
        validUntil: formValidUntil,
        notes: formNotes,
        createdByName: user?.name || 'Comercial CR',
      });

      showToast('Orçamento gerado com sucesso!');
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao gerar orçamento', err.message, 'error');
    }
  };

  // Convert Quote to Work Order (REGRA 1)
  const handleConvertToWorkOrder = async (quote: Quote) => {
    try {
      setConvertingId(quote.id);
      const res = await api.convertQuoteToWorkOrder(quote.id, user?.name || 'Comercial CR');
      showToast(
        'Orçamento convertido com sucesso!',
        `Nova Ordem de Serviço ${res.workOrder.code} gerada e agendada!`,
        'success'
      );
      onRefresh();
      // Navigate to work orders
      onNavigateToWorkOrders(res.workOrder.id);
    } catch (err: any) {
      showToast('Erro ao converter em OS', err.message, 'error');
    } finally {
      setConvertingId(null);
    }
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      await api.updateQuoteStatus(quoteId, newStatus);
      showToast(`Status do orçamento atualizado para ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar status', err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!quoteToDelete) return;
    try {
      await api.deleteQuote(quoteToDelete.id);
      showToast('Orçamento excluído com sucesso.');
      setDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir orçamento', err.message, 'error');
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'PENDENTE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            PENDENTE
          </span>
        );
      case 'APROVADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            APROVADO
          </span>
        );
      case 'CONVERTIDO_OS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" /> CONVERTIDO EM OS
          </span>
        );
      case 'RECUSADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            RECUSADO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = 'Código;Data;Validade;Cliente;Bairro;Total (R$);Status;Itens\n';
    const rows = filteredQuotes
      .map((q) => {
        const cust = customers.find((c) => c.id === q.customerId);
        const itemsSummary = q.items.map((it) => `${it.name} (${it.quantity}x)`).join(' + ');
        return `"${q.code}";"${q.createdAt}";"${q.validUntil}";"${cust?.name || 'Cliente'}";"${cust?.neighborhood || ''}";"${(q.total || 0).toFixed(2)}";"${q.status}";"${itemsSummary}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamentos-cr-${Date.now()}.csv`;
    link.click();
    showToast('Lista de Orçamentos exportada para Excel/CSV!');
  };

  const totalQuotesCount = quotes.length;
  const pendingQuotesCount = quotes.filter(
    (q) => q.status === 'PENDENTE' || (q.status as string) === 'pending' || (q.status as string) === 'sent'
  ).length;
  const approvedQuotesCount = quotes.filter(
    (q) => q.status === 'APROVADO' || (q.status as string) === 'approved'
  ).length;
  const convertedQuotesCount = quotes.filter((q) => q.status === 'CONVERTIDO_OS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Gestão e Emissão de Orçamentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie propostas comerciais detalhadas, envie via WhatsApp, imprima PDF e converta em OS em 1 clique
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar Excel / CSV
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* 4 Main Operational KPI Cards (Standardized font-display tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Orçamentos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Orçamentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {String(totalQuotesCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">emitidos</span>
          </div>
        </div>

        {/* Card 2: Pendentes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Pendentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-700 tracking-tight tabular-nums">
              {String(pendingQuotesCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-amber-700 font-semibold">em análise</span>
          </div>
        </div>

        {/* Card 3: Aprovados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Aprovados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {String(approvedQuotesCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">aceitos</span>
          </div>
        </div>

        {/* Card 4: Convertidos em OS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Convertidos em OS
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight tabular-nums">
              {String(convertedQuotesCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-indigo-700 font-semibold">em execução</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {['TODOS', 'PENDENTE', 'APROVADO', 'CONVERTIDO_OS', 'RECUSADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, cliente ou serviço..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Quotes List Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
          Nenhum orçamento encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => {
            const cust = customers.find((c) => c.id === quote.customerId);

            return (
              <div
                key={quote.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-amber-700 font-mono tracking-tight">
                        {quote.code}
                      </span>
                      {getStatusBadge(quote.status)}
                      <span className="text-xs text-slate-500">
                        Válido até: <strong className="text-slate-700 font-medium">{quote.validUntil}</strong>
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mt-1">{cust?.name || 'Cliente'}</h3>
                    <p className="text-xs text-slate-500">
                      {cust?.street}, {cust?.number} - {cust?.neighborhood} • Tel: {cust?.phone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* REGRA 1: Convert to OS button */}
                    {quote.status !== 'CONVERTIDO_OS' && (
                      <button
                        onClick={() => handleConvertToWorkOrder(quote)}
                        disabled={convertingId === quote.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        {convertingId === quote.id ? 'Gerando OS...' : 'Converter em Ordem de Serviço'}
                      </button>
                    )}

                    {quote.status === 'PENDENTE' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(quote.id, 'APROVADO')}
                          className="px-2.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold"
                          title="Marcar como Aprovado pelo cliente"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(quote.id, 'RECUSADO')}
                          className="px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-semibold"
                          title="Marcar como Recusado"
                        >
                          Recusar
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onOpenPrintModal(quote)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                      title="Imprimir e Baixar PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      PDF / Imprimir
                    </button>

                    {cust?.whatsapp && (
                      <a
                        href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(cust.name)},%20segue%20a%20proposta%20de%20orçamento%20(${quote.code})%20da%20CR%20Serviços%20Gerais%20no%20valor%20de%20R$%20${quote.total.toFixed(2)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="Enviar link direto via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}

                    {onOpenWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp({ quote, customer: cust })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
                        title="Abrir Modelos Formatados de WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

                    {hasPermission(user?.role, 'records:delete') && (
                      <button
                        onClick={() => {
                          setQuoteToDelete(quote);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
                        title="Excluir Orçamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="mt-4 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item / Serviço</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-right">Unitário</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {quote.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-900">{it.name}</td>
                          <td className="p-2.5 text-center font-semibold">{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            R$ {it.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            R$ {it.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total and Notes */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <p className="text-xs text-slate-500 italic">
                    {quote.notes || 'Condições padrão de pagamento e garantia de 90 dias.'}
                  </p>

                  <div className="flex items-center gap-4 self-end">
                    {quote.discount > 0 && (
                      <span className="text-xs text-rose-600 font-medium">
                        Desconto: -R$ {quote.discount.toFixed(2)}
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                        Valor Total Proposta
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                        R$ {Number(quote.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Quote */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Novo Orçamento Comercial
            </h3>

            <form onSubmit={handleSaveQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cliente:</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.neighborhood})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Validade da Proposta:</label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Service Items Selection */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Itens e Serviços da Proposta:</span>
                  <div className="flex items-center gap-2">
                    <select
                      id="service-picker"
                      className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-1.5 focus:border-blue-600"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled>
                        + Adicionar serviço do catálogo...
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (R$ {s.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formItems.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Nenhum item adicionado ainda. Escolha no menu acima.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200"
                      >
                        <span className="flex-1 font-medium text-slate-900 truncate">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                            className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Unit.:</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                            className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 text-right font-mono"
                          />
                        </div>
                        <span className="w-20 text-right font-bold text-emerald-700 font-mono">
                          R$ {item.totalPrice.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount & Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Desconto Comercial (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center text-right">
                  <span className="text-[11px] text-slate-500">Valor Total Calculado:</span>
                  <span className="text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
                    R$ {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Termos e Observações:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Gerar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Orçamento?"
        message="A exclusão removerá esta proposta comercial do histórico da empresa."
        itemName={quoteToDelete?.code}
      />
    </div>
  );
};
