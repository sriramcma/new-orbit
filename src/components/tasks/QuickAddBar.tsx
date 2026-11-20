import React, { useState } from 'react';
import { Plus, CornerDownLeft } from 'lucide-react';

interface QuickAddBarProps {
  onAddTask: (title: string) => Promise<void> | void;
  placeholder?: string;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onAddTask,
  placeholder = 'What needs to be done?',
}) => {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || submitting) return;

    // Immediately clear input for zero-latency feel
    setTitle('');
    setSubmitting(true);
    try {
      await onAddTask(cleanTitle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky top-0 z-20 bg-[#f9fafb]/95 dark:bg-[#0f172a]/95 backdrop-blur-md pb-2 pt-1 transition-colors duration-200"
    >
      <div className="relative flex items-center w-full min-w-0 shadow-xs rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] focus-within:ring-2 focus-within:ring-[#6366f1]/30 dark:focus-within:ring-[#818cf8]/30 focus-within:border-[#6366f1] dark:focus-within:border-[#818cf8] transition-all duration-200">
        <div className="pl-3.5 pr-1 text-gray-400 dark:text-gray-500 shrink-0">
          <Plus className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8]" />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 w-full py-3 px-2 text-sm text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280]/70 dark:placeholder:text-[#94a3b8]/60 bg-transparent focus:outline-none"
        />
        {title.trim().length > 0 && (
          <button
            type="submit"
            disabled={submitting}
            className="mr-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#6366f1] dark:bg-[#818cf8] text-white dark:text-slate-900 shadow-xs hover:bg-indigo-600 active:scale-95 transition-all duration-150 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
          >
            Add <CornerDownLeft className="w-3 h-3 shrink-0" />
          </button>
        )}
      </div>
    </form>
  );
};
