import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Category } from '../../types/budget';
import {
  CATEGORY_ICON_NAMES,
  CATEGORY_COLORS,
  CategoryIconName,
  CategoryColorId,
} from '../../utils/budgetUtils';
import { CategoryIcon } from './CategoryIcon';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (catData: { name: string; icon: string; color: string }) => Promise<void>;
  editingCategory?: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<CategoryIconName>('PiggyBank');
  const [selectedColor, setSelectedColor] = useState<CategoryColorId>('indigo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setSelectedIcon((editingCategory.icon as CategoryIconName) || 'MoreHorizontal');
      setSelectedColor((editingCategory.color as CategoryColorId) || 'indigo');
    } else {
      setName('');
      setSelectedIcon('PiggyBank');
      setSelectedColor('indigo');
    }
    setError(null);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide a category name');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: cleanName,
        icon: selectedIcon,
        color: selectedColor,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category');
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
            {editingCategory ? 'Edit Category' : 'New Category'}
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
              Category Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Travel, Gym, Education"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Theme Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((c) => {
                const isSelected = selectedColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#6366f1] ring-offset-2 dark:ring-offset-slate-900 border-transparent scale-105'
                        : 'border-[#e5e7eb] dark:border-[#334155] opacity-75 hover:opacity-100'
                    } ${c.bg}`}
                    title={c.label}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker (12 Icons) */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICON_NAMES.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6366f1] text-white shadow-sm ring-2 ring-[#6366f1] ring-offset-2 dark:ring-offset-slate-900'
                        : 'bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    title={iconName}
                  >
                    <CategoryIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] flex items-center gap-3">
            <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">Preview:</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  CATEGORY_COLORS.find((c) => c.id === selectedColor)?.bg || 'bg-indigo-50'
                } ${
                  CATEGORY_COLORS.find((c) => c.id === selectedColor)?.text || 'text-indigo-600'
                }`}
              >
                <CategoryIcon name={selectedIcon} className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
                {name.trim() || 'Category Name'}
              </span>
            </div>
          </div>

          {/* Buttons */}
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
              disabled={submitting || !name.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
