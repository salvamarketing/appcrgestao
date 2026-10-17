import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Building2,
  Home,
  Briefcase,
  Warehouse,
  ExternalLink,
  Edit2,
  Trash2,
  Wrench,
  Phone,
  User,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Customer, CustomerLocation, LocationType, WorkOrder } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';

interface LocationsPageProps {
  locations: CustomerLocation[];
  customers: Customer[];
  onRefresh: () => void;
  onOpenNewWorkOrderForLocation?: (location: CustomerLocation, customer?: Customer) => void;
}

export const LocationsPage: React.FC<LocationsPageProps> = ({
  locations,
  customers,
  onRefresh,
  onOpenNewWorkOrderForLocation,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterCustomer, setFilterCustomer] = useState<string>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CustomerLocation | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<CustomerLocation | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('comercial');
  const [cep, setCep] = useState('95020-000');
  const [loadingCep, setLoadingCep] = useState(false);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Caxias do Sul');
  const [state, setState] = useState('RS');
  const [reference, setReference] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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

  // Filtered locations
  const filteredLocations = locations.filter((loc) => {
    const matchesType = filterType === 'TODOS' || loc.type === filterType;
    const matchesCustomer = filterCustomer === 'TODOS' || loc.customerId === filterCustomer;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      loc.name.toLowerCase().includes(query) ||
      (loc.customerName && loc.customerName.toLowerCase().includes(query)) ||
      loc.street.toLowerCase().includes(query) ||
      loc.neighborhood.toLowerCase().includes(query) ||
      loc.city.toLowerCase().includes(query) ||
      loc.cep.includes(query) ||
      (loc.contactName && loc.contactName.toLowerCase().includes(query));
    return matchesType && matchesCustomer && matchesQuery;
  });

  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    setCustomerId(customers[0]?.id || '');
    setName('');
    setType('comercial');
    setCep('95020-000');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('Caxias do Sul');
    setState('RS');
    setReference('');
    setContactName('');
    setContactPhone('(54) 9');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (loc: CustomerLocation) => {
    setEditingLocation(loc);
    setCustomerId(loc.customerId);
    setName(loc.name);
    setType(loc.type || 'comercial');
    setCep(loc.cep || '95020-000');
    setStreet(loc.street);
    setNumber(loc.number);
    setComplement(loc.complement || '');
    setNeighborhood(loc.neighborhood);
    setCity(loc.city);
    setState(loc.state);
    setReference(loc.reference || '');
    setContactName(loc.contactName || '');
    setContactPhone(loc.contactPhone || '');
    setNotes(loc.notes || '');
    setModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      showToast('Atenção', 'Selecione o cliente para vincular o local.', 'warning');
      return;
    }
    if (!name.trim()) {
      showToast('Atenção', 'Informe um nome para o local (ex: Matriz, Apto 302, Filial).', 'warning');
      return;
    }

    try {
      setSaving(true);
      const chosenCustomer = customers.find((c) => c.id === customerId);

      if (editingLocation) {
        await api.updateLocation(editingLocation.id, {
          customerId,
          customerName: chosenCustomer?.name,
          name,
          type,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          reference,
          contactName,
          contactPhone,
          notes,
        });
        showToast('Local atualizado com sucesso!', undefined, 'success');
      } else {
        await api.createLocation({
          customerId,
          customerName: chosenCustomer?.name,
          name,
          type,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          reference,
          contactName,
          contactPhone,
          notes,
          userId: user?.id,
          userName: user?.name,
          userRole: user?.role
        });
        showToast('Novo local cadastrado com sucesso!', undefined, 'success');
      }

      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar local', err.message || 'Falha na gravação', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    try {
      await api.deleteLocation(locationToDelete.id);
      showToast('Local removido com sucesso!', undefined, 'success');
      setDeleteModalOpen(false);
      setLocationToDelete(null);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao remover local', err.message || 'Falha ao excluir', 'error');
    }
  };

  const getTypeBadge = (type?: LocationType) => {
    switch (type) {
      case 'comercial':
        return { label: 'Comercial', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Briefcase };
      case 'condominio':
        return { label: 'Condomínio', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Building2 };
      case 'industrial':
        return { label: 'Industrial / Galpão', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Warehouse };
      default:
        return { label: 'Residencial', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Home };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <MapPin className="w-6 h-6 text-indigo-600" />
            Locais de Atendimento e Unidades
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de filiais, condomínios, matrizes e pontos de atendimento dos clientes
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Local</span>
        </button>
      </div>

      {/* 4 Main Operational KPI Cards (Standardized font-display tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Locais */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Locais
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {String(locations.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">unidades</span>
          </div>
        </div>

        {/* Card 2: Comerciais */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Comerciais
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight tabular-nums">
              {String(locations.filter((l) => l.type === 'comercial').length).padStart(2, '0')}
            </span>
            <span className="text-xs text-blue-700 font-semibold">empresas</span>
          </div>
        </div>

        {/* Card 3: Condomínios */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Condomínios
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-700 tracking-tight tabular-nums">
              {String(locations.filter((l) => l.type === 'condominio').length).padStart(2, '0')}
            </span>
            <span className="text-xs text-purple-700 font-semibold">prediais</span>
          </div>
        </div>

        {/* Card 4: Residenciais / Outros */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Residenciais / Outros
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {String(locations.filter((l) => l.type === 'residencial' || l.type === 'industrial').length).padStart(2, '0')}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">casas e galpões</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por local, cliente, rua, bairro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter by Client */}
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
          >
            <option value="TODOS">Todos os Clientes</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="comercial">Comercial</option>
            <option value="residencial">Residencial</option>
            <option value="condominio">Condomínio</option>
            <option value="industrial">Industrial</option>
          </select>

          <span className="text-xs text-slate-500 font-medium ml-auto">
            {filteredLocations.length} {filteredLocations.length === 1 ? 'local' : 'locais'} encontrados
          </span>
        </div>
      </div>

      {/* Locations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nenhum local de atendimento encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Tente alterar os termos de busca ou cadastre um novo local para um dos clientes.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Local
            </button>
          </div>
        ) : (
          filteredLocations.map((loc) => {
            const badge = getTypeBadge(loc.type);
            const Icon = badge.icon;
            const customer = customers.find((c) => c.id === loc.customerId);

            return (
              <div
                key={loc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Type Badge & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(loc)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Local"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setLocationToDelete(loc);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Excluir Local"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Location Title & Customer */}
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Cliente: <strong className="text-slate-900">{loc.customerName || customer?.name || 'Cliente'}</strong>
                  </p>

                  {/* Address Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {loc.street}, {loc.number}
                        {loc.complement ? ` (${loc.complement})` : ''} - {loc.neighborhood}, {loc.city}/{loc.state}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                      <span>CEP: {loc.cep}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${loc.street}, ${loc.number}, ${loc.neighborhood}, ${loc.city}, ${loc.state}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-0.5 font-sans font-semibold text-xs"
                      >
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {loc.reference && (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        Ref: {loc.reference}
                      </p>
                    )}
                  </div>

                  {/* Contact / Access Notes */}
                  {(loc.contactName || loc.notes) && (
                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-xs">
                      {loc.contactName && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate">
                            Contato: {loc.contactName} {loc.contactPhone ? `(${loc.contactPhone})` : ''}
                          </span>
                        </div>
                      )}
                      {loc.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          Obs: {loc.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action: Lançar Serviço neste Local */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (onOpenNewWorkOrderForLocation) {
                        onOpenNewWorkOrderForLocation(loc, customer);
                      }
                    }}
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lançar Serviço neste Local</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Cadastro / Edição de Local */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {editingLocation ? 'Editar Local de Atendimento' : 'Cadastrar Novo Local de Atendimento'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Cliente Vinculado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente Vinculado *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome do Local e Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome / Identificação do Local *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Matriz, Filial Lourdes, Apto 302..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Estabelecimento
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LocationType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="comercial">Comercial / Loja</option>
                    <option value="residencial">Residencial</option>
                    <option value="condominio">Condomínio</option>
                    <option value="industrial">Industrial / Galpão</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* CEP, Cidade e Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">CEP *</label>
                    {loadingCep && (
                      <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
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
                        if (val.replace(/\D/g, '').length === 8) {
                          buscarCep(val);
                        }
                      }}
                      onBlur={() => {
                        if (cep.replace(/\D/g, '').length === 8) {
                          buscarCep(cep);
                        }
                      }}
                      placeholder="95020-000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pr-9 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => buscarCep(cep)}
                      disabled={loadingCep}
                      title="Buscar endereço pelo CEP"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Logradouro, Número, Complemento e Bairro */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Logradouro (Rua / Av.) *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua Alfredo Chaves"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número *</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 302 / Bloco B / Galpão 3"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro, Lourdes, Panazzolo..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Ponto de Referência */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ponto de Referência</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Em frente à Praça Dante, portão 2 dos fundos..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Contato no Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Contato no Local</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Porteiro Carlos, Gerente Denis..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone do Contato</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(54) 99123-4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              {/* Observações de Acesso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações de Acesso / Instruções Técnicas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Viatura autorizada pelo portão 2. Chave do registro geral fica na administração..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingLocation ? 'Salvar Alterações' : 'Cadastrar Local'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && locationToDelete && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteLocation}
          title="Excluir Local de Atendimento"
          message={`Tem certeza que deseja excluir o local "${locationToDelete.name}" de ${locationToDelete.customerName}? Esta ação é permanente.`}
        />
      )}
    </div>
  );
};
