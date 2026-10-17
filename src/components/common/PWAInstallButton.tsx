import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Se já estiver rodando instalado como App independente (standalone), oculta
  if (isInstalled) {
    return null;
  }

  // Navegadores Chromium (Chrome, Edge, Opera, Samsung Internet) em Celular e Computador
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={installApp}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${className}`}
          title="Instalar aplicativo no dispositivo"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
          <span>Instalar App</span>
        </button>
      );
    }

    return (
      <button
        onClick={installApp}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>Instalar Aplicativo (PWA)</span>
      </button>
    );
  }

  // No iOS Safari (WebKit não dispara beforeinstallprompt, exige adicionar à tela de início)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${className}`}
          title="Instalar no iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Salvar no iPhone</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 relative text-slate-800">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Download className="w-6 h-6 stroke-[2]" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Instalar no iPhone / iPad
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Para instalar este painel como app no seu dispositivo iOS sem passar pela App Store:
              </p>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Toque no botão de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> na barra inferior do Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Confirme em <strong>Adicionar</strong> no canto superior direito.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
