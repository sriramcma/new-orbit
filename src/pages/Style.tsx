import React, { useState, useEffect, useMemo } from 'react';
import {
  Shirt,
  Glasses,
  Watch,
  Scissors,
  Search,
  X,
  Plus,
  Database,
  Sparkles,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StyleItem, StyleCategory, StyleStatus } from '../types/style';
import { styleService } from '../services/styleService';
import { StyleCard } from '../components/StyleCard';
import { StyleDetailView } from '../components/StyleDetailView';
import { StyleSchemaModal } from '../components/style/StyleSchemaModal';

const TABS: { category: StyleCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { category: 'clothes', label: 'Clothes', icon: Shirt },
  { category: 'accessories', label: 'Accessories', icon: Glasses },
  { category: 'watches', label: 'Watches', icon: Watch },
  { category: 'haircut', label: 'Haircuts', icon: Scissors },
];

export const StylePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [items, setItems] = useState<StyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StyleCategory>('clothes');

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add input
  const [quickAddText, setQuickAddText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Selected item for Detail View Modal
  const [selectedItem, setSelectedItem] = useState<StyleItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | StyleStatus>('all');

  // Schema Modal
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load items
  const loadItems = async () => {
    const { items: data } = await styleService.fetchStyleItems(userId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
    const unsubscribe = styleService.subscribeToStyle(userId, () => {
      loadItems();
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<StyleCategory, { total: number; bought: number; shortlisted: number; idea: number }> = {
      clothes: { total: 0, bought: 0, shortlisted: 0, idea: 0 },
      accessories: { total: 0, bought: 0, shortlisted: 0, idea: 0 },
      watches: { total: 0, bought: 0, shortlisted: 0, idea: 0 },
      haircut: { total: 0, bought: 0, shortlisted: 0, idea: 0 },
    };

    items.forEach((item) => {
      if (counts[item.category]) {
        counts[item.category].total++;
        if (item.status === 'bought') counts[item.category].bought++;
        else if (item.status === 'shortlisted') counts[item.category].shortlisted++;
        else if (item.status === 'idea') counts[item.category].idea++;
      }
    });

    return counts;
  }, [items]);

  // Filtered by active tab, status, and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.category !== activeTab) return false;

      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchNotes) return false;
      }

      return true;
    });
  }, [items, activeTab, statusFilter, searchQuery]);

  // Quick Add handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickAddText.trim();
    if (!text || isAdding) return;

    setIsAdding(true);
    try {
      const res = await styleService.addStyleItem(userId, {
        title: text,
        category: activeTab,
        brand: null,
        status: 'idea',
        notes: null,
        links: [],
      });

      setItems((prev) => [res.item, ...prev]);
      setQuickAddText('');
      showToast(`Added to ${activeTab} lookbook`);
    } finally {
      setIsAdding(false);
    }
  };

  // Update Item handler
  const handleUpdate = async (id: string, updates: Partial<StyleItem>) => {
    const res = await styleService.updateStyleItem(userId, id, updates);
    setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));
    if (selectedItem?.id === id) {
      setSelectedItem(res.item);
    }
    showToast(`Updated "${res.item.title}"`);
  };

  // Delete Item handler
  const handleDelete = async (id: string) => {
    const target = items.find((i) => i.id === id);
    await styleService.deleteStyleItem(userId, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
      setIsDetailOpen(false);
    }
    showToast(`Deleted "${target?.title || 'item'}"`);
  };

  const getQuickAddPlaceholder = () => {
    switch (activeTab) {
      case 'clothes':
        return 'Add clothes (e.g. Denim Jacket, Linen Shirt)...';
      case 'accessories':
        return 'Add accessory (e.g. Sunglasses, Leather Belt)...';
      case 'watches':
        return 'Add watch (e.g. Seiko GMT, PRX Powermatic)...';
      case 'haircut':
        return 'Add haircut (e.g. French Crop, Low Skin Taper)...';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f9fafb] dark:bg-[#0f172a] transition-colors duration-200">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-xl border border-gray-700 animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STICKY HEADER */}
      <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 sticky top-0 z-20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Style &amp; Wardrobe
                </h1>
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-900/60">
                  {tabCounts[activeTab].total} {activeTab}
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Visual lookbook for clothes, accessories, watches &amp; cuts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title="Search style items"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* SQL Schema Modal Button */}
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View & Copy Database Schema"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="mt-2.5 relative animate-in fade-in slide-in-from-top-2 duration-150">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, brand, or notes..."
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-slate-800/80 border border-[#e5e7eb] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 4 HORIZONTAL TABS */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-1 border-t border-[#f3f4f6] dark:border-[#334155]/60">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.category;
            const count = tabCounts[tab.category];
            return (
              <button
                key={tab.category}
                type="button"
                onClick={() => {
                  setActiveTab(tab.category);
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800/80 text-[#4b5563] dark:text-[#cbd5e1] hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </div>
                <span className="text-[10px] opacity-90">{count.total}</span>
              </button>
            );
          })}
        </div>

        {/* STICKY QUICK ADD BAR (below tabs) */}
        <form onSubmit={handleQuickAdd} className="mt-3 relative">
          <input
            type="text"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder={getQuickAddPlaceholder()}
            className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-violet-500/40 shadow-xs"
          />
          <button
            type="submit"
            disabled={!quickAddText.trim() || isAdding}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Add item"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* STATUS FILTER CHIPS */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'bought', label: '🟢 Bought' },
              { key: 'shortlisted', label: '🟡 Shortlisted' },
              { key: 'idea', label: '⚪ Ideas' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === key
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                  : 'bg-white dark:bg-slate-800 text-[#4b5563] dark:text-[#94a3b8] border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-COLUMN MASONRY / PINTEREST-LIKE GALLERY */}
      <div className="p-4 max-w-[480px] mx-auto w-full">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#6b7280] dark:text-[#94a3b8]">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading {activeTab} lookbook...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 px-4 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-dashed border-[#d1d5db] dark:border-[#334155]">
            <div className="w-12 h-12 mx-auto rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-500 flex items-center justify-center mb-3">
              {activeTab === 'clothes' && <Shirt className="w-6 h-6" />}
              {activeTab === 'accessories' && <Glasses className="w-6 h-6" />}
              {activeTab === 'watches' && <Watch className="w-6 h-6" />}
              {activeTab === 'haircut' && <Scissors className="w-6 h-6" />}
            </div>
            <h3 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
              {searchQuery || statusFilter !== 'all'
                ? 'No matching style items'
                : 'Start your style catalog'}
            </h3>
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 max-w-[260px] mx-auto leading-relaxed">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing the search or switching the status filter.'
                : activeTab === 'haircut'
                ? 'Save your haircut inspiration photos and fade specifications for your barber.'
                : 'Add outfit ideas, favorite brands, reference links, and pieces you want to buy.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 items-start animate-in fade-in duration-200">
            {filteredItems.map((item) => (
              <StyleCard
                key={item.id}
                item={item}
                onClick={(clicked) => {
                  setSelectedItem(clicked);
                  setIsDetailOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* FULL SCREEN / MODAL DETAIL VIEW */}
      <StyleDetailView
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedItem(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {/* SQL SCHEMA MODAL */}
      <StyleSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
