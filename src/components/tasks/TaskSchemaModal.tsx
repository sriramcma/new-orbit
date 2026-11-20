import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal } from 'lucide-react';
import { Button } from '../ui';
import { TASKS_SQL_SCHEMA } from '../../services/taskService';

interface TaskSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskSchemaModal: React.FC<TaskSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(TASKS_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[90dvh] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#e5e7eb] dark:border-[#334155]"
      >
        <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center font-bold shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9] truncate">Supabase `tasks` Table</h2>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] truncate">Database schema and RLS policies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-xs">
          <p className="text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
            Run this in your Supabase project&apos;s <strong>SQL Editor</strong> to ensure the <code className="text-[#6366f1] dark:text-[#818cf8]">tasks</code> table and security rules are configured:
          </p>

          <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/80 dark:bg-slate-900 border-b border-gray-800">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-300">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                schema.sql
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="text-[10px] h-7 px-2.5 bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy SQL
                  </>
                )}
              </Button>
            </div>
            <pre className="p-3 text-gray-100 text-[11px] font-mono overflow-x-auto max-h-52 max-w-full">
              {TASKS_SQL_SCHEMA}
            </pre>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
            ✓ Your tasks are also automatically saved in local storage with optimistic UI so you can use it right away!
          </div>
        </div>

        <div className="shrink-0 p-3 border-t border-[#e5e7eb] dark:border-[#334155] flex justify-end">
          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
