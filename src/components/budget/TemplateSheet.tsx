import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Star,
  Pencil,
  Trash2,
  Check,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { BudgetTemplate, Category } from '../../types/budget';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';

interface TemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  templates: BudgetTemplate[];
  categories: Category[];
  targetMonth: string;
  onApply: (template: BudgetTemplate) => Promise<void>;
  onEdit: (template: BudgetTemplate) => void;
  onSetDefault: (template: BudgetTemplate) => Promise<void>;
  onDelete: (template: BudgetTemplate) => Promise<void>;
  onCreateNew: () => void;
}

export const TemplateSheet: React.FC<TemplateSheetProps> = ({
  isOpen,
  onClose,
  templates,
  categories,
  targetMonth,
  onApply,
  onEdit,
  onSetDefault,
  onDelete,
  onCreateNew,
}) => {
  // Confirm application modal/state
  const [confirmingTemplate, setConfirmingTemplate] = useState<BudgetTemplate | null>(null);
  // Confirm delete state
  const [deletingTemplate, setDeletingTemplate] = useState<BudgetTemplate | null>(null);
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  const handleConfirmApply = async () => {
    if (!confirmingTemplate) return;
    try {
      setApplying(true);
      await onApply(confirmingTemplate);
      setConfirmingTemplate(null);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    await onDelete(deletingTemplate);
    setDeletingTemplate(null);
  };

  const getTemplateTotal = (t: BudgetTemplate) => {
    return Object.values(t.allocations || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  };

  const getCategoryCount = (t: BudgetTemplate) => {
    return Object.values(t.allocations || {}).filter((v) => (Number(v) || 0) > 0).length;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl border-t sm:border border-[#e5e7eb] dark:border-[#334155] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#e5e7eb] dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                Budget Templates
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Target: {formatMonthLabel(targetMonth)}
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

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {templates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#e5e7eb] dark:border-[#334155] rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] mx-auto flex items-center justify-center">
                <Bookmark className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                No templates saved yet
              </h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                Save your ideal allocation breakdown once and easily apply it to any upcoming month.
              </p>
            </div>
          ) : (
            templates.map((tpl) => {
              const total = getTemplateTotal(tpl);
              const count = getCategoryCount(tpl);

              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50/60 dark:bg-slate-900/40 p-3 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col gap-2 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div
                      className="flex-1 min-w-0 cursor-pointer select-none"
                      onClick={() => setConfirmingTemplate(tpl)}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9] hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors truncate max-w-full">
                          {tpl.name}
                        </span>
                        {tpl.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-[#6366f1] dark:text-[#818cf8] shrink-0">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5 truncate">
                        ₹{formatIndianCurrency(total)} • {count} categories
                      </p>
                    </div>

                    {/* Apply Button */}
                    <button
                      type="button"
                      onClick={() => setConfirmingTemplate(tpl)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-[#334155] text-[#6366f1] dark:text-[#818cf8] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                    >
                      Apply
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-3">
                      {!tpl.is_default ? (
                        <button
                          type="button"
                          onClick={() => onSetDefault(tpl)}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8] hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Default template
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(tpl);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit template"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTemplate(tpl)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Create New */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900/20 rounded-b-3xl sm:rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full py-2.5 text-xs font-bold rounded-xl border border-dashed border-[#6366f1] dark:border-[#818cf8] text-[#6366f1] dark:text-[#818cf8] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer h-11"
          >
            <Plus className="w-4 h-4" />
            Save Current Plan as New Template
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Apply Template */}
      {confirmingTemplate && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setConfirmingTemplate(null)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#e5e7eb] dark:border-[#334155] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                Apply "{confirmingTemplate.name}"?
              </h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
                This will overwrite current category allocations for{' '}
                <span className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
                  {formatMonthLabel(targetMonth)}
                </span>
                . Your planned monthly income will stay the same.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingTemplate(null)}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#e5e7eb] dark:border-[#334155] text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer h-10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={handleConfirmApply}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#6366f1] text-white hover:bg-indigo-600 transition-colors cursor-pointer h-10"
              >
                {applying ? 'Applying...' : 'Apply Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Template */}
      {deletingTemplate && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setDeletingTemplate(null)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#e5e7eb] dark:border-[#334155] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                Delete "{deletingTemplate.name}"?
              </h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
                This template will be permanently removed. Current or past months using these amounts will not be affected.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#e5e7eb] dark:border-[#334155] text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer h-10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer h-10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
