import React, { useState } from 'react';
import { X, Copy, Check, Database, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react';
import { LEARNING_SQL_SCHEMA } from '../../services/learningService';
import { Button } from '../ui';
import { isSupabaseConfigured } from '../../supabaseClient';

interface LearningSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningSchemaModal: React.FC<LearningSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LEARNING_SQL_SCHEMA);
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
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Learning &amp; Skills Schema
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                PostgreSQL schema &amp; Supabase RLS security policies
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
                  <strong className="text-[#111827] dark:text-[#f1f5f9]">Supabase SQL Editor</strong> to create the <code>learning_items</code> table with Row Level Security.
                </span>
              ) : (
                <span>
                  Running in offline local storage mode. Your skills and learning items are cached in your browser. Connect Supabase credentials to sync in cloud.
                </span>
              )}
            </div>
          </div>

          {/* SQL Block */}
          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-300 text-[11px] rounded-t-xl font-mono">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>learning_items.sql</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-gray-950 text-gray-200 text-[11px] font-mono rounded-b-xl overflow-x-auto max-h-56 leading-relaxed select-all">
              {LEARNING_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy SQL Schema'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
