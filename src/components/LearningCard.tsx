import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Languages,
  HelpCircle,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Check,
  X,
} from 'lucide-react';
import { LearningItem, LearningStatus, LearningLink, LearningType } from '../types/learning';

interface LearningCardProps {
  item: LearningItem;
  onUpdate: (id: string, updates: Partial<LearningItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: LearningStatus) => Promise<void>;
}

export const LearningCard: React.FC<LearningCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local editable state
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes || '');
  const [links, setLinks] = useState<LearningLink[]>(item.links || []);

  // New link input state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Swipe-to-delete state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Synchronize when prop updates
  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes || '');
    setLinks(item.links || []);
  }, [item]);

  // Icon based on type
  const getTypeIcon = (type: LearningType) => {
    switch (type) {
      case 'skill':
        return BookOpen;
      case 'language':
        return Languages;
      case 'doubt':
        return HelpCircle;
      case 'wishlist':
        return Star;
    }
  };

  const Icon = getTypeIcon(item.type);

  // Auto-save on blur
  const handleSaveBlur = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (
      trimmedTitle !== item.title ||
      notes !== (item.notes || '') ||
      JSON.stringify(links) !== JSON.stringify(item.links)
    ) {
      await onUpdate(item.id, {
        title: trimmedTitle,
        notes: notes.trim() || null,
        links,
      });
    }
  };

  // Add new link
  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) return;
    const formattedUrl = newLinkUrl.trim().startsWith('http')
      ? newLinkUrl.trim()
      : `https://${newLinkUrl.trim()}`;
    const label = newLinkLabel.trim() || new URL(formattedUrl).hostname.replace('www.', '');

    const updatedLinks = [...links, { label, url: formattedUrl }];
    setLinks(updatedLinks);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setIsAddingLink(false);

    await onUpdate(item.id, { links: updatedLinks });
  };

  // Remove a link
  const handleRemoveLink = async (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    await onUpdate(item.id, { links: updatedLinks });
  };

  // Swipe-to-delete handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || isExpanded) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff < 0) {
      // Swiping left
      setSwipeOffset(Math.max(-80, diff));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -50) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
    }
    setTouchStartX(null);
  };

  const isLearning = item.status === 'learning';
  const isDone = item.status === 'done';

  return (
    <div className="relative overflow-hidden rounded-xl transition-all duration-200">
      {/* Swipe reveal background delete button */}
      <div className="absolute inset-y-0 right-0 w-20 bg-rose-600 flex items-center justify-center text-white">
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-xs font-semibold"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-white dark:bg-[#1e293b] rounded-xl border transition-all duration-200 shadow-xs ${
          isLearning
            ? 'border-indigo-400/80 dark:border-indigo-500/60 shadow-indigo-500/5'
            : isDone
            ? 'border-emerald-300 dark:border-emerald-900/60 opacity-90'
            : 'border-[#e5e7eb] dark:border-[#334155]'
        }`}
      >
        {/* CARD HEADER (Tap to expand) */}
        <div
          onClick={() => {
            if (swipeOffset !== 0) {
              setSwipeOffset(0);
              return;
            }
            setIsExpanded(!isExpanded);
          }}
          className="p-3.5 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {/* Type & status icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isLearning
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Title & Preview */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`font-semibold text-sm transition-colors ${
                      isDone
                        ? 'line-through text-gray-500 dark:text-slate-400'
                        : 'text-[#111827] dark:text-[#f1f5f9]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {isLearning && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      In Progress
                    </span>
                  )}
                </div>

                {/* Notes 1-line preview */}
                {item.notes && !isExpanded && (
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] line-clamp-1 mt-1 leading-relaxed">
                    {item.notes}
                  </p>
                )}

                {/* Metadata tags: links count & status tag */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {item.links && item.links.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium">
                      <LinkIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>{item.links.length} {item.links.length === 1 ? 'resource' : 'resources'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* STATUS BADGE / QUICK ACTION */}
            <div className="flex items-center gap-2 shrink-0">
              {item.status === 'learning' ? (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/80 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-indigo-500" />
                  Learning
                </span>
              ) : item.status === 'done' ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {item.type === 'doubt' ? 'Solved' : 'Mastered'}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  To Do
                </span>
              )}

              <div className="text-[#9ca3af] hover:text-[#4b5563] dark:hover:text-[#cbd5e1] p-1">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        {/* INLINE EXPANDED FORM (Zero Modal) */}
        {isExpanded && (
          <div className="p-3.5 bg-gray-50/80 dark:bg-slate-900/60 border-t border-[#e5e7eb] dark:border-[#334155] space-y-3.5 animate-in fade-in duration-150">
            {/* Status Segmented Buttons */}
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1.5">
                Current Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, 'todo')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    item.status === 'todo'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-xs dark:bg-slate-600'
                      : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>To Do</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, 'learning')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    item.status === 'learning'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Learning</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, 'done')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    item.status === 'done'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.type === 'doubt' ? 'Solved' : 'Done'}</span>
                </button>
              </div>
            </div>

            {/* Editable Title */}
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1">
                Title / Topic
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveBlur}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            {/* Notes / Answer Textarea */}
            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] mb-1">
                {item.type === 'doubt' ? 'Question & Solution' : 'Notes & Key Takeaways'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveBlur}
                placeholder={
                  item.type === 'doubt'
                    ? 'What is the question? Did you find the answer?'
                    : 'Notes, key concepts, study schedule, or reflections...'
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-y"
              />
            </div>

            {/* Links / Resources Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-[#4b5563] dark:text-[#94a3b8] flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-cyan-500" />
                  <span>Resources &amp; Study Links ({links.length})</span>
                </label>
                {!isAddingLink && (
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(true)}
                    className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              {/* Links list */}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {links.map((link, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-[#111827] dark:text-[#f1f5f9]"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-cyan-600 dark:text-cyan-400 flex items-center gap-1 max-w-[180px] truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-gray-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Link Input Box */}
              {isAddingLink && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-900/60 space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Docs, Video)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      className="px-2 py-1 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-[#111827] dark:text-[#f1f5f9] focus:outline-none"
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLink();
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-[#111827] dark:text-[#f1f5f9] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingLink(false);
                        setNewLinkLabel('');
                        setNewLinkUrl('');
                      }}
                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!newLinkUrl.trim()}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded cursor-pointer disabled:opacity-50"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer: Auto-save note & Delete button */}
            <div className="pt-2 border-t border-[#e5e7eb] dark:border-slate-750 flex items-center justify-between">
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                Changes save automatically on blur
              </span>

              <div className="flex items-center gap-2">
                {isDeleting ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-rose-600 font-medium">Delete item?</span>
                    <button
                      type="button"
                      onClick={() => setIsDeleting(false)}
                      className="px-2 py-1 text-[11px] rounded bg-gray-200 dark:bg-slate-700 text-[#4b5563] dark:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="px-2 py-1 text-[11px] rounded bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDeleting(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 py-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
