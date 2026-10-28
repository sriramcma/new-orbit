import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { ShoppingItem } from '../../types/shopping';
import { Button } from '../ui';
import { budgetService } from '../../services/budgetService';
import { MonthSummary } from '../../types/budget';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';
import { getNextMonthsList } from '../../utils/shoppingUtils';

interface PlanToBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShoppingItem | null;
  userId: string;
  onConfirm: (targetMonth: string) => Promise<void>;
}

export const PlanToBuyModal: React.FC<PlanToBuyModalProps> = ({
  isOpen,
  onClose,
  item,
  userId,
  onConfirm,
}) => {
  const monthsList = getNextMonthsList(6);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    item?.planned_month || monthsList[0]?.value || ''
  );
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item?.planned_month) {
      setSelectedMonth(item.planned_month);
    } else if (monthsList.length > 0) {
      setSelectedMonth(monthsList[0].value);
    }
  }, [item]);

  useEffect(() => {
    if (!isOpen || !selectedMonth || !userId) return;

    let isMounted = true;
    setLoadingSummary(true);

    budgetService
      .getMonthSummary(userId, selectedMonth)
      .then((summary) => {
        if (isMounted) {
          setMonthSummary(summary);
          setLoadingSummary(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching month budget for planning:', err);
        if (isMounted) setLoadingSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedMonth, userId]);

  if (!isOpen || !item) return null;

  const targetPrice = item.target_price || 0;
  const unallocated = monthSummary?.unallocated || 0;
  const isOverBudget = monthSummary && monthSummary.income > 0 && targetPrice > unallocated;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selectedMonth);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Plan Purchase Month
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Sync with Monthly Budget Planner
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

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Item Preview */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155]">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] uppercase font-semibold">
                  {item.category} {item.brand ? `• ${item.brand}` : ''}
                </span>
                <p className="font-semibold text-[#111827] dark:text-[#f1f5f9] text-xs truncate">
                  {item.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">Target</span>
                <span className="font-bold text-sm text-pink-600 dark:text-pink-400">
                  ₹{formatIndianCurrency(targetPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Month Selection Buttons */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Select Target Month
            </label>
            <div className="grid grid-cols-2 gap-2">
              {monthsList.map((m) => {
                const isSelected = selectedMonth === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMonth(m.value)}
                    className={`py-2 px-3 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-[#6366f1] bg-indigo-50/60 dark:bg-indigo-950/40 text-[#6366f1] dark:text-[#818cf8] font-bold'
                        : 'border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900/40 text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block">{m.label}</span>
                    <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                      {m.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Insight for that month */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/70 border border-[#e5e7eb] dark:border-[#334155] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                Budget for {formatMonthLabel(selectedMonth)}
              </span>
              {loadingSummary ? (
                <span className="text-[10px] text-[#6b7280] animate-pulse">Calculating...</span>
              ) : (
                <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                  Unallocated: <strong className={unallocated >= targetPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>₹{formatIndianCurrency(unallocated)}</strong>
                </span>
              )}
            </div>

            {isOverBudget && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p className="text-[11px] leading-relaxed">
                  Target price (₹{formatIndianCurrency(targetPrice)}) exceeds your unallocated budget balance (₹{formatIndianCurrency(unallocated)}) for this month. You can still plan it, or adjust budget envelope allocations.
                </p>
              </div>
            )}

            {!isOverBudget && monthSummary && monthSummary.income > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Budget comfortably covers this planned purchase.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <span>{submitting ? 'Planning...' : `Add to ${formatMonthLabel(selectedMonth)}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

      </div>
    </div>
  );
};
