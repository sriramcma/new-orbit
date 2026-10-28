import React, { useState, useEffect } from 'react';
import {
  Pill,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Medicine, MedicineStockStatus } from '../types/medicine';

interface MedicineCardProps {
  medicine: Medicine;
  onUpdate: (id: string, updates: Partial<Medicine>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRestock: (id: string) => Promise<void>;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onUpdate,
  onDelete,
  onRestock,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restocking, setRestocking] = useState(false);

  // Editable local state
  const [name, setName] = useState(medicine.name);
  const [purpose, setPurpose] = useState(medicine.purpose);
  const [dosageNotes, setDosageNotes] = useState(medicine.dosage_notes || '');
  const [stockStatus, setStockStatus] = useState<MedicineStockStatus>(medicine.stock_status);
  const [expiryDate, setExpiryDate] = useState(medicine.expiry_date || '');

  // Keep local state synced if parent updates
  useEffect(() => {
    setName(medicine.name);
    setPurpose(medicine.purpose);
    setDosageNotes(medicine.dosage_notes || '');
    setStockStatus(medicine.stock_status);
    setExpiryDate(medicine.expiry_date || '');
  }, [medicine]);

  // Compute expiry details
  const getExpiryInfo = () => {
    if (!medicine.expiry_date) return { status: 'none', label: 'No expiry set' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(medicine.expiry_date);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: `Expired ${Math.abs(diffDays)}d ago`,
        daysRemaining: diffDays,
      };
    }
    if (diffDays === 0) {
      return { status: 'soon', label: 'Expires today!', daysRemaining: 0 };
    }
    if (diffDays <= 30) {
      return {
        status: 'soon',
        label: `Expires in ${diffDays}d`,
        daysRemaining: diffDays,
      };
    }
    const formatted = exp.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    return { status: 'normal', label: `Exp: ${formatted}`, daysRemaining: diffDays };
  };

  const expiryInfo = getExpiryInfo();

  // Determine left border highlight:
  // Out of stock = red, Expiring soon or expired = amber, else standard border
  let borderHighlightClass = '';
  if (medicine.stock_status === 'out_of_stock') {
    borderHighlightClass = 'border-l-4 border-l-rose-500';
  } else if (expiryInfo.status === 'expired') {
    borderHighlightClass = 'border-l-4 border-l-rose-500';
  } else if (expiryInfo.status === 'soon' || medicine.stock_status === 'low_stock') {
    borderHighlightClass = 'border-l-4 border-l-amber-500';
  }

  const handleBlurOrSave = async () => {
    const trimmedName = name.trim();
    const trimmedPurpose = purpose.trim();
    if (!trimmedName || !trimmedPurpose) return;

    if (
      trimmedName !== medicine.name ||
      trimmedPurpose !== medicine.purpose ||
      dosageNotes !== (medicine.dosage_notes || '') ||
      stockStatus !== medicine.stock_status ||
      (expiryDate || null) !== (medicine.expiry_date || null)
    ) {
      await onUpdate(medicine.id, {
        name: trimmedName,
        purpose: trimmedPurpose,
        dosage_notes: dosageNotes.trim() || null,
        stock_status: stockStatus,
        expiry_date: expiryDate || null,
      });
    }
  };

  const handleStockChange = async (newStatus: MedicineStockStatus) => {
    setStockStatus(newStatus);
    await onUpdate(medicine.id, { stock_status: newStatus });
  };

  const handleQuickRestock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRestocking(true);
    try {
      await onRestock(medicine.id);
    } finally {
      setRestocking(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    await onDelete(medicine.id);
  };

  return (
    <div
      className={`bg-white dark:bg-[#1e293b] rounded-xl border border-[#e5e7eb] dark:border-[#334155] shadow-xs transition-all duration-200 overflow-hidden ${borderHighlightClass}`}
    >
      {/* CARD MAIN HEADER AREA */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                medicine.stock_status === 'out_of_stock'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : medicine.stock_status === 'low_stock'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}
            >
              <Pill className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9] truncate">
                  {medicine.name}
                </h3>
              </div>

              {/* Purpose subtitle */}
              <p className="text-xs text-[#4b5563] dark:text-[#94a3b8] line-clamp-1 mt-0.5">
                {medicine.purpose}
              </p>

              {/* Dosage preview if available */}
              {medicine.dosage_notes && !isExpanded && (
                <p className="text-[11px] text-[#6b7280] dark:text-[#64748b] line-clamp-1 mt-1 italic flex items-center gap-1">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>{medicine.dosage_notes}</span>
                </p>
              )}
            </div>
          </div>

          {/* RIGHT BADGES & CONTROLS */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Stock Badge */}
            {medicine.stock_status === 'in_stock' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                In Stock
              </span>
            )}

            {medicine.stock_status === 'low_stock' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/70 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Low Stock
              </span>
            )}

            {medicine.stock_status === 'out_of_stock' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/70 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                Out of Stock
              </span>
            )}

            {/* Expiry indicator */}
            {expiryInfo.status === 'expired' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/80 dark:text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                <Clock className="w-2.5 h-2.5" />
                {expiryInfo.label}
              </span>
            )}

            {expiryInfo.status === 'soon' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/80 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                <Clock className="w-2.5 h-2.5" />
                {expiryInfo.label}
              </span>
            )}

            {expiryInfo.status === 'normal' && (
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {expiryInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM CARD ROW: Quick Restock button + expand chevron */}
        <div className="mt-2.5 pt-2 border-t border-[#f3f4f6] dark:border-[#334155]/60 flex items-center justify-between text-xs">
          <div>
            {(medicine.stock_status === 'low_stock' || medicine.stock_status === 'out_of_stock') && (
              <button
                type="button"
                onClick={handleQuickRestock}
                disabled={restocking}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{restocking ? 'Restocking...' : '+ Restock'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#94a3b8] text-[11px]">
            <span>{isExpanded ? 'Collapse' : 'Details & Edit'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* EXPANDED INLINE EDIT SECTION (Zero-modal) */}
      {isExpanded && (
        <div className="p-3.5 bg-gray-50/80 dark:bg-slate-900/60 border-t border-[#e5e7eb] dark:border-[#334155] space-y-3 animate-in fade-in duration-150">
          {/* Quick Stock Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1.5">
              Stock Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleStockChange('in_stock')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'in_stock'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock</span>
              </button>

              <button
                type="button"
                onClick={() => handleStockChange('low_stock')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'low_stock'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low</span>
              </button>

              <button
                type="button"
                onClick={() => handleStockChange('out_of_stock')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  stockStatus === 'out_of_stock'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out</span>
              </button>
            </div>
          </div>

          {/* Name & Purpose Fields */}
          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1">
                Medicine Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlurOrSave}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1">
                Purpose / Indications
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                onBlur={handleBlurOrSave}
                placeholder="e.g. Fever, Headache, Allergies"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            {/* Dosage Notes */}
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1">
                Dosage &amp; Instructions
              </label>
              <textarea
                rows={2}
                value={dosageNotes}
                onChange={(e) => setDosageNotes(e.target.value)}
                onBlur={handleBlurOrSave}
                placeholder="e.g. 1 tablet after breakfast. Avoid on empty stomach."
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#6b7280]" />
                <span>Expiry Date</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  onUpdate(medicine.id, { expiry_date: e.target.value || null });
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>

          {/* Delete Action Row */}
          <div className="pt-2 border-t border-[#e5e7eb] dark:border-slate-750 flex items-center justify-between">
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
              Changes auto-save on blur
            </span>

            <div className="flex items-center gap-2">
              {isDeleting ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-600 font-medium">Delete item?</span>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="px-2 py-1 text-[11px] rounded bg-gray-200 dark:bg-slate-700 text-[#4b5563] dark:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="px-2 py-1 text-[11px] rounded bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 py-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
