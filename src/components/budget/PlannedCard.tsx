import React, { useState } from 'react';
import { CheckCircle2, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { PlannedPurchase } from '../../types/budget';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';

interface PlannedCardProps {
  item: PlannedPurchase;
  categoryLabel: string;
  showMonthBadge?: boolean;
  onMarkBought: (id: string) => void;
  onEdit: (item: PlannedPurchase) => void;
  onDelete: (id: string) => void;
}

export const PlannedCard: React.FC<PlannedCardProps> = ({
  item,
  categoryLabel,
  showMonthBadge = false,
  onMarkBought,
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
      <div className="flex items-start justify-between gap-3">
        {/* Left Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold truncate ${
                isBought
                  ? 'line-through text-[#6b7280] dark:text-[#94a3b8]'
                  : 'text-[#111827] dark:text-[#f1f5f9]'
              }`}
            >
              {item.name}
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8]">
              {categoryLabel}
            </span>
            {isBought && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                Bought ✓
              </span>
            )}
          </div>

          {/* Subtext info */}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            {showMonthBadge && (
              <span className="flex items-center gap-1 font-medium text-[#6366f1] dark:text-[#818cf8]">
                <Calendar className="w-3 h-3" />
                {formatMonthLabel(item.target_month)}
              </span>
            )}
            {item.notes && (
              <span className="flex items-center gap-1 truncate text-[#6b7280] dark:text-[#94a3b8]">
                <FileText className="w-3 h-3 shrink-0" />
                {item.notes}
              </span>
            )}
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight">
            ₹{formatIndianCurrency(item.amount)}
          </span>

          <div className="flex items-center gap-1.5">
            {!isBought && (
              <button
                type="button"
                onClick={() => onMarkBought(item.id)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                title="Mark as bought"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Bought</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

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
                  Del
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-[#6b7280] px-1 py-0.5 cursor-pointer"
                >
                  X
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
    </div>
  );
};
