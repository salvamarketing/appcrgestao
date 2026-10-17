import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  X,
  Phone,
  User,
  MapPin,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { Customer, WorkOrder, Quote, CompanySettings, Technician } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultRecipientName?: string;
  workOrder?: WorkOrder;
  quote?: Quote;
  customer?: Customer;
  technician?: Technician;
  technicians?: Technician[];
  settings: CompanySettings;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultRecipientName = '',
  workOrder,
  quote,
  customer,
  technician,
  technicians = [],
  settings,
}) => {
  const { showToast } = useNotification();
  const [copied, setCopied] = useState(false);

  // Identifica técnico atribuído
  const assignedTech =
    technician ||
    (workOrder?.technicianId ? technicians.find((t) => t.id === workOrder.technicianId) : undefined);

  // Destinatário alvo: 'technician' ou 'customer'
  const [targetType, setTargetType] = useState<'technician' | 'customer'>(
    assignedTech ? 'technician' : 'customer'
  );

  const customerPhone = defaultPhone || customer?.whatsapp || customer?.phone || '';
  const techPhone = assignedTech?.whatsapp || assignedTech?.phone || '54996362178';

  const [phoneNumber, setPhoneNumber] = useState(
    targetType === 'technician' && techPhone ? techPhone : customerPhone
  );
  const [recipientName, setRecipientName] = useState(
    targetType === 'technician' && assignedTech?.name
      ? assignedTech.name
      : defaultRecipientName || customer?.name || 'Cliente'
  );

  const companyName = settings.commercialName || settings.name || 'CR Serviços Gerais';
  const pixKey = settings.pixKey || '42.891.304/0001-92';
  const warranty = settings.warrantyDefault || '90 dias de garantia conforme CDC.';

  // Endereço exato do lançamento feito pelo administrador
  const fullAddress =
    workOrder?.locationAddress ||
    (customer?.street
      ? `${customer.street}, ${customer.number || 'S/N'}${customer.complement ? ' - ' + customer.complement : ''} - ${customer.neighborhood || ''}, ${customer.city || 'Caxias do Sul'}${customer.state ? '/' + customer.state : ''}`
      : 'Endereço a confirmar');

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;

  // Constrói a mensagem consolidada e completa solicitada pelo usuário
  const buildConsolidatedMessage = (type: 'dispatch_route' | 'pix_completion' | 'quote'): string => {
    if (type === 'pix_completion') {
      return `Olá, *${customer?.name || recipientName}*!\n\nSeu atendimento pela *${companyName}* foi finalizado com sucesso! ✅\n\n👤 *Cliente:* ${customer?.name || recipientName}\n🔧 *Serviço:* ${workOrder?.problemDescription || 'Atendimento Concluído'}\n📄 *OS:* ${workOrder?.code || 'OS'}\n💰 *Valor Final:* R$ ${(workOrder?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🛡️ *Garantia:* ${warranty}\n\n🔑 *Chave PIX:* ${pixKey}\n\nAssim que realizar o pagamento, pode nos enviar o comprovante por aqui. Agradecemos pela confiança!`;
    }

    if (type === 'quote' && quote) {
      return `Olá, *${recipientName}*! Tudo bem?\n\nAqui é da *${companyName}*.\n\nSegue o resumo do seu orçamento:\n📄 *Proposta:* ${quote.code}\n💰 *Valor Total:* R$ ${(quote.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🛡️ *Garantia:* ${warranty}\n\n💳 *Chave PIX:* ${pixKey}\n\nPodemos confirmar a execução do serviço? Ficamos à disposição!`;
    }

    // Padrão Primário: Encaminhamento completo com Rota Maps, Endereço exato e PIX
    const clientNameStr = customer?.name || 'Cliente';
    const clientPhoneStr = customer?.phone || customer?.whatsapp || 'Não informado';
    const problemStr = workOrder?.problemDescription || 'Atendimento Operacional';
    const dateStr = workOrder?.scheduledDate || 'Hoje';
    const timeStr = workOrder?.scheduledTime || 'Imediato';
    const valStr = (workOrder?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const codeStr = workOrder?.code || 'OS';

    return `🚨 *ENCAMINHAMENTO DE ORDEM DE SERVIÇO - ${companyName.toUpperCase()}*\n\n` +
      `👤 *Cliente:* ${clientNameStr}\n` +
      `📞 *Contato do Cliente:* ${clientPhoneStr}\n` +
      `📍 *Endereço do Local:* ${fullAddress}\n\n` +
      `🗺️ *Link Direto Google Maps (Clique para Iniciar Navegação):*\n${mapsUrl}\n\n` +
      `🚗 *Link Waze (Alternativo):*\n${wazeUrl}\n\n` +
      `🔧 *Serviço / Problema:* ${problemStr}\n` +
      `📅 *Data e Horário Previsto:* ${dateStr} às ${timeStr}\n` +
      `💰 *Valor do Atendimento:* R$ ${valStr}\n` +
      `🔑 *Chave PIX da Empresa:* ${pixKey}\n` +
      `📝 *Código da OS:* ${codeStr}`;
  };

  const initialMode = quote ? 'quote' : 'dispatch_route';
  const [templateMode, setTemplateMode] = useState<'dispatch_route' | 'pix_completion' | 'quote'>(initialMode);
  const [message, setMessage] = useState(buildConsolidatedMessage(initialMode));

  // Sincroniza ao alternar modo ou destinatário
  useEffect(() => {
    if (targetType === 'technician') {
      setPhoneNumber(techPhone || '');
      setRecipientName(assignedTech?.name || 'Técnico Operacional');
    } else {
      setPhoneNumber(customerPhone || '');
      setRecipientName(customer?.name || defaultRecipientName || 'Cliente');
    }
  }, [targetType, assignedTech, customerPhone, techPhone]);

  useEffect(() => {
    setMessage(buildConsolidatedMessage(templateMode));
  }, [templateMode, customer, workOrder, quote, recipientName, fullAddress]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('Texto copiado com sucesso!', 'Pronto para colar em qualquer chat.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanNumber) {
      showToast('Número de WhatsApp inválido', 'Informe o número com DDD.', 'error');
      return;
    }
    const fullNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleOpenGoogleMapsDirectly = () => {
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Compacto & Mobile */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                WhatsApp com Rota Maps
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {workOrder?.code ? `Ordem de Serviço ${workOrder.code}` : 'Envio Operacional CR'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Seletor de Destinatário: Técnico vs Cliente */}
          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Destino da Mensagem
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('technician')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  targetType === 'technician'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Para o Técnico</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal truncate">
                  {assignedTech?.name || 'Técnico de Campo'} ({techPhone || 'com rota'})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('customer')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  targetType === 'customer'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Para o Cliente</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal truncate">
                  {customer?.name || 'Cliente'} ({customerPhone || 'contato'})
                </span>
              </button>
            </div>
          </div>

          {/* Nome e Telefone do Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nome:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                WhatsApp com DDD:
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="(54) 99999-0000"
                />
              </div>
            </div>
          </div>

          {/* Destaque do Endereço com botão direto para o Google Maps */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Localização Lançada pelo Administrador:
                  </span>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5 leading-snug break-words">
                    {fullAddress}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenGoogleMapsDirectly}
              className="w-full min-h-[38px] py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Testar e Abrir Link no Google Maps</span>
            </button>
          </div>

          {/* Opções de Modelo Rápido */}
          <div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTemplateMode('dispatch_route')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                  templateMode === 'dispatch_route'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🗺️ Rota Maps & Detalhes
              </button>
              <button
                type="button"
                onClick={() => setTemplateMode('pix_completion')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                  templateMode === 'pix_completion'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ✅ Conclusão & PIX
              </button>
            </div>
          </div>

          {/* Textarea com a mensagem formatada */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Mensagem Automática:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed custom-scrollbar resize-none"
            />
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Abrir no WhatsApp Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
