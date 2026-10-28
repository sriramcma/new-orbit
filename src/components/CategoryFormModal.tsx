import React, { useState, useEffect } from 'react';
import { X, Sparkles, Folder } from 'lucide-react';
import { BrainCategory } from '../types/brain';
import {
  BRAIN_ICON_NAMES,
  BRAIN_ICON_MAP,
  BRAIN_COLORS,
  BrainIconName,
} from '../utils/brainUtils';
import { Button } from './ui';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: BrainCategory | null;
  onSave: (data: { name: string; icon: string; color: string }) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<BrainIconName>('Folder');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSelectedIcon((category.icon as BrainIconName) || 'Folder');
      setSelectedColor(category.color || 'purple');
    } else {
      setName('');
      setSelectedIcon('Folder');
      setSelectedColor('purple');
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
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

  const CurrentIcon = BRAIN_ICON_MAP[selectedIcon] || Folder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CurrentIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                {category ? 'Edit Category' : 'New Brain Category'}
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Group notes, projects &amp; ideas
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
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Personal Grooming, Pipeline, Ideas..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Icon Picker (12 Icons Grid) */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
                Choose Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BRAIN_ICON_NAMES.map((iconName) => {
                  const IconComp = BRAIN_ICON_MAP[iconName];
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30'
                          : 'border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#6b7280] dark:text-[#94a3b8] hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                      title={iconName}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker (6 Preset Colors) */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
                Accent Theme Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BRAIN_COLORS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer relative ${
                        isSelected
                          ? `${c.border} ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-slate-900`
                          : 'border-[#e5e7eb] dark:border-[#334155]'
                      } ${c.cardBg}`}
                      title={c.label}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                    </button>
                  );
                })}
              </div>
            </div>
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
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
            >
              <span>{submitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}</span>
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
