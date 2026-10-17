import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Clock,
  Car,
  DollarSign,
  Shield,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Technician, TechnicianStatus, WorkOrder } from '../types';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';

interface TeamPageProps {
  technicians: Technician[];
  workOrders: WorkOrder[];
  onRefresh: () => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({
  technicians,
  workOrders,
  onRefresh,
  onSelectWorkOrder,
}) => {
  const { showToast } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Técnico Especialista');
  const [phone, setPhone] = useState('(54) 9');
  const [whatsapp, setWhatsapp] = useState('(54) 9');
  const [vehicle, setVehicle] = useState('Fiat Fiorino - Placa IXX-0000');
  const [specialties, setSpecialties] = useState('Desentupimento Mecânico e Alta Pressão');
  const [status, setStatus] = useState<TechnicianStatus>('Disponível');

  const handleOpenCreateModal = () => {
    setEditingTech(null);
    setName('');
    setRole('Técnico Especialista');
    setPhone('(54) 99');
    setWhatsapp('(54) 99');
    setVehicle('Fiat Fiorino');
    setSpecialties('Desentupimento, Hidráulica');
    setStatus('Disponível');
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: Technician) => {
    setEditingTech(t);
    setName(t.name || '');
    setRole(t.role || '');
    setPhone(t.phone || '');
    setWhatsapp(t.whatsapp || t.phone || '');
    setVehicle(t.vehicle || '');
    setSpecialties((t.specialties || []).join(', '));
    setStatus(t.status || 'Disponível');
    setModalOpen(true);
  };

  const handleSaveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specialtiesArray = specialties.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingTech) {
        await api.updateTechnician(editingTech.id, {
          name,
          role,
          phone,
          whatsapp,
          vehicle,
          specialties: specialtiesArray,
          status,
        });
        showToast('Dados do colaborador atualizados com sucesso!');
      } else {
        await api.createTechnician({
          name,
          role,
          phone,
          whatsapp,
          vehicle,
          specialties: specialtiesArray,
          status,
          avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150`,
          completedCount: 0,
        });
        showToast('Novo técnico cadastrado na equipe!');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar técnico', err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!techToDelete) return;
    try {
      await api.deleteTechnician(techToDelete.id);
      showToast('Colaborador removido da equipe.');
      setDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir', err.message, 'error');
    }
  };

  const getStatusBadge = (st: TechnicianStatus) => {
    switch (st) {
      case 'Disponível':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Em deslocamento':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Em atendimento':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Equipe Operacional & Técnicos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Escalação de técnicos em campo, viaturas, especialidades e acompanhamento de produtividade
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Colaborador
        </button>
      </div>

      {/* KPI Cards: Standardized with Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total na Equipe
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {String(technicians.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">colaboradores</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Em Atendimento
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-700 tracking-tight tabular-nums">
              {String(technicians.filter((t) => t.status === 'Em atendimento' || t.status === 'Em deslocamento').length).padStart(2, '0')}
            </span>
            <span className="text-xs text-amber-700 font-semibold">em campo</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Disponíveis
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {String(technicians.filter((t) => t.status === 'Disponível').length).padStart(2, '0')}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">prontos</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              OS Concluídas
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-700 tracking-tight tabular-nums">
              {String(technicians.reduce((acc, t) => acc + (t.completedCount || 0), 0)).padStart(2, '0')}
            </span>
            <span className="text-xs text-purple-700 font-semibold">finalizadas</span>
          </div>
        </div>
      </div>

      {/* Technicians Grid */}
      {technicians.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Nenhum colaborador cadastrado na equipe operacional.</p>
            <p className="text-slate-400 text-xs mt-0.5">Cadastre os técnicos que atendem chamados e realizam visitas no campo.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            + Cadastrar Primeiro Colaborador
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.map((t) => {
          const activeWO = t.activeWorkOrderId
            ? workOrders.find((w) => w.id === t.activeWorkOrderId)
            : null;

          return (
            <div
              key={t.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={t.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{t.role}</p>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border mt-1.5 ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setTechToDelete(t);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {t.vehicle && (
                    <p className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.vehicle}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{(t.specialties || [t.role]).join(', ')}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Produtividade: <strong>{t.completedCount} OS concluídas</strong>
                    </span>
                  </p>
                </div>

                {/* Active Work Order preview if any */}
                {activeWO && (
                  <div
                    onClick={() => onSelectWorkOrder(activeWO)}
                    className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 font-mono">
                        OS Ativa: {activeWO.code}
                      </span>
                      <span className="text-[10px] text-slate-500">{activeWO.scheduledTime}</span>
                    </div>
                    <p className="text-xs text-slate-800 line-clamp-1 mt-0.5">
                      {activeWO.problemDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(t.whatsapp || t.phone) && (
                    <a
                      href={`https://wa.me/${(t.whatsapp || t.phone || '').replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(t.name || 'Colaborador')},%20despacho%20operacional%20da%20CR%20Serviços%20Gerais.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chamar WhatsApp
                    </a>
                  )}
                  {t.phone && (
                    <a
                      href={`tel:${t.phone}`}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal: Create / Edit Technician */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 relative text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {editingTech ? 'Editar Colaborador' : 'Novo Técnico na Equipe'}
            </h3>

            <form onSubmit={handleSaveTechnician} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Função / Cargo:</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Técnico Especialista"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Inicial:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TechnicianStatus)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em deslocamento">Em deslocamento</option>
                    <option value="Em atendimento">Em atendimento</option>
                    <option value="Folga">Folga</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telefone Celular:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">WhatsApp:</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Veículo / Placa:</label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="Ex: Fiat Fiorino - Placa IXX-0000"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Especialidades (separadas por vírgula):
                </label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="Ex: Desentupimento, Hidráulica, Caça Vazamentos"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {editingTech ? 'Salvar Alterações' : 'Cadastrar Técnico'}
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
        title="Remover Técnico da Equipe?"
        message="A remoção deste colaborador o desvinculará da lista ativa de despachos."
        itemName={techToDelete?.name}
      />
    </div>
  );
};
