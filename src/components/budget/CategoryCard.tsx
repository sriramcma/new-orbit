import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { Category } from '../../types/budget';
import { CategoryIcon } from './CategoryIcon';
import { formatIndianCurrency, getColorClasses } from '../../utils/budgetUtils';

interface CategoryCardProps {
  category: Category;
  allocationAmount: number;
  totalIncome: number;
  onUpdateAllocation: (categoryId: string, amount: number) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  allocationAmount,
  totalIncome,
  onUpdateAllocation,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(allocationAmount.toString());
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const colorMeta = getColorClasses(category.color);
  const percent = totalIncome > 0 ? Math.round((allocationAmount / totalIncome) * 100) : 0;

  useEffect(() => {
    setInputValue(allocationAmount > 0 ? allocationAmount.toString() : '');
  }, [allocationAmount]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(/,/g, ''));
    const finalAmount = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    onUpdateAllocation(category.id, finalAmount);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(allocationAmount > 0 ? allocationAmount.toString() : '');
      setIsEditing(false);
    }
  };

  // Long-press handling for mobile convenience
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative bg-white dark:bg-[#1e293b] rounded-xl p-3.5 border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:border-[#6366f1]/50 dark:hover:border-[#818cf8]/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Category Icon & Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMeta.bg} ${colorMeta.text}`}
          >
            <CategoryIcon name={category.icon} className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
              {category.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8] truncate">
                {totalIncome > 0 ? `${percent}% of income` : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] shrink-0">₹</span>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className="w-20 sm:w-24 text-right text-sm font-bold bg-gray-50 dark:bg-slate-900 border border-[#6366f1] rounded-lg px-2 py-1 text-[#111827] dark:text-[#f1f5f9] focus:outline-hidden"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSave}
                className="p-1.5 rounded-lg bg-[#6366f1] text-white hover:bg-[#4f46e5] cursor-pointer shrink-0"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-right py-1 px-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group/btn"
              title="Click to edit allocation"
            >
              <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight block">
                ₹{formatIndianCurrency(allocationAmount)}
              </span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] group-hover/btn:text-[#6366f1] dark:group-hover/btn:text-[#818cf8] transition-colors">
                tap to edit
              </span>
            </button>
          )}

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Category options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-9 w-36 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-[#e5e7eb] dark:border-[#334155] py-1 z-20 animate-in fade-in-50 zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEditCategory(category);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#374151] dark:text-[#cbd5e1] hover:bg-gray-100 dark:hover:bg-slate-700/60 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" />
                  <span>Edit Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteCategory(category);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
