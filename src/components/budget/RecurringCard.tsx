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
          : 'border-dashed border-gray-300 dark:border-slate-700 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-semibold truncate ${
                item.active
                  ? 'text-[#111827] dark:text-[#f1f5f9]'
                  : 'text-[#6b7280] dark:text-[#94a3b8] line-through'
              }`}
            >
              {item.name}
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8]">
              {categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8]" />
              Due on the {formatDayOfMonth(item.day_of_month)}
            </span>
          </div>
        </div>

        {/* Right: Amount & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
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
            onClick={() => onToggleActive(item.id, !item.active)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              item.active ? 'bg-[#6366f1]' : 'bg-gray-300 dark:bg-slate-700'
            }`}
            title={item.active ? 'Active bill (included in total)' : 'Paused'}
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
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button / Confirm */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-0.5 rounded-lg border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  setConfirmDelete(false);
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-[#6b7280] px-1 py-0.5 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
