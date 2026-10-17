import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  MapPin,
  ClipboardList,
  FileText,
  Edit2,
  Trash2,
  Building2,
  Home,
  Briefcase,
  X,
  ExternalLink,
  History,
  CheckCircle2,
  Loader2,
  Wrench
} from 'lucide-react';
import { Customer, CustomerLocation, CustomerType, WorkOrder, Quote } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { hasPermission } from '../utils/permissions';
import { AddressGpsLinks } from '../components/common/AddressGpsLinks';

interface CustomersPageProps {
  customers: Customer[];
  locations?: CustomerLocation[];
  workOrders: WorkOrder[];
  quotes: Quote[];
  onRefresh: () => void;
  onOpenNewWorkOrderForCustomer: (c: Customer) => void;
  onOpenNewQuoteForCustomer: (c: Customer) => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  customers,
  locations = [],
  workOrders,
  quotes,
  onRefresh,
  onOpenNewWorkOrderForCustomer,
  onOpenNewQuoteForCustomer,
  onSelectWorkOrder
}) => {
  const { showToast } = useNotification();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [customerForHistory, setCustomerForHistory] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form states
  const [type, setType] = useState<CustomerType>('residencial');
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Bento Gonçalves');
  const [state, setState] = useState('RS');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

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
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf);
      showToast('Endereço localizado!', `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro || ''} - ${data.localidade}/${data.uf}`, 'success');
    } catch (error) {
      console.error('Erro na comunicação com o ViaCEP:', error);
      showToast('Erro', 'Não foi possível consultar o CEP no momento.', 'error');
    } finally {
      setLoadingCep(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesType = filterType === 'TODOS' || c.type === filterType;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.whatsapp.includes(query) ||
      c.neighborhood.toLowerCase().includes(query) ||
      c.street.toLowerCase().includes(query) ||
      (c.cpfCnpj && c.cpfCnpj.includes(query));
    return matchesType && matchesQuery;
  });

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setType('residencial');
    setName('');
    setCpfCnpj('');
    setPhone('(54) 9');
    setWhatsapp('(54) 9');
    setEmail('');
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('Bento Gonçalves');
    setState('RS');
    setReference('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setType(c.type || 'residencial');
    setName(c.name);
    setCpfCnpj(c.cpfCnpj || '');
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setEmail(c.email || '');
    setCep(c.cep);
    setStreet(c.street);
    setNumber(c.number);
    setComplement(c.complement || '');
    setNeighborhood(c.neighborhood);
    setCity(c.city);
    setState(c.state);
    setReference(c.reference || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          type,
          name,
          cpfCnpj,
          phone,
          whatsapp,
          email,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          reference,
          notes,
        });
        showToast('Cliente atualizado com sucesso!');
      } else {
        await api.createCustomer({
          type,
          name,
          cpfCnpj,
          phone,
          whatsapp,
          email,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          reference,
          notes,
        });
        showToast('Cliente cadastrado com sucesso!');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar cliente', err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await api.deleteCustomer(customerToDelete.id);
      showToast('Cliente removido do sistema.');
      setDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir cliente', err.message, 'error');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'EM_ATENDIMENTO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EM_DESLOCAMENTO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AGENDADA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONCLUIDA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELADA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeBadge = (cType?: CustomerType) => {
    switch (cType) {
      case 'condominio':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Condomínio
          </span>
        );
      case 'comercial':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Comercial
          </span>
        );
      case 'imobiliaria':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Imobiliária
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Home className="w-3 h-3" /> Residencial
          </span>
        );
    }
  };

  const totalCustomers = customers.length;
  const residentialCount = customers.filter((c) => !c.type || c.type === 'residencial').length;
  const commercialCount = customers.filter((c) => c.type === 'comercial').length;
  const corporateCount = customers.filter((c) => c.type === 'condominio' || c.type === 'imobiliaria').length;

  const isEmployee = user?.role === 'employee';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header: Mobile Standardized */}
      {isEmployee ? (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Cadastro de Clientes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredCustomers.length} cadastros na base</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs min-h-[42px] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Novo</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Cadastro e CRM de Clientes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de contatos, endereços de atendimento e histórico acumulado de serviços
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer min-h-[46px] border border-blue-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Cadastrar Novo Cliente</span>
          </button>
        </div>
      )}

      {/* Indicadores de Clientes: Um em cima do outro para exibir as palavras inteiras sem embaralhar */}
      <div className={isEmployee ? "flex flex-col gap-2.5 w-full" : "flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5"}>
        {/* Card 1: Total Clientes */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total de Clientes
              </h4>
              <p className="text-xs text-slate-400 font-medium">Cadastros na base ativa da CR</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {String(totalCustomers).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card 2: Residenciais */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Clientes Residenciais
              </h4>
              <p className="text-xs text-emerald-600/70 font-medium">Casas, sobrados e apartamentos</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight tabular-nums">
              {String(residentialCount).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card 3: Comerciais */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Clientes Comerciais
              </h4>
              <p className="text-xs text-blue-600/70 font-medium">Empresas, comércios e indústrias</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight tabular-nums">
              {String(commercialCount).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card 4: Condomínios / Imobiliárias */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Condomínios e Imobiliárias
              </h4>
              <p className="text-xs text-purple-600/70 font-medium">Prédios e administradoras</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight tabular-nums">
              {String(corporateCount).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and View Controls: Limpo e Desafogado */}
      <div className="space-y-2.5">
        {/* Campo de Busca 100% largura */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone, bairro ou rua..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        {/* Type pills com scroll horizontal */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 custom-scrollbar">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'residencial', label: 'Residencial' },
              { id: 'comercial', label: 'Comercial' },
              { id: 'condominio', label: 'Condomínios' },
              { id: 'imobiliaria', label: 'Imobiliárias' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterType(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === item.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!isEmployee && (
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tabela
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customers List View */}
      {filteredCustomers.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
          Nenhum cliente encontrado com os termos pesquisados.
        </div>
      ) : viewMode === 'cards' ? (
        <div className={isEmployee ? "space-y-3 w-full" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"}>
          {filteredCustomers.map((c) => {
            const customerWOs = workOrders.filter((w) => w.customerId === c.id);
            // Identifica o serviço ativo ou o mais recente do cliente
            const activeWo =
              customerWOs.find((w) => w.status === 'EM_ATENDIMENTO' || w.status === 'EM_DESLOCAMENTO' || w.status === 'AGENDADA') ||
              (customerWOs.length > 0 ? customerWOs[customerWOs.length - 1] : null);

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all overflow-hidden"
              >
                <div>
                  {/* Nome do Cliente e Endereço GPS */}
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight truncate" title={c.name}>
                    {c.name}
                  </h3>
                  <div className="pt-1">
                    <AddressGpsLinks
                      address={`${c.street}, ${c.number || 'S/N'} - ${c.neighborhood || ''}, ${c.city || ''}`}
                      className="text-xs"
                    />
                  </div>

                  {/* Qual o serviço que está sendo feito */}
                  {activeWo ? (
                    <div
                      onClick={() => onSelectWorkOrder(activeWo)}
                      className="mt-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate">
                          <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Serviço:</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                            activeWo.status
                          )}`}
                        >
                          {activeWo.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {activeWo.problemDescription || 'Serviço Operacional'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                        <span className="font-bold text-blue-700">{activeWo.code}</span>
                        <span>{activeWo.scheduledDate}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Nenhum serviço em andamento</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenNewWorkOrderForCustomer(c)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                      >
                        + Iniciar OS
                      </button>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card: Ação contida perfeitamente dentro do retângulo */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  {activeWo ? (
                    <button
                      type="button"
                      onClick={() => onSelectWorkOrder(activeWo)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Ver Detalhes do Serviço</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenNewWorkOrderForCustomer(c)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 active:scale-98 text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lançar Nova OS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Telefone / WhatsApp</th>
                  <th className="p-3.5">Bairro / Endereço</th>
                  <th className="p-3.5 text-center">Atendimentos</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => {
                  const customerWOs = workOrders.filter((w) => w.customerId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        {c.cpfCnpj && (
                          <span className="text-[10px] text-slate-400">{c.cpfCnpj}</span>
                        )}
                      </td>
                      <td className="p-3.5">{getTypeBadge(c.type)}</td>
                      <td className="p-3.5">
                        <div>{c.phone}</div>
                        {c.whatsapp && (
                          <div className="text-emerald-700 font-medium text-[11px]">{c.whatsapp}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{c.neighborhood}</div>
                        <AddressGpsLinks
                          address={`${c.street}, ${c.number || 'S/N'} - ${c.neighborhood || ''}, ${c.city || ''}`}
                          showWazeBadge={false}
                          className="text-[11px]"
                        />
                      </td>
                      <td className="p-3.5 text-center font-bold text-blue-600">
                        {customerWOs.length} OS
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenNewWorkOrderForCustomer(c)}
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 text-[10px] font-bold transition-colors"
                          >
                            + OS
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission(user?.role, 'records:delete') && (
                            <button
                              onClick={() => {
                                setCustomerToDelete(c);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {historyModalOpen && customerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Histórico do Cliente: {customerForHistory.name}
            </h3>
            <div className="mb-4">
              <AddressGpsLinks
                address={`${customerForHistory.street}, ${customerForHistory.number || 'S/N'} - ${customerForHistory.neighborhood || ''}, ${customerForHistory.city || ''}`}
              />
            </div>

            <div className="space-y-3">
              {workOrders.filter((w) => w.customerId === customerForHistory.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  Nenhuma ordem de serviço registrada para este cliente até o momento.
                </div>
              ) : (
                workOrders
                  .filter((w) => w.customerId === customerForHistory.id)
                  .map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => {
                        onSelectWorkOrder(wo);
                        setHistoryModalOpen(false);
                      }}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-blue-700 font-mono">{wo.code}</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {wo.scheduledDate}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                            {wo.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {wo.problemDescription}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        R$ {wo.value.toFixed(2)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tipo de Cliente:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CustomerType)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="condominio">Condomínio</option>
                    <option value="imobiliaria">Imobiliária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nome Completo / Razão Social:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Condomínio Aurora / João Silva"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CPF ou CNPJ:</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telefone Fixo/Celular:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(54) 3452-0000"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">WhatsApp (Envio de OS):</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(54) 99999-9999"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">E-mail (opcional):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@cliente.com.br"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
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
                      value={cep}
                      maxLength={9}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCep(val);
                        const clean = val.replace(/\D/g, '');
                        if (clean.length === 8) {
                          buscarCep(val);
                        }
                      }}
                      onBlur={() => {
                        if (cep.replace(/\D/g, '').length === 8) {
                          buscarCep(cep);
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pr-9 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => buscarCep(cep)}
                      disabled={loadingCep}
                      title="Buscar endereço pelo CEP"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Logradouro (Rua / Av):</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua Marechal Deodoro"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Número:</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="120"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Complemento / Bloco:</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 402, Bloco B"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bairro:</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Cidade Alta"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cidade / UF:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-3/4 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-1/4 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-center focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ponto de Referência / Como Chegar:
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Próximo à praça das rosas, portão branco"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Observações Gerais:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais do cliente ou restrições de horário"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
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
        title="Excluir Cliente?"
        message="A exclusão deste cliente removerá seu cadastro do banco de dados do sistema."
        itemName={customerToDelete?.name}
      />
    </div>
  );
};
