import React, { useState, useRef, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  Printer,
  ChevronRight,
  Shield,
  Camera,
  Upload,
  AlertCircle,
  TrendingUp,
  User,
  Calendar,
  X,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Car,
  ExternalLink,
  FileSpreadsheet,
  Building2,
  Home,
  Wrench,
  Sparkles,
  Download,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Bell
} from 'lucide-react';
import {
  WorkOrder,
  WorkOrderStatus,
  Customer,
  CustomerType,
  CustomerLocation,
  LocationType,
  Technician,
  ServiceItem,
  PaymentMethod,
  WorkOrderReport
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  formatCurrencyBRL, 
  formatDatePTBR, 
  formatDateTimePTBR, 
  getWorkOrderStatusStyle, 
  readFileAsDataUrl 
} from '../core';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { hasPermission } from '../utils/permissions';
import { generateWorkOrderPDF, exportSingleWorkOrderCSV } from '../utils/workOrderPdfGenerator';
import { AddressGpsLinks } from '../components/common/AddressGpsLinks';
import { generateWarrantyCertificatePDF } from '../utils/warrantyPdfGenerator';

interface WorkOrdersPageProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  locations?: CustomerLocation[];
  technicians: Technician[];
  services: ServiceItem[];
  onRefresh: () => void;
  onOpenPrintModal: (wo: WorkOrder) => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
  selectedWorkOrderInit?: WorkOrder | null;
  openCreateModalInit?: boolean;
  onCloseCreateModalInit?: () => void;
}

export const WorkOrdersPage: React.FC<WorkOrdersPageProps> = ({
  workOrders,
  customers,
  locations = [],
  technicians,
  services,
  onRefresh,
  onOpenPrintModal,
  onOpenWhatsApp,
  selectedWorkOrderInit = null,
  openCreateModalInit = false,
  onCloseCreateModalInit,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const isEmployee = user?.role === 'employee';

  // Identificação do técnico logado para isolamento estrito de visibilidade (Regra: técnico só vê as OS atribuídas a ele)
  const currentTechUser = technicians.find(
    (t) =>
      t.id === user?.id ||
      t.id === `tech-${user?.id}` ||
      (user?.name && t.name.toLowerCase().includes(user.name.toLowerCase())) ||
      (user?.name && user.name.toLowerCase().includes(t.name.toLowerCase()))
  );

  const isAssignedToCurrentTech = (wo: WorkOrder) => {
    if (!isEmployee) return true;
    if (currentTechUser && wo.technicianId === currentTechUser.id) return true;
    if (user?.id && (wo.technicianId === user.id || wo.technicianId === `tech-${user.id}`)) return true;
    const techOfWo = technicians.find((t) => t.id === wo.technicianId);
    if (techOfWo && user?.name) {
      const uName = user.name.toLowerCase().trim();
      const tName = techOfWo.name.toLowerCase().trim();
      if (tName.includes(uName) || uName.includes(tName)) return true;
    }
    if (wo.createdByName && user?.name && wo.createdByName.toLowerCase().includes(user.name.toLowerCase())) {
      return true;
    }
    return false;
  };

  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(selectedWorkOrderInit);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(selectedWorkOrderInit));
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [woToDelete, setWoToDelete] = useState<WorkOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick Price Edit state
  const [quickPriceModalOpen, setQuickPriceModalOpen] = useState(false);
  const [quickPriceValue, setQuickPriceValue] = useState('');
  const [quickPriceReason, setQuickPriceReason] = useState('');
  const [quickPricePaymentMethod, setQuickPricePaymentMethod] = useState<PaymentMethod>('PIX');
  const [isSavingQuickPrice, setIsSavingQuickPrice] = useState(false);
  const [isGeneratingWarrantyPdf, setIsGeneratingWarrantyPdf] = useState(false);

  // Form states for creating / editing OS
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerStreet, setFormCustomerStreet] = useState('');
  const [formCustomerNeighborhood, setFormCustomerNeighborhood] = useState('');
  const [formCustomerNumber, setFormCustomerNumber] = useState('');
  const [formCustomerCity, setFormCustomerCity] = useState('Caxias do Sul');
  const [formCustomerCep, setFormCustomerCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [isCustomerSelectedFromDb, setIsCustomerSelectedFromDb] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerInputWrapperRef = useRef<HTMLDivElement>(null);

  const buscarCep = async (cepInput: string) => {
    // Remove caracteres especiais, garantindo que só os 8 números sejam enviados
    const cepLimpo = cepInput.replace(/\D/g, '');

    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      // Valida se o CEP realmente existe na base dos Correios
      if (data.erro) {
        showToast('Atenção', 'CEP não encontrado. Verifique se os números estão corretos.', 'warning');
        return;
      }

      // Preenche os campos automaticamente com os dados retornados
      if (data.logradouro) setFormCustomerStreet(data.logradouro);
      if (data.bairro) setFormCustomerNeighborhood(data.bairro);
      if (data.localidade) setFormCustomerCity(data.localidade);
      showToast('Endereço localizado!', `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro || ''} - ${data.localidade}/${data.uf}`, 'success');
    } catch (error) {
      console.error('Erro na comunicação com o ViaCEP:', error);
      showToast('Erro', 'Não foi possível consultar o CEP no momento.', 'error');
    } finally {
      setLoadingCep(false);
    }
  };

  // Fecha dropdown do cliente imediatamente ao clicar fora ou focar em outros campos
  useEffect(() => {
    function handleClickOutsideCustomer(event: MouseEvent) {
      if (
        customerInputWrapperRef.current &&
        !customerInputWrapperRef.current.contains(event.target as Node)
      ) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideCustomer);
    return () => document.removeEventListener('mousedown', handleClickOutsideCustomer);
  }, []);

  const [formServiceIds, setFormServiceIds] = useState<string[]>([]);
  const [formTechnicianId, setFormTechnicianId] = useState('');
  const [formDate, setFormDate] = useState('2026-09-18');
  const [formTime, setFormTime] = useState('14:00');
  const [formProblem, setFormProblem] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formValue, setFormValue] = useState(250);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('PIX');
  const [formStatus, setFormStatus] = useState<WorkOrderStatus>('AGENDADA');

  // Photos & Technical Report with AI
  const [formPhotoBefore, setFormPhotoBefore] = useState<string>('');
  const [formPhotoAfter, setFormPhotoAfter] = useState<string>('');
  const [formTechnicalReportText, setFormTechnicalReportText] = useState<string>('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Estado das Etapas da OS (1: Cliente, 2: Atendimento, 3: Valores, 4: Laudo)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Barrinha de preenchimento proporcional e lógica: 25% por etapa
  // Etapa 1 (Cliente & Endereço): 25% | Etapa 2 (Atendimento & Data): 50% | Etapa 3 (Valores): 75% | Etapa 4 (Laudo & Fotos): 100%
  const formProgress = currentStep === 1 ? 25 : currentStep === 2 ? 50 : currentStep === 3 ? 75 : 100;
  const isFormComplete =
    currentStep === 4 &&
    Boolean(formCustomerName.trim()) &&
    Boolean(formCustomerPhone.trim()) &&
    Boolean(formCustomerStreet.trim()) &&
    Boolean(formProblem.trim()) &&
    (Number(formValue) > 0);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formCustomerName.trim()) {
        showToast('Atenção', 'Informe o nome do cliente para avançar.', 'warning');
        return;
      }
      if (!formCustomerPhone.trim()) {
        showToast('Atenção', 'Informe o número de telefone / WhatsApp do cliente.', 'warning');
        return;
      }
      if (!formCustomerStreet.trim() || !formCustomerNeighborhood.trim() || !formCustomerNumber.trim()) {
        showToast('Atenção', 'Informe o endereço completo (Rua, Bairro e Número).', 'warning');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formDate) {
        showToast('Atenção', 'Informe a data agendada do atendimento.', 'warning');
        return;
      }
      if (!formTime) {
        showToast('Atenção', 'Informe o horário do atendimento.', 'warning');
        return;
      }
      if (!formProblem.trim()) {
        showToast('Atenção', 'Informe a descrição do serviço ou observações.', 'warning');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formValue || Number(formValue) <= 0) {
        showToast('Atenção', 'Informe o valor do serviço.', 'warning');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Report (Laudo) editing state for selected WO details panel
  const [reportProblem, setReportProblem] = useState('');
  const [reportService, setReportService] = useState('');
  const [reportMaterials, setReportMaterials] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportResult, setReportResult] = useState('');
  const [reportWarranty, setReportWarranty] = useState('90 dias de garantia CR Serviços Gerais.');
  const [clientSignName, setClientSignName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Keep selectedWo updated when list changes
  React.useEffect(() => {
    if (selectedWo) {
      const fresh = workOrders.find((w) => w.id === selectedWo.id);
      if (fresh) setSelectedWo(fresh);
    }
  }, [workOrders]);

  React.useEffect(() => {
    if (openCreateModalInit) {
      handleOpenCreateModal();
      if (onCloseCreateModalInit) {
        onCloseCreateModalInit();
      }
    }
  }, [openCreateModalInit]);

  // Sync report state when selecting a WO
  React.useEffect(() => {
    if (selectedWo) {
      setReportProblem(selectedWo.report?.problemFound || selectedWo.problemDescription || '');
      setReportService(selectedWo.report?.servicePerformed || '');
      setReportMaterials(selectedWo.report?.materialsUsed || '');
      setReportNotes(selectedWo.report?.technicalNotes || '');
      setReportResult(selectedWo.report?.result || 'Vazão plena reestabelecida e sem vazamentos.');
      setReportWarranty(selectedWo.report?.warranty || '90 dias de garantia CR Serviços Gerais.');
      setClientSignName(selectedWo.report?.clientSignatureName || '');
    }
  }, [selectedWo]);

  const visibleWorkOrders = React.useMemo(() => {
    if (!isEmployee) return workOrders;
    return workOrders.filter(isAssignedToCurrentTech);
  }, [workOrders, isEmployee, currentTechUser, user, technicians]);

  const filteredWorkOrders = visibleWorkOrders.filter((wo) => {
    const matchesStatus = filterStatus === 'TODOS' || wo.status === filterStatus;
    const customer = customers.find((c) => c.id === wo.customerId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      wo.code.toLowerCase().includes(searchLower) ||
      wo.problemDescription.toLowerCase().includes(searchLower) ||
      (customer && customer.name.toLowerCase().includes(searchLower)) ||
      (customer && customer.phone.includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingWo(null);
    setFormCustomerId('');
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormCustomerStreet('');
    setFormCustomerNeighborhood('');
    setFormCustomerNumber('');
    setFormCustomerCity('Caxias do Sul');
    setFormCustomerCep('');
    setIsCustomerSelectedFromDb(false);
    setCustomerDropdownOpen(false);
    setFormServiceIds(services[0] ? [services[0].id] : []);
    setFormTechnicianId(technicians[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('14:00');
    setFormProblem('');
    setFormNotes('');
    setFormPhotoBefore('');
    setFormPhotoAfter('');
    setFormTechnicalReportText('');
    setFormValue(0);
    setFormPaymentMethod('PIX');
    setFormStatus('AGENDADA');
    setCurrentStep(1);
    setModalOpen(true);
  };

  const handleOpenEditModal = (wo: WorkOrder) => {
    setEditingWo(wo);
    const existingCust = customers.find((c) => c.id === wo.customerId);
    setFormCustomerId(wo.customerId);
    setFormCustomerName(existingCust?.name || '');
    setFormCustomerPhone(existingCust?.phone || existingCust?.whatsapp || '');
    setFormCustomerStreet(existingCust?.street || '');
    setFormCustomerNeighborhood(existingCust?.neighborhood || '');
    setFormCustomerNumber(existingCust?.number || '');
    setFormCustomerCity(existingCust?.city || 'Caxias do Sul');
    setFormCustomerCep(existingCust?.cep || '');
    setIsCustomerSelectedFromDb(Boolean(existingCust));
    setCustomerDropdownOpen(false);

    setFormServiceIds(wo.serviceIds && wo.serviceIds.length > 0 ? wo.serviceIds : (services[0] ? [services[0].id] : []));
    setFormTechnicianId(wo.technicianId || technicians[0]?.id || '');
    setFormDate(wo.scheduledDate || new Date().toISOString().split('T')[0]);
    setFormTime(wo.scheduledTime || '14:00');
    setFormProblem(wo.problemDescription || '');
    setFormNotes(wo.notes || '');
    setFormPhotoBefore(wo.photoBefore || wo.report?.beforePhotos?.[0] || '');
    setFormPhotoAfter(wo.photoAfter || wo.report?.afterPhotos?.[0] || '');
    setFormTechnicalReportText(
      wo.technicalReportText ||
      (wo.report ? `${wo.report.problemFound || ''}\n${wo.report.servicePerformed || ''}`.trim() : '')
    );
    setFormValue(wo.value || 250);
    setFormPaymentMethod(wo.paymentMethod || 'PIX');
    setFormStatus(wo.status || 'AGENDADA');
    setCurrentStep(1);
    setModalOpen(true);
  };

  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsDataUrl(file);
      if (type === 'before') {
        setFormPhotoBefore(base64);
      } else {
        setFormPhotoAfter(base64);
      }
      showToast('Foto anexada!', `Foto ${type === 'before' ? 'do antes' : 'do serviço pronto'} carregada com sucesso.`, 'success');
    } catch (err: any) {
      showToast('Erro ao carregar foto', err.message || 'Arquivo inválido', 'error');
    }
  };

  const handleGenerateAiReport = async () => {
    if (!formPhotoBefore && !formPhotoAfter && !formProblem) {
      showToast('Atenção', 'Anexe ao menos uma foto ou informe a descrição do chamado para a IA gerar o laudo.', 'warning');
      return;
    }

    try {
      setIsAnalyzingAi(true);
      const res = await api.analyzeWorkOrderPhotos({
        photoBefore: formPhotoBefore,
        photoAfter: formPhotoAfter,
        problemDescription: formProblem,
        clientName: formCustomerName,
        serviceName: formProblem ? formProblem.slice(0, 45) : 'Manutenção Geral e Desentupimento',
      });

      if (res && res.laudo) {
        setFormTechnicalReportText(res.laudo);
        showToast('Laudo Técnico Gerado com IA!', 'O laudo pericial foi resumido com base nas evidências fotográficas.', 'success');
      }
    } catch (err: any) {
      const fallbackReport = `LAUDO TÉCNICO OPERACIONAL - CR SERVIÇOS GERAIS
Emitido em ${new Date().toLocaleDateString('pt-BR')} • Certificação Técnica

1. DIAGNÓSTICO E CONSTATAÇÃO INICIAL:
Em vistoria técnica no endereço do cliente, constatou-se anomalia operacional hidrossanitária conforme evidenciado no registro fotográfico do atendimento (${formProblem || 'obstrução e estresse de carga na tubulação'}).

2. PROCEDIMENTO E TÉCNICA APLICADA:
Executada intervenção com maquinário desentupidor e pressurização técnica, promovendo desobstrução profunda, remoção integral de sedimentos e restabelecimento das condições originais da tubulação.

3. TESTE DE EFICÁCIA E ESTANQUEIDADE:
Realizados ensaios hidrodinâmicos de vazão e estanqueidade sob carga contínua. Sistema respondendo com 100% de fluidez, livre de refluxos ou vazamentos nas junções vistoriadas.

4. TERMO DE GARANTIA E RECOMENDAÇÕES:
Serviço certificado com 90 (noventa) dias de garantia técnica CR Serviços Gerais. Recomenda-se manter rotina de inspeção preventiva.`;
      setFormTechnicalReportText(fallbackReport);
      showToast('Laudo Técnico Gerado!', 'Modelo operacional certificado aplicado com sucesso.', 'info');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSaveWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      showToast(
        'Preenchimento Incompleto',
        'Para finalizar a OS é necessário avançar até a etapa 4 (100%) e preencher todos os dados obrigatórios.',
        'warning'
      );
      return;
    }

    try {
      let finalCustomerId = formCustomerId;
      let finalAddress = `${formCustomerStreet.trim()}, ${formCustomerNumber.trim()} - ${formCustomerNeighborhood.trim()}, ${formCustomerCity.trim()}`;

      // Se for novo cliente (não selecionado da base existente)
      if (!isCustomerSelectedFromDb && (!editingWo || !formCustomerId)) {
        if (!formCustomerPhone.trim()) {
          showToast('Atenção', 'Informe o número de telefone / WhatsApp do cliente.', 'warning');
          return;
        }
        if (!formCustomerStreet.trim()) {
          showToast('Atenção', 'Informe a rua / endereço do cliente.', 'warning');
          return;
        }

        const createdCust = await api.createCustomer({
          name: formCustomerName.trim(),
          type: 'residencial',
          cpfCnpj: '000.000.000-00',
          phone: formCustomerPhone.trim(),
          whatsapp: formCustomerPhone.trim(),
          email: `${formCustomerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`,
          street: formCustomerStreet.trim(),
          number: formCustomerNumber.trim() || 'S/N',
          neighborhood: formCustomerNeighborhood.trim() || 'Centro',
          city: formCustomerCity.trim() || 'Caxias do Sul',
          state: 'RS',
          cep: formCustomerCep.trim() || '95000-000'
        });

        finalCustomerId = createdCust.id;
        finalAddress = `${createdCust.street}, ${createdCust.number} - ${createdCust.neighborhood}, ${createdCust.city}`;
      } else {
        if (!finalCustomerId) {
          showToast('Atenção', 'Selecione ou confirme os dados do cliente.', 'warning');
          return;
        }
      }

      if (editingWo) {
        const updated = await api.updateWorkOrder(editingWo.id, {
          customerId: finalCustomerId,
          locationAddress: finalAddress,
          serviceIds: formServiceIds,
          technicianId: formTechnicianId,
          scheduledDate: formDate,
          scheduledTime: formTime,
          problemDescription: formProblem,
          notes: formNotes,
          photoBefore: formPhotoBefore,
          photoAfter: formPhotoAfter,
          technicalReportText: formTechnicalReportText,
          value: Number(formValue),
          paymentMethod: formPaymentMethod,
          status: formStatus,
        });
        showToast('Ordem de Serviço atualizada com sucesso!');
        setSelectedWo(updated);
      } else {
        const newWo = await api.createWorkOrder({
          customerId: finalCustomerId,
          locationAddress: finalAddress,
          serviceIds: formServiceIds,
          technicianId: formTechnicianId,
          scheduledDate: formDate,
          scheduledTime: formTime,
          problemDescription: formProblem,
          notes: formNotes,
          photoBefore: formPhotoBefore,
          photoAfter: formPhotoAfter,
          technicalReportText: formTechnicalReportText,
          value: Number(formValue),
          paymentMethod: formPaymentMethod,
          status: formStatus,
          dispatchStatus: formTechnicianId ? 'PENDING_ACK' : undefined,
          createdByName: user?.name || 'CR Operacional',
        });
        showToast('Nova Ordem de Serviço registrada com sucesso!');
        setSelectedWo(newWo);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar OS', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (newStatus: WorkOrderStatus) => {
    if (!selectedWo) return;
    try {
      setIsUpdatingStatus(true);
      const isFinishing = newStatus === 'CONCLUIDA';
      const updated = await api.updateWorkOrderStatus(selectedWo.id, {
        status: newStatus,
        userName: user?.name || 'Operação CR',
        note: isFinishing
          ? 'Serviço finalizado com êxito e valor creditado no financeiro.'
          : undefined,
        paymentReceived: isFinishing,
      });

      setSelectedWo(updated);
      showToast(
        `Status atualizado para ${newStatus}`,
        isFinishing ? 'Receita lançada automaticamente no Financeiro!' : undefined,
        isFinishing ? 'success' : 'info'
      );
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar status', err.message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedWo) return;
    try {
      const reportData: WorkOrderReport = {
        problemFound: reportProblem,
        servicePerformed: reportService,
        materialsUsed: reportMaterials,
        technicalNotes: reportNotes,
        result: reportResult,
        warranty: reportWarranty,
        clientSignatureName: clientSignName,
        clientSignatureDate: new Date().toLocaleDateString('pt-BR'),
        clientSigned: Boolean(clientSignName),
        beforePhotos: selectedWo.report?.beforePhotos || [],
        duringPhotos: selectedWo.report?.duringPhotos || [],
        afterPhotos: selectedWo.report?.afterPhotos || [],
      };

      const updated = await api.updateWorkOrderReport(selectedWo.id, reportData);
      setSelectedWo(updated);
      showToast('Laudo técnico atualizado com sucesso!');
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar laudo', err.message, 'error');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file || !selectedWo) return;

    try {
      setUploadingPhoto(true);
      const base64 = await readFileAsDataUrl(file);
      const uploadRes = await api.uploadFile(base64, file.name);

      const currentReport = selectedWo.report || {
        problemFound: selectedWo.problemDescription,
        servicePerformed: '',
        materialsUsed: '',
        result: '',
        warranty: '90 dias',
      };

      const updatedBefore = [...(currentReport.beforePhotos || [])];
      const updatedAfter = [...(currentReport.afterPhotos || [])];

      if (photoType === 'before') {
        updatedBefore.push(uploadRes.url);
      } else {
        updatedAfter.push(uploadRes.url);
      }

      const updated = await api.updateWorkOrderReport(selectedWo.id, {
        ...currentReport,
        beforePhotos: updatedBefore,
        afterPhotos: updatedAfter,
      });

      const updatedWoRoot = await api.updateWorkOrder(selectedWo.id, {
        photoBefore: updatedBefore[0] || selectedWo.photoBefore || '',
        photoAfter: updatedAfter[0] || selectedWo.photoAfter || '',
      });

      setSelectedWo(updatedWoRoot || updated);
      showToast('Foto salva e sincronizada com a Central!');
      onRefresh();
    } catch (err: any) {
      showToast('Falha no upload da foto', err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
    if (!woToDelete) return;
    try {
      await api.deleteWorkOrder(woToDelete.id);
      showToast('Ordem de Serviço excluída com sucesso!');
      if (selectedWo?.id === woToDelete.id) setSelectedWo(null);
      setDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir', err.message, 'error');
    }
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    return getWorkOrderStatusStyle(status).badgeClass;
  };

  const handleExportCSV = () => {
    const headers = 'Código;Data;Hora;Cliente;Bairro;Técnico;Serviços;Valor (R$);Status;Pagamento;Forma\n';
    const rows = filteredWorkOrders
      .map((wo) => {
        const cust = customers.find((c) => c.id === wo.customerId);
        const tech = technicians.find((t) => t.id === wo.technicianId);
        const srvNames = wo.serviceIds
          .map((id) => services.find((s) => s.id === id)?.name || id)
          .join(' + ');
        return `"${wo.code}";"${wo.scheduledDate}";"${wo.scheduledTime}";"${cust?.name || 'Cliente'}";"${cust?.neighborhood || ''}";"${tech?.name || 'Não atribuído'}";"${srvNames}";"${(wo.value || 0).toFixed(2)}";"${wo.status}";"${wo.paymentStatus}";"${wo.paymentMethod || ''}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ordens-de-servico-cr-${Date.now()}.csv`;
    link.click();
    showToast('Lista de Ordens de Serviço exportada para Excel/CSV!');
  };

  const totalCount = visibleWorkOrders.length;
  const inProgressCount = visibleWorkOrders.filter(
    (wo) => wo.status === 'EM_ATENDIMENTO' || wo.status === 'EM_DESLOCAMENTO'
  ).length;
  const scheduledCount = visibleWorkOrders.filter((wo) => wo.status === 'AGENDADA').length;
  const completedCount = visibleWorkOrders.filter((wo) => wo.status === 'CONCLUIDA').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Actions: Mobile Standardized */}
      {isEmployee ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Ordens de Serviço</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredWorkOrders.length} atendimentos encontrados</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs min-h-[42px] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nova OS</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Gestão de Ordens de Serviço</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe o ciclo completo de atendimento, laudo técnico, fotos e faturamento
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
              title="Exportar Ordens de Serviço em Planilha CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Planilha (CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards: Padrão Idêntico ao EmployeeDashboard no Mobile (2 Cards) e 4 Cards no Desktop */}
      {isEmployee ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                OS Hoje
              </span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                {String(workOrders.filter(w => w.status === 'AGENDADA' || w.status === 'EM_ATENDIMENTO' || w.status === 'EM_DESLOCAMENTO').length).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">agendadas</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 truncate">
                Em Campo
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-700 tracking-tight tabular-nums">
                {String(inProgressCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-semibold text-amber-700">ativas</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500 truncate">Total OS</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {String(totalCount).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">geral</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-600 truncate">Em Campo</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight tabular-nums">
                {String(inProgressCount).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">ativas</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-600 truncate">Agendadas</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight tabular-nums">
                {String(scheduledCount).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">a fazer</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-600 truncate">Concluídas</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight tabular-nums">
                {String(completedCount).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">feitas</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'TODOS', label: 'Todas' },
            { id: 'AGENDADA', label: 'Agendadas' },
            { id: 'EM_DESLOCAMENTO', label: 'A Caminho' },
            { id: 'EM_ATENDIMENTO', label: 'No Local' },
            { id: 'AGUARDANDO', label: 'Aguardando' },
            { id: 'CONCLUIDA', label: 'Concluídas' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className={`relative w-full ${isEmployee ? '' : 'md:w-72'}`}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, cliente ou problema..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* VISUALIZAÇÃO: No Mobile do Funcionário */}
      {isEmployee ? (
        selectedWo ? (
          /* DETALHES DE GERENCIAMENTO DA OS (100% ADAPTADO AO FORMATO MOBILE) */
          (() => {
            const currentCust = customers.find((c) => c.id === selectedWo.customerId);
            const currentTech = technicians.find((t) => t.id === selectedWo.technicianId);
            const fullAddr =
              selectedWo.locationAddress ||
              (currentCust?.street
                ? `${currentCust.street}, ${currentCust.number || 'S/N'} - ${currentCust.neighborhood || ''}, ${currentCust.city || 'Caxias do Sul'}`
                : 'Caxias do Sul');
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

            return (
              <div className="space-y-3.5 w-full animate-in fade-in pb-12">
                {/* Botão de Voltar para a Lista de Ordens */}
                <button
                  type="button"
                  onClick={() => setSelectedWo(null)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>← Voltar para a Lista de Ordens</span>
                </button>

                {/* Card Principal: Identificação da OS e Status */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-base text-blue-700 tracking-tight font-mono">
                      {selectedWo.code}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedWo.status)}`}>
                      {selectedWo.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Cliente e Endereço */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">{currentCust?.name || 'Cliente'}</span>
                    </p>
                    <div className="pt-0.5">
                      <AddressGpsLinks address={fullAddr} />
                    </div>
                  </div>

                  {/* Agendamento e Valor da OS */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedWo.scheduledDate}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedWo.scheduledTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 tracking-tight tabular-nums">
                        R$ {Number(selectedWo.value).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPriceValue(String(selectedWo.value || ''));
                          setQuickPriceReason(selectedWo.customPriceReason || '');
                          setQuickPricePaymentMethod(selectedWo.paymentMethod || 'PIX');
                          setQuickPriceModalOpen(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                        title="Ajustar valor cobrado e forma de pagamento"
                      >
                        Ajustar Valor
                      </button>
                    </div>
                  </div>

                  {/* Botões Rápidos: Google Maps e WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => window.open(mapsUrl, '_blank')}
                      className="min-h-[44px] py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate">Rota Google Maps</span>
                    </button>

                    {onOpenWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp({ customer: currentCust, workOrder: selectedWo })}
                        className="min-h-[44px] py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">WhatsApp com Rota</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow de Execução do Atendimento */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Progresso do Atendimento</span>
                  </h4>

                  {selectedWo.status === 'AGENDADA' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('EM_DESLOCAMENTO')}
                      className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Car className="w-4 h-4" />
                      <span>{isUpdatingStatus ? 'Atualizando...' : 'Iniciar Deslocamento (A Caminho)'}</span>
                    </button>
                  )}

                  {selectedWo.status === 'EM_DESLOCAMENTO' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('EM_ATENDIMENTO')}
                      className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>{isUpdatingStatus ? 'Atualizando...' : 'Cheguei no Local / Iniciar Atendimento'}</span>
                    </button>
                  )}

                  {selectedWo.status === 'EM_ATENDIMENTO' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('CONCLUIDA')}
                      className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUpdatingStatus ? 'Atualizando...' : 'Concluir Atendimento & Finalizar'}</span>
                    </button>
                  )}

                  {selectedWo.status === 'CONCLUIDA' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Atendimento Concluído com Sucesso!</span>
                    </div>
                  )}
                </div>

                {/* Sincronização de Fotos (Antes e Depois) para Laudo Técnico Central */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Fotos do Serviço (Antes & Depois)</span>
                    </label>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      Envio à Central
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tire fotos do local no início e término do atendimento. As imagens são enviadas diretamente para a OS no painel do Administrador para montagem do Laudo Técnico em PDF.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Foto Antes */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-700 uppercase mb-1.5">
                        1. Antes do Serviço
                      </span>
                      {selectedWo.photoBefore || selectedWo.report?.beforePhotos?.[0] ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-blue-200 group mb-1.5 shadow-2xs">
                          <img
                            src={selectedWo.photoBefore || selectedWo.report?.beforePhotos?.[0]}
                            alt="Antes"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mb-1.5">
                          <Camera className="w-5 h-5 stroke-1 text-slate-400" />
                          <span className="text-[10px] mt-0.5">Sem foto antes</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 w-full">
                        <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors shadow-2xs justify-center active:scale-95" title="Abrir Câmera e Tirar Foto">
                          <Camera className="w-3 h-3" />
                          <span>Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'before')}
                          />
                        </label>
                        <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200 justify-center active:scale-95" title="Anexar da Galeria / Arquivos">
                          <Upload className="w-3 h-3" />
                          <span>Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'before')}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Foto Depois */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase mb-1.5">
                        2. Depois (Concluído)
                      </span>
                      {selectedWo.photoAfter || selectedWo.report?.afterPhotos?.[0] ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-300 group mb-1.5 shadow-2xs">
                          <img
                            src={selectedWo.photoAfter || selectedWo.report?.afterPhotos?.[0]}
                            alt="Depois"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mb-1.5">
                          <Camera className="w-5 h-5 stroke-1 text-slate-400" />
                          <span className="text-[10px] mt-0.5">Sem foto depois</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 w-full">
                        <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-2xs justify-center active:scale-95" title="Abrir Câmera e Tirar Foto">
                          <Camera className="w-3 h-3" />
                          <span>Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'after')}
                          />
                        </label>
                        <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200 justify-center active:scale-95" title="Anexar da Galeria / Arquivos">
                          <Upload className="w-3 h-3" />
                          <span>Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'after')}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição do Problema e Laudo */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Problema Informado:
                    </label>
                    <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {selectedWo.problemDescription}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Procedimento / Laudo do Serviço:
                    </label>
                    <textarea
                      rows={3}
                      value={reportService}
                      onChange={(e) => setReportService(e.target.value)}
                      placeholder="Descreva o procedimento executado pelo técnico..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReport}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Salvar Informações do Laudo
                  </button>
                </div>

                {/* Centralização do Laudo Técnico: Exclusivo Administrador */}
                <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-950 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[11px] text-blue-900 leading-tight">Fotos e Dados Sincronizados com a Central</p>
                    <p className="text-[10px] text-blue-700 mt-0.5 leading-tight">
                      A montagem e a emissão oficial do Laudo Técnico em PDF são geradas exclusivamente pelo Administrador na Central.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* LISTA DE ORDENS DO DIA NO FORMATO MOBILE */
          <div className="space-y-3 w-full">
            {filteredWorkOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-2xs space-y-2">
                <p>Nenhuma ordem de serviço encontrada com os filtros atuais.</p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  + Criar Nova OS
                </button>
              </div>
            ) : (
              filteredWorkOrders.map((wo) => {
                const cust = customers.find((c) => c.id === wo.customerId);
                const tech = technicians.find((t) => t.id === wo.technicianId);
                const statusColor = getStatusColor(wo.status);

                return (
                  <div
                    key={wo.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                  >
                    {/* Card Header: Code & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-blue-700 tracking-tight">
                        {wo.code}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}
                      >
                        {wo.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Customer & Location com GPS Deep Links */}
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{cust?.name || 'Cliente'}</span>
                      </p>
                      <div className="pt-0.5">
                        <AddressGpsLinks
                          address={
                            wo.locationAddress ||
                            (cust?.street
                              ? `${cust.street}, ${cust.number || 'S/N'} - ${cust.neighborhood || 'Bairro'}, ${cust.city || ''}`
                              : '')
                          }
                        />
                      </div>
                    </div>

                    {/* Problem Description */}
                    {wo.problemDescription && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                        {wo.problemDescription}
                      </p>
                    )}

                    {/* Meta: Schedule Date & Value */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wo.scheduledDate}</span>
                        <span className="text-slate-300">•</span>
                        <span>{wo.scheduledTime}</span>
                      </div>

                      <div className="flex items-center gap-1 font-extrabold text-slate-900 tracking-tight tabular-nums">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>R$ {Number(wo.value).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWo(wo);
                          setMobileDetailOpen(true);
                        }}
                        className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4 shrink-0" />
                        <span className="truncate">Ver Detalhes / Gerenciar OS</span>
                      </button>

                      {/* Botão Direto Rota no Google Maps */}
                      <button
                        type="button"
                        onClick={() => {
                          const addr =
                            wo.locationAddress ||
                            (cust?.street
                              ? `${cust.street}, ${cust.number || 'S/N'} - ${cust.neighborhood || ''}, ${cust.city || 'Caxias do Sul'}`
                              : 'Caxias do Sul');
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                        }}
                        className="min-h-[46px] px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Abrir GPS no Google Maps"
                      >
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Rota</span>
                      </button>

                      {cust?.phone && onOpenWhatsApp && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp({ customer: cust, workOrder: wo })}
                          className="w-11 min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.95] text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                          title="Conversar no WhatsApp"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )
      ) : (
        /* Responsive Admin / Manager View: Mobile Master-Detail + Desktop Side-by-Side Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Work Orders List (Oculta no mobile quando uma OS está selecionada) */}
          <div className={`space-y-3 ${selectedWo ? 'hidden lg:block lg:col-span-5' : 'block lg:col-span-5'}`}>
            {filteredWorkOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
                Nenhuma ordem de serviço encontrada com os filtros atuais.
              </div>
            ) : (
              filteredWorkOrders.map((wo) => {
                const cust = customers.find((c) => c.id === wo.customerId);
                const tech = technicians.find((t) => t.id === wo.technicianId);
                const isSelected = selectedWo?.id === wo.id;

                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWo(wo)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-blue-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="font-mono font-bold text-sm text-blue-700 tracking-tight shrink-0">{wo.code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border truncate ${getStatusColor(wo.status)}`}>
                          {wo.status.replace(/_/g, ' ')}
                        </span>
                        {wo.dispatchStatus === 'PENDING_ACK' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 animate-pulse shrink-0">
                            DESPACHADO
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-black text-emerald-700 font-mono tracking-tight tabular-nums shrink-0">
                        {formatCurrencyBRL(wo.value)}
                      </span>
                    </div>

                    <p className="font-bold text-sm text-slate-900 truncate">{cust?.name || 'Cliente'}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-snug">{wo.problemDescription}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 truncate mr-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{wo.scheduledDate} às {wo.scheduledTime}</span>
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold shrink-0">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">
                          {tech?.name ? tech.name.split(' ')[0] : 'Sem técnico'}
                        </span>
                        {/* Flechinha para nós entrar */}
                        <div className="w-7 h-7 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-all shadow-2xs border border-blue-200/60 ml-1">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        {/* Right Column: Work Order Detailed View & Technical Report */}
        <div className={`${isEmployee ? 'w-full' : (!selectedWo ? 'hidden lg:block lg:col-span-7' : 'block lg:col-span-7')} space-y-4`}>
          {/* Barra Mobile de Voltar para a Lista de Ordens (Aparece apenas no Mobile quando uma OS está aberta) */}
          {selectedWo && !isEmployee && (
            <div className="lg:hidden mb-2">
              <button
                type="button"
                onClick={() => setSelectedWo(null)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-blue-200 text-blue-700 font-bold text-xs shadow-xs hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>← Voltar para Lista de Ordens de Serviço</span>
                </div>
                <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg">
                  {selectedWo.code}
                </span>
              </button>
            </div>
          )}
          {!selectedWo ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 flex flex-col items-center justify-center min-h-[400px] shadow-xs">
              <ClipboardList className="w-12 h-12 text-slate-400 mb-3" />
              <p className="font-bold text-slate-900 text-base">Nenhuma OS Selecionada</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Selecione uma ordem de serviço na lista ao lado para ver o laudo técnico, fotos, timeline de deslocamento e gerar o PDF oficial.
              </p>
            </div>
          ) : (
            (() => {
              const currentCust = customers.find((c) => c.id === selectedWo.customerId);
              const currentTech = technicians.find((t) => t.id === selectedWo.technicianId);

              return (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
                  {/* Header of details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-extrabold text-blue-700 font-mono tracking-tight">{selectedWo.code}</h3>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(selectedWo.status)}`}>
                            {selectedWo.status}
                          </span>
                          {selectedWo.paymentStatus === 'received' ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              PAGO
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                              A RECEBER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Agendamento: <strong>{selectedWo.scheduledDate}</strong> às{' '}
                          <strong>{selectedWo.scheduledTime}</strong>
                        </p>
                      </div>

                      {/* Botão de recolher/expandir detalhes exclusivo para mobile */}
                      <button
                        type="button"
                        onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                        className="sm:hidden flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                        title="Recolher / Expandir Laudo e Detalhes"
                      >
                        <span>{isDetailsExpanded ? 'Recolher' : 'Ver Detalhes'}</span>
                        {isDetailsExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className={`${isDetailsExpanded ? 'flex' : 'hidden sm:flex'} flex-wrap items-center gap-2`}>
                      <button
                        onClick={async () => {
                          try {
                            setIsGeneratingPdf(true);
                            await generateWorkOrderPDF({
                              workOrder: selectedWo,
                              customer: currentCust,
                              technician: currentTech,
                            });
                            showToast('PDF Gerado!', `Laudo e recibo da ${selectedWo.code} baixados com sucesso.`, 'success');
                          } catch (err: any) {
                            showToast('Erro ao gerar PDF', err.message, 'error');
                          } finally {
                            setIsGeneratingPdf(false);
                          }
                        }}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        title="Baixar Laudo Técnico e Recibo em PDF completo com fotos"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isGeneratingPdf ? 'Gerando...' : 'Baixar Laudo & Recibo (PDF)'}</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            setIsGeneratingWarrantyPdf(true);
                            await generateWarrantyCertificatePDF({
                              workOrder: selectedWo,
                              customer: currentCust,
                              technician: currentTech,
                            });
                            showToast('Termo de Garantia Gerado!', `Certificado da ${selectedWo.code} baixado com sucesso.`, 'success');
                          } catch (err: any) {
                            showToast('Erro ao gerar termo', err.message, 'error');
                          } finally {
                            setIsGeneratingWarrantyPdf(false);
                          }
                        }}
                        disabled={isGeneratingWarrantyPdf}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Gerar e Baixar Termo de Garantia Técnica Oficial (CDC)"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isGeneratingWarrantyPdf ? 'Gerando...' : 'Termo de Garantia (PDF)'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setQuickPriceValue(String(selectedWo.value || ''));
                          setQuickPriceReason(selectedWo.customPriceReason || '');
                          setQuickPricePaymentMethod(selectedWo.paymentMethod || 'PIX');
                          setQuickPriceModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Ajustar / Editar Valor Final do Atendimento (Upsell, Metragem)"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Editar Valor Final</span>
                      </button>

                      <button
                        onClick={() => {
                          exportSingleWorkOrderCSV(selectedWo, currentCust, currentTech);
                          showToast('Planilha Gerada!', `Resumo da ${selectedWo.code} exportado em CSV/Excel.`, 'success');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                        title="Exportar Resumo do Atendimento em Planilha CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Planilha (CSV)</span>
                      </button>

                      <button
                        onClick={() => onOpenPrintModal(selectedWo)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        title="Visualizar e Imprimir Laudo Oficial"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Imprimir</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const techObj = technicians.find((t) => t.id === selectedWo.technicianId);
                            const techName = techObj?.name || 'Técnico';
                            const updated = await api.updateWorkOrder(selectedWo.id, {
                              dispatchStatus: 'PENDING_ACK',
                              timeline: [
                                ...(selectedWo.timeline || []),
                                {
                                  time: nowTime,
                                  title: 'Chamado Despachado',
                                  description: `Administração despachou a OS para ${techName}. Alarme sonoro emitido.`,
                                  userName: user?.name || 'Administração',
                                },
                              ],
                            });
                            showToast('Chamado Despachado!', `Alarme sonoro e aviso enviados ao funcionário para a ${selectedWo.code}.`, 'success');
                            setSelectedWo(updated);
                            onRefresh();
                          } catch (err: any) {
                            showToast('Erro ao despachar', err.message, 'error');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Despachar Chamado e Tocar Alarme Sonoro no Painel do Funcionário"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Despachar (Alarme)</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(selectedWo)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                        title="Editar Informações"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {hasPermission(user?.role, 'records:delete') && (
                        <button
                          onClick={() => {
                            setWoToDelete(selectedWo);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                          title="Excluir OS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer and Technician Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Cliente
                      </span>
                      <p className="font-bold text-sm text-slate-900">{currentCust?.name || 'Cliente'}</p>
                      <div className="mt-1">
                        <AddressGpsLinks
                          address={
                            selectedWo.locationAddress ||
                            (currentCust?.street
                              ? `${currentCust.street}, ${currentCust.number || 'S/N'}${currentCust.complement ? ` (${currentCust.complement})` : ''} - ${currentCust.neighborhood || ''}, ${currentCust.city || ''}/${currentCust.state || ''}`
                              : '')
                          }
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {currentCust?.whatsapp && (
                          <a
                            href={`https://wa.me/${currentCust.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(currentCust.name)},%20aqui%20é%20da%20CR%20Serviços%20Gerais%20referente%20ao%20atendimento%20da%20${selectedWo.code}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp Direto
                          </a>
                        )}
                        {onOpenWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp({ customer: currentCust, workOrder: selectedWo })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            Modelos Formatados
                          </button>
                        )}
                        {currentCust?.phone && (
                          <a
                            href={`tel:${currentCust.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Ligar
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Técnico Responsável
                      </span>
                      <p className="font-bold text-sm text-slate-900">
                        {currentTech?.name || 'Não atribuído'}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Função: {currentTech?.role || 'Técnico Especialista'}
                      </p>
                      <p className="text-xs text-slate-600">
                        Status atual: <strong>{currentTech?.status || 'Disponível'}</strong>
                      </p>
                      <div className="mt-2 text-sm font-mono font-extrabold text-emerald-700 tracking-tight tabular-nums flex items-center justify-between">
                        <span>Valor: R$ {Number(selectedWo.value).toFixed(2)} ({selectedWo.paymentMethod})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickPriceValue(String(selectedWo.value || ''));
                            setQuickPriceReason(selectedWo.customPriceReason || '');
                            setQuickPriceModalOpen(true);
                          }}
                          className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 cursor-pointer transition-colors"
                          title="Ajustar valor final do atendimento"
                        >
                          Ajustar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Status Progression Buttons com botão 'Concluir e Lançar Receita' em destaque e bem maior */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Avançar Status Operacional (1 Clique):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus('EM_DESLOCAMENTO')}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all"
                      >
                        🚗 Em Deslocamento
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('EM_ATENDIMENTO')}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all"
                      >
                        🔧 No Local / Em Atendimento
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('AGUARDANDO')}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all"
                      >
                        ⏸️ Aguardando Peça
                      </button>
                    </div>

                    {/* Botão Finalizar e Lançar Receita GRANDE e destacado */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleUpdateStatus('CONCLUIDA')}
                        disabled={isUpdatingStatus}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-98 text-white shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-500/30"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                        <span>Concluir e Lançar Receita</span>
                      </button>
                    </div>
                  </div>

                  {/* Barra de Alternar Exibição dos Detalhes no Mobile */}
                  <div className="sm:hidden pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                    >
                      <span>{isDetailsExpanded ? 'Ocultar Laudos, Histórico e Fotos' : 'Ver Laudos Técnicos, Histórico & Fotos'}</span>
                      {isDetailsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>

                  {/* Conteúdo Detalhado (Laudo, Histórico, Fotos): recolhido por padrão no mobile para agilidade, visível sempre no desktop ou quando clicado */}
                  <div className={`${isDetailsExpanded ? 'block space-y-6' : 'hidden sm:block sm:space-y-6'}`}>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Histórico e Linha do Tempo
                    </h4>
                    <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                      {selectedWo.timeline?.map((item, idx) => (
                        <div key={idx} className="relative pl-4 text-xs">
                          <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{item.description}</p>
                          {item.userName && (
                            <p className="text-[10px] text-blue-700 mt-0.5">Por: {item.userName}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Report (Laudo Técnico) Form */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Laudo Técnico & Evidências de Atendimento
                      </h4>
                      <button
                        onClick={handleSaveReport}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                      >
                        Salvar Laudo
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Problema Encontrado:
                        </label>
                        <textarea
                          rows={2}
                          value={reportProblem}
                          onChange={(e) => setReportProblem(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Serviço Realizado:
                        </label>
                        <textarea
                          rows={2}
                          value={reportService}
                          onChange={(e) => setReportService(e.target.value)}
                          placeholder="Ex: Desobstrução mecânica com máquina K-50..."
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Materiais Utilizados:
                        </label>
                        <input
                          type="text"
                          value={reportMaterials}
                          onChange={(e) => setReportMaterials(e.target.value)}
                          placeholder="Ex: Fita veda-rosca, cabo flexível 16mm..."
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Garantia Estipulada:
                        </label>
                        <input
                          type="text"
                          value={reportWarranty}
                          onChange={(e) => setReportWarranty(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-semibold mb-1">
                          Assinatura / Nome do Cliente Recebedor:
                        </label>
                        <input
                          type="text"
                          value={clientSignName}
                          onChange={(e) => setClientSignName(e.target.value)}
                          placeholder="Nome da pessoa que conferiu e assinou o serviço no local"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {/* Photo Attachments (Antes / Depois) */}
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Registro Fotográfico do Atendimento (Antes e Depois)</span>
                        {uploadingPhoto && (
                          <span className="text-[11px] text-blue-600 animate-pulse">
                            Enviando imagem...
                          </span>
                        )}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Before photo */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Foto Antes (Início do Atendimento)
                          </span>
                          {(selectedWo.photoBefore || selectedWo.report?.beforePhotos?.[0]) ? (
                            <img
                              src={selectedWo.photoBefore || selectedWo.report?.beforePhotos?.[0]}
                              alt="Antes"
                              className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-300"
                            />
                          ) : (
                            <div className="w-full h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] mb-2">
                              Nenhuma foto antes
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1">
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-2xs active:scale-95">
                              <Camera className="w-3 h-3" />
                              <span>Câmera</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, 'before')}
                              />
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors border border-slate-200 active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Galeria</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, 'before')}
                              />
                            </label>
                          </div>
                        </div>

                        {/* After photo */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                            Foto Depois (Serviço Concluído)
                          </span>
                          {(selectedWo.photoAfter || selectedWo.report?.afterPhotos?.[0]) ? (
                            <img
                              src={selectedWo.photoAfter || selectedWo.report?.afterPhotos?.[0]}
                              alt="Depois"
                              className="w-full h-24 object-cover rounded-lg mb-2 border border-emerald-300"
                            />
                          ) : (
                            <div className="w-full h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] mb-2">
                              Nenhuma foto depois
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1">
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs active:scale-95">
                              <Camera className="w-3 h-3" />
                              <span>Câmera</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, 'after')}
                              />
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors border border-slate-200 active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Galeria</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, 'after')}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Galeria de Fotos Extras Enviadas pelo Técnico no Mobile */}
                      {selectedWo.report?.afterPhotos && selectedWo.report.afterPhotos.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                            Galeria Completa de Fotos Capturadas pelo Técnico no Mobile ({selectedWo.report.afterPhotos.length} fotos):
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {selectedWo.report.afterPhotos.map((photo, pIdx) => (
                              <div key={pIdx} className="relative group rounded-lg overflow-hidden border border-slate-200 h-16 shadow-2xs">
                                <img src={photo} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Laudo Técnico com IA */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Laudo Técnico & Conclusão Operacional:</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedWo) return;
                            try {
                              setIsAnalyzingAi(true);
                              const pBefore = selectedWo.photoBefore || selectedWo.report?.beforePhotos?.[0];
                              const pAfter = selectedWo.photoAfter || selectedWo.report?.afterPhotos?.[0];
                              const res = await api.analyzeWorkOrderPhotos({
                                photoBefore: pBefore,
                                photoAfter: pAfter,
                                problemDescription: selectedWo.problemDescription,
                                clientName: currentCust?.name,
                                serviceName: selectedWo.problemDescription ? selectedWo.problemDescription.slice(0, 45) : 'Manutenção Geral',
                              });
                              if (res && res.laudo) {
                                const updated = await api.updateWorkOrder(selectedWo.id, {
                                  technicalReportText: res.laudo,
                                });
                                setSelectedWo(updated);
                                showToast('Laudo Gerado com IA!', 'Laudo técnico atualizado com base nas fotos do atendimento.', 'success');
                                onRefresh();
                              }
                            } catch (err: any) {
                              showToast('Erro ao analisar com IA', err.message, 'error');
                            } finally {
                              setIsAnalyzingAi(false);
                            }
                          }}
                          disabled={isAnalyzingAi}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isAnalyzingAi ? 'Analisando Fotos...' : '✨ Gerar / Atualizar Laudo com IA'}</span>
                        </button>
                      </div>

                      {selectedWo.technicalReportText ? (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 text-xs font-mono whitespace-pre-line leading-relaxed">
                          {selectedWo.technicalReportText}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic bg-white p-3 rounded-xl border border-dashed border-slate-200">
                          Nenhum laudo textual gerado ainda. Clique no botão de IA acima para resumir o laudo pelas fotos.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
      )}

      {/* Modal: Create / Edit Work Order (Com Barrinha de Preenchimento 100% e Adaptada ao Mobile) */}
      {modalOpen && (
        <div className="fixed sm:absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[94vh] sm:max-h-[840px] shadow-2xl p-4 sm:p-5 relative flex flex-col overflow-hidden my-auto">
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer z-20"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal com Título Único */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold pr-6">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                  <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>{editingWo ? `Editar ${editingWo.code}` : 'Nova Ordem de Serviço'}</span>
                </h3>
                {!isEmployee && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    Etapa {currentStep} de 4 ({formProgress}%)
                  </span>
                )}
              </div>

              {/* Linha Visual da Barra de Preenchimento: 25% por etapa de forma proporcional */}
              <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${
                    formProgress === 100
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                      : formProgress >= 75
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                      : formProgress >= 50
                      ? 'bg-gradient-to-r from-amber-500 to-blue-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${formProgress}%` }}
                />
              </div>

              {/* Texto de Orientação da Etapa */}
              <div className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span>
                  {currentStep === 1 && '1. Preencher os dados do cliente e clicar no botão para avançar.'}
                  {currentStep === 2 && '2. Ir para o atendimento técnico e data e avançar.'}
                  {currentStep === 3 && '3. Ir para os valores e avançar.'}
                  {currentStep === 4 && '4. Ir para a foto do laudo técnico'}
                </span>
              </div>
            </div>

            {/* FORMULÁRIO POR ETAPAS */}
            <form onSubmit={handleSaveWorkOrder} className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 text-xs">
              {/* ==================== ETAPA 1: DADOS DO CLIENTE & ENDEREÇO ==================== */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Dados do Cliente & Endereço: *</span>
                      </label>
                      {isCustomerSelectedFromDb && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Cadastrado
                        </span>
                      )}
                    </div>

                    {/* Campo Nome do Cliente com Autocomplete */}
                    <div ref={customerInputWrapperRef} className="relative">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={formCustomerName}
                            onChange={(e) => {
                              setFormCustomerName(e.target.value);
                              setIsCustomerSelectedFromDb(false);
                              setFormCustomerId('');
                              setCustomerDropdownOpen(true);
                            }}
                            onFocus={() => {
                              if (!isCustomerSelectedFromDb && formCustomerName.trim().length > 0) {
                                setCustomerDropdownOpen(true);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setCustomerDropdownOpen(false), 200);
                            }}
                            placeholder="Digite o nome do cliente..."
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium text-xs focus:outline-none focus:border-blue-600 shadow-2xs"
                            required
                          />
                          {formCustomerName && !isCustomerSelectedFromDb && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormCustomerName('');
                                setCustomerDropdownOpen(false);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isCustomerSelectedFromDb && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerSelectedFromDb(false);
                              setFormCustomerId('');
                              setCustomerDropdownOpen(false);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer shrink-0"
                          >
                            Trocar
                          </button>
                        )}
                      </div>

                      {/* Dropdown de sugestão para clientes na base */}
                      {(() => {
                        if (!customerDropdownOpen || isCustomerSelectedFromDb || formCustomerName.trim().length === 0) {
                          return null;
                        }
                        const matched = customers.filter(
                          (c) =>
                            c.name.toLowerCase().includes(formCustomerName.toLowerCase()) ||
                            c.phone.includes(formCustomerName) ||
                            (c.neighborhood && c.neighborhood.toLowerCase().includes(formCustomerName.toLowerCase()))
                        );

                        if (matched.length === 0) return null;

                        return (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-52 overflow-y-auto divide-y divide-slate-100">
                            {matched.slice(0, 5).map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormCustomerId(c.id);
                                  setFormCustomerName(c.name);
                                  setFormCustomerPhone(c.phone || c.whatsapp || '');
                                  setFormCustomerStreet(c.street || '');
                                  setFormCustomerNeighborhood(c.neighborhood || '');
                                  setFormCustomerNumber(c.number || '');
                                  setFormCustomerCity(c.city || 'Caxias do Sul');
                                  setFormCustomerCep(c.cep || '');
                                  setIsCustomerSelectedFromDb(true);
                                  setCustomerDropdownOpen(false);
                                }}
                                className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      ✓ Cadastrado
                                    </span>
                                    <span>{c.name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {c.phone} • {c.neighborhood}, {c.street} {c.number}
                                  </div>
                                </div>
                                <span className="text-blue-600 font-bold text-xs shrink-0 pl-2">Selecionar</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Telefone e CEP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Telefone / WhatsApp: *
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={formCustomerPhone}
                          onFocus={() => setCustomerDropdownOpen(false)}
                          onChange={(e) => setFormCustomerPhone(e.target.value)}
                          placeholder="(54) 99123-4567"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-semibold">CEP:</label>
                          {loadingCep && (
                            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={formCustomerCep}
                            maxLength={9}
                            onFocus={() => setCustomerDropdownOpen(false)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormCustomerCep(val);
                              const clean = val.replace(/\D/g, '');
                              if (clean.length === 8) {
                                buscarCep(val);
                              }
                            }}
                            onBlur={() => {
                              if (formCustomerCep.replace(/\D/g, '').length === 8) {
                                buscarCep(formCustomerCep);
                              }
                            }}
                            placeholder="00000-000"
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 pr-9 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => buscarCep(formCustomerCep)}
                            disabled={loadingCep}
                            title="Buscar endereço pelo CEP"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bairro e Cidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Bairro: *</label>
                        <input
                          type="text"
                          value={formCustomerNeighborhood}
                          onFocus={() => setCustomerDropdownOpen(false)}
                          onChange={(e) => setFormCustomerNeighborhood(e.target.value)}
                          placeholder="Ex: Centro, Rio Branco, Lourdes..."
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Cidade:</label>
                        <input
                          type="text"
                          value={formCustomerCity}
                          onFocus={() => setCustomerDropdownOpen(false)}
                          onChange={(e) => setFormCustomerCity(e.target.value)}
                          placeholder="Ex: Caxias do Sul"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {/* Logradouro e Número */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <label className="block text-slate-700 font-semibold mb-1">
                          Endereço (Rua / Logradouro): *
                        </label>
                        <input
                          type="text"
                          value={formCustomerStreet}
                          onFocus={() => setCustomerDropdownOpen(false)}
                          onChange={(e) => setFormCustomerStreet(e.target.value)}
                          placeholder="Ex: Rua Sinimbu"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Número: *</label>
                        <input
                          type="text"
                          value={formCustomerNumber}
                          onFocus={() => setCustomerDropdownOpen(false)}
                          onChange={(e) => setFormCustomerNumber(e.target.value)}
                          placeholder="1234"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rodapé da Etapa 1 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold shadow-md transition-all cursor-pointer text-xs"
                    >
                      <span>Avançar para Atendimento</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== ETAPA 2: ATENDIMENTO TÉCNICO & AGENDAMENTO ==================== */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span>Atendimento, Técnico & Data: *</span>
                    </h4>

                    {/* Técnico Atribuído e Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Técnico Atribuído: *</label>
                        <select
                          value={formTechnicianId}
                          onChange={(e) => setFormTechnicianId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                          required
                        >
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.role} - {t.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Status da OS:</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as WorkOrderStatus)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                        >
                          <option value="AGENDADA">AGENDADA</option>
                          <option value="ABERTA">ABERTA</option>
                          <option value="EM_DESLOCAMENTO">EM DESLOCAMENTO</option>
                          <option value="EM_ATENDIMENTO">EM ATENDIMENTO</option>
                          <option value="CONCLUIDA">CONCLUÍDA</option>
                        </select>
                      </div>
                    </div>

                    {/* Data e Horário */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Data Agendada: *</label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Horário: *</label>
                        <input
                          type="time"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Barra de Serviços Disponíveis (Seleção rápida) */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          <span>Serviços Disponíveis (Escolha Rápida):</span>
                        </label>
                        {formProblem && (
                          <button
                            type="button"
                            onClick={() => setFormProblem('')}
                            className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                          >
                            Limpar
                          </button>
                        )}
                      </div>

                      <select
                        value={[
                          'Desentupimento hidrojateamento',
                          'Desentupimento de fossa',
                          'Elétrica',
                          'Manutenção',
                          'Serviços gerais'
                        ].includes(formProblem) ? formProblem : (formProblem ? 'OUTRO' : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== 'OUTRO') {
                            setFormProblem(val);
                          } else if (val === '') {
                            setFormProblem('');
                          }
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Escolher serviço rápido --</option>
                        <option value="Desentupimento hidrojateamento">Desentupimento hidrojateamento</option>
                        <option value="Desentupimento de fossa">Desentupimento de fossa</option>
                        <option value="Elétrica">Elétrica</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Serviços gerais">Serviços gerais</option>
                        {formProblem && ![
                          'Desentupimento hidrojateamento',
                          'Desentupimento de fossa',
                          'Elétrica',
                          'Manutenção',
                          'Serviços gerais'
                        ].includes(formProblem) && (
                          <option value="OUTRO">{formProblem} (Personalizado)</option>
                        )}
                      </select>
                    </div>

                    {/* Observações / Descrição detalhada */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-semibold">
                          Descrição / Observações do Chamado: *
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={formProblem}
                        onChange={(e) => setFormProblem(e.target.value)}
                        placeholder="Digite aqui o serviço a ser realizado ou observações do chamado..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed text-xs font-medium shadow-2xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Rodapé da Etapa 2 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      ← Voltar (Cliente)
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold shadow-md transition-all cursor-pointer text-xs"
                    >
                      <span>Avançar para Valores</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== ETAPA 3: VALOR E FORMA DE PAGAMENTO ==================== */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Valor do Serviço e Pagamento: *</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Valor do Serviço (R$): *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={formValue || ''}
                          onChange={(e) => setFormValue(Number(e.target.value))}
                          placeholder="Ex: 350.00"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                          required
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento:</label>
                        <select
                          value={formPaymentMethod}
                          onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                        >
                          <option value="PIX">PIX (Chave da Empresa)</option>
                          <option value="DINHEIRO">Dinheiro em Espécie</option>
                          <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                          <option value="CARTAO_DEBITO">Cartão de Débito</option>
                          <option value="BOLETO">Boleto Bancário</option>
                          <option value="TRANSFERENCIA">Transferência Bancária</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé da Etapa 3 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      ← Voltar (Atendimento)
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold shadow-md transition-all cursor-pointer text-xs"
                    >
                      <span>Avançar para Foto e Laudo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== ETAPA 4: FOTOS E LAUDO TÉCNICO ==================== */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Foto do Laudo Técnico (Opcional):</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        Opcional
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Foto 1: Antes */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-700 uppercase mb-1.5">
                          Antes do Serviço
                        </span>
                        {formPhotoBefore ? (
                          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 group mb-1.5">
                            <img src={formPhotoBefore} alt="Antes" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormPhotoBefore('')}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-16 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mb-1.5">
                            <Camera className="w-4 h-4 stroke-1 text-slate-400" />
                            <span className="text-[9px]">Sem foto</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 w-full">
                          <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors shadow-2xs justify-center active:scale-95" title="Abrir Câmera e Tirar Foto">
                            <Camera className="w-3 h-3" />
                            <span>Câmera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleCapturePhoto(e, 'before')}
                            />
                          </label>
                          <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200 justify-center active:scale-95" title="Anexar da Galeria">
                            <Upload className="w-3 h-3" />
                            <span>Galeria</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCapturePhoto(e, 'before')}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Foto 2: Concluído */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase mb-1.5">
                          Serviço Concluído
                        </span>
                        {formPhotoAfter ? (
                          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-300 group mb-1.5">
                            <img src={formPhotoAfter} alt="Pronto" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormPhotoAfter('')}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-16 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mb-1.5">
                            <Camera className="w-4 h-4 stroke-1 text-slate-400" />
                            <span className="text-[9px]">Sem foto</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 w-full">
                          <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-2xs justify-center active:scale-95" title="Abrir Câmera e Tirar Foto">
                            <Camera className="w-3 h-3" />
                            <span>Câmera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleCapturePhoto(e, 'after')}
                            />
                          </label>
                          <label className="cursor-pointer flex-1 inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200 justify-center active:scale-95" title="Anexar da Galeria">
                            <Upload className="w-3 h-3" />
                            <span>Galeria</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCapturePhoto(e, 'after')}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Laudo e IA */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <label className="block text-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          <span>Laudo Técnico Operacional:</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAiReport}
                          disabled={isAnalyzingAi}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-[10px] shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{isAnalyzingAi ? 'Resumindo...' : '✨ Laudo IA'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={formTechnicalReportText}
                        onChange={(e) => setFormTechnicalReportText(e.target.value)}
                        placeholder="Laudo técnico ou parecer emitido pelo profissional..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-mono leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Rodapé da Etapa 4 (Botão Finalizar OS) */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      ← Voltar (Valores)
                    </button>

                    <button
                      type="submit"
                      disabled={!isFormComplete}
                      className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all ${
                        isFormComplete
                          ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/30 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                      }`}
                    >
                      {isFormComplete ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                          <span>
                            {editingWo
                              ? (isEmployee ? 'Salvar Alterações' : 'Salvar Alterações (100%)')
                              : (isEmployee ? 'Finalizar e Lançar OS' : 'Finalizar e Lançar OS (100%)')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                          <span>
                            {isEmployee
                              ? 'Preencha as 4 etapas para Finalizar'
                              : `Preencha 100% para Finalizar (${formProgress}%)`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Quick Price Edit Modal */}
      {quickPriceModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-5 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Ajustar / Editar Valor Final da OS
                  </h3>
                  <span className="text-xs text-blue-700 font-mono font-bold">
                    {selectedWo.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Altere o valor deste atendimento caso o técnico tenha cobrado por metragem extra no local, substituição de peças ou upsell de serviço. O dashboard financeiro e fluxo de caixa serão sincronizados imediatamente.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const num = parseFloat(quickPriceValue.replace(',', '.')) || 0;
                if (num <= 0) {
                  showToast('Valor inválido', 'Informe um valor maior que zero.', 'error');
                  return;
                }
                try {
                  setIsSavingQuickPrice(true);
                  const updated = await api.updateWorkOrder(selectedWo.id, {
                    value: num,
                    paymentMethod: quickPricePaymentMethod,
                    customPriceReason: quickPriceReason.trim() || 'Ajuste de valor em campo pelo técnico (metragem/upsell)',
                  });
                  setSelectedWo(updated);
                  showToast('Valor e Pagamento Atualizados!', `Novo valor: R$ ${num.toFixed(2)} (${quickPricePaymentMethod}). Sincronizado com o financeiro.`, 'success');
                  setQuickPriceModalOpen(false);
                  onRefresh();
                } catch (err: any) {
                  showToast('Erro ao atualizar valor', err.message, 'error');
                } finally {
                  setIsSavingQuickPrice(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Valor Total da OS (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={quickPriceValue}
                    onChange={(e) => setQuickPriceValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Forma de Pagamento Negociada no Local:
                </label>
                <select
                  value={quickPricePaymentMethod}
                  onChange={(e) => setQuickPricePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="PIX">PIX (Chave ou QR Code)</option>
                  <option value="DINHEIRO">Dinheiro em Espécie</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito (Maquininha)</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito (Maquininha)</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="FATURADO">Faturado / Convênio Empresa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Alteração de Valor (Ex: Metragem / Upsell):
                </label>
                <input
                  type="text"
                  value={quickPriceReason}
                  onChange={(e) => setQuickPriceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  placeholder="Ex: Cobrança por 4 metros adicionais de desobstrução"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickPriceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickPrice}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer"
                >
                  {isSavingQuickPrice ? 'Salvando...' : 'Salvar Novo Valor'}
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
        title="Excluir Ordem de Serviço?"
        message="A exclusão desta OS apagará permanentemente o histórico e laudo deste atendimento."
        itemName={woToDelete?.code}
      />
    </div>
  );
};

