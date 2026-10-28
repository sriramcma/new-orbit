import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  ExternalLink,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import {
  ShoppingItem,
  ShoppingCategory,
  ShoppingPriority,
  ShoppingLink,
} from '../../types/shopping';
import { SHOPPING_CATEGORIES } from '../../utils/shoppingUtils';
import { Button } from '../ui';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ShoppingItem | null;
  onSave: (data: {
    name: string;
    brand?: string | null;
    category: ShoppingCategory;
    target_price?: number | null;
    priority: ShoppingPriority;
    notes?: string | null;
    links: ShoppingLink[];
    checklist: { text: string; done: boolean }[];
  }) => Promise<void>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ShoppingCategory>('Clothes');
  const [targetPrice, setTargetPrice] = useState('');
  const [priority, setPriority] = useState<ShoppingPriority>('med');
  const [notes, setNotes] = useState('');

  // Links state
  const [links, setLinks] = useState<ShoppingLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setBrand(item.brand || '');
      setCategory(item.category || 'Clothes');
      setTargetPrice(item.target_price ? String(item.target_price) : '');
      setPriority(item.priority || 'med');
      setNotes(item.notes || '');
      setLinks(item.links ? [...item.links] : []);
      setChecklist(item.checklist ? [...item.checklist] : []);
    } else {
      setName('');
      setBrand('');
      setCategory('Clothes');
      setTargetPrice('');
      setPriority('med');
      setNotes('');
      setLinks([]);
      setChecklist([]);
    }
    setNewLinkUrl('');
    setNewLinkLabel('');
    setNewChecklistText('');
    setError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const label = newLinkLabel.trim() || 'Store Link';
    setLinks([...links, { url: newLinkUrl.trim(), label }]);
    setNewLinkUrl('');
    setNewLinkLabel('');
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([...checklist, { text: newChecklistText.trim(), done: false }]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        brand: brand.trim() || null,
        category,
        target_price: targetPrice.trim() !== '' ? parseFloat(targetPrice) : null,
        priority,
        notes: notes.trim() || null,
        links,
        checklist,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[460px] max-h-[92vh] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                {item ? 'Edit Wishlist Item' : 'Add to Wishlist'}
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Track prices, links &amp; checklist specs
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

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Name & Brand */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sony WH-1000XM5, Linen Shirt..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Brand / Store (Optional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Nike, Uniqlo, IKEA..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SHOPPING_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer text-center ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold shadow-xs'
                        : 'border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#6b7280] dark:text-[#94a3b8] hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Price & Priority */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Target Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#6b7280] dark:text-[#94a3b8] text-xs font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 h-[34px]">
                {(['low', 'med', 'high'] as ShoppingPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-xl capitalize text-xs font-medium border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-500 text-white border-rose-500 font-semibold'
                            : p === 'med'
                            ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                            : 'bg-slate-600 text-white border-slate-600 font-semibold'
                          : 'bg-white dark:bg-slate-900 text-[#6b7280] dark:text-[#94a3b8] border-[#e5e7eb] dark:border-[#334155]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reference Links Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-pink-500" />
                Store &amp; Reference Links
              </label>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                {links.length} added
              </span>
            </div>

            {/* List of current links */}
            {links.length > 0 && (
              <div className="space-y-1">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155]"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9] truncate">
                        {link.label}
                      </p>
                      <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] truncate font-mono">
                        {link.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new link input */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                placeholder="Label (e.g. Amazon)"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                className="w-1/3 px-2.5 py-1.5 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9]"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9]"
              />
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!newLinkUrl.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#111827] dark:text-[#f1f5f9] cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Checklist Specs Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                Pre-purchase Checklist
              </label>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                {checklist.length} items
              </span>
            </div>

            {/* List of current checklist */}
            {checklist.length > 0 && (
              <div className="space-y-1">
                {checklist.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155]"
                  >
                    <span className="text-xs text-[#111827] dark:text-[#f1f5f9] truncate min-w-0 pr-2">
                      {c.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add checklist input */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                placeholder="e.g. Try size M in store, check discount code..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9]"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                disabled={!newChecklistText.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#111827] dark:text-[#f1f5f9] cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Notes &amp; Thoughts
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why you want this, alternatives, sale dates..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-1.5"
          >
            <span>{submitting ? 'Saving...' : item ? 'Save Changes' : 'Add to Wishlist'}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
