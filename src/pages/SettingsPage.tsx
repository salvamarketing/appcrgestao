import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Save,
  Shield,
  Users,
  CheckCircle2,
  Phone,
  QrCode,
  Database,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  Check,
  X,
  KeyRound
} from 'lucide-react';
import { CompanySettings, UserRole } from '../types';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getRoleBadge } from '../utils/permissions';
import { UsersPage } from './UsersPage';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';

interface SettingsPageProps {
  settings: CompanySettings;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onRefresh }) => {
  const { showToast } = useNotification();
  const { user, switchQuickRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'permissions' | 'users'>('general');

  // General fields
  const [name, setName] = useState(settings.name);
  const [commercialName, setCommercialName] = useState(settings.commercialName);
  const [cnpj, setCnpj] = useState(settings.cnpj);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [state, setState] = useState(settings.state);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType || 'CNPJ');
  const [warrantyDefault, setWarrantyDefault] = useState(settings.warrantyDefault);
  const [saving, setSaving] = useState(false);

  // Backup & Restore state
  const [restoring, setRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [parsedBackupData, setParsedBackupData] = useState<any>(null);

  // System Reset state
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        name,
        commercialName,
        cnpj,
        phone,
        whatsapp,
        email,
        address,
        city,
        state,
        pixKey,
        pixKeyType,
        warrantyDefault,
      });
      showToast('Configurações da empresa salvas com sucesso!', '', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao salvar configurações', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = api.exportBackupUrl();
    showToast('Download do backup iniciado!', 'O arquivo JSON completo foi gerado.', 'success');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const data = json.data || json;
        if (!data.workOrders || !data.customers) {
          throw new Error('O arquivo não possui os campos essenciais de ordens de serviço e clientes.');
        }
        setParsedBackupData(data);
        setRestoreConfirmOpen(true);
      } catch (err: any) {
        showToast('Arquivo de backup inválido', err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackupData) return;
    try {
      setRestoring(true);
      await api.restoreBackup({
        data: parsedBackupData,
        userId: user?.id,
        userName: user?.name,
      });
      showToast('Backup restaurado com sucesso!', 'Todos os dados foram revalidados.', 'success');
      setRestoreConfirmOpen(false);
      setParsedBackupData(null);
      onRefresh();
    } catch (err: any) {
      showToast('Falha ao restaurar backup', err.message, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setResetting(true);
      await api.resetSystemData({
        userId: user?.id,
        userName: user?.name,
      });
      showToast(
        'Dados Resetados com Sucesso!',
        'O sistema foi restaurado para o padrão original limpo (Administrador e Funcionários).',
        'success'
      );
      setResetConfirmOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao resetar dados', err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            Configurações, Backup e Permissões
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento cadastral, salvamento de dados em arquivo seguro e matriz de perfis de usuário
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dados da Empresa
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            Backup & Restauração
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Matriz de Permissões
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            Gerenciar Usuários & Equipe
          </button>
        </div>
      </div>

      {/* TAB 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Company Identity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Identificação Cadastral da Empresa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Razão Social:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Fantasia:</label>
                <input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">CNPJ Oficial:</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail Operacional:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contacts & Plantão */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              Contatos de Atendimento & Plantão 24h
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Telefone Principal (Plantão):</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">WhatsApp de Despacho:</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Endereço / Base Operacional:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cidade Sede:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estado (UF):</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* PIX & Financial Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Dados Financeiros & Chave PIX Padrão
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chave PIX da Empresa:</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="42.891.304/0001-92 ou telefone"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tipo de Chave:</label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="Telefone">Telefone</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Chave Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Termo de Garantia Padrão (CDC):
                </label>
                <input
                  type="text"
                  value={warrantyDefault}
                  onChange={(e) => setWarrantyDefault(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Segurança & Senha de Acesso do Administrador */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Segurança & Senha do Administrador
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conta principal: <strong>Cristiano</strong> (@Cristiano). Altere sua senha de acesso a qualquer momento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Alterar Senha do Administrador</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando Alterações...' : 'Salvar Todas as Configurações'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Exportar Backup Completo</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Baixe uma cópia exata de todo o banco de dados da empresa em formato JSON estruturado. Inclui todas as ordens de serviço, clientes, orçamentos, lançamentos financeiros, técnicos e logs de auditoria.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo de Backup (.JSON)
                </button>
              </div>
            </div>

            {/* Import / Restore Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Restaurar Sistema de Backup</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Carregue um arquivo JSON de backup previamente gerado para restaurar o sistema em caso de manutenção ou migração. O sistema valida os dados e preserva os registros de auditoria.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo para Restaurar
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Backup Integrity Notice */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-3 text-xs text-slate-600">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Segurança & Persistência Contínua:</span>
              <p className="text-slate-500 leading-relaxed">
                Todas as operações no CR Serviços Gerais utilizam salvamento atômico local. Recomendamos gerar e guardar um backup semanal em mídia externa ou nuvem segura.
              </p>
            </div>
          </div>

          {/* System Reset / Factory Reset Section */}
          <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950 flex items-center gap-2">
                    Reset Geral de Dados
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-200/80 text-red-800">
                      Restaurar Padrão
                    </span>
                  </h3>
                  <p className="text-xs text-red-800/90 mt-1 leading-relaxed max-w-2xl">
                    Restaura todo o sistema para o estado original limpo. Limpa todos os dados criados (novos funcionários registrados, ordens de serviço, clientes, orçamentos e lançamentos financeiros criados tanto por funcionários quanto por administradores), restabelecendo os acessos e senhas padrão (Admin: <strong>admin</strong> / 123456 e Funcionário: <strong>func01</strong> / 123456).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Resetar Todos os Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Permissions & Roles */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Active Profile Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Perfil Atual em Uso: {user?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alternar de perfil permite testar os limites e a visão específica de cada membro da equipe:
                </p>
              </div>

              {user && (
                <span className={`px-3 py-1 rounded-xl border text-xs font-bold ${getRoleBadge(user.role).colorClass}`}>
                  {getRoleBadge(user.role).label}
                </span>
              )}
            </div>

            {/* Quick Switch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => switchQuickRole('admin')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'admin'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-[11px] block font-bold text-rose-700">Administrador</span>
                <span className="text-xs text-slate-900 font-semibold">Cristiano Ramos</span>
              </button>

              <button
                type="button"
                onClick={() => switchQuickRole('manager')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'manager'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-[11px] block font-bold text-amber-700">Gerente Operacional</span>
                <span className="text-xs text-slate-900 font-semibold">Eduardo Silveira</span>
              </button>

              <button
                type="button"
                onClick={() => switchQuickRole('employee')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'employee'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-[11px] block font-bold text-blue-700">Atendimento / Recepção</span>
                <span className="text-xs text-slate-900 font-semibold">Juliana Mendes</span>
              </button>

              <button
                type="button"
                onClick={() => switchQuickRole('technician')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'technician'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-[11px] block font-bold text-emerald-700">Técnico em Campo</span>
                <span className="text-xs text-slate-900 font-semibold">Marcos Vinicius</span>
              </button>
            </div>
          </div>

          {/* Permissions Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Matriz de Controle de Acesso e Permissões (RBAC)
              </h4>
              <p className="text-xs text-slate-500">
                Regras e visibilidade configuradas para cada função no sistema CR Serviços Gerais
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Módulo / Funcionalidade</th>
                    <th className="p-3.5 text-center">Administrador</th>
                    <th className="p-3.5 text-center">Gerente</th>
                    <th className="p-3.5 text-center">Atendimento</th>
                    <th className="p-3.5 text-center">Técnico de Campo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Ordens de Serviço (Visualizar e Abrir)</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-blue-700 font-bold">Apenas Atribuídas a Ele</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Modo Técnico em Campo (Celular/GPS/Fotos/Assinatura)</td>
                    <td className="p-3.5 text-center text-emerald-700">✓</td>
                    <td className="p-3.5 text-center text-emerald-700">✓</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">✓ Interface Dedicada</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Orçamentos (Propostas e Conversão em OS)</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Financeiro (Livro Caixa e Recebimentos)</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Relatórios & Análise de Desempenho</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Logs de Auditoria e Rastreabilidade</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">Total</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Backup e Restauração Geral do Sistema</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">✓ Total</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900 font-semibold">Exclusão Definitiva de Registros</td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">✓ Exclusivo</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                    <td className="p-3.5 text-center text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Gerenciamento de Usuários (RBAC) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <UsersPage onRefresh={onRefresh} />
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirmOpen && parsedBackupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Confirmar Restauração de Backup?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Este arquivo contém:
              </p>
              <ul className="text-xs text-slate-700 mt-2 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <li>• {parsedBackupData.workOrders?.length || 0} Ordens de Serviço</li>
                <li>• {parsedBackupData.customers?.length || 0} Clientes</li>
                <li>• {parsedBackupData.quotes?.length || 0} Orçamentos</li>
                <li>• {parsedBackupData.services?.length || 0} Serviços</li>
              </ul>
            </div>

            <p className="text-[11px] text-amber-700 font-medium">
              Atenção: A base atual será substituída pelos registros deste arquivo. Um log de auditoria será gerado automaticamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                {restoring ? 'Restaurando...' : 'Confirmar Restauração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm System Reset */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirmar Reset Geral dos Dados?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Esta ação irá <strong>redefinir todos os dados criados no aplicativo</strong> de volta para o padrão original limpo:
              </p>
              <ul className="text-xs text-slate-700 mt-2.5 space-y-1.5 bg-red-50/60 p-3.5 rounded-xl border border-red-100 font-sans">
                <li className="flex items-center gap-1.5 text-red-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Remove novos funcionários cadastrados em testes
                </li>
                <li className="flex items-center gap-1.5 text-red-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Restaura o Administrador e Funcionários padrão (senha: 123456)
                </li>
                <li className="flex items-center gap-1.5 text-red-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Redefine Ordens de Serviço, Clientes, Locais e Lançamentos
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-red-600 font-medium">
              Esta ação não pode ser desfeita. Recomendamos baixar um backup prévio se desejar guardar os dados atuais.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Resetando...' : 'Sim, Resetar Todos os Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
};
