import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Layers
} from 'lucide-react';
import { ServiceItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';

interface ServicesPageProps {
  services: ServiceItem[];
  onRefresh: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ services, onRefresh }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isEmployee = user?.role === 'employee';
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Desentupimento');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(250);
  const [estimatedDuration, setEstimatedDuration] = useState('1h');
  const [active, setActive] = useState(true);

  const categories = [
    'TODAS',
    'Desentupimento',
    'Hidráulica',
    'Limpeza Caixa D\'água',
    'Impermeabilização',
    'Dedetização',
    'Pintura e Reparos',
  ];

  const filteredServices = services.filter((s) => {
    const matchesCategory = categoryFilter === 'TODAS' || s.category === categoryFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setName('');
    setCategory('Desentupimento');
    setDescription('');
    setPrice(250);
    setEstimatedDuration('1h');
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEditModal = (s: ServiceItem) => {
    setEditingService(s);
    setName(s.name);
    setCategory(s.category);
    setDescription(s.description);
    setPrice(s.price);
    setEstimatedDuration(s.estimatedDuration);
    setActive(s.active ?? (s.status !== 'inactive'));
    setModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, {
          name,
          category,
          description,
          price: Number(price),
          estimatedDuration,
          active,
        });
        showToast('Serviço atualizado com sucesso!');
      } else {
        await api.createService({
          name,
          category,
          description,
          price: Number(price),
          estimatedDuration,
          active,
        });
        showToast('Novo serviço adicionado ao catálogo!');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar serviço', err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await api.deleteService(serviceToDelete.id);
      showToast('Serviço excluído do catálogo.');
      setDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir serviço', err.message, 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Top Header: Visualização Limpa da Tabela e Catálogo */}
      {isEmployee ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Catálogo de Serviços</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Procedimentos operacionais, tempos estimados e tabela base de valores da CR Serviços Gerais
          </p>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Catálogo de Serviços da CR</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tabela de preços base, tempos estimados e descrição técnica dos procedimentos operacionais
          </p>
        </div>
      )}

      {/* Indicadores do Catálogo: Um em cima do outro para exibir as palavras inteiras sem embaralhar */}
      <div className={isEmployee ? "flex flex-col gap-2.5 w-full" : "flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5"}>
        {/* Card 1: Total de Serviços */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total de Serviços
              </h4>
              <p className="text-xs text-slate-400 font-medium">Cadastrados no catálogo da CR</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {String(services.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card 2: Categorias */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Categorias de Serviços
              </h4>
              <p className="text-xs text-purple-600/70 font-medium">Especialidades operacionais</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight tabular-nums">
              {String(new Set(services.map((s) => s.category).filter(Boolean)).size).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card 3: Preço Médio */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Preço Médio dos Serviços
              </h4>
              <p className="text-xs text-emerald-600/70 font-medium">Valor base de referência</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight tabular-nums">
              R$ {(services.length > 0 ? services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length : 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 4: Procedimentos Ativos */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Procedimentos Ativos
              </h4>
              <p className="text-xs text-amber-600/70 font-medium">Prontos para lançamento de OS</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight tabular-nums">
              {String(services.filter((s) => s.active ?? (s.status !== 'inactive')).length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca Padronizados */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar serviço por nome ou descrição..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'TODAS' ? 'Todas Categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services List: Padrão Idêntico ao Layout de Ordens de Serviço */}
      {filteredServices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-2xs space-y-2">
          <p>Nenhum serviço encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3"
            >
              {/* Header do Card: Categoria & Ações */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {s.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(s)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar serviço"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setServiceToDelete(s);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Excluir serviço"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Nome e Descrição */}
              <div>
                <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                {s.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                )}
              </div>

              {/* Rodapé do Card: Valor Base e Tempo Estimado */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1 font-extrabold text-slate-900 tracking-tight tabular-nums">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">R$ {s.price.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-0.5">preço base</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{s.estimatedDuration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Serviço:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Desentupimento de Pia ou Vaso Sanitário"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Desentupimento">Desentupimento</option>
                    <option value="Hidráulica">Hidráulica</option>
                    <option value="Limpeza Caixa D'água">Limpeza Caixa D'água</option>
                    <option value="Impermeabilização">Impermeabilização</option>
                    <option value="Dedetização">Dedetização</option>
                    <option value="Pintura e Reparos">Pintura e Reparos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tempo Estimado:</label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="Ex: 1h a 2h"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Preço Base de Referência (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Descrição Técnica do Procedimento:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva equipamentos utilizados, máquinas e escopo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
                >
                  {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
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
        title="Excluir Serviço?"
        message="A exclusão deste serviço o removerá do catálogo geral de preços."
        itemName={serviceToDelete?.name}
      />
    </div>
  );
};
