import React, { useState, useRef } from 'react';
import {
  Wrench,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  PenTool,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  User,
  DollarSign,
  ArrowLeft,
  Upload,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Plus,
  X
} from 'lucide-react';
import { WorkOrder, Customer, Technician, ServiceItem, CompanySettings } from '../../types';
import { api } from '../../lib/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { AddressGpsLinks } from '../common/AddressGpsLinks';
import { SpontaneousWorkOrderModal } from './SpontaneousWorkOrderModal';
import { generateWarrantyCertificatePDF } from '../../utils/warrantyPdfGenerator';
import { 
  formatCurrencyBRL, 
  formatDatePTBR, 
  getWorkOrderStatusStyle, 
  readFileAsDataUrl 
} from '../../core';

interface MobileTechnicianViewProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  technicians: Technician[];
  services: ServiceItem[];
  settings: CompanySettings;
  onRefresh: () => void;
  onOpenWhatsApp: (payload: { phone?: string; customer?: Customer; workOrder?: WorkOrder }) => void;
  onExitMobileMode?: () => void;
}

export const MobileTechnicianView: React.FC<MobileTechnicianViewProps> = ({
  workOrders,
  customers,
  technicians,
  services,
  settings,
  onRefresh,
  onOpenWhatsApp,
  onExitMobileMode,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('in_progress');
  const [actionLoading, setActionLoading] = useState(false);

  // Spontaneous modal state (Fim do Caderno)
  const [spontaneousModalOpen, setSpontaneousModalOpen] = useState(false);

  // Price editing state in technician panel
  const [editingPriceModalOpen, setEditingPriceModalOpen] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editPriceReason, setEditPriceReason] = useState('');

  // Completion modal state & warranty terms
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [technicalReport, setTechnicalReport] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [finalServiceValue, setFinalServiceValue] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('90 dias');
  const [warrantyCovered, setWarrantyCovered] = useState(
    'Desobstrução e fluxo normalizado no ponto trabalhado. Mão de obra técnica da CR Serviços Gerais.'
  );
  const [warrantyNotCovered, setWarrantyNotCovered] = useState(
    'Mau uso (descarte de papel higiênico, gordura sólida, absorventes após a entrega), quebras estruturais e químicos corrosivos.'
  );
  const [warrantyExclusionReason, setWarrantyExclusionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Filter work orders for this technician if technician role
  const currentTech = technicians.find((t) => t.email === user?.email || t.name === user?.name) || technicians[0];
  const myWorkOrders = user?.role === 'technician' && currentTech
    ? workOrders.filter((w) => w.technicianId === currentTech.id)
    : workOrders;

  const inProgressWOs = myWorkOrders.filter(
    (w) => w.status === 'EM_DESLOCAMENTO' || w.status === 'EM_ATENDIMENTO'
  );
  const pendingWOs = myWorkOrders.filter(
    (w) => w.status === 'AGENDADA' || w.status === 'ABERTA' || w.status === 'AGUARDANDO'
  );
  const completedWOs = myWorkOrders.filter((w) => w.status === 'CONCLUIDA');

  const displayedWOs =
    activeTab === 'in_progress'
      ? inProgressWOs
      : activeTab === 'pending'
      ? pendingWOs
      : completedWOs;

  const handleUpdateStatus = async (wo: WorkOrder, nextStatus: any, note?: string) => {
    try {
      setActionLoading(true);
      await api.updateWorkOrderStatus(wo.id, {
        status: nextStatus,
        note: note || `Atualizado pelo técnico em campo: ${user?.name || 'Técnico'}`,
        userName: user?.name || 'Técnico',
      });
      showToast(`Status atualizado para ${nextStatus}!`);
      onRefresh();
      if (selectedWO?.id === wo.id) {
        setSelectedWO((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      showToast('Erro ao atualizar status', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGPS = (cust?: Customer) => {
    if (!cust) return;
    const addr = `${cust.street}, ${cust.number}, ${cust.neighborhood}, ${cust.city} - ${cust.state}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank');
  };

  const handleCallClient = (cust?: Customer) => {
    if (!cust || (!cust.phone && !cust.whatsapp)) return;
    const phone = cust.phone || cust.whatsapp;
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsDataUrl(file);
      setUploadedPhotos((prev) => [...prev, base64]);
      showToast('Foto registrada com sucesso!', '', 'success');
    } catch (err: any) {
      showToast('Erro ao carregar foto', err.message || 'Arquivo inválido', 'error');
    }
  };

  React.useEffect(() => {
    // Initialize modal state when opened
    if (selectedWO) {
      setFinalServiceValue(String(selectedWO.value));
      setEditPriceValue(String(selectedWO.value));
      setEditPriceReason(selectedWO.customPriceReason || '');
      setWarrantyDays(selectedWO.report?.warranty || settings.warrantyDefault || '90 dias');
      setWarrantyCovered(
        selectedWO.report?.warrantyCovered ||
          'Desobstrução e fluxo normalizado no ponto trabalhado. Mão de obra técnica da CR Serviços Gerais.'
      );
      setWarrantyNotCovered(
        selectedWO.report?.warrantyNotCovered ||
          'Mau uso (descarte de papel higiênico, gordura sólida, absorventes após a entrega), quebras estruturais e químicos corrosivos.'
      );
      setWarrantyExclusionReason(selectedWO.report?.warrantyExclusionsReason || '');
    }
  }, [selectedWO, settings.warrantyDefault]);

  const handleSaveEditedPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    const numVal = parseFloat(editPriceValue.replace(',', '.')) || 0;
    if (numVal <= 0) {
      showToast('Valor inválido', 'Informe um valor maior que zero.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await api.updateWorkOrder(selectedWO.id, {
        value: numVal,
        customPriceReason: editPriceReason.trim() || 'Preço reajustado pelo técnico no local (metragem/upsell)',
      });

      setSelectedWO(updated);
      showToast(
        'Valor atualizado com sucesso!',
        `Novo valor de R$ ${numVal.toFixed(2)} registrado e sincronizado com o financeiro.`,
        'success'
      );
      setEditingPriceModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar valor', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishWorkOrder = async () => {
    if (!selectedWO) return;
    const currentCustomer = customers.find((c) => c.id === selectedWO.customerId);
    try {
      setActionLoading(true);

      const numFinalVal = parseFloat(finalServiceValue.replace(',', '.')) || selectedWO.value;

      // Se o técnico alterou o valor final na conclusão, atualiza a OS primeiro
      if (numFinalVal !== selectedWO.value) {
        await api.updateWorkOrder(selectedWO.id, {
          value: numFinalVal,
          customPriceReason: 'Valor final ajustado no encerramento do serviço',
        });
      }

      // Salva o laudo completo incluindo o Termo de Garantia e o que cobre / não cobre
      await api.updateWorkOrderReport(selectedWO.id, {
        problemFound: selectedWO.problemDescription || 'Manutenção e atendimento técnico especializado',
        servicePerformed: technicalReport || 'Serviço executado com sucesso e testado perante o cliente.',
        materialsUsed: partsUsed || 'Nenhum material adicional consumido',
        result: 'Operação 100% normalizada e verificada',
        warranty: warrantyDays || settings.warrantyDefault || '90 dias',
        warrantyCovered: warrantyCovered,
        warrantyNotCovered: warrantyNotCovered,
        warrantyExclusionsReason: warrantyExclusionReason,
        afterPhotos: uploadedPhotos,
        clientSigned: Boolean(hasSignature),
        clientSignatureName: currentCustomer?.name || 'Cliente',
        clientSignatureDate: new Date().toLocaleDateString('pt-BR'),
      });

      // Update status to CONCLUIDA and trigger financial payment
      await api.updateWorkOrderStatus(selectedWO.id, {
        status: 'CONCLUIDA',
        note: `Finalizado por ${user?.name || 'Técnico'} em campo com termo de garantia técnica e recibo.`,
        userName: user?.name || 'Técnico',
        paymentReceived: paymentReceived,
        paymentMethod: paymentMethod,
      });

      showToast(
        'Ordem de Serviço finalizada com sucesso!',
        'Termo de garantia anexado e financeiro sincronizado em tempo real.',
        'success'
      );
      setCompletionModalOpen(false);
      setSelectedWO(null);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao concluir OS', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto animate-fade-in">
      {/* Technician Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase border border-emerald-200">
              Modo Técnico em Campo
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {currentTech ? currentTech.name : user?.name || 'Técnico'}
            </h2>
            <p className="text-xs text-slate-500">
              {myWorkOrders.length} atendimentos atribuídos • Plantão 24h
            </p>
          </div>
        </div>

        {onExitMobileMode && (
          <button
            onClick={onExitMobileMode}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            Visão Geral
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'in_progress'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Em Andamento ({inProgressWOs.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Agendadas ({pendingWOs.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Concluídas ({completedWOs.length})
        </button>
      </div>

      {/* Single Work Order Detail View (When Selected) */}
      {selectedWO ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <button
              onClick={() => setSelectedWO(null)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para lista
            </button>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {selectedWO.code}
            </span>
          </div>

          {/* Customer Info Card */}
          {(() => {
            const cust = customers.find((c) => c.id === selectedWO.customerId);
            return (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cust?.name || 'Cliente'}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {cust ? `${cust.street}, ${cust.number} - ${cust.neighborhood}` : 'Endereço'}
                    </p>
                    {cust?.reference && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Ref: {cust.reference}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    {formatCurrencyBRL(selectedWO.value)}
                  </span>
                </div>

                {/* Quick 1-Tap Action Bar for Mobile Phone */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleOpenGPS(cust)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-all active:scale-95"
                  >
                    <Navigation className="w-5 h-5 mb-1 text-blue-600" />
                    GPS Rota
                  </button>

                  <button
                    onClick={() => handleCallClient(cust)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all active:scale-95"
                  >
                    <Phone className="w-5 h-5 mb-1 text-emerald-600" />
                    Ligar
                  </button>

                  <button
                    onClick={() => onOpenWhatsApp({ customer: cust, workOrder: selectedWO })}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold text-xs transition-all active:scale-95"
                  >
                    <MessageSquare className="w-5 h-5 mb-1 text-green-600" />
                    WhatsApp
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Problem description */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Defeito / Ocorrência Relatada:
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {selectedWO.problemDescription || 'Sem detalhes específicos informados.'}
            </p>
          </div>

          {/* Large Touch Status Progression Buttons */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Atualizar Andamento em Tempo Real:
            </span>

            {selectedWO.status === 'AGENDADA' && (
              <button
                onClick={() => handleUpdateStatus(selectedWO, 'EM_DESLOCAMENTO')}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-all active:scale-98"
              >
                <Navigation className="w-5 h-5" />
                Iniciar Deslocamento (A Caminho)
              </button>
            )}

            {selectedWO.status === 'EM_DESLOCAMENTO' && (
              <button
                onClick={() => handleUpdateStatus(selectedWO, 'EM_ATENDIMENTO')}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all active:scale-98"
              >
                <Wrench className="w-5 h-5" />
                Cheguei no Local / Iniciar Serviço
              </button>
            )}

            {(selectedWO.status === 'EM_ATENDIMENTO' || selectedWO.status === 'EM_DESLOCAMENTO') && (
              <button
                onClick={() => setCompletionModalOpen(true)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Atendimento & Colher Assinatura
              </button>
            )}

            {selectedWO.status === 'CONCLUIDA' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-center text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ordem de Serviço Concluída e Faturada
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Work Orders List */
        <div className="space-y-3">
          {displayedWOs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum chamado nesta aba</p>
              <p className="text-xs mt-1 text-slate-400">Tudo em dia para o seu plantão!</p>
            </div>
          ) : (
            displayedWOs.map((wo) => {
              const cust = customers.find((c) => c.id === wo.customerId);
              return (
                <div
                  key={wo.id}
                  onClick={() => setSelectedWO(wo)}
                  className="bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      {wo.code}
                    </span>
                    {(() => {
                      const style = getWorkOrderStatusStyle(wo.status);
                      return (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${style.badgeClass}`}>
                          {style.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">{cust?.name || 'Cliente'}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {cust ? `${cust.street}, ${cust.number} • ${cust.neighborhood}` : 'Endereço'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {wo.problemDescription}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {wo.scheduledTime || 'Horário a combinar'}
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatCurrencyBRL(wo.value)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Completion, Photos & Signature Modal */}
      {completionModalOpen && selectedWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Concluir Atendimento • {selectedWO.code}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Laudo técnico, fotos e assinatura digital do cliente
                </p>
              </div>
              <button
                onClick={() => setCompletionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Technical Report */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Laudo Técnico do Serviço Realizado:
                </label>
                <textarea
                  rows={3}
                  value={technicalReport}
                  onChange={(e) => setTechnicalReport(e.target.value)}
                  placeholder="Ex: Realizada desobstrução mecânica com máquina K-50. Teste de estanqueidade realizado sem vazamentos."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Parts & Materials */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Peças / Materiais Utilizados (opcional):
                </label>
                <input
                  type="text"
                  value={partsUsed}
                  onChange={(e) => setPartsUsed(e.target.value)}
                  placeholder="Ex: Sifão sanfonado Tigre, anel de vedação"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Photos upload (Antes / Depois) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-slate-800 font-bold text-xs">Fotos do Atendimento (Antes / Depois):</span>
                  <div className="flex items-center gap-1.5">
                    {/* Botão Câmera Direta */}
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Câmera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {/* Botão Galeria */}
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Galeria</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {uploadedPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {uploadedPhotos.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 h-20 shadow-2xs group">
                        <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 cursor-pointer shadow-xs transition-transform active:scale-90"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center text-slate-500 text-[11px] bg-slate-50">
                    Nenhuma foto anexada ainda. Toque em <strong>Câmera</strong> para tirar foto ao vivo ou <strong>Galeria</strong> para anexar do aparelho.
                  </div>
                )}
              </div>

              {/* Digital Client Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" />
                    Assinatura Digital do Cliente na Tela:
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
                <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full touch-none cursor-crosshair block"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-center">
                  O cliente assina com o dedo diretamente no visor do celular.
                </p>
              </div>

              {/* Payment Section */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <span className="text-slate-900 font-bold block">Fechamento Financeiro:</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Valor Total:</span>
                  <span className="text-emerald-700 font-bold font-mono text-sm">
                    {formatCurrencyBRL(selectedWO.value)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Forma de Pagamento:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Boleto">Boleto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Status Pagamento:</label>
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(!paymentReceived)}
                      className={`w-full py-1.5 px-2 rounded-lg border text-center font-bold transition-all ${
                        paymentReceived
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {paymentReceived ? '✓ Recebido no Local' : 'Pendente de Cobrança'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCompletionModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleFinishWorkOrder}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                {actionLoading ? 'Gravando...' : 'Concluir OS e Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
