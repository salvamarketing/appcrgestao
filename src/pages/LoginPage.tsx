import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CRLogo } from '../components/common/CRLogo';

interface LoginPageProps {
  onNavigateToRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const { showToast } = useNotification();

  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem('cr_saved_username');
      if (!saved || saved.toLowerCase() === 'admin') {
        localStorage.removeItem('cr_saved_username');
        return '';
      }
      return saved;
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState(() => {
    try {
      const saved = localStorage.getItem('cr_saved_password');
      return saved || '';
    } catch {
      return '';
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('cr_remember_me') === 'true';
    } catch {
      return false;
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Garantir que a palavra 'admin' nunca venha preenchida no campo de usuário
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cr_saved_username');
      if (saved && saved.toLowerCase() === 'admin') {
        localStorage.removeItem('cr_saved_username');
      }
    } catch {}

    if (username.toLowerCase() === 'admin') {
      setUsername('');
    }

    const timer = setTimeout(() => {
      setUsername((prev) => (prev.toLowerCase() === 'admin' ? '' : prev));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Por favor, informe o seu usuário e a senha.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await login(cleanUser, password);

      if (rememberMe) {
        localStorage.setItem('cr_saved_username', cleanUser);
        localStorage.setItem('cr_saved_password', password);
        localStorage.setItem('cr_remember_me', 'true');
      } else {
        localStorage.removeItem('cr_saved_username');
        localStorage.removeItem('cr_saved_password');
        localStorage.setItem('cr_remember_me', 'false');
      }

      showToast('Acesso autorizado', 'Bem-vindo ao sistema CR Serviços Gerais!', 'success');
    } catch (err: any) {
      const msg = err.message || 'Usuário ou senha incorretos.';
      setErrorMessage(msg);
      showToast('Falha no acesso', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans select-none">
      {/* Subtle clean background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding with CR Vector Logo */}
        <div className="text-center space-y-3">
          <div className="flex flex-col items-center justify-center mb-1">
            <CRLogo variant="full" size="xl" className="h-16 sm:h-20 w-auto drop-shadow-sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            CR Serviços Gerais
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Acesso ao painel de ordens de serviço, clientes, orçamentos e agendamentos.
          </p>
        </div>

        {/* Main Login Card - Entrada Direta e Limpa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Não foi possível acessar</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Username */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-9 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
                {username && (
                  <button
                    type="button"
                    onClick={() => setUsername('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Limpar campo de usuário"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  autoComplete="new-password"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl pl-10 pr-16 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                  {password && (
                    <button
                      type="button"
                      onClick={() => setPassword('')}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Limpar senha"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    if (!checked) {
                      localStorage.removeItem('cr_saved_username');
                      localStorage.removeItem('cr_saved_password');
                      localStorage.setItem('cr_remember_me', 'false');
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  Lembrar dados de acesso nesse navegador
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              <span>{submitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center space-y-1">
          <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Ambiente Corporativo Seguro • CR Serviços Gerais
          </p>
        </div>
      </div>
    </div>
  );
};
