import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { SHOPPING_CATEGORIES } from '../../utils/shoppingUtils';
import { ShoppingCategory } from '../../types/shopping';

interface CategoryFilterProps {
  selectedCategory: string; // 'All' | ShoppingCategory
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 min-w-max px-0.5">
        {/* 'All' Chip */}
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-pink-600 text-white shadow-xs font-semibold'
              : 'bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] border border-[#e5e7eb] dark:border-[#334155]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'All'
                ? 'bg-pink-700/60 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-[#6b7280] dark:text-[#94a3b8]'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Category Chips */}
        {SHOPPING_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-pink-600 text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] border border-[#e5e7eb] dark:border-[#334155]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-pink-700/60 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-[#6b7280] dark:text-[#94a3b8]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
