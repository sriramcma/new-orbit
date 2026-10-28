import React from 'react';
import { X, Sparkles, ArrowRight, Bookmark, DollarSign } from 'lucide-react';
import { BudgetTemplate } from '../../types/budget';
import { formatMonthLabel } from '../../utils/budgetUtils';

interface TemplateBannerProps {
  month: string;
  defaultTemplate: BudgetTemplate | null;
  templatesCount: number;
  onApplyDefault: (template: BudgetTemplate) => void;
  onBrowseTemplates: () => void;
  onSetIncome: () => void;
  onDismiss: () => void;
}

export const TemplateBanner: React.FC<TemplateBannerProps> = ({
  month,
  defaultTemplate,
  templatesCount,
  onApplyDefault,
  onBrowseTemplates,
  onSetIncome,
  onDismiss,
}) => {
  const monthName = formatMonthLabel(month);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/40 border border-indigo-200/60 dark:border-indigo-800/40 p-3.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#6366f1]/15 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {defaultTemplate ? (
              <>
                <h4 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Apply your default plan ({defaultTemplate.name})?
                </h4>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] leading-tight">
                  Start {monthName} in one tap with your preferred category split.
                </p>
                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onApplyDefault(defaultTemplate)}
                    className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    Apply Template
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : templatesCount > 0 ? (
              <>
                <h4 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Load a saved template for {monthName}?
                </h4>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] leading-tight">
                  You have {templatesCount} saved template{templatesCount > 1 ? 's' : ''} ready to apply.
                </p>
                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={onBrowseTemplates}
                    className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Bookmark className="w-3 h-3" />
                    Browse Templates
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Set up your plan for {monthName}
                </h4>
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] leading-tight">
                  Enter expected income and allocate to categories to plan this month.
                </p>
                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={onSetIncome}
                    className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <DollarSign className="w-3 h-3" />
                    Set Income
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
