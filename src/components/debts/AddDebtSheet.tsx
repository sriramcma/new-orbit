import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, FileText, Plus } from 'lucide-react';
import { DebtDirection } from '../../types/debt';
import { getDefaultReturnDate } from '../../utils/debtDate';
import { Button, Input } from '../ui';

interface AddDebtSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDebt: (debtData: {
    person: string;
    amount: number;
    direction: DebtDirection;
    return_date: string;
    notes?: string | null;
  }) => Promise<void> | void;
}

export const AddDebtSheet: React.FC<AddDebtSheetProps> = ({
  isOpen,
  onClose,
  onAddDebt,
}) => {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<DebtDirection>('borrowed');
  const [returnDate, setReturnDate] = useState(getDefaultReturnDate());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const isValid = person.trim().length > 0 && Number(amount) > 0 && returnDate.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      await onAddDebt({
        person: person.trim(),
        amount: Number(amount),
        direction,
        return_date: returnDate,
        notes: notes.trim() || null,
      });

      // Reset
      setPerson('');
      setAmount('');
      setDirection('borrowed');
      setReturnDate(getDefaultReturnDate());
      setNotes('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] max-h-[92vh] bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200 border border-[#e5e7eb] dark:border-[#334155]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              direction === 'borrowed'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
            }`}>
              {direction === 'borrowed' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                {direction === 'borrowed' ? 'Record Borrowed Money' : 'Record Lent Money'}
              </h2>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Track repayments and due dates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* DIRECTION TOGGLE */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Direction</label>
            <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-[#e5e7eb] dark:border-[#334155]">
              <button
                type="button"
                onClick={() => setDirection('borrowed')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === 'borrowed'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[#6b7280] dark:text-[#94a3b8]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                I Borrowed (I Owe)
              </button>
              <button
                type="button"
                onClick={() => setDirection('lent')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === 'lent'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-[#6b7280] dark:text-[#94a3b8]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                I Lent (Owed to Me)
              </button>
            </div>
          </div>

          {/* PERSON NAME */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              {direction === 'borrowed' ? 'Borrowed From (Person)' : 'Lent To (Person)'} <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="e.g. Ramesh Kumar, Arvind, Landlord"
              required
              autoFocus
            />
          </div>

          {/* AMOUNT */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6b7280] dark:text-[#94a3b8]">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-8 pr-3.5 py-2.5 text-sm font-semibold text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                required
              />
            </div>
          </div>

          {/* RETURN DATE */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" />
              Expected Return Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
              required
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#6b7280]" />
              Notes / Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. For dinner split, laptop repair, advance rent..."
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className={`px-5 font-semibold ${
                direction === 'borrowed'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {submitting ? 'Saving...' : 'Save Debt Record'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
