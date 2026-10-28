import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Plus,
  Trash2,
  Link as LinkIcon,
  Shirt,
  Glasses,
  Watch,
  Scissors,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StyleItem, StyleCategory, StyleStatus, StyleLink } from '../types/style';
import { Button } from './ui';

interface StyleDetailViewProps {
  item: StyleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<StyleItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  return (
    clean.includes('images.unsplash.com') ||
    clean.includes('unsplash.com/photos') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.includes('image')
  );
}

export const StyleDetailView: React.FC<StyleDetailViewProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState(item?.title || '');
  const [brand, setBrand] = useState(item?.brand || '');
  const [category, setCategory] = useState<StyleCategory>(item?.category || 'clothes');
  const [status, setStatus] = useState<StyleStatus>(item?.status || 'idea');
  const [notes, setNotes] = useState(item?.notes || '');
  const [links, setLinks] = useState<StyleLink[]>(item?.links || []);

  // New link input state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Delete confirm state
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setBrand(item.brand || '');
      setCategory(item.category);
      setStatus(item.status);
      setNotes(item.notes || '');
      setLinks(item.links || []);
      setIsDeleting(false);
      setIsAddingLink(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Auto-save on blur
  const handleAutoSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (
      trimmedTitle !== item.title ||
      brand !== (item.brand || '') ||
      category !== item.category ||
      status !== item.status ||
      notes !== (item.notes || '') ||
      JSON.stringify(links) !== JSON.stringify(item.links)
    ) {
      await onUpdate(item.id, {
        title: trimmedTitle,
        brand: brand.trim() || null,
        category,
        status,
        notes: notes.trim() || null,
        links,
      });
    }
  };

  // Status toggle handler
  const handleStatusToggle = async (newStatus: StyleStatus) => {
    setStatus(newStatus);
    await onUpdate(item.id, { status: newStatus });
  };

  // Category toggle handler
  const handleCategoryToggle = async (newCategory: StyleCategory) => {
    setCategory(newCategory);
    await onUpdate(item.id, { category: newCategory });
  };

  // Add Link handler
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

  // Remove Link handler
  const handleRemoveLink = async (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    await onUpdate(item.id, { links: updatedLinks });
  };

  const isHaircut = category === 'haircut';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#e5e7eb] dark:border-[#334155] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0 bg-white dark:bg-[#1e293b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Style Detail
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Segmented Buttons */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleStatusToggle('idea')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'idea'
                    ? 'bg-slate-700 text-white border-slate-800 shadow-sm dark:bg-slate-600'
                    : 'bg-gray-50 dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Idea</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusToggle('shortlisted')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'shortlisted'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white dark:bg-amber-200" />
                <span>Shortlisted</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusToggle('bought')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'bought'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bought</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1.5">
              Title / Item Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleAutoSave}
              placeholder="e.g. Raw Denim Jacket, Seiko GMT..."
              className="w-full px-3 py-2 text-base font-bold bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Brand or Barber / Salon */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1.5">
              {isHaircut ? 'Barber / Salon Reference' : 'Brand / Label'}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onBlur={handleAutoSave}
              placeholder={isHaircut ? 'e.g. Downtown Barbershop, Fade Specialist...' : 'e.g. Uniqlo, Seiko, Levi’s, Moscot...'}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { cat: 'clothes', label: 'Clothes', icon: Shirt },
                  { cat: 'accessories', label: 'Accessories', icon: Glasses },
                  { cat: 'watches', label: 'Watches', icon: Watch },
                  { cat: 'haircut', label: 'Haircut', icon: Scissors },
                ] as const
              ).map(({ cat, label, icon: CatIcon }) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryToggle(cat)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#cbd5e1] border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <CatIcon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1.5">
              Style Notes &amp; Fit Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleAutoSave}
              placeholder={
                isHaircut
                  ? 'e.g. 2.5 inches length on top for texture. Low skin taper on sides. Use matte styling clay.'
                  : 'e.g. 100% heavyweight cotton, boxy drop shoulder, charcoal wash. True to size.'
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y"
            />
          </div>

          {/* Reference Links & Photos Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-violet-500" />
                <span>Reference Links &amp; Photos ({links.length})</span>
              </label>

              {!isAddingLink && (
                <button
                  type="button"
                  onClick={() => setIsAddingLink(true)}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              )}
            </div>

            {/* Visual Photo Gallery for image links */}
            {links.some((l) => isImageUrl(l.url)) && (
              <div className="grid grid-cols-2 gap-2 pb-1">
                {links
                  .filter((l) => isImageUrl(l.url))
                  .map((imgLink, i) => (
                    <div
                      key={i}
                      className="relative h-28 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 group"
                    >
                      <img
                        src={imgLink.url}
                        alt={imgLink.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <a
                        href={imgLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded-lg truncate flex items-center justify-between"
                      >
                        <span className="truncate">{imgLink.label}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-1" />
                      </a>
                    </div>
                  ))}
              </div>
            )}

            {/* List of text links */}
            {links.length > 0 && (
              <div className="space-y-1.5">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-xs"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline min-w-0 pr-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold truncate">{link.label}</span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                        ({link.url})
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded cursor-pointer"
                      title="Remove link"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add Link Form */}
            {isAddingLink && (
              <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-slate-800 border border-violet-200 dark:border-violet-900/60 space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Front Photo, Store)"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none"
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
                    className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-[#111827] dark:text-[#f1f5f9] focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingLink(false);
                      setNewLinkLabel('');
                      setNewLinkUrl('');
                    }}
                    className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!newLinkUrl.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Save Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
          <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
            Auto-saves on change
          </span>

          <div className="flex items-center gap-2">
            {isDeleting ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-rose-600 font-semibold">Delete item?</span>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-gray-200 dark:bg-slate-700 text-[#4b5563] dark:text-slate-200 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(item.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
