import React, { useState } from 'react';
import { X, Copy, Check, Database, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { CREDENTIALS_SQL_SCHEMA } from '../../services/credentialService';
import { Button } from '../ui';
import { isSupabaseConfigured } from '../../supabaseClient';

interface CredentialSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CredentialSchemaModal: React.FC<CredentialSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Hook safety: return null after hooks
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CREDENTIALS_SQL_SCHEMA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Credentials Vault Schema
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Encrypted ciphertext table &amp; RLS policies
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Status banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-[#e5e7eb] dark:border-[#334155]">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
                {isSupabaseConfigured
                  ? 'Supabase Cloud Configured'
                  : 'Local Storage Fallback Active'}
              </p>
              <p className="text-[#6b7280] dark:text-[#94a3b8] mt-0.5 leading-relaxed text-[11px]">
                Passwords are encrypted using AES-256 before upload. Plaintext passwords never touch the database.
              </p>
            </div>
          </div>

          {/* Code container */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
                SQL Migration Script
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 selection:bg-teal-600 max-h-56">
              <code>{CREDENTIALS_SQL_SCHEMA}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={handleCopy} className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard' : 'Copy SQL Script'}
          </Button>
        </div>
      </div>
    </div>
  );
};
