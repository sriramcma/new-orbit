import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Bookmark,
  PiggyBank,
  Zap,
  ShoppingBag,
  Home,
  Utensils,
  CreditCard,
  Wallet,
  Gift,
  Car,
  Heart,
  BookOpen,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';
import { Category } from '../../types/budget';
import { formatIndianCurrency } from '../../utils/budgetUtils';

const ICON_MAP: Record<string, LucideIcon> = {
  PiggyBank,
  Zap,
  ShoppingBag,
  Home,
  Utensils,
  CreditCard,
  Wallet,
  Gift,
  Car,
  Heart,
  BookOpen,
  MoreHorizontal,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-[#6366f1] dark:text-[#818cf8]' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-600 dark:text-cyan-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-400' },
};

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialName?: string;
  initialAllocations: Record<string, number>;
  initialIsDefault?: boolean;
  isEditing?: boolean;
  templateId?: string;
  existingTemplates?: Array<{ id: string; name: string }>;
  onSave: (data: { name: string; allocations: Record<string, number>; is_default: boolean }) => Promise<void>;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialName = '',
  initialAllocations,
  initialIsDefault = false,
  isEditing = false,
  templateId,
  existingTemplates = [],
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      // Clean allocations to only positive amounts
      const clean: Record<string, number> = {};
      Object.entries(initialAllocations || {}).forEach(([catId, amt]) => {
        const val = Number(amt) || 0;
        if (val > 0) clean[catId] = val;
      });
      setAllocations(clean);
      setIsDefault(initialIsDefault);
      setError(null);
      setSelectedToAdd('');
    }
  }, [isOpen, initialName, initialAllocations, initialIsDefault]);

  // Compute category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Total allocated amount
  const totalAmount = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [allocations]);

  const activeCategoryCount = useMemo(() => {
    return Object.values(allocations).filter((v) => (Number(v) || 0) > 0).length;
  }, [allocations]);

  // Available categories not yet in the template
  const availableToAdd = useMemo(() => {
    return categories.filter((c) => !(c.id in allocations));
  }, [categories, allocations]);

  if (!isOpen) return null;

  const handleAllocationChange = (catId: string, valStr: string) => {
    const cleaned = valStr.replace(/\D/g, '');
    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setAllocations((prev) => ({
      ...prev,
      [catId]: num,
    }));
  };

  const handleRemoveCategory = (catId: string) => {
    setAllocations((prev) => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
  };

  const handleAddCategory = () => {
    if (!selectedToAdd) return;
    setAllocations((prev) => ({
      ...prev,
      [selectedToAdd]: 0,
    }));
    setSelectedToAdd('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a name for the template.');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Template name must be 50 characters or less.');
      return;
    }

    // Check duplicate name
    const isDuplicate = existingTemplates.some(
      (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase() && t.id !== templateId
    );
    if (isDuplicate) {
      setError(`A template named "${trimmedName}" already exists.`);
      return;
    }

    if (totalAmount <= 0 || activeCategoryCount === 0) {
      setError('Allocate an amount greater than ₹0 to at least one category.');
      return;
    }

    // Filter to only positive allocations
    const finalAllocations: Record<string, number> = {};
    Object.entries(allocations).forEach(([k, v]) => {
      const val = Number(v) || 0;
      if (val > 0) finalAllocations[k] = val;
    });

    try {
      setSaving(true);
      await onSave({
        name: trimmedName,
        allocations: finalAllocations,
        is_default: isDefault,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#e5e7eb] dark:border-[#334155] space-y-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#e5e7eb] dark:border-[#334155] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                {isEditing ? 'Edit Template' : 'Save as Template'}
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                {isEditing ? 'Update template name and allocations' : 'Reuse this allocation plan across any month'}
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

        {error && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Template Name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Template Name
              </label>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                {name.length}/50
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={50}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Month, Lean Month, Bonus Month"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          {/* Allocation summary pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-[#e5e7eb] dark:border-[#334155]">
            <span className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
              Total Plan ({activeCategoryCount} categories)
            </span>
            <span className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
              ₹{formatIndianCurrency(totalAmount)}
            </span>
          </div>

          {/* Allocations Breakdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] block">
              Categories & Amounts
            </label>

            {Object.keys(allocations).length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6b7280] dark:text-[#94a3b8] bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#334155]">
                No categories in this template yet. Add one below.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {Object.entries(allocations).map(([catId, amount]) => {
                  const cat = categoryMap.get(catId);
                  const Icon = cat ? (ICON_MAP[cat.icon] || MoreHorizontal) : MoreHorizontal;
                  const colorStyle = cat ? (COLOR_MAP[cat.color] || COLOR_MAP.indigo) : COLOR_MAP.indigo;

                  return (
                    <div
                      key={catId}
                      className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-900/40 border border-[#e5e7eb] dark:border-[#334155]"
                    >
                      <div className={`w-7 h-7 rounded-lg ${colorStyle.bg} ${colorStyle.text} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9] flex-1 truncate">
                        {cat ? cat.name : 'Unknown Category'}
                      </span>
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6b7280] dark:text-[#94a3b8]">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={amount ? formatIndianCurrency(amount) : ''}
                          onChange={(e) => handleAllocationChange(catId, e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1 text-xs font-bold text-right rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(catId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                        title="Remove from template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add remaining categories dropdown */}
            {availableToAdd.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedToAdd}
                  onChange={(e) => setSelectedToAdd(e.target.value)}
                  className="flex-1 text-xs py-1.5 px-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-1 focus:ring-[#6366f1]"
                >
                  <option value="">+ Add another category...</option>
                  {availableToAdd.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedToAdd}
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Make default toggle */}
          <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="mt-0.5 rounded text-[#6366f1] focus:ring-[#6366f1]"
              />
              <div>
                <span className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] block">
                  Make this default for new months
                </span>
                <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                  Automatically suggested when opening an unbudgeted month.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-3 border-t border-[#e5e7eb] dark:border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#e5e7eb] dark:border-[#334155] text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer h-10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#6366f1] text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer h-10"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isEditing ? 'Save Changes' : 'Save Template'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
