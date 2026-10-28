import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';

interface BudgetHeroProps {
  month: string;
  income: number;
  totalAllocated: number;
  onUpdateIncome: (newIncome: number) => Promise<void>;
  onShowUndoToast?: (oldIncome: number) => void;
}

export const BudgetHero: React.FC<BudgetHeroProps> = ({
  month,
  income,
  totalAllocated,
  onUpdateIncome,
}) => {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(income.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIncomeInput(income > 0 ? income.toString() : '');
  }, [income]);

  useEffect(() => {
    if (isEditingIncome) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingIncome]);

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput.replace(/,/g, ''));
    if (isNaN(parsed) || parsed < 0) {
      setIncomeInput(income.toString());
      setIsEditingIncome(false);
      return;
    }

    if (parsed === income) {
      setIsEditingIncome(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateIncome(parsed);
    } finally {
      setIsSaving(false);
      setIsEditingIncome(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveIncome();
    } else if (e.key === 'Escape') {
      setIncomeInput(income.toString());
      setIsEditingIncome(false);
    }
  };

  const unallocated = income - totalAllocated;
  const progressPercent = income > 0 ? Math.min(100, Math.round((totalAllocated / income) * 100)) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 shadow-lg border border-indigo-800/40">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Month & Status Tag */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300/80 block">
              Budget Plan
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {formatMonthLabel(month)}
            </h2>
          </div>

          <div className="text-right shrink-0 max-w-full">
            {unallocated > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 max-w-full">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">₹{formatIndianCurrency(unallocated)} left to allocate</span>
              </span>
            )}
            {unallocated < 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 max-w-full">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Over-allocated by ₹{formatIndianCurrency(Math.abs(unallocated))}</span>
              </span>
            )}
            {unallocated === 0 && income > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Balanced ✓
              </span>
            )}
            {income === 0 && (
              <span className="text-xs text-indigo-300/70">
                Tap income to plan
              </span>
            )}
          </div>
        </div>

        {/* Income Display & Inline Edit */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-200/80 font-medium">Monthly Planned Income</span>
            {!isEditingIncome && (
              <button
                type="button"
                onClick={() => setIsEditingIncome(true)}
                className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white transition-colors cursor-pointer group"
                title="Edit Income"
              >
                <Pencil className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Tap to edit</span>
              </button>
            )}
          </div>

          <div className="mt-1 flex items-baseline">
            {isEditingIncome ? (
              <div className="flex items-center gap-2 w-full mt-1">
                <span className="text-2xl font-bold text-indigo-300 shrink-0">₹</span>
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  onBlur={handleSaveIncome}
                  onKeyDown={handleKeyDown}
                  placeholder="0"
                  className="flex-1 min-w-0 text-2xl font-black bg-indigo-950/80 text-white rounded-lg px-2.5 py-1 border border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSaveIncome}
                  disabled={isSaving}
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 cursor-pointer"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIncomeInput(income.toString());
                    setIsEditingIncome(false);
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="budget-hero-income-btn"
                onClick={() => setIsEditingIncome(true)}
                className="text-left group cursor-pointer focus:outline-hidden"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                    ₹{formatIndianCurrency(income)}
                  </span>
                  <Pencil className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Allocation Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-200/90 font-medium">
              Allocated: <strong className="text-white font-bold">₹{formatIndianCurrency(totalAllocated)}</strong>
              {income > 0 && <span className="text-indigo-300/70 ml-1">({progressPercent}%)</span>}
            </span>
            <span className="text-indigo-300/80 font-medium">
              Goal: ₹{formatIndianCurrency(income)}
            </span>
          </div>

          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalAllocated > income
                  ? 'bg-rose-500'
                  : totalAllocated === income
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-indigo-400 to-indigo-300'
              }`}
              style={{
                width: income > 0 ? `${Math.min(100, (totalAllocated / income) * 100)}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
