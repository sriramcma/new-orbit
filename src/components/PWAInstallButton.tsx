import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // If already installed as standalone PWA, hide install triggers
  if (isInstalled) {
    if (variant === 'drawer') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
          <CheckCircle2 size={15} />
          <span>ORBIT is installed on this device</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback guide if browser does not fire beforeinstallprompt yet
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Header compact variant */}
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          title="Install ORBIT as App"
          className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 active:scale-95 transition"
        >
          <Download size={13} className="stroke-[2.5]" />
          <span>Install</span>
        </button>
      )}

      {/* Drawer full-width variant */}
      {variant === 'drawer' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Install ORBIT App</p>
              <p className="text-[11px] text-indigo-100">Add to home screen for native full-screen</p>
            </div>
          </div>
          <span className="text-xs bg-white text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
            Free
          </span>
        </button>
      )}

      {/* Card banner variant (e.g. for dashboard or settings) */}
      {variant === 'card' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Download size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Install ORBIT to Home Screen</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Instant launch & offline access</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition"
          >
            Install
          </button>
        </div>
      )}

      {/* iOS & Browser Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src="/icon.svg" alt="ORBIT" className="w-10 h-10 rounded-xl shadow-sm" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Install ORBIT</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add to your device home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Share size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">1. Tap the Share button</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isIOS ? 'Located at the bottom of Safari (or top right on iPad)' : 'Located in your browser toolbar or menu (⋮)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">2. Select "Add to Home Screen"</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Scroll down in the action sheet and tap "Add to Home Screen" or "Install App".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">3. Open ORBIT</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tap Add. ORBIT will now open like a standalone mobile app!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={16} />
          <span>ORBIT added to Home Screen!</span>
        </div>
      )}
    </>
  );
};
