import React, { useState } from 'react';
import { X, Copy, Check, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BUDGET_SQL_SCHEMA } from '../../services/budgetService';
import { Button } from '../ui';
import { isSupabaseConfigured } from '../../supabaseClient';

interface BudgetSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetSchemaModal: React.FC<BudgetSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BUDGET_SQL_SCHEMA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Budget Database Schema
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                4 tables: categories, budgets, recurring & planned
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
            <div className="text-[11px] leading-relaxed text-[#6b7280] dark:text-[#94a3b8]">
              {isSupabaseConfigured ? (
                <span>
                  Supabase is configured. Paste this SQL into your{' '}
                  <strong className="text-[#111827] dark:text-[#f1f5f9]">Supabase SQL Editor</strong> to enable cloud sync and real-time ledger updates across devices.
                </span>
              ) : (
                <span>
                  Running in offline local storage mode. Add your Supabase credentials in your project environment to activate cloud database persistence.
                </span>
              )}
            </div>
          </div>

          {/* SQL Block */}
          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-300 text-[11px] rounded-t-xl font-mono">
              <span>PostgreSQL DDL</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white transition-colors cursor-pointer font-sans"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-gray-100 text-[11px] font-mono rounded-b-xl overflow-x-auto max-h-56 leading-relaxed select-all">
              {BUDGET_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-slate-900/60 border-t border-[#e5e7eb] dark:border-[#334155] flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy SQL
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
