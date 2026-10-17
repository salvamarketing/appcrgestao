import jsPDF from 'jspdf';
import { WorkOrder, Customer, Technician, CompanySettings } from '../types';

interface GeneratePdfOptions {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: Technician;
  settings?: CompanySettings;
}

const defaultSettings: CompanySettings = {
  name: 'CR Serviços Gerais',
  commercialName: 'CR Serviços Gerais',
  cnpj: '52.891.234/0001-89',
  phone: '(54) 99123-4567',
  whatsapp: '(54) 99123-4567',
  email: 'contato@crservicosgerais.com.br',
  address: 'Rua Sinimbu, 1500, Sala 402, Centro',
  city: 'Caxias do Sul',
  state: 'RS',
  emergency24h: true,
  logoUrl: '',
  warrantyDefault: '90 dias de garantia técnica CR Serviços Gerais conforme Art. 26 do CDC.',
  pixKey: '52.891.234/0001-89',
  pixKeyType: 'CNPJ',
};

export const generateWorkOrderPDF = async ({
  workOrder,
  customer,
  technician,
  settings = defaultSettings,
}: GeneratePdfOptions): Promise<void> => {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });

    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // 1. HEADER (Dark Blue Header)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.name || 'CR SERVIÇOS GERAIS', margin, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`CNPJ: ${settings.cnpj} • Plantão: ${settings.phone}`, margin, 18);
    doc.text(`${settings.address} - ${settings.city}/${settings.state}`, margin, 24);

    // Document Type & Code on top right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text('LAUDO TÉCNICO & RECIBO', pageWidth - margin, 13, { align: 'right' });

    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(workOrder.code, pageWidth - margin, 21, { align: 'right' });

    let y = 38;

    // 2. DADOS DO CLIENTE
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. DADOS DO CLIENTE E ENDEREÇO DO ATENDIMENTO', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Cliente: ${customer?.name || 'Cliente'}`, margin + 4, y + 12);
    doc.text(`Telefone / WhatsApp: ${customer?.phone || customer?.whatsapp || 'Não informado'}`, margin + 4, y + 17);

    const addressText = workOrder.locationAddress || 
      (customer ? `${customer.street}, ${customer.number} - ${customer.neighborhood}, ${customer.city}/${customer.state}` : 'Endereço no local do chamado');
    doc.text(`Endereço: ${addressText}`, margin + 4, y + 22);

    y += 28;

    // 3. DADOS DA OPERAÇÃO / ATENDIMENTO
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('2. INFORMAÇÕES DO ATENDIMENTO TÉCNICO', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Data Expedida: ${workOrder.scheduledDate} às ${workOrder.scheduledTime}`, margin + 4, y + 12);
    doc.text(`Técnico Responsável: ${technician?.name || 'Técnico Especialista CR'}`, margin + 4, y + 17);

    // Status badge on the right
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Status: ${workOrder.status}`, pageWidth - margin - 4, y + 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Forma Pgto: ${workOrder.paymentMethod}`, pageWidth - margin - 4, y + 17, { align: 'right' });

    y += 26;

    // 4. DESCRIÇÃO DO PROBLEMA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Descrição do Chamado / Problema Relatado:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const problemLines = doc.splitTextToSize(workOrder.problemDescription || 'Manutenção e vistoria técnica solicitada.', contentWidth);
    doc.text(problemLines, margin, y);
    y += problemLines.length * 4.2 + 3;

    // 5. REGISTRO FOTOGRÁFICO (FOTO ANTES E FOTO DEPOIS)
    const photoBefore = workOrder.photoBefore || workOrder.report?.beforePhotos?.[0];
    const photoAfter = workOrder.photoAfter || workOrder.report?.afterPhotos?.[0];

    if (photoBefore || photoAfter) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('3. REGISTRO FOTOGRÁFICO DO ATENDIMENTO (EVIDÊNCIAS)', margin, y);
      y += 4;

      const imgWidth = 85;
      const imgHeight = 44;

      // Photo Before
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, imgWidth, imgHeight, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Foto 1: Antes do Serviço (Situação Inicial)', margin + 3, y + 4.5);

      if (photoBefore) {
        try {
          doc.addImage(photoBefore, 'JPEG', margin + 3, y + 6, imgWidth - 6, imgHeight - 8);
        } catch {
          doc.setFontSize(7.5);
          doc.text('(Registro fotográfico anexado)', margin + 4, y + 20);
        }
      } else {
        doc.setFontSize(7.5);
        doc.text('(Sem foto do antes registrada)', margin + 4, y + 20);
      }

      // Photo After
      const secondX = margin + imgWidth + 12;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(secondX, y, imgWidth, imgHeight, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('Foto 2: Serviço Pronto / Concluído', secondX + 3, y + 4.5);

      if (photoAfter) {
        try {
          doc.addImage(photoAfter, 'JPEG', secondX + 3, y + 6, imgWidth - 6, imgHeight - 8);
        } catch {
          doc.setFontSize(7.5);
          doc.text('(Registro fotográfico anexado)', secondX + 4, y + 20);
        }
      } else {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('(Sem foto de conclusão registrada)', secondX + 4, y + 20);
      }

      y += imgHeight + 4;
    }

    // 6. LAUDO TÉCNICO COMPLETO
    const reportText = workOrder.technicalReportText || 
      (workOrder.report ? `${workOrder.report.problemFound}\n${workOrder.report.servicePerformed}\n${workOrder.report.materialsUsed}` : '') ||
      'Serviço executado com conformidade técnica, maquinário especializado e teste de estanqueidade sem refluxos ou vazamentos.';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('4. LAUDO TÉCNICO OPERACIONAL & CONCLUSÃO', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const reportLines = doc.splitTextToSize(reportText, contentWidth);
    // Limit lines to fit on page
    const maxLines = Math.min(reportLines.length, 12);
    for (let i = 0; i < maxLines; i++) {
      doc.text(reportLines[i], margin, y);
      y += 3.8;
    }
    y += 3;

    // 7. RECIBO E DEMONSTRATIVO FINANCEIRO
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(49, 46, 129); // indigo-900
    doc.text('5. RECIBO DE PAGAMENTO & QUITAÇÃO', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(67, 56, 202);
    doc.text(`Forma de Pagamento: ${workOrder.paymentMethod}`, margin + 4, y + 12);
    doc.text(`Situação: ${workOrder.paymentStatus === 'received' ? 'VALOR QUITADO NO ATO DO ATENDIMENTO' : 'AGUARDANDO COMPENSAÇÃO / FATURAMENTO'}`, margin + 4, y + 17);

    // Large value on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`R$ ${Number(workOrder.value || 0).toFixed(2)}`, pageWidth - margin - 4, y + 14, { align: 'right' });

    y += 26;

    // 8. TERMO DE GARANTIA E ASSINATURAS
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Garantia: ${settings.warrantyDefault}`, margin, y);
    y += 10;

    // Signature lines
    const sigColWidth = (contentWidth - 10) / 2;
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.line(margin, y, margin + sigColWidth, y);
    doc.line(margin + sigColWidth + 10, y, pageWidth - margin, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(technician?.name || 'Técnico Responsável (CR)', margin + sigColWidth / 2, y + 4, { align: 'center' });
    doc.text(customer?.name || 'Assinatura do Cliente', margin + sigColWidth + 10 + sigColWidth / 2, y + 4, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('CR Serviços Gerais', margin + sigColWidth / 2, y + 8, { align: 'center' });
    doc.text('Declaro ter recebido e conferido o serviço', margin + sigColWidth + 10 + sigColWidth / 2, y + 8, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Documento gerado eletronicamente pelo Sistema Operacional da CR Serviços Gerais • ${new Date().toLocaleDateString('pt-BR')}`, margin, 290);

    // Save PDF
    const filename = `Laudo_Recibo_${workOrder.code || 'OS'}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('Erro ao gerar Laudo e Recibo em PDF:', err);
    throw err;
  }
};

export const exportSingleWorkOrderCSV = (
  workOrder: WorkOrder,
  customer?: Customer,
  technician?: Technician
): void => {
  const headers = 'Campo;Valor\n';
  const data = [
    `"Código da OS" ; "${workOrder.code}"`,
    `"Status" ; "${workOrder.status}"`,
    `"Data Expedida" ; "${workOrder.scheduledDate}"`,
    `"Horário" ; "${workOrder.scheduledTime}"`,
    `"Cliente" ; "${customer?.name || 'Cliente'}"`,
    `"Telefone / WhatsApp" ; "${customer?.phone || customer?.whatsapp || ''}"`,
    `"Endereço do Atendimento" ; "${workOrder.locationAddress || (customer ? `${customer.street}, ${customer.number} - ${customer.neighborhood}, ${customer.city}` : '')}"`,
    `"Técnico Responsável" ; "${technician?.name || 'Técnico Especialista'}"`,
    `"Descrição do Problema" ; "${(workOrder.problemDescription || '').replace(/"/g, '""')}"`,
    `"Laudo Técnico" ; "${(workOrder.technicalReportText || workOrder.report?.servicePerformed || '').replace(/"/g, '""')}"`,
    `"Valor do Serviço (R$)" ; "${Number(workOrder.value || 0).toFixed(2)}"`,
    `"Forma de Pagamento" ; "${workOrder.paymentMethod}"`,
    `"Situação do Pagamento" ; "${workOrder.paymentStatus}"`,
    `"Observações Internas" ; "${(workOrder.notes || '').replace(/"/g, '""')}"`,
    `"Data de Criação" ; "${workOrder.createdAt || ''}"`
  ].join('\n');

  const blob = new Blob(['\uFEFF' + headers + data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Resumo_${workOrder.code || 'OS'}_Planilha.csv`;
  link.click();
};
