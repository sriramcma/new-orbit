import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react';
import { ShoppingItem, ShoppingLink } from '../../types/shopping';
import {
  getCategoryMeta,
  getPriorityMeta,
  formatUrlForDisplay,
} from '../../utils/shoppingUtils';
import { formatIndianCurrency, formatShortMonth } from '../../utils/budgetUtils';
import { Badge } from '../ui';

interface WishlistCardProps {
  item: ShoppingItem;
  onPlanToBuy: (item: ShoppingItem) => void;
  onMarkBought: (item: ShoppingItem) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onToggleChecklist: (itemId: string, index: number) => void;
  onAddChecklist: (itemId: string, text: string) => void;
  onRemoveChecklist: (itemId: string, index: number) => void;
  onAddLink: (itemId: string, link: ShoppingLink) => void;
  onRemoveLink: (itemId: string, index: number) => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({
  item,
  onPlanToBuy,
  onMarkBought,
  onEdit,
  onDelete,
  onToggleChecklist,
  onAddChecklist,
  onRemoveChecklist,
  onAddLink,
  onRemoveLink,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  const categoryMeta = getCategoryMeta(item.category);
  const priorityMeta = getPriorityMeta(item.priority);
  const CategoryIcon = categoryMeta.icon;

  const checklist = item.checklist || [];
  const links = item.links || [];
  const completedChecklistCount = checklist.filter((c) => c.done).length;
  const checklistPercent =
    checklist.length > 0
      ? Math.round((completedChecklistCount / checklist.length) * 100)
      : 0;

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    onAddChecklist(item.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    onAddLink(item.id, {
      url: linkUrl.trim(),
      label: linkLabel.trim() || formatUrlForDisplay(linkUrl),
    });
    setLinkUrl('');
    setLinkLabel('');
    setIsAddingLink(false);
  };

  const handleCopyLink = async (url: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkIndex(index);
      setTimeout(() => setCopiedLinkIndex(null), 2000);
    } catch {}
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs overflow-hidden transition-all duration-200 hover:border-pink-300 dark:hover:border-pink-500/40">
      {/* Top Main Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-start justify-between gap-2.5 cursor-pointer select-none"
      >
        {/* Left: Category Icon & Details */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Category Icon with Priority Dot */}
          <div className="relative shrink-0 mt-0.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${categoryMeta.badgeBg} ${categoryMeta.badgeText}`}
            >
              <CategoryIcon className="w-4 h-4" />
            </div>
            {/* Priority dot on icon corner */}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#1e293b] ${priorityMeta.dotClass}`}
              title={priorityMeta.label}
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b7280] dark:text-[#94a3b8]">
                {item.category}
              </span>
              {item.brand && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9] font-medium">
                  {item.brand}
                </span>
              )}
              {item.status === 'planned' && item.planned_month && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] font-bold">
                  Planned: {formatShortMonth(item.planned_month)}
                </span>
              )}
            </div>

            <h4 className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9] mt-0.5 line-clamp-1 leading-snug">
              {item.name}
            </h4>

            {/* Checklist progress preview if has checklist */}
            {checklist.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                  {completedChecklistCount}/{checklist.length} specs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Target Price & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] block">
              {item.target_price ? `₹${formatIndianCurrency(item.target_price)}` : 'No price'}
            </span>
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
              Target
            </span>
          </div>

          <button
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#e5e7eb] dark:border-[#334155]/60 space-y-3 animate-in fade-in duration-200">
          {/* Notes if present */}
          {item.notes && (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 text-xs text-[#6b7280] dark:text-[#94a3b8] border border-[#e5e7eb] dark:border-[#334155]">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-[#111827] dark:text-[#f1f5f9] mb-0.5">
                Notes
              </span>
              <p className="text-[11px] leading-relaxed text-[#111827] dark:text-[#cbd5e1]">
                {item.notes}
              </p>
            </div>
          )}

          {/* Reference Links Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3 text-pink-500" />
                Store Links ({links.length})
              </span>
              {!isAddingLink && (
                <button
                  type="button"
                  onClick={() => setIsAddingLink(true)}
                  className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              )}
            </div>

            {links.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/60 text-xs text-pink-700 dark:text-pink-300"
                  >
                    <a
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>{link.label || formatUrlForDisplay(link.url)}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(link.url, idx, e)}
                      title="Copy URL"
                      className="text-pink-600 dark:text-pink-400 hover:text-pink-900 cursor-pointer p-0.5"
                    >
                      {copiedLinkIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveLink(item.id, idx)}
                      title="Remove Link"
                      className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAddingLink && (
              <form onSubmit={handleAddLink} className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-[#e5e7eb] dark:border-[#334155] space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Store name (e.g. Amazon)"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-1/3 px-2 py-1 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9]"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9]"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(false)}
                    className="px-2 py-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-semibold bg-pink-600 hover:bg-pink-700 text-white rounded-lg cursor-pointer"
                  >
                    Save Link
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pre-purchase Checklist */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3 text-emerald-500" />
                Pre-purchase Checklist ({completedChecklistCount}/{checklist.length})
              </span>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1">
                {checklist.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleChecklist(item.id, idx)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {c.done ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8] shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          c.done
                            ? 'line-through text-[#6b7280] dark:text-[#94a3b8]'
                            : 'text-[#111827] dark:text-[#f1f5f9]'
                        }`}
                      >
                        {c.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveChecklist(item.id, idx)}
                      className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add checklist item */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                placeholder="+ Add checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9]"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim()}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] cursor-pointer disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#334155]/60 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {/* Plan to Buy Button */}
              <button
                type="button"
                onClick={() => onPlanToBuy(item)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-[#6366f1] dark:text-[#818cf8] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.status === 'planned' ? 'Change Month' : 'Plan to Buy'}</span>
              </button>

              {/* Mark Bought Button */}
              <button
                type="button"
                onClick={() => onMarkBought(item)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Bought</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Edit button */}
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Edit item"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${item.name}" from wishlist?`)) {
                    onDelete(item.id);
                  }
                }}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
