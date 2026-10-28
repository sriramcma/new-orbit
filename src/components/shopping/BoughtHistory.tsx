import React from 'react';
import {
  ShoppingBag,
  RotateCcw,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ShoppingItem, EssentialItem } from '../../types/shopping';
import { getCategoryMeta } from '../../utils/shoppingUtils';
import { formatIndianCurrency, formatMonthLabel } from '../../utils/budgetUtils';

interface BoughtHistoryProps {
  shoppingItems: ShoppingItem[];
  essentialItems: EssentialItem[];
  onBuyAgainShopping: (item: ShoppingItem) => Promise<void>;
  onBuyAgainEssential: (item: EssentialItem) => Promise<void>;
  onDeleteShopping: (id: string) => Promise<void>;
  onDeleteEssential: (id: string) => Promise<void>;
}

export const BoughtHistory: React.FC<BoughtHistoryProps> = ({
  shoppingItems,
  essentialItems,
  onBuyAgainShopping,
  onBuyAgainEssential,
  onDeleteShopping,
  onDeleteEssential,
}) => {
  const boughtShopping = shoppingItems.filter((i) => i.status === 'bought');
  const boughtEssentials = essentialItems.filter((i) => i.status === 'bought');

  const totalSpent = boughtShopping.reduce(
    (sum, i) => sum + (Number(i.actual_price) || Number(i.target_price) || 0),
    0
  );

  // Group shopping items by purchase month
  const groupedByMonth: Record<string, ShoppingItem[]> = {};

  boughtShopping.forEach((item) => {
    let monthKey = 'Earlier';
    if (item.bought_date) {
      try {
        const d = new Date(item.bought_date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthKey = `${y}-${m}`;
      } catch {}
    } else if (item.created_at) {
      try {
        const d = new Date(item.created_at);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthKey = `${y}-${m}`;
      } catch {}
    }

    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    groupedByMonth[monthKey].push(item);
  });

  const monthKeys = Object.keys(groupedByMonth).sort().reverse();

  if (boughtShopping.length === 0 && boughtEssentials.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
          No Purchase History Yet
        </h4>
        <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
          When you mark wishlist items as bought or check off essentials, they will appear here grouped by month.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Total Spent Summary Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Wishlist Purchases
          </span>
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#f1f5f9]">
            ₹{formatIndianCurrency(totalSpent)}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
            {boughtShopping.length} items
          </span>
          <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">
            +{boughtEssentials.length} essentials
          </span>
        </div>
      </div>

      {/* Grouped by Month Shopping Items */}
      {monthKeys.map((mKey) => {
        const items = groupedByMonth[mKey];
        const monthLabel = mKey === 'Earlier' ? 'Earlier Purchases' : formatMonthLabel(mKey);
        const monthSpent = items.reduce(
          (sum, i) => sum + (Number(i.actual_price) || Number(i.target_price) || 0),
          0
        );

        return (
          <div key={mKey} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                {monthLabel}
              </h4>
              <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                ₹{formatIndianCurrency(monthSpent)} ({items.length})
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const categoryMeta = getCategoryMeta(item.category);
                const CategoryIcon = categoryMeta.icon;
                const paid = (item.actual_price !== null && item.actual_price !== undefined)
                  ? Number(item.actual_price)
                  : Number(item.target_price || 0);
                const target = Number(item.target_price || 0);
                const saved = target > 0 ? target - paid : 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs flex items-center justify-between gap-2.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${categoryMeta.badgeBg} ${categoryMeta.badgeText}`}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-[#6b7280] dark:text-[#94a3b8]">
                            {item.category}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9] font-medium">
                              {item.brand}
                            </span>
                          )}
                        </div>
                        <h5 className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9] truncate">
                          {item.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                          {paid > 0 && (
                            <span>
                              Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{formatIndianCurrency(paid)}</strong>
                            </span>
                          )}
                          {saved > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Saved ₹{formatIndianCurrency(saved)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onBuyAgainShopping(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/60 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Add back to wishlist"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Buy Again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove "${item.name}" from history?`)) {
                            onDeleteShopping(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bought Essentials Section */}
      {boughtEssentials.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Bought Essentials &amp; Groceries ({boughtEssentials.length})
            </h4>
          </div>

          <div className="space-y-1.5">
            {boughtEssentials.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-gray-50/60 dark:bg-slate-900/40 border border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#111827] dark:text-[#f1f5f9] truncate">
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] truncate">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onBuyAgainEssential(item)}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/50 border border-pink-200 dark:border-pink-800/60 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Need Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEssential(item.id)}
                    className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
