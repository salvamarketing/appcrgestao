import jsPDF from 'jspdf';
import { WorkOrder, Customer, Technician, CompanySettings } from '../types';

interface GenerateWarrantyCertificateOptions {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: Technician;
  settings?: CompanySettings;
}

export const generateWarrantyCertificatePDF = async ({
  workOrder,
  customer,
  technician,
  settings,
}: GenerateWarrantyCertificateOptions): Promise<void> => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const companyName = settings?.name || 'CR SERVIÇOS GERAIS';
  const companyCnpj = settings?.cnpj || '52.891.234/0001-89';
  const companyPhone = settings?.phone || '(54) 99123-4567';
  const companyAddress = settings?.address || 'Rua Sinimbu, 1500, Sala 402, Centro';
  const companyCity = settings?.city ? `${settings.city}/${settings.state}` : 'Caxias do Sul/RS';

  // 1. HEADER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(companyName.toUpperCase(), margin, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`CNPJ: ${companyCnpj} • Plantão 24h: ${companyPhone}`, margin, 19);
  doc.text(`${companyAddress} - ${companyCity}`, margin, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('TERMO DE GARANTIA TÉCNICA', pageWidth - margin, 13, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF. OS: ${workOrder.code}`, pageWidth - margin, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 26, { align: 'right' });

  let y = 40;

  // 2. DADOS DO CLIENTE E ATENDIMENTO
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DO CLIENTE & LOCAL DO ATENDIMENTO:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cliente: ${customer?.name || 'Não informado'}`, margin + 4, y + 12);
  doc.text(`CPF/CNPJ: ${customer?.cpfCnpj || 'Não informado'}`, margin + 4, y + 17);
  doc.text(`Telefone: ${customer?.phone || customer?.whatsapp || 'Não informado'}`, margin + 4, y + 22);

  const fullAddress = customer
    ? `${customer.street}, ${customer.number || 'S/N'} - ${customer.neighborhood || ''}, ${customer.city || ''}/${customer.state || ''}`
    : workOrder.locationAddress || 'Endereço cadastrado na OS';

  doc.text(`Endereço: ${fullAddress.slice(0, 55)}`, margin + 95, y + 12);
  doc.text(`Data do Serviço: ${workOrder.scheduledDate} às ${workOrder.scheduledTime}`, margin + 95, y + 17);
  doc.text(`Técnico Responsável: ${technician?.name || 'Equipe Técnica CR'}`, margin + 95, y + 22);

  y += 32;

  // 3. OBJETO DO SERVIÇO & PRAZO
  const warrantyDays = workOrder.report?.warranty || settings?.warrantyDefault || '90 dias de garantia técnica';
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138); // indigo-900
  doc.text('1. PRAZO E ESCOPO DA GARANTIA LEGAL E CONTRATUAL', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Prazo estipulado: ${warrantyDays} (em conformidade com o Artigo 26 do Código de Defesa do Consumidor - CDC).`,
    margin + 4,
    y + 12
  );

  y += 24;

  // 4. O QUE ESTÁ COBERTO
  const coveredText = workOrder.report?.warrantyCovered ||
    '• Desobstrução e fluxo normalizado na tubulação ou ponto de esgoto especificamente trabalhado.\n' +
    '• Mão de obra técnica referente ao serviço discriminado no laudo da presente Ordem de Serviço.\n' +
    '• Peças, anéis de vedação ou reparos hidráulicos fornecidos e instalados comprovadamente pela CR Serviços Gerais.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. O QUE ESTÁ COBERTO PELA GARANTIA:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const coveredLines = doc.splitTextToSize(coveredText, contentWidth - 4);
  doc.text(coveredLines, margin + 2, y);
  y += coveredLines.length * 4 + 4;

  // 5. O QUE NÃO ESTÁ COBERTO E MOTIVOS TÉCNICOS
  const notCoveredText = workOrder.report?.warrantyNotCovered ||
    '• Mau uso superveniente: descarte inadequado de papel higiênico, lenços umedecidos, absorventes, preservativos, gordura sólida ou entulhos de obra após a entrega do serviço testado.\n' +
    '• Vícios estruturais pré-existentes: canos quebrados, afundamento de tubulação de barro, contra-queda na tubulação, raízes de árvores invadindo o duto ou caixas de gordura saturadas por falta de manutenção periódica.\n' +
    '• Intervenção de terceiros: tentativas de desobstrução com arames, cabos não profissionais ou produtos químicos corrosivos (como soda cáustica) após o atendimento técnico.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('3. O QUE NÃO ESTÁ COBERTO E MOTIVOS DE EXCLUSÃO:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const notCoveredLines = doc.splitTextToSize(notCoveredText, contentWidth - 4);
  doc.text(notCoveredLines, margin + 2, y);
  y += notCoveredLines.length * 4 + 4;

  // 6. MOTIVO ESPECÍFICO DE RESSALVA (SE HOUVER)
  if (workOrder.report?.warrantyExclusionsReason) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text(`Ressalva Técnica no Local: ${workOrder.report.warrantyExclusionsReason}`, margin + 4, y + 8);
    y += 18;
  }

  // 7. DECLARAÇÃO DE CONFERÊNCIA E TESTE
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('4. DECLARAÇÃO DE RECEBIMENTO E TESTE DE FLUXO', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Declaro que acompanhei o teste de escoamento e vazão perante o técnico responsável, constatando que o serviço foi entregue em perfeito funcionamento. Estou ciente dos termos de garantia acima descritos.',
    margin + 4,
    y + 10,
    { maxWidth: contentWidth - 8 }
  );

  y += 24;

  // 8. ASSINATURAS
  const signY = Math.min(y + 10, pageHeight - 38);

  // Linha Técnico
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, signY, margin + 80, signY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(technician?.name || 'TÉCNICO OPERACIONAL', margin + 45, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(companyName, margin + 45, signY + 8, { align: 'center' });

  // Linha Cliente
  doc.line(margin + 100, signY, margin + 170, signY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(workOrder.report?.clientSignatureName || customer?.name || 'CLIENTE / RECEBEDOR', margin + 135, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${workOrder.report?.clientSignatureDate || new Date().toLocaleDateString('pt-BR')}`, margin + 135, signY + 8, { align: 'center' });

  // Rodapé
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento vinculado à Ordem de Serviço ${workOrder.code} • Valor Total: R$ ${Number(workOrder.value).toFixed(2)} • CR Serviços Gerais Plantão 24h`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const cleanFileName = `termo-garantia-${workOrder.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  doc.save(cleanFileName);
};
