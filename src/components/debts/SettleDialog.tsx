import React from 'react';
import { CheckCircle2, X, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { Debt } from '../../types/debt';
import { formatCurrency } from '../../utils/debtDate';
import { Button } from '../ui';

interface SettleDialogProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (logToBudget: boolean) => void;
}

export const SettleDialog: React.FC<SettleDialogProps> = ({
  debt,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !debt) return null;

  const isBorrowed = debt.direction === 'borrowed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl overflow-hidden border border-[#e5e7eb] dark:border-[#334155] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              isBorrowed
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
            }`}>
              {isBorrowed ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                {isBorrowed ? 'Repay & Settle' : 'Received & Settle'}
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Close out this debt record
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155] space-y-1">
            <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
              {isBorrowed ? 'Amount borrowed from' : 'Amount lent to'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                {debt.person}
              </span>
              <span className={`text-lg font-bold ${
                isBorrowed ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                ₹{formatCurrency(debt.amount)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#111827] dark:text-[#f1f5f9] leading-relaxed">
            {isBorrowed
              ? `Reimbursed ₹${formatCurrency(debt.amount)} to ${debt.person}. Would you also like to log this as an expense in your Budget?`
              : `Received ₹${formatCurrency(debt.amount)} back from ${debt.person}. Would you also like to log this as income in your Budget?`}
          </p>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Budget ledger auto-categorizes under <strong>&quot;Debt&quot;</strong></span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50/70 dark:bg-slate-900/40 border-t border-[#e5e7eb] dark:border-[#334155] flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onConfirm(false)}
            className="text-xs order-2 sm:order-1"
          >
            Just Settle
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onConfirm(true)}
            className="text-xs font-semibold order-1 sm:order-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {isBorrowed ? 'Settle + Log Expense' : 'Settle + Log Income'}
          </Button>
        </div>

      </div>
    </div>
  );
};
