import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ArrowLeft,
  Wrench,
  Phone,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CRLogo } from '../components/common/CRLogo';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Técnico Operacional');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu Nome Completo.');
      return;
    }

    const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('O Nome de Usuário (Login) deve ter no mínimo 3 caracteres.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, defina uma senha de acesso.');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Verifique a confirmação de senha.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name: name.trim(),
        username: cleanUsername,
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        phone: phone.trim() || undefined,
        jobTitle: jobTitle.trim() || 'Técnico Operacional',
      });

      showToast(
        'Cadastro realizado com sucesso!',
        `Bem-vindo, ${name}! Seu perfil de funcionário foi ativado e o Painel Operacional está pronto.`,
        'success'
      );
      // AuthContext sets user automatically, which triggers redirect to EmployeeDashboard in App.tsx
    } catch (err: any) {
      const msg = err.message || 'Erro ao realizar cadastro de funcionário.';
      setErrorMessage(msg);
      showToast('Falha no cadastro', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans select-none">
      {/* Subtle clean background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Header Branding with CR Logo */}
        <div className="text-center space-y-3">
          <div className="flex flex-col items-center justify-center mb-1">
            <CRLogo variant="full" size="xl" className="h-16 sm:h-20 w-auto drop-shadow-sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            CR Serviços Gerais
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            Auto-Cadastro de Funcionários
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Cadastre-se na equipe operacional para lançar ordens de serviço, cadastrar clientes e gerenciar atendimentos.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                Criar Conta de Funcionário
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Preencha os dados abaixo. O acesso será liberado imediatamente.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Voltar para a tela de login"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Atenção ao preencher</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Nome Completo */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Nome Completo: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo da Silva"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* 2. Nome de Usuário (Login) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Nome de Usuário (Login): <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Sem espaços ou acentos</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold text-sm">
                  @
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="carlos.silva ou func03"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono font-medium"
                  required
                />
              </div>
            </div>

            {/* 3. Senha & 4. Confirmar Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Senha: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Confirmar Senha: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Cargo & Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Cargo / Função:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Técnico Operacional"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Telefone / WhatsApp:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(54) 99100-0000"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Profile Assignment Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Perfil Atribuído Automaticamente: Funcionário (Operacional)</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Você terá acesso imediato para <strong>lançar ordens de serviço</strong>, <strong>cadastrar clientes</strong> e <strong>gerenciar locais de atendimento</strong>. Módulos financeiros e relatórios gerais são restritos à diretoria.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              <span>{submitting ? 'Cadastrando e Entrando...' : 'Concluir Cadastro e Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Already have an account link */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Já possui uma conta na CR Serviços Gerais?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center space-y-1">
          <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Ambiente Corporativo Seguro • Gestão Operacional CR Serviços Gerais
          </p>
        </div>
      </div>
    </div>
  );
};
