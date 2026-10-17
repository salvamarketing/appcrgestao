import React, { useRef } from 'react';
import { X, Printer, Download, Share2, Shield, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { WorkOrder, Quote, Customer, ServiceItem, Technician, CompanySettings } from '../../types';
import jsPDF from 'jspdf';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'work-order' | 'quote' | 'warranty';
  workOrder?: WorkOrder;
  quote?: Quote;
  customer?: Customer;
  services?: ServiceItem[];
  technician?: Technician;
  settings: CompanySettings;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  type,
  workOrder,
  quote,
  customer,
  services = [],
  technician,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
      });

      const isOS = type === 'work-order';
      const title = isOS ? `ORDEM DE SERVIÇO - ${workOrder?.code}` : `ORÇAMENTO - ${quote?.code}`;
      const docCode = isOS ? workOrder?.code : quote?.code;

      // Header block
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(settings.name, 14, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`CNPJ: ${settings.cnpj} | Plantão 24h: ${settings.phone}`, 14, 22);
      doc.text(`${settings.address} - ${settings.city}/${settings.state}`, 14, 27);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(title, 210 - 14, 18, { align: 'right' });

      // Body Customer Info
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', 14, 42);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome / Razão: ${customer?.name || 'Cliente'}`, 14, 49);
      doc.text(`CPF/CNPJ: ${customer?.cpfCnpj || 'Não informado'} | Telefone: ${customer?.phone || ''} | WhatsApp: ${customer?.whatsapp || ''}`, 14, 55);
      doc.text(`Endereço: ${customer?.street || ''}, ${customer?.number || ''} ${customer?.complement ? `(${customer.complement})` : ''} - ${customer?.neighborhood || ''}, ${customer?.city || ''}/${customer?.state || ''}`, 14, 61);

      let yPos = 72;

      if (isOS && workOrder) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DADOS DO ATENDIMENTO', 14, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${workOrder.scheduledDate} às ${workOrder.scheduledTime} | Status: ${workOrder.status}`, 14, yPos);
        yPos += 6;
        doc.text(`Técnico Responsável: ${technician?.name || 'Técnico Autorizado CR'}`, 14, yPos);
        yPos += 6;
        doc.text(`Descrição do Problema: ${workOrder.problemDescription}`, 14, yPos);
        yPos += 10;

        if (workOrder.report) {
          doc.setFont('helvetica', 'bold');
          doc.text('LAUDO TÉCNICO E EXECUÇÃO', 14, yPos);
          yPos += 7;

          doc.setFont('helvetica', 'normal');
          doc.text(`Problema Constatado: ${workOrder.report.problemFound || 'Conforme chamado'}`, 14, yPos);
          yPos += 6;
          doc.text(`Serviço Realizado: ${workOrder.report.servicePerformed || 'Executado com êxito'}`, 14, yPos);
          yPos += 6;
          doc.text(`Materiais Utilizados: ${workOrder.report.materialsUsed || 'Materiais padrão'}`, 14, yPos);
          yPos += 6;
          doc.text(`Garantia: ${workOrder.report.warranty || settings.warrantyDefault}`, 14, yPos);
          yPos += 12;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`VALOR TOTAL: R$ ${workOrder.value.toFixed(2)} (Pagamento: ${workOrder.paymentMethod} - ${workOrder.paymentStatus === 'received' ? 'QUITADO' : 'PENDENTE'})`, 14, yPos);
      } else if (quote) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('ITENS DO ORÇAMENTO', 14, yPos);
        yPos += 7;

        doc.setFontSize(10);
        quote.items.forEach((item, index) => {
          doc.setFont('helvetica', 'normal');
          doc.text(`${index + 1}. ${item.name} (Qtd: ${item.quantity}) - R$ ${item.totalPrice.toFixed(2)}`, 14, yPos);
          yPos += 6;
        });

        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal: R$ ${quote.subtotal.toFixed(2)} | Desconto: R$ ${quote.discount.toFixed(2)} | TOTAL: R$ ${quote.total.toFixed(2)}`, 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`Validade da Proposta: até ${quote.validUntil}`, 14, yPos);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Documento emitido pelo sistema operacional interno da ${settings.name}. Garantia documentada conforme CDC.`, 14, 280);

      doc.save(`${docCode || 'documento'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    }
  };

  const isOS = type === 'work-order';
  const code = isOS ? workOrder?.code : quote?.code;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 print:m-0 print:border-none print:shadow-none print:bg-white text-slate-900">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 print:hidden rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">
              Visualização de Impressão / Documento Oficial
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
              {code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              Imprimir
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 bg-white text-slate-900 font-sans print:p-6"
        >
          {/* Company Header Timbre */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900 flex items-center justify-center p-2 text-white font-extrabold text-xl shrink-0 shadow-md">
                <img
                  src={settings.logoUrl}
                  alt="CR Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span>CR</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight leading-tight">
                  {settings.name.toUpperCase()}
                </h2>
                <p className="text-xs font-semibold text-blue-800 mt-1 uppercase tracking-wider">
                  {settings.commercialName}
                </p>
                <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                  <p>
                    <strong>CNPJ:</strong> {settings.cnpj} • <strong>Plantão 24h:</strong>{' '}
                    {settings.phone}
                  </p>
                  <p>
                    {settings.address} - {settings.city}/{settings.state}
                  </p>
                  <p>
                    <strong>E-mail:</strong> {settings.email} • <strong>Chave PIX:</strong>{' '}
                    {settings.pixKey}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold text-xs tracking-wide">
                {isOS ? 'ORDEM DE SERVIÇO' : 'ORÇAMENTO'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5">{code}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Emissão: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              Identificação do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs text-slate-800">
              <div>
                <span className="font-semibold text-slate-500">Nome / Razão: </span>
                <span className="font-bold text-slate-900">{customer?.name || 'Não informado'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">CPF / CNPJ: </span>
                <span>{customer?.cpfCnpj || 'Não cadastrado'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Telefones: </span>
                <span>
                  {customer?.phone} {customer?.whatsapp ? `| WhatsApp: ${customer.whatsapp}` : ''}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">E-mail: </span>
                <span>{customer?.email || 'Não informado'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-slate-500">Endereço de Atendimento: </span>
                <span>
                  {customer?.street}, {customer?.number}
                  {customer?.complement ? ` (${customer.complement})` : ''} -{' '}
                  {customer?.neighborhood}, {customer?.city}/{customer?.state} - CEP: {customer?.cep}
                </span>
                {customer?.reference && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong>Ponto de Referência:</strong> {customer.reference}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Work Order Specific Sections */}
          {isOS && workOrder && (
            <div className="space-y-6">
              {/* Service Execution & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-white">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Data & Horário
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {workOrder.scheduledDate} às {workOrder.scheduledTime}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Técnico Responsável
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {technician?.name || 'Técnico Especialista CR'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Status do Chamado
                  </span>
                  <span className="text-sm font-bold text-slate-900">{workOrder.status}</span>
                </div>
              </div>

              {/* Description of Problem */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Motivo do Chamado / Descrição Inicial
                </h4>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {workOrder.problemDescription}
                </p>
                {workOrder.notes && (
                  <p className="text-[11px] text-slate-600 mt-2 italic bg-slate-50 p-2 rounded">
                    Observações de atendimento: {workOrder.notes}
                  </p>
                )}
              </div>

              {/* Technical Report (Laudo Técnico) */}
              {workOrder.report && (
                <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/40 space-y-3">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider border-b border-blue-200 pb-1 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-700" />
                    Laudo Técnico Pericial de Atendimento
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <strong className="text-slate-700 block">Problema Constatado:</strong>
                      <p className="text-slate-800">{workOrder.report.problemFound || 'Obstrução / Falha localizada'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700 block">Serviço Executado:</strong>
                      <p className="text-slate-800">{workOrder.report.servicePerformed || 'Desobstrução e reparo completo'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700 block">Materiais Empregados:</strong>
                      <p className="text-slate-800">{workOrder.report.materialsUsed || 'Equipamentos de alta pressão / cabos flexíveis'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700 block">Resultado dos Testes:</strong>
                      <p className="text-slate-800">{workOrder.report.result || 'Fluxo pleno restabelecido e sem vazamentos'}</p>
                    </div>
                  </div>

                  {workOrder.report.technicalNotes && (
                    <div className="text-xs pt-1 border-t border-blue-200">
                      <strong className="text-slate-700">Recomendações Técnicas:</strong>{' '}
                      <span className="text-slate-800">{workOrder.report.technicalNotes}</span>
                    </div>
                  )}

                  {/* Photos preview if present */}
                  {((workOrder.report.beforePhotos && workOrder.report.beforePhotos.length > 0) ||
                    (workOrder.report.afterPhotos && workOrder.report.afterPhotos.length > 0)) && (
                    <div className="pt-2">
                      <strong className="text-[11px] text-slate-700 uppercase block mb-1.5">
                        Registro Fotográfico do Atendimento:
                      </strong>
                      <div className="flex gap-2 overflow-x-auto">
                        {workOrder.report.beforePhotos?.map((p, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden shrink-0">
                            <img src={p} alt="Antes" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 text-[9px] bg-black/70 text-white text-center">
                              Antes
                            </span>
                          </div>
                        ))}
                        {workOrder.report.afterPhotos?.map((p, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden shrink-0">
                            <img src={p} alt="Depois" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 text-[9px] bg-emerald-900/80 text-white text-center">
                              Depois
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial & Warranty Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 block">Condição de Pagamento</span>
                  <span className="font-bold text-sm text-blue-700">
                    {workOrder.paymentMethod} •{' '}
                    {workOrder.paymentStatus === 'received' ? 'PAGAMENTO QUITADO' : 'AGUARDANDO PAGAMENTO'}
                  </span>
                </div>
                <div className="text-right mt-3 sm:mt-0">
                  <span className="text-xs text-slate-500 block font-medium">VALOR TOTAL DO ATENDIMENTO</span>
                  <span className="text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
                    R$ {workOrder.value.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Warranty terms detalhados */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-amber-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-700" />
                    TERMO DE GARANTIA TÉCNICA E LIMITAÇÕES:
                  </strong>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    {workOrder.report?.warranty || settings.warrantyDefault}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                    <span className="font-bold text-emerald-800 block mb-1">✓ O QUE ESTÁ COBERTO:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {workOrder.report?.warrantyCovered ||
                        '• Fluxo e desobstrução no ponto trabalhado.\n• Mão de obra técnica referente ao serviço discriminado.\n• Peças/reparos fornecidos pela empresa.'}
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                    <span className="font-bold text-rose-800 block mb-1">✕ O QUE NÃO COBRE & MOTIVOS:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {workOrder.report?.warrantyNotCovered ||
                        '• Mau uso (descarte de papel, lenços, gordura ou entulhos após o serviço).\n• Vícios estruturais (canos quebrados, raízes de árvores, contra-queda).\n• Intervenção de terceiros ou químicos corrosivos.'}
                    </p>
                  </div>
                </div>
                {workOrder.report?.warrantyExclusionsReason && (
                  <p className="text-[11px] font-semibold text-rose-900 pt-1">
                    <strong>Ressalva Técnica no Local:</strong> {workOrder.report.warrantyExclusionsReason}
                  </p>
                )}
              </div>

              {/* Signature Blocks */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    {technician?.name || 'Técnico Responsável'}
                  </p>
                  <p className="text-[10px] text-slate-500">CR Serviços Gerais</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    {workOrder.report?.clientSignatureName || customer?.name || 'Assinatura do Cliente'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Serviço conferido e recebido em {workOrder.scheduledDate}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quote Specific Sections */}
          {!isOS && quote && (
            <div className="space-y-6">
              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item / Descrição do Serviço</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quote.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-slate-900">{it.name}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">{it.quantity}</td>
                        <td className="p-3 text-right text-slate-700">R$ {it.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          R$ {it.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Discount Calculation */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">R$ {quote.subtotal.toFixed(2)}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Desconto Especial:</span>
                      <span className="font-semibold">- R$ {quote.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-900">
                    <span>VALOR TOTAL:</span>
                    <span className="text-emerald-700 font-bold tabular-nums">R$ {quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Observations & Validity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <p>
                  <strong>Validade da Proposta:</strong> Válido até{' '}
                  <span className="font-bold text-blue-900">{quote.validUntil}</span>.
                </p>
                {quote.notes && (
                  <p>
                    <strong>Observações:</strong> {quote.notes}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Preços incluem mão de obra qualificada, máquinas rotativas e garantia padrão de 90
                  dias conforme CDC.
                </p>
              </div>

              {/* Acceptance line */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">CR Serviços Gerais</p>
                  <p className="text-[10px] text-slate-500">Depto. Comercial / Operacional</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">De Acordo / Aceite do Cliente</p>
                  <p className="text-[10px] text-slate-500">Assinatura ou Aprovação Digital</p>
                </div>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            {settings.name} • {settings.commercialName} • Plantão Emergencial 24h: {settings.phone} •{' '}
            {settings.email}
          </div>
        </div>
      </div>
    </div>
  );
};
