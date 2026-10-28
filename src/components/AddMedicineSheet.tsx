import React, { useState } from 'react';
import { X, Pill, AlertTriangle, AlertCircle, CheckCircle2, Calendar, Plus } from 'lucide-react';
import { MedicineStockStatus } from '../types/medicine';
import { Button } from './ui';

interface AddMedicineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    purpose: string;
    dosage_notes?: string | null;
    stock_status: MedicineStockStatus;
    expiry_date?: string | null;
  }) => Promise<void>;
}

const COMMON_PURPOSES = [
  'Fever & Pain',
  'Cold & Cough',
  'Allergy & Itching',
  'Acidity & Gas',
  'Headache',
  'First Aid',
  'Supplements',
  'Digestive',
];

export const AddMedicineSheet: React.FC<AddMedicineSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dosageNotes, setDosageNotes] = useState('');
  const [stockStatus, setStockStatus] = useState<MedicineStockStatus>('in_stock');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a medicine name');
      return;
    }
    if (!purpose.trim()) {
      setError('Please enter the medicine purpose');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        purpose: purpose.trim(),
        dosage_notes: dosageNotes.trim() || null,
        stock_status: stockStatus,
        expiry_date: expiryDate || null,
      });
      // reset form
      setName('');
      setPurpose('');
      setDosageNotes('');
      setStockStatus('in_stock');
      setExpiryDate('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#1e293b] rounded-t-2xl shadow-2xl border-t border-[#e5e7eb] dark:border-[#334155] max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Add to Medicine Cabinet
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Track home stock, purpose &amp; expiry dates
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/60">
              {error}
            </div>
          )}

          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg, Cetirizine..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          {/* Purpose / Indication */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Purpose / For What? <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Fever, Headache, Severe allergy..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_PURPOSES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPurpose(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    purpose === tag
                      ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-gray-100 text-[#4b5563] border-gray-200 dark:bg-slate-800 dark:text-[#94a3b8] dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Status Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Stock Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStockStatus('in_stock')}
                className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'in_stock'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setStockStatus('low_stock')}
                className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'low_stock'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setStockStatus('out_of_stock')}
                className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'out_of_stock'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </button>
            </div>
          </div>

          {/* Dosage & Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Dosage &amp; Notes <span className="text-[11px] font-normal text-[#6b7280]">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={dosageNotes}
              onChange={(e) => setDosageNotes(e.target.value)}
              placeholder="e.g. 1 tablet after dinner. Max 2 tablets a day. Do not take on empty stomach."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6b7280]" />
              <span>Expiry Date <span className="text-[11px] font-normal text-[#6b7280]">(Optional)</span></span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Medicine'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
