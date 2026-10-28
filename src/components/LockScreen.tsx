import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui';

interface LockScreenProps {
  isFirstTime: boolean;
  onUnlock: (pin: string) => boolean;
  onToast: (msg: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isFirstTime,
  onUnlock,
  onToast,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();

    if (!trimmedPin) {
      setError('Please enter your Master PIN');
      return;
    }

    if (trimmedPin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }

    if (isFirstTime) {
      if (trimmedPin !== confirmPin.trim()) {
        setError('PINs do not match');
        onToast('PIN confirmation did not match');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    // Call onUnlock which verifies or initializes
    const success = onUnlock(trimmedPin);
    if (!success) {
      setError('Incorrect Master PIN. Please try again.');
      onToast('Incorrect PIN or corrupted data');
      setSubmitting(false);
      setPin('');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-[#111827] dark:text-[#f1f5f9] animate-in fade-in duration-300">
      <div className="w-full max-w-[360px] space-y-6 text-center">
        {/* Animated Vault Shield Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 dark:border-teal-400/20 animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 dark:from-teal-600 dark:to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            {isFirstTime ? (
              <KeyRound className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <Lock className="w-8 h-8 stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">
            {isFirstTime ? 'Create Master PIN' : 'Credentials Vault'}
          </h2>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed max-w-[320px] mx-auto">
            {isFirstTime
              ? 'Choose a Master PIN to protect your passwords. All credentials will be encrypted on your device using AES-256.'
              : 'Enter your Master PIN to decrypt and unlock your stored passwords & credentials.'}
          </p>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Main PIN Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              {isFirstTime ? 'New Master PIN' : 'Master PIN'}
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={isFirstTime ? 'e.g. 1234 or secret-pass' : '••••••••'}
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-wider transition-all ${
                  error
                    ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                    : 'border-[#e5e7eb] dark:border-[#334155]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] cursor-pointer"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm PIN (First time only) */}
          {isFirstTime && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
                Confirm Master PIN
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Re-enter PIN to confirm"
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-wider"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <Button
            type="submit"
            disabled={submitting || !pin.trim()}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 gap-2 cursor-pointer text-sm"
          >
            <span>{isFirstTime ? 'Create Vault & Unlock' : 'Unlock Vault'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Security Disclaimers */}
        <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#334155]/60 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span>Zero-Knowledge AES-256 Encryption</span>
          </div>
          <p className="text-[10px] text-[#9ca3af] dark:text-slate-500 leading-tight">
            Your Master PIN is never sent to any server or saved to disk. If you lose your PIN, passwords cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  );
};
