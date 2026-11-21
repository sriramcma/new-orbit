import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { PlannedPurchase, PlannedPurchaseStatus } from '../../types/budget';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';

interface PlannedCardProps {
  item: PlannedPurchase;
  categoryLabel: string;
  showMonthBadge?: boolean;
  onToggleBought: (id: string, nextStatus: PlannedPurchaseStatus) => void;
  onEdit: (item: PlannedPurchase) => void;
  onDelete: (id: string) => void;
}

export const PlannedCard: React.FC<PlannedCardProps> = ({
  item,
  categoryLabel,
  showMonthBadge = false,
  onToggleBought,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isBought = item.status === 'bought';

  return (
    <div
      className={`group relative bg-white dark:bg-[#1e293b] rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
        isBought
          ? 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
          : 'border-[#e5e7eb] dark:border-[#334155]'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Left Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-sm font-semibold leading-snug break-words ${
                isBought
                  ? 'line-through text-[#6b7280] dark:text-[#94a3b8]'
                  : 'text-[#111827] dark:text-[#f1f5f9]'
              }`}
            >
              {item.name}
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] shrink-0">
              {categoryLabel}
            </span>
            {isBought && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
                Bought ✓
              </span>
            )}
          </div>

          {/* Subtext info */}
          {(showMonthBadge || item.notes) && (
            <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8] flex-wrap">
              {showMonthBadge && (
                <span className="flex items-center gap-1 font-medium text-[#6366f1] dark:text-[#818cf8]">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {formatMonthLabel(item.target_month)}
                </span>
              )}
              {item.notes && (
                <span className="flex items-center gap-1 break-words text-[#6b7280] dark:text-[#94a3b8]">
                  <FileText className="w-3 h-3 shrink-0" />
                  {item.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Info & Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight">
            ₹{formatIndianCurrency(item.amount)}
          </span>

          <div className="flex items-center gap-1.5">
            {isBought ? (
              <button
                type="button"
                onClick={() => onToggleBought(item.id, 'planned')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                title="Mark back as planned"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleBought(item.id, 'bought')}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                title="Mark as bought"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bought</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit"
              aria-label={`Edit ${item.name}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

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
      </div>

      {/* Full-width Inline Delete Confirmation Bar */}
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
