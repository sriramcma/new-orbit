import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, RecurringExpense } from '../../types/budget';

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (itemData: {
    name: string;
    amount: number;
    category: string;
    day_of_month: number;
    active: boolean;
  }) => Promise<void>;
  editingItem?: RecurringExpense | null;
}

export const RecurringFormModal: React.FC<RecurringFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setAmount(editingItem.amount.toString());
      setCategory(editingItem.category);
      setDayOfMonth(editingItem.day_of_month || 1);
      setActive(editingItem.active !== undefined ? editingItem.active : true);
    } else {
      setName('');
      setAmount('');
      setCategory(categories[0]?.name || 'General');
      setDayOfMonth(5);
      setActive(true);
    }
    setError(null);
  }, [editingItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numAmount = parseFloat(amount.replace(/,/g, ''));

    if (!cleanName) {
      setError('Please provide a name for this recurring expense');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid amount');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: cleanName,
        amount: numAmount,
        category: category || (categories[0]?.name ?? 'General'),
        day_of_month: Number(dayOfMonth),
        active,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recurring expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] shrink-0">
          <h3 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
            {editingItem ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Expense / Bill Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Netflix, Wifi, Electricity, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Monthly Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-[#6b7280] dark:text-[#94a3b8]">
                ₹
              </span>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-bold rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {categories.length === 0 && <option value="General">General</option>}
            </select>
          </div>

          {/* Day of Month */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Day of Month (1 - 31)
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155]">
            <div>
              <span className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] block">
                Active Expense
              </span>
              <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Include this in monthly recurring totals
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                active ? 'bg-[#6366f1]' : 'bg-gray-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !amount}
              className="px-4 py-2 text-xs font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
