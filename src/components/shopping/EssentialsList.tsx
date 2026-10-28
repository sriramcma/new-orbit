import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RotateCcw,
  Repeat,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { EssentialItem } from '../../types/shopping';

interface EssentialsListProps {
  items: EssentialItem[];
  onAdd: (name: string, recurring: boolean, notes?: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: 'need' | 'bought') => Promise<void>;
  onToggleRecurring: (id: string, currentRecurring: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onResetAllRecurring: () => Promise<void>;
}

export const EssentialsList: React.FC<EssentialsListProps> = ({
  items,
  onAdd,
  onToggleStatus,
  onToggleRecurring,
  onDelete,
  onResetAllRecurring,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecurringChecked, setIsRecurringChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'need' | 'bought'>('all');

  const needItems = items.filter((i) => i.status === 'need');
  const boughtItems = items.filter((i) => i.status === 'bought');
  const recurringBoughtCount = items.filter((i) => i.recurring && i.status === 'bought').length;

  const displayedItems =
    filter === 'need'
      ? needItems
      : filter === 'bought'
      ? boughtItems
      : items;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(inputText.trim(), isRecurringChecked);
      setInputText('');
      setIsRecurringChecked(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Quick Add Bar */}
      <form
        onSubmit={handleAdd}
        className="p-2.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs space-y-2 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            placeholder="Add grocery or daily essential (e.g. Milk, Toothpaste, Coffee)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={submitting || !inputText.trim()}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Quick Options for New Item */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRecurringChecked}
              onChange={(e) => setIsRecurringChecked(e.target.checked)}
              className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3 text-pink-500" /> Recurring Essential (e.g. weekly groceries)
            </span>
          </label>
        </div>
      </form>

      {/* Recurring Reset Alert Banner */}
      {recurringBoughtCount > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Repeat className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8] shrink-0" />
            <span className="text-xs text-[#111827] dark:text-[#f1f5f9] font-medium truncate">
              {recurringBoughtCount} recurring {recurringBoughtCount === 1 ? 'item' : 'items'} bought previously
            </span>
          </div>
          <button
            type="button"
            onClick={onResetAllRecurring}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-[#6366f1] dark:text-[#818cf8] text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1 shrink-0 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Need</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-1 border-b border-[#e5e7eb] dark:border-[#334155] pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-gray-200 dark:bg-slate-700 text-[#111827] dark:text-[#f1f5f9]'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('need')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'need'
                ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
            }`}
          >
            Need to Buy ({needItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('bought')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'bought'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
            }`}
          >
            Bought ({boughtItems.length})
          </button>
        </div>
      </div>

      {/* Items List */}
      {displayedItems.length > 0 ? (
        <div className="space-y-1.5">
          {displayedItems.map((item) => {
            const isBought = item.status === 'bought';
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all duration-200 ${
                  isBought
                    ? 'bg-gray-50/60 dark:bg-slate-900/40 border-[#e5e7eb] dark:border-[#334155]/60 opacity-70'
                    : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155] shadow-xs'
                }`}
              >
                {/* Checkbox & Name */}
                <button
                  type="button"
                  onClick={() => onToggleStatus(item.id, item.status)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                >
                  {isBought ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#6b7280] dark:text-[#94a3b8] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium ${
                        isBought
                          ? 'line-through text-[#6b7280] dark:text-[#94a3b8]'
                          : 'text-[#111827] dark:text-[#f1f5f9]'
                      }`}
                    >
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] truncate">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </button>

                {/* Right metadata and buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Recurring badge / toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleRecurring(item.id, item.recurring)}
                    title={item.recurring ? 'Recurring item (tap to disable)' : 'Mark as recurring essential'}
                    className={`p-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                      item.recurring
                        ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-semibold border border-pink-200 dark:border-pink-800/60'
                        : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Repeat className="w-3 h-3" />
                    {item.recurring && <span className="hidden sm:inline">Recurring</span>}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center space-y-1">
          <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
            {filter === 'bought'
              ? 'No bought essentials yet'
              : filter === 'need'
              ? 'All essentials have been checked off! 🎉'
              : 'No essential items added yet'}
          </p>
          <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            Quickly track milk, groceries, grooming refills &amp; recurring supplies.
          </p>
        </div>
      )}
    </div>
  );
};
