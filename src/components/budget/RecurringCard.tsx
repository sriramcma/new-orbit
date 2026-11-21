import React, { useState } from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { RecurringExpense } from '../../types/budget';
import { formatIndianCurrency, formatDayOfMonth } from '../../utils/budgetUtils';

interface RecurringCardProps {
  item: RecurringExpense;
  categoryLabel: string;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (item: RecurringExpense) => void;
  onDelete: (id: string) => void;
}

export const RecurringCard: React.FC<RecurringCardProps> = ({
  item,
  categoryLabel,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`group relative bg-white dark:bg-[#1e293b] rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
        item.active
          ? 'border-[#e5e7eb] dark:border-[#334155]'
          : 'border-dashed border-gray-300 dark:border-slate-700 opacity-65'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Left Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-sm font-semibold leading-snug break-words ${
                item.active
                  ? 'text-[#111827] dark:text-[#f1f5f9]'
                  : 'text-[#6b7280] dark:text-[#94a3b8] line-through'
              }`}
            >
              {item.name}
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] shrink-0">
              {categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8] shrink-0" />
              Due on the {formatDayOfMonth(item.day_of_month)}
            </span>
          </div>
        </div>

        {/* Right: Amount & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight block">
              ₹{formatIndianCurrency(item.amount)}
            </span>
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">/ month</span>
          </div>

          {/* Active Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={item.active}
            aria-label={item.active ? `Pause ${item.name}` : `Activate ${item.name}`}
            onClick={() => onToggleActive(item.id, !item.active)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              item.active ? 'bg-[#6366f1]' : 'bg-gray-300 dark:bg-slate-700'
            }`}
            title={item.active ? 'Active bill (included in Plan total)' : 'Paused'}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                item.active ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit"
            aria-label={`Edit ${item.name}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Trigger */}
          <button
            type="button"
            onClick={() => setConfirmDelete((prev) => !prev)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              confirmDelete
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                : 'text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
            title="Delete"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full-width Inline Delete Confirmation Bar (prevents mobile overflow) */}
      {confirmDelete && (
        <div className="mt-3 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
            Delete "{item.name}"?
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(item.id);
                setConfirmDelete(false);
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
