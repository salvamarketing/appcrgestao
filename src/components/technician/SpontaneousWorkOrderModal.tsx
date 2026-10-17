import React, { useState } from 'react';
import { X, Plus, DollarSign, User, Phone, MapPin, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { Customer, Technician, ServiceItem, PaymentMethod } from '../../types';
import { api } from '../../lib/api';
import { useNotification } from '../../context/NotificationContext';

interface SpontaneousWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: Technician | null;
  technicianName: string;
  customers: Customer[];
  services: ServiceItem[];
  onCreatedSuccess: () => void;
}

export const SpontaneousWorkOrderModal: React.FC<SpontaneousWorkOrderModalProps> = ({
  isOpen,
  onClose,
  technician,
  technicianName,
  customers,
  services,
  onCreatedSuccess,
}) => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientStreet, setClientStreet] = useState('');
  const [clientNeighborhood, setClientNeighborhood] = useState('');

  const [problemDescription, setProblemDescription] = useState('Desentupimento / Atendimento Avulso Realizado');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [value, setValue] = useState('250.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isCompletedAlready, setIsCompletedAlready] = useState(true);
  const [customPriceReason, setCustomPriceReason] = useState('Cobrança avulsa negociada no local com o cliente');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalCustomerId = selectedCustomerId;

      // Se for novo cliente no ato
      if (customerMode === 'new') {
        if (!clientName.trim()) {
          showToast('Informe o nome do cliente', '', 'error');
          setLoading(false);
          return;
        }

        const newCust = await api.createCustomer({
          name: clientName.trim(),
          phone: clientPhone.trim() || '(54) 99000-0000',
          whatsapp: clientPhone.trim(),
          email: `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`,
          street: clientStreet.trim() || 'Atendimento no local',
          number: 'S/N',
          neighborhood: clientNeighborhood.trim() || 'Centro',
          city: 'Caxias do Sul',
          state: 'RS',
          cep: '95000-000',
          type: 'residencial',
          cpfCnpj: '',
        });
        finalCustomerId = newCust.id;
      } else {
        if (!finalCustomerId) {
          showToast('Selecione um cliente cadastrado', '', 'error');
          setLoading(false);
          return;
        }
      }

      const numVal = parseFloat(value.replace(',', '.')) || 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Cria a OS avulsa
      const createdWo = await api.createWorkOrder({
        customerId: finalCustomerId,
        serviceIds: selectedServiceId ? [selectedServiceId] : [],
        technicianId: technician?.id || '',
        scheduledDate: todayStr,
        scheduledTime: nowTimeStr,
        problemDescription: problemDescription.trim(),
        value: numVal,
        paymentMethod: paymentMethod,
        paymentStatus: isCompletedAlready ? 'received' : 'pending',
        status: isCompletedAlready ? 'CONCLUIDA' : 'EM_ATENDIMENTO',
        isSpontaneous: true,
        customPriceReason: customPriceReason.trim(),
        createdByName: technicianName,
        timeline: [
          {
            time: nowTimeStr,
            title: 'Lançamento Avulso pelo Técnico',
            description: `Serviço registrado diretamente pelo técnico ${technicianName} em campo (Fim do Caderno).`,
          },
          ...(isCompletedAlready
            ? [
                {
                  time: nowTimeStr,
                  title: 'Serviço Concluído no Ato',
                  description: `Atendimento finalizado com valor de R$ ${numVal.toFixed(2)} pago via ${paymentMethod}.`,
                },
              ]
            : []),
        ],
        notes: `OS Avulsa registrada no local: ${customPriceReason}`,
      });

      // Se foi concluída no ato, aciona a atualização de status com financeiro
      if (isCompletedAlready) {
        await api.updateWorkOrderStatus(createdWo.id, {
          status: 'CONCLUIDA',
          note: `Lançamento avulso concluído por ${technicianName}`,
          userName: technicianName,
          paymentReceived: true,
          paymentMethod: paymentMethod,
        });
      }

      showToast(
        'Lançamento Avulso Concluído!',
        'A Ordem de Serviço foi gravada e o financeiro do administrador foi atualizado instantaneamente.',
        'success'
      );

      onCreatedSuccess();
      onClose();
    } catch (err: any) {
      showToast('Erro ao registrar OS avulsa', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-6 relative my-4 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Lançar Serviço Avulso (Fim do Caderno)
            </h3>
            <p className="text-xs text-slate-500">
              Registre direto no celular o serviço que apareceu na hora ou por mensagem.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Seletor Cliente Novo ou Existente */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Dados do Cliente:
              </label>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    customerMode === 'new'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Novo no Local
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    customerMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Já Cadastrado
                </button>
              </div>
            </div>

            {customerMode === 'new' ? (
              <div className="space-y-2">
                <div>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome completo do cliente *"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    value={clientNeighborhood}
                    onChange={(e) => setClientNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={clientStreet}
                    onChange={(e) => setClientStreet(e.target.value)}
                    placeholder="Endereço (Rua e Número)"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">Selecione o cliente na lista...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.neighborhood || c.city || 'Sem bairro'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Descrição do Serviço */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              O que foi feito no local:
            </label>
            <input
              type="text"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Ex: Desentupimento pia cozinha com máquina K-50"
              required
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Valor do Serviço e Motivo */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Valor Cobrado do Cliente (R$):
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="w-full bg-white border border-emerald-300 rounded-xl pl-8 pr-2.5 py-1.5 font-bold text-sm text-slate-900 focus:outline-none focus:border-emerald-600 tabular-nums text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-[11px] mb-1">
                Motivo / Justificativa do Valor (ex: cobrança por metro, taxa extra):
              </label>
              <input
                type="text"
                value={customPriceReason}
                onChange={(e) => setCustomPriceReason(e.target.value)}
                placeholder="Ex: 5 metros de cabo rotativo a R$ 60/metro"
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">Forma de Pagamento:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-medium"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] mb-1">Situação:</label>
                <button
                  type="button"
                  onClick={() => setIsCompletedAlready(!isCompletedAlready)}
                  className={`w-full py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs ${
                    isCompletedAlready
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-amber-700 border-amber-300'
                  }`}
                >
                  {isCompletedAlready ? '✓ Concluído & Pago' : '⏳ Em Andamento'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Lançar e Alimentar Financeiro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
