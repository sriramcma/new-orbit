import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Languages,
  HelpCircle,
  Star,
  Search,
  X,
  Plus,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LearningItem, LearningType, LearningStatus } from '../types/learning';
import { learningService } from '../services/learningService';
import { LearningCard } from '../components/LearningCard';
import { LearningSchemaModal } from '../components/learning/LearningSchemaModal';

const TABS: { type: LearningType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'skill', label: 'Skills', icon: BookOpen },
  { type: 'language', label: 'Languages', icon: Languages },
  { type: 'doubt', label: 'Doubts', icon: HelpCircle },
  { type: 'wishlist', label: 'Wishlist', icon: Star },
];

export const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LearningType>('skill');

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add Input
  const [quickAddText, setQuickAddText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Done section collapsed state per tab
  const [isDoneCollapsed, setIsDoneCollapsed] = useState<Record<string, boolean>>({
    skill: false,
    language: false,
    doubt: false,
    wishlist: false,
  });

  // Modal & Toast
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load items
  const loadItems = async () => {
    const { items: data } = await learningService.fetchItems(userId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
    const unsubscribe = learningService.subscribeToLearning(userId, () => {
      loadItems();
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<LearningType, { total: number; learning: number; todo: number; done: number }> = {
      skill: { total: 0, learning: 0, todo: 0, done: 0 },
      language: { total: 0, learning: 0, todo: 0, done: 0 },
      doubt: { total: 0, learning: 0, todo: 0, done: 0 },
      wishlist: { total: 0, learning: 0, todo: 0, done: 0 },
    };

    items.forEach((item) => {
      if (counts[item.type]) {
        counts[item.type].total++;
        if (item.status === 'learning') counts[item.type].learning++;
        else if (item.status === 'todo') counts[item.type].todo++;
        else if (item.status === 'done') counts[item.type].done++;
      }
    });

    return counts;
  }, [items]);

  // Filtered by current tab and search query
  const tabItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes) return false;
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  // Grouped by status
  const learningItems = useMemo(
    () => tabItems.filter((i) => i.status === 'learning'),
    [tabItems]
  );
  const todoItems = useMemo(
    () => tabItems.filter((i) => i.status === 'todo'),
    [tabItems]
  );
  const doneItems = useMemo(
    () => tabItems.filter((i) => i.status === 'done'),
    [tabItems]
  );

  // Quick Add Handlers
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickAddText.trim();
    if (!text || isAdding) return;

    setIsAdding(true);
    try {
      const res = await learningService.addItem(userId, {
        title: text,
        type: activeTab,
        status: 'todo',
        notes: null,
        links: [],
      });

      setItems((prev) => [res.item, ...prev]);
      setQuickAddText('');
      showToast(`Added to ${activeTab}s`);
    } finally {
      setIsAdding(false);
    }
  };

  // Update item
  const handleUpdate = async (id: string, updates: Partial<LearningItem>) => {
    const res = await learningService.updateItem(userId, id, updates);
    setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));
  };

  // Status change with specific toasts
  const handleStatusChange = async (id: string, newStatus: LearningStatus) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const res = await learningService.updateStatus(userId, id, newStatus);
    setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));

    if (newStatus === 'done') {
      if (target.type === 'doubt') {
        showToast('Doubt cleared! 🎉');
      } else {
        showToast('Marked as Mastered! 🌟');
      }
    } else if (newStatus === 'learning') {
      showToast('Moved to Learning Now ⚡');
    } else {
      showToast('Moved to To Do 📋');
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    const target = items.find((i) => i.id === id);
    await learningService.deleteItem(userId, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Deleted "${target?.title || 'item'}"`);
  };

  // Placeholder text for quick add input
  const getQuickAddPlaceholder = () => {
    switch (activeTab) {
      case 'skill':
        return 'Add a skill (e.g. Docker, System Design, GraphQL)...';
      case 'language':
        return 'Add a language or goal (e.g. Spanish, German B1)...';
      case 'doubt':
        return 'Ask a doubt or question to solve (e.g. Why useMemo?)...';
      case 'wishlist':
        return 'Add to wishlist (e.g. Piano, WebAssembly, Chess)...';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f9fafb] dark:bg-[#0f172a] transition-colors duration-200">
      {/* FLOATING TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-xl border border-gray-700 animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 sticky top-0 z-20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Learning &amp; Skills
                </h1>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-900/60">
                  {tabCounts[activeTab].total} {activeTab}s
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Skills backlog, languages, doubts &amp; curiosity vault
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
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title="Search learning items"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* SQL Schema Button */}
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View Database Schema"
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
              placeholder="Search by title, notes, or questions..."
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-slate-800/80 border border-[#e5e7eb] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
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
            const isActive = activeTab === tab.type;
            const count = tabCounts[tab.type];
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => {
                  setActiveTab(tab.type);
                  setSearchQuery('');
                }}
                className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-sm dark:bg-cyan-600'
                    : 'bg-gray-50 dark:bg-slate-800/80 text-[#4b5563] dark:text-[#cbd5e1] hover:bg-gray-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-90">
                  {count.learning > 0 && (
                    <span
                      className={`px-1 rounded-full text-[9px] font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                      title={`${count.learning} learning now`}
                    >
                      {count.learning}⚡
                    </span>
                  )}
                  <span>{count.total}</span>
                </div>
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
            className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-slate-800 border border-[#d1d5db] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-xs"
          />
          <button
            type="submit"
            disabled={!quickAddText.trim() || isAdding}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Add item"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* CONTENT LIST AREA */}
      <div className="p-4 space-y-5 max-w-[480px] mx-auto w-full">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#6b7280] dark:text-[#94a3b8]">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading {activeTab}s...</span>
          </div>
        ) : tabItems.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-dashed border-[#d1d5db] dark:border-[#334155]">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              {activeTab === 'skill' && <BookOpen className="w-6 h-6" />}
              {activeTab === 'language' && <Languages className="w-6 h-6" />}
              {activeTab === 'doubt' && <HelpCircle className="w-6 h-6" />}
              {activeTab === 'wishlist' && <Star className="w-6 h-6" />}
            </div>
            <h3 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
              {searchQuery ? 'No matching items found' : `No ${activeTab}s yet`}
            </h3>
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 max-w-[280px] mx-auto">
              {searchQuery
                ? 'Try searching with a different keyword or reset search.'
                : activeTab === 'doubt'
                ? 'Log programming questions, architecture puzzles, or concepts to clarify.'
                : activeTab === 'wishlist'
                ? 'Save future learning ambitions like musical instruments, languages, or deep topics.'
                : 'Add topics you want to learn using the quick add bar above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* SECTION 1: LEARNING NOW */}
            {learningItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    <Flame className="w-4 h-4 text-indigo-500" />
                    <span>Learning Now</span>
                    <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                      {learningItems.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {learningItems.map((item) => (
                    <LearningCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: TO DO */}
            {todoItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4b5563] dark:text-[#94a3b8]">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>To Do</span>
                    <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300 font-semibold">
                      {todoItems.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {todoItems.map((item) => (
                    <LearningCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: MASTERED / SOLVED (Collapsible at bottom) */}
            {doneItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]/60">
                <button
                  type="button"
                  onClick={() =>
                    setIsDoneCollapsed((prev) => ({
                      ...prev,
                      [activeTab]: !prev[activeTab],
                    }))
                  }
                  className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{activeTab === 'doubt' ? 'Solved' : 'Mastered'}</span>
                    <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                      {doneItems.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-normal lowercase">
                    <span>{isDoneCollapsed[activeTab] ? 'expand' : 'collapse'}</span>
                    {isDoneCollapsed[activeTab] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {!isDoneCollapsed[activeTab] && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    {doneItems.map((item) => (
                      <LearningCard
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SQL SCHEMA MODAL */}
      <LearningSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
