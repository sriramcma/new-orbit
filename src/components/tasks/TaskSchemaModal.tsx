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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#e5e7eb] dark:border-[#334155]">
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">Supabase `tasks` Table</h2>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">Database schema and RLS policies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs">
          <p className="text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
            Run this in your Supabase project&apos;s <strong>SQL Editor</strong> to ensure the <code className="text-[#6366f1] dark:text-[#818cf8]">tasks</code> table and security rules are configured:
          </p>

          <div className="relative">
            <pre className="p-3 bg-gray-900 text-gray-100 dark:bg-slate-950 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-gray-800">
              {TASKS_SQL_SCHEMA}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="absolute top-2 right-2 text-[10px] h-7 px-2.5 bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 mr-1" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" /> Copy SQL
                </>
              )}
            </Button>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
            ✓ Your tasks are also automatically saved in local storage with optimistic UI so you can use it right away!
          </div>
        </div>

        <div className="p-3 border-t border-[#e5e7eb] dark:border-[#334155] flex justify-end">
          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
