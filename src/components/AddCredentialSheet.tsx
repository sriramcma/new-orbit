import React, { useState } from 'react';
import { X, KeyRound, Globe, Lock, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { Button } from './ui';

interface AddCredentialSheetProps {
  isOpen: boolean;
  masterPin: string;
  onClose: () => void;
  onSubmit: (data: {
    platform: string;
    username: string;
    password: string;
    url?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onToast: (msg: string) => void;
}

export const AddCredentialSheet: React.FC<AddCredentialSheetProps> = ({
  isOpen,
  masterPin,
  onClose,
  onSubmit,
  onToast,
}) => {
  const [platform, setPlatform] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Errors
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const QUICK_PLATFORMS = ['Google', 'GitHub', 'LinkedIn', 'Amazon', 'Apple ID', 'Wi-Fi Network', 'Discord'];

  const resetForm = () => {
    setPlatform('');
    setUsername('');
    setPassword('');
    setUrl('');
    setNotes('');
    setShowPassword(false);
    setPlatformError(null);
    setUsernameError(null);
    setPasswordError(null);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let generated = '';
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
    setPasswordError(null);
    onToast('Generated 16-character secure password');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!platform.trim()) {
      setPlatformError('Platform name is required');
      hasError = true;
    } else {
      setPlatformError(null);
    }

    if (!username.trim()) {
      setUsernameError('Username or email is required');
      hasError = true;
    } else {
      setUsernameError(null);
    }

    if (!password.trim()) {
      setPasswordError('Password or PIN is required');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) {
      onToast('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        platform: platform.trim(),
        username: username.trim(),
        password: password.trim(),
        url: url.trim() || null,
        notes: notes.trim() || null,
      });

      resetForm();
      onClose();
    } catch {
      onToast('Failed to save credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rule of hooks: render null only AFTER hooks!
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#e5e7eb] dark:border-[#334155] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827] dark:text-[#f1f5f9]">
                Add Credential
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Encrypted locally using AES-256 with your Master PIN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Platform / Service <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                if (platformError) setPlatformError(null);
              }}
              placeholder="e.g. LinkedIn, GitHub, Home Wi-Fi"
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                platformError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {platformError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {platformError}
              </p>
            )}

            {/* Quick Suggestions */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">Suggestions:</span>
              {QUICK_PLATFORMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setPlatform(item);
                    if (platformError) setPlatformError(null);
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Username / Email / Account ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError(null);
              }}
              placeholder="e.g. user@gmail.com or dev_handle"
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                usernameError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {usernameError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {usernameError}
              </p>
            )}
          </div>

          {/* Password / PIN */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Password / Secret Key <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter password to encrypt"
                className={`w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono ${
                  passwordError
                    ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                    : 'border-[#e5e7eb] dark:border-[#334155]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {passwordError}
              </p>
            )}
          </div>

          {/* URL (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Website / Login URL (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b7280] dark:text-[#94a3b8]">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://linkedin.com/login"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Notes &amp; Security Hints (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recovery codes, 2FA backup questions, or license details..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>

          {/* Security Banner */}
          <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 flex items-start gap-2 text-[11px] text-teal-800 dark:text-teal-300">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>
              Your password will be encrypted into ciphertext on your device before leaving memory. The server only sees encrypted gibberish.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 pb-6 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] dark:border-[#334155]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Encrypting & Saving...' : 'Save Credential'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
