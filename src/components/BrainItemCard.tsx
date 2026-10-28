import React, { useState, useEffect, useRef } from 'react';
import {
  Pin,
  ExternalLink,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';
import { BrainItem, BrainLink, BrainChecklistItem } from '../types/brain';

interface BrainItemCardProps {
  item: BrainItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePin: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<BrainItem>) => void;
  onDeleteItem: (id: string) => void;
}

export const BrainItemCard: React.FC<BrainItemCardProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onTogglePin,
  onUpdateItem,
  onDeleteItem,
}) => {
  // Local form state for inline editing
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes || '');
  const [links, setLinks] = useState<BrainLink[]>(item.links || []);
  const [checklist, setChecklist] = useState<BrainChecklistItem[]>(item.checklist || []);

  // Mini link input state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  // Mini checklist input state
  const [newChecklistText, setNewChecklistText] = useState('');

  // Long press timer ref for mobile
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync state when item changes externally
  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes || '');
    setLinks(item.links || []);
    setChecklist(item.checklist || []);
  }, [item]);

  // Debounced auto-save on blur / updates
  const saveUpdates = (updates: Partial<BrainItem>) => {
    onUpdateItem(item.id, updates);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== item.title) {
      saveUpdates({ title: title.trim() });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (item.notes || '')) {
      saveUpdates({ notes: notes.trim() || null });
    }
  };

  // Link actions
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;
    const label = newLinkLabel.trim() || new URL(newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`).hostname.replace(/^www\./, '');
    const updated = [...links, { url: newLinkUrl.trim(), label }];
    setLinks(updated);
    saveUpdates({ links: updated });
    setNewLinkUrl('');
    setNewLinkLabel('');
    setIsAddingLink(false);
  };

  const handleRemoveLink = (idx: number) => {
    const updated = links.filter((_, i) => i !== idx);
    setLinks(updated);
    saveUpdates({ links: updated });
  };

  const handleCopyLink = async (url: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkIndex(index);
      setTimeout(() => setCopiedLinkIndex(null), 2000);
    } catch {}
  };

  // Checklist actions
  const handleToggleChecklist = (idx: number) => {
    const updated = checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
    setChecklist(updated);
    saveUpdates({ checklist: updated });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const updated = [...checklist, { text: newChecklistText.trim(), done: false }];
    setChecklist(updated);
    saveUpdates({ checklist: updated });
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (idx: number) => {
    const updated = checklist.filter((_, i) => i !== idx);
    setChecklist(updated);
    saveUpdates({ checklist: updated });
  };

  // Long press for quick pin
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onTogglePin(item.id);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const completedTasks = checklist.filter((c) => c.done).length;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`rounded-2xl transition-all duration-200 overflow-hidden ${
        item.is_pinned
          ? 'border-l-4 border-l-indigo-500 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs'
          : 'bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs'
      }`}
    >
      {/* CARD SUMMARY (Always visible, tap to expand) */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-bold text-xs text-[#111827] dark:text-[#f1f5f9] leading-snug line-clamp-2 ${
                isExpanded ? 'text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              {item.title}
            </h4>
          </div>

          {/* Notes preview (1 line muted) */}
          {item.notes && !isExpanded && (
            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-1 line-clamp-1">
              {item.notes}
            </p>
          )}

          {/* Badges row: Links & Tasks */}
          {(links.length > 0 || checklist.length > 0) && !isExpanded && (
            <div className="flex items-center gap-2 mt-2">
              {links.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                  <LinkIcon className="w-2.5 h-2.5" />
                  {links.length} {links.length === 1 ? 'link' : 'links'}
                </span>
              )}
              {checklist.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    completedTasks === checklist.length
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-gray-100 dark:bg-slate-800 text-[#6b7280] dark:text-[#94a3b8] border-[#e5e7eb] dark:border-[#334155]'
                  }`}
                >
                  <CheckSquare className="w-2.5 h-2.5" />
                  {completedTasks}/{checklist.length} tasks
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right action icons: Pin button & Expand toggle */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(item.id);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.is_pinned
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title={item.is_pinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            className="p-1 rounded-lg text-[#6b7280] dark:text-[#94a3b8]"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* INLINE EXPAND (Zero-Modal Notion-like editing) */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#e5e7eb] dark:border-[#334155]/60 space-y-3 animate-in fade-in duration-200">
          {/* Editable Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1">
              Notes &amp; Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Write thoughts, protocols, links, summaries..."
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            />
          </div>

          {/* Links Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-purple-500" />
                Reference Links ({links.length})
              </span>
              {!isAddingLink && (
                <button
                  type="button"
                  onClick={() => setIsAddingLink(true)}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-700 dark:text-purple-300"
                  >
                    <a
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(link.url, idx, e)}
                      title="Copy URL"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-900 cursor-pointer p-0.5"
                    >
                      {copiedLinkIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
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
                    placeholder="Label (e.g. GitHub)"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="w-1/3 px-2 py-1 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9]"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9]"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(false)}
                    className="px-2 py-1 text-[10px] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer"
                  >
                    Save Link
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Checklist / Sub-tasks Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-emerald-500" />
                Sub-tasks ({completedTasks}/{checklist.length})
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
                      onClick={() => handleToggleChecklist(idx)}
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
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Task */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                placeholder="+ Add task item..."
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

          {/* Footer Bar: Pinned & Delete */}
          <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#334155]/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onTogglePin(item.id)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                item.is_pinned
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8]'
              }`}
            >
              <Pin className={`w-3 h-3 ${item.is_pinned ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
              <span>{item.is_pinned ? 'Pinned to top' : 'Pin to top'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${item.title}"?`)) {
                  onDeleteItem(item.id);
                }
              }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
