import React from 'react';
import { Plus } from 'lucide-react';
import { BrainCategory } from '../types/brain';
import { getBrainIcon, getBrainColorMeta } from '../utils/brainUtils';

interface CategoryGridProps {
  categories: BrainCategory[];
  loading: boolean;
  onSelectCategory: (category: BrainCategory) => void;
  onNewCategory: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  loading,
  onSelectCategory,
  onNewCategory,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-28 rounded-2xl bg-gray-100 dark:bg-slate-800/60 animate-pulse p-3.5 border border-[#e5e7eb] dark:border-[#334155]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
      {categories.map((cat) => {
        const Icon = getBrainIcon(cat.icon);
        const colorMeta = getBrainColorMeta(cat.color);
        const count = cat.item_count || 0;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 group hover:scale-[1.02] active:scale-[0.98] shadow-xs ${colorMeta.cardBg} ${colorMeta.border} hover:border-purple-400 dark:hover:border-purple-500/60`}
          >
            {/* Top Row: Icon + Count */}
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMeta.iconBg} ${colorMeta.text}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-[#6b7280] dark:text-[#94a3b8] border border-black/5 dark:border-white/5">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Bottom Row: Name */}
            <div>
              <h3 className="font-bold text-xs text-[#111827] dark:text-[#f1f5f9] line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                Tap to open
              </p>
            </div>
          </button>
        );
      })}

      {/* [+ New Category] Card at the end */}
      <button
        type="button"
        onClick={onNewCategory}
        className="p-3.5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center h-28 group active:scale-95"
      >
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800 text-[#6b7280] dark:text-[#94a3b8] group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 flex items-center justify-center mb-1.5 transition-colors">
          <Plus className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          New Category
        </span>
        <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
          Create collection
        </span>
      </button>
    </div>
  );
};
