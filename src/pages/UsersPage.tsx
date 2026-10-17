import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

interface UsersPageProps {
  onRefresh?: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onRefresh }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formJobTitle, setFormJobTitle] = useState('Técnico Operacional');
  const [formRole, setFormRole] = useState<'admin' | 'employee'>('employee');
  const [formPhone, setFormPhone] = useState('(54) 99100-0000');
  const [formEmail, setFormEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'employee'>('employee');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Reset password form state
  const [newPassword, setNewPassword] = useState('123456');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Load users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast('Erro ao carregar usuários', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick suggestion for cargo
  const CARGO_SUGGESTIONS = [
    'Técnico Operacional',
    'Atendimento & Suporte',
    'Auxiliar de Manutenção',
    'Supervisor de Equipe',
    'Administrador Geral',
  ];

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('123456');
    setFormShowPassword(false);
    setFormJobTitle('Técnico Operacional');
    setFormRole('employee');
    setFormPhone('(54) 99100-0000');
    setFormEmail('');
    setFormError(null);
    setCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      setFormError('Nome Completo e Usuário/Login são obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const cleanUsername = formUsername.toLowerCase().trim().replace(/^@/, '');
      const created = await api.createUser({
        name: formName.trim(),
        username: cleanUsername,
        password: formPassword.trim() || '123456',
        jobTitle: formJobTitle.trim() || (formRole === 'admin' ? 'Administrador' : 'Técnico Operacional'),
        role: formRole,
        phone: formPhone.trim(),
        email: formEmail.trim() || `${cleanUsername}@crservicosgerais.com.br`,
      });

      showToast(
        'Usuário cadastrado com sucesso!',
        `O login "@${created.username}" já está liberado para entrar no sistema com a senha cadastrada.`,
        'success'
      );

      setCreateModalOpen(false);
      await fetchUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name || '');
    setEditUsername(u.username || '');
    setEditJobTitle(u.jobTitle || '');
    setEditRole(u.role === 'admin' ? 'admin' : 'employee');
    setEditPhone(u.phone || '');
    setEditEmail(u.email || '');
    setEditActive(u.active);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setSubmitting(true);
      const cleanUsername = editUsername.toLowerCase().trim().replace(/^@/, '');
      await api.updateUser(editUser.id, {
        name: editName.trim(),
        username: cleanUsername,
        jobTitle: editJobTitle.trim(),
        role: editRole,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        active: editActive,
      });

      showToast('Usuário atualizado com sucesso!', `Dados de ${editName} foram salvos.`, 'success');
      setEditUser(null);
      await fetchUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar usuário', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    if (u.id === 'usr-1' || u.username === 'admin') {
      showToast('Ação não permitida', 'O Administrador Principal não pode ser desativado.', 'warning');
      return;
    }

    try {
      const res = await api.toggleUserStatus(u.id);
      showToast(
        res.active ? 'Usuário Ativado' : 'Usuário Desativado',
        `O colaborador ${u.name} agora está ${res.active ? 'ativo' : 'inativo'}.`,
        'success'
      );
      await fetchUsers();
    } catch (err: any) {
      showToast('Erro ao alterar status', err.message, 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    try {
      setSubmitting(true);
      await api.resetUserPassword(resetPasswordUser.id, newPassword.trim() || '123456');
      showToast(
        'Senha redefinida com sucesso!',
        `A nova senha para "@${resetPasswordUser.username}" foi gravada no sistema.`,
        'success'
      );
      setResetPasswordUser(null);
    } catch (err: any) {
      showToast('Erro ao redefinir senha', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    if (deleteUser.id === 'usr-1' || deleteUser.username === 'admin') {
      showToast('Ação bloqueada', 'O Administrador Principal não pode ser excluído.', 'error');
      setDeleteUser(null);
      return;
    }

    try {
      setSubmitting(true);
      await api.deleteUser(deleteUser.id);
      showToast('Usuário excluído', `O colaborador "${deleteUser.name}" foi removido do sistema.`, 'success');
      setDeleteUser(null);
      await fetchUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir usuário', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para a área de transferência', `${label}: ${text}`, 'success');
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.jobTitle?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);

    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && (u.role === 'admin' || u.role === 'manager')) ||
      (roleFilter === 'employee' && (u.role === 'employee' || u.role === 'technician'));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.active) ||
      (statusFilter === 'inactive' && !u.active);

    return matchQuery && matchRole && matchStatus;
  });

  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'manager').length;
  const employeeCount = users.filter((u) => u.role === 'employee' || u.role === 'technician').length;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Controle de Acesso RBAC
            </span>
            <span className="text-xs text-slate-400 font-mono">• Módulo Administrativo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Gerenciamento de Usuários / Funcionários
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Cadastre novos funcionários, redefina senhas, altere permissões de acesso e controle quem pode acessar os módulos operacionais e financeiros da CR Serviços Gerais.
          </p>
        </div>

        {/* Visible Button "+ Novo Usuário" */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Novo Usuário</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total de Colaboradores</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-2">
            {String(totalCount).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Cadastrados no sistema</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Administradores</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-purple-700 tracking-tight tabular-nums mt-2">
            {String(adminCount).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-purple-600 font-medium mt-1">Acesso total administrativo</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Funcionários Operacionais</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight tabular-nums mt-2">
            {String(employeeCount).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Operação em campo & OS</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Status Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums mt-2">
            {String(activeCount).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Com login autorizado</p>
        </div>
      </div>

      {/* Role Access Information Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Controle de Perfis no Sistema</h4>
            <div className="mt-1 space-y-1 text-slate-600 leading-relaxed">
              <p>
                • <strong className="text-purple-700 font-bold">Administrador:</strong> Acesso total a todas as áreas (Dashboard, Lançamentos, Clientes, Financeiro, Configurações e Gerenciamento de Equipe).
              </p>
              <p>
                • <strong className="text-blue-700 font-bold">Funcionário:</strong> Acesso restrito apenas aos módulos operacionais (Ordens de Serviço, Visualização de Atendimentos e Clientes), bloqueando abas gerenciais/financeiras com aviso de Acesso Restrito.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, usuário @login, cargo, e-mail ou telefone..."
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Gestão ({adminCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('employee')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                roleFilter === 'employee'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Funcionários ({employeeCount})
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Apenas Ativos
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Colaborador / Nome Completo</th>
                <th className="py-3.5 px-4">Usuário / Login</th>
                <th className="py-3.5 px-4">Cargo / Função</th>
                <th className="py-3.5 px-4">Nível de Acesso (RBAC)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando usuários cadastrados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Nenhum usuário encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste o filtro de busca ou cadastre um novo usuário.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin' || u.role === 'manager';
                  const isPrimaryAdmin = u.id === 'usr-1' || u.username === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                u.active ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={u.active ? 'Ativo' : 'Inativo'}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {u.name}
                              </span>
                              {isPrimaryAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {u.email && <span className="truncate">{u.email}</span>}
                              {u.phone && <span>• {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                            @{u.username || u.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.username || '', 'Login')}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Copiar login"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Cargo / JobTitle */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700">
                          {u.jobTitle || (isAdmin ? 'Administrador Geral' : 'Técnico Operacional')}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3 h-3 text-purple-600" />
                            Gestão / Gerência
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            Funcionário (Operacional)
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={isPrimaryAdmin}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          } ${isPrimaryAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
                          title={isPrimaryAdmin ? 'Administrador Principal não pode ser desativado' : 'Clique para alternar status'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {u.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Editar Dados do Usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset password button */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPasswordUser(u);
                              setNewPassword('123456');
                              setShowNewPassword(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                            title="Resetar Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteUser(u)}
                            disabled={isPrimaryAdmin}
                            className={`p-1.5 rounded-lg transition-all ${
                              isPrimaryAdmin
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer'
                            }`}
                            title={isPrimaryAdmin ? 'Administrador Principal não pode ser excluído' : 'Excluir Usuário'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: + Novo Usuário */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Usuário / Funcionário</h3>
                  <p className="text-xs text-slate-500">Defina os dados de acesso e o perfil de permissões</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Colaborador: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Carlos Roberto de Souza"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>

              {/* Login / Usuário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usuário / Login: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder="carlos.souza ou func03"
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono font-medium"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Sem espaços ou acentos</p>
                </div>

                {/* Senha */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Senha de Acesso: <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPassword('123456')}
                      className="text-[10px] text-blue-600 hover:underline font-mono"
                    >
                      Padrão 123456
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={formShowPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl pl-3 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormShowPassword(!formShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cargo / Função */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formJobTitle}
                  onChange={(e) => setFormJobTitle(e.target.value)}
                  placeholder="Ex: Técnico Operacional em Campo"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CARGO_SUGGESTIONS.map((cargo) => (
                    <button
                      key={cargo}
                      type="button"
                      onClick={() => setFormJobTitle(cargo)}
                      className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    >
                      {cargo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nível de Acesso (RBAC) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nível de Acesso (Perfil RBAC): <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option Funcionário */}
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      formRole === 'employee'
                        ? 'bg-blue-50/80 border-blue-400 text-blue-950 ring-2 ring-blue-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="employee"
                          checked={formRole === 'employee'}
                          onChange={() => setFormRole('employee')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-bold text-xs text-slate-900">Funcionário</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                        Operacional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Lançar Serviços, Clientes e Locais. <strong>Sem acesso a Financeiro e Relatórios</strong>.
                    </p>
                  </label>

                  {/* Option Administrador */}
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      formRole === 'admin'
                        ? 'bg-purple-50/80 border-purple-400 text-purple-950 ring-2 ring-purple-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={formRole === 'admin'}
                          onChange={() => setFormRole('admin')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="font-bold text-xs text-slate-900">Administrador</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-700 text-white">
                        Total
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Acesso irrestrito a todas as áreas, financeiro, relatórios, configurações e equipe.
                    </p>
                  </label>
                </div>
              </div>

              {/* Contatos Opcionais (Telefone & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone / WhatsApp (Opcional):
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(54) 99100-0000"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    E-mail Corporativo (Opcional):
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder={formUsername ? `${formUsername}@crservicosgerais.com.br` : 'usuario@crservicosgerais.com.br'}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Após salvar, o novo usuário fica <strong>imediatamente disponível</strong> no banco do sistema para login com o usuário e senha cadastrados.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Usuário</h3>
                  <p className="text-xs text-slate-500">Alterar dados cadastrais e permissões</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuário / Login:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função:</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Nível de Acesso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nível de Acesso (RBAC):</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2 ${
                      editRole === 'employee'
                        ? 'bg-blue-50 border-blue-400 font-bold text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRole"
                      checked={editRole === 'employee'}
                      onChange={() => setEditRole('employee')}
                    />
                    <span>Funcionário (Operacional)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2 ${
                      editRole === 'admin'
                        ? 'bg-purple-50 border-purple-400 font-bold text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRole"
                      checked={editRole === 'admin'}
                      onChange={() => setEditRole('admin')}
                    />
                    <span>Administrador (Total)</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    disabled={editUser.id === 'usr-1' || editUser.username === 'admin'}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-xs font-semibold text-slate-700">Usuário Ativo (Pode fazer login)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resetar Senha */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Resetar Senha de Acesso</h3>
                <p className="text-xs text-slate-500">
                  Colaborador: <strong>{resetPasswordUser.name}</strong> (@{resetPasswordUser.username})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nova Senha:</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword('123456')}
                    className="text-[11px] text-blue-600 hover:underline font-mono"
                  >
                    Usar padrão 123456
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl pl-3 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 font-mono font-medium focus:outline-none focus:border-amber-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                O colaborador poderá entrar imediatamente utilizando este novo código no login.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Gravando...' : 'Confirmar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Excluir Usuário?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tem certeza que deseja remover o usuário <strong>{deleteUser.name}</strong> (@{deleteUser.username})?
              </p>
              <p className="text-[11px] text-rose-700 font-medium mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                Atenção: O colaborador perderá o acesso imediatamente. Esta ação será registrada no histórico de auditoria.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {submitting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
