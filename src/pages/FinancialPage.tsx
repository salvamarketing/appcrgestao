import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';
import { FinancialTransaction, PaymentMethod } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface FinancialPageProps {
  transactions: FinancialTransaction[];
  onRefresh: () => void;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({ transactions, onRefresh }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [filterType, setFilterType] = useState<string>('TODAS');
  const [modalOpen, setModalOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Combustível');
  const [amount, setAmount] = useState(150);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalRevenue = transactions
    .filter((t) => t.type?.toLowerCase() === 'receita')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type?.toLowerCase() === 'despesa')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const netBalance = totalRevenue - totalExpenses;

  const totalPending = transactions
    .filter((t) => t.status === 'pendente')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'receita') return t.type?.toLowerCase() === 'receita';
    if (filterType === 'despesa') return t.type?.toLowerCase() === 'despesa';
    if (filterType === 'pendente') return t.status === 'pendente';
    return true;
  });

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransaction({
        type: 'despesa',
        category,
        description,
        amount: Number(amount),
        paymentMethod,
        date,
        status: 'pago',
        createdByName: user?.name || 'Administrador',
      });
      showToast('Despesa registrada com sucesso!');
      setModalOpen(false);
      setDescription('');
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao registrar despesa', err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID;Data;Tipo;Categoria;Descricao;Valor (R$);Forma de Pagamento;Status\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}";"${t.date}";"${t.type?.toUpperCase()}";"${t.category}";"${(t.description || '').replace(/"/g, '""')}";"${(t.amount || 0).toFixed(2)}";"${t.paymentMethod}";"${t.status}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${Date.now()}.csv`;
    link.click();
    showToast('Planilha exportada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Gestão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
            Gestão Financeira & Caixa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Receitas de serviços prestados, controle de despesas e saldo líquido em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Lançar Despesa
          </button>
        </div>
      </div>

      {/* 4 Cards Principais de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Receita Realizada
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums block">
            R$ {totalRevenue.toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">OS concluídas e compensadas</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Despesas Totais
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-rose-700 tracking-tight tabular-nums block">
            R$ {totalExpenses.toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">Combustível, peças e manutenção</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Saldo Líquido
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight tabular-nums block">
            R$ {netBalance.toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">Resultado operacional em caixa</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Valores Pendentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-amber-700 tracking-tight tabular-nums block">
            R$ {totalPending.toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">Aguardando compensação</p>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Extrato Geral de Movimentações</h3>
            <p className="text-xs text-slate-500 mt-0.5">Histórico cronológico de receitas e custos operacionais</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['TODAS', 'receita', 'despesa', 'pendente'].map((tp) => (
              <button
                key={tp}
                onClick={() => setFilterType(tp)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterType === tp
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tp === 'TODAS' ? 'Todas' : tp}
              </button>
            ))}
          </div>
        </div>

        {/* Versão Mobile (Cards Elegantes em Lista) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhuma movimentação financeira encontrada com este filtro.
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isRev = (t.type || '').toLowerCase() === 'receita';
              return (
                <div key={t.id} className="p-4 flex items-start justify-between gap-3 bg-white">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isRev
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {isRev ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            isRev
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isRev ? 'Receita' : 'Despesa'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.date}</span>
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]">
                          • {t.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-extrabold text-sm block font-mono ${
                        isRev ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isRev ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 inline-block ${
                        t.status === 'pago' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {t.status === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Versão Desktop (Tabela Completa) */}
        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Descrição</th>
                <th className="p-3.5">Forma</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((t) => {
                const isRev = (t.type || '').toLowerCase() === 'receita';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">{t.date}</td>
                    <td className="p-3.5">
                      {isRev ? (
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono">
                          Receita
                        </span>
                      ) : (
                        <span className="bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono">
                          Despesa
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">{t.category}</td>
                    <td className="p-3.5 text-slate-900 max-w-[280px] truncate">{t.description}</td>
                    <td className="p-3.5 font-mono text-slate-500">{t.paymentMethod}</td>
                    <td className="p-3.5">
                      {t.status === 'pago' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-3.5 text-right font-extrabold text-sm tracking-tight tabular-nums ${
                        isRev ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isRev ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançamento de Despesa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Lançar Despesa Operacional
            </h3>
            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Abastecimento de veículo utilitário"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Combustível">Combustível</option>
                    <option value="Peças e Insumos">Peças e Insumos</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Data:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
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
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
