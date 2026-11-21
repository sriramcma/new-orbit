import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit2, Trash2, Check, Repeat, ShoppingBag } from 'lucide-react';
import { Category } from '../../types/budget';
import { CategoryIcon } from './CategoryIcon';
import {
  CategoryBudgetBreakdown,
  formatIndianCurrency,
  getColorClasses,
} from '../../utils/budgetUtils';

interface CategoryCardProps {
  category: Category;
  allocationAmount: number;
  breakdown?: CategoryBudgetBreakdown;
  totalIncome: number;
  onUpdateAllocation: (categoryId: string, amount: number) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  allocationAmount,
  breakdown,
  totalIncome,
  onUpdateAllocation,
  onEditCategory,
  onDeleteCategory,
}) => {
  const effectiveAmount = breakdown ? breakdown.effectiveAmount : allocationAmount;
  const recurringTotal = breakdown?.recurringTotal || 0;
  const plannedTotal = breakdown?.plannedTotal || 0;
  const extraAmount = breakdown?.extraAmount || 0;
  const hasCommitments = recurringTotal > 0 || plannedTotal > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    effectiveAmount > 0 ? effectiveAmount.toString() : ''
  );
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorMeta = getColorClasses(category.color);
  const percent = totalIncome > 0 ? Math.round((effectiveAmount / totalIncome) * 100) : 0;

  useEffect(() => {
    if (!isEditing) {
      setInputValue(effectiveAmount > 0 ? effectiveAmount.toString() : '');
    }
  }, [effectiveAmount, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

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
    const finalAmount = isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed);
    setIsEditing(false);
    if (finalAmount !== effectiveAmount) {
      onUpdateAllocation(category.id, finalAmount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(effectiveAmount > 0 ? effectiveAmount.toString() : '');
      setIsEditing(false);
    }
  };

  // Long-press handling for mobile convenience (cancelled on scroll/move)
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    cancelLongPress();
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 600);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={cancelLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      className={`group relative bg-white dark:bg-[#1e293b] rounded-xl p-3.5 border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:border-[#6366f1]/50 dark:hover:border-[#818cf8]/50 transition-all duration-200 ${
        showMenu ? 'z-20' : 'z-0'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Category Icon & Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMeta.bg} ${colorMeta.text}`}
          >
            <CategoryIcon name={category.icon} className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[#111827] dark:text-[#f1f5f9] leading-snug line-clamp-2 break-words">
              {category.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8]">
                {totalIncome > 0 ? `${percent}% of income` : 'Set income above'}
              </span>
            </div>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
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
                aria-label="Save allocation"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setInputValue(effectiveAmount > 0 ? effectiveAmount.toString() : '');
                setIsEditing(true);
              }}
              className="text-right py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group/btn"
              title="Click to edit allocation"
            >
              <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight block">
                ₹{formatIndianCurrency(effectiveAmount)}
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
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Category options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-36 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-[#e5e7eb] dark:border-[#334155] py-1 z-30 animate-in fade-in-50 zoom-in-95 duration-100">
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

      {/* Live Commitment Breakdown (Recurring Bills & This Month's Planned Purchases) */}
      {hasCommitments && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-[11px]">
          {recurringTotal > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
              <Repeat className="w-3 h-3 shrink-0" />
              ₹{formatIndianCurrency(recurringTotal)} recurring
            </span>
          )}
          {plannedTotal > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium">
              <ShoppingBag className="w-3 h-3 shrink-0" />
              ₹{formatIndianCurrency(plannedTotal)} planned
            </span>
          )}
          {extraAmount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] font-medium">
              + ₹{formatIndianCurrency(extraAmount)} extra
            </span>
          )}
        </div>
      )}
    </div>
  );
};
