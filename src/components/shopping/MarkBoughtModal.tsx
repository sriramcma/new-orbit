import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, IndianRupee, Sparkles } from 'lucide-react';
import { ShoppingItem } from '../../types/shopping';
import { Button } from '../ui';
import { formatIndianCurrency } from '../../utils/budgetUtils';

interface MarkBoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShoppingItem | null;
  onConfirm: (actualPrice: number | null) => Promise<void>;
}

export const MarkBoughtModal: React.FC<MarkBoughtModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [actualPrice, setActualPrice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setActualPrice(item.target_price ? String(item.target_price) : '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const target = item.target_price || 0;
  const numericPaid = parseFloat(actualPrice) || 0;
  const difference = target > 0 ? target - numericPaid : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const priceVal = actualPrice.trim() !== '' ? parseFloat(actualPrice) : null;
      await onConfirm(priceVal);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Mark Item as Bought
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Archive to your purchased history
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155]">
              <p className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9]">
                {item.name}
              </p>
              {item.brand && (
                <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                  Brand: {item.brand}
                </span>
              )}
              {target > 0 && (
                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-1">
                  Target Price was: <strong className="text-[#111827] dark:text-[#f1f5f9]">₹{formatIndianCurrency(target)}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
                Actual Price Paid (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#6b7280] dark:text-[#94a3b8] text-xs font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                  placeholder={target ? String(target) : '0'}
                  className="w-full pl-8 pr-3 py-2 text-sm font-semibold rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {difference !== null && numericPaid > 0 && (
              <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-[#e5e7eb] dark:border-[#334155]">
                {difference > 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    You saved ₹{formatIndianCurrency(difference)} under target!
                  </span>
                ) : difference < 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                    ₹{formatIndianCurrency(Math.abs(difference))} above target budget
                  </span>
                ) : (
                  <span className="text-[#6b7280] dark:text-[#94a3b8] text-xs">
                    Exact match with target price!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Confirm Bought'}</span>
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
