import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Search,
  X,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  Database,
  Pin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrainCategory, BrainItem } from '../types/brain';
import { brainService } from '../services/brainService';
import { CategoryGrid } from '../components/CategoryGrid';
import { BrainItemCard } from '../components/BrainItemCard';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { BrainSchemaModal } from '../components/brain/BrainSchemaModal';
import { getBrainIcon, getBrainColorMeta } from '../utils/brainUtils';

export const BrainPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // Navigation & Category state
  const [categories, setCategories] = useState<BrainCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BrainCategory | null>(null);
  const [items, setItems] = useState<BrainItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Quick Add input state
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);

  // Expanded items state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BrainCategory | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Load Categories & Items
  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const cats = await brainService.fetchCategories(userId);
      setCategories(cats);

      // Keep selected category in sync if open
      if (selectedCategory) {
        const found = cats.find((c) => c.id === selectedCategory.id);
        if (found) setSelectedCategory(found);
      }
    } catch (err) {
      console.warn('Failed to load brain categories:', err);
    } finally {
      setLoadingCats(false);
    }
  };

  const loadItems = async (catId?: string) => {
    setLoadingItems(true);
    try {
      const fetched = await brainService.fetchItems(userId, catId);
      setItems(fetched);
    } catch (err) {
      console.warn('Failed to load brain items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadCategories();
    const unsub = brainService.subscribeToBrain(userId, () => {
      loadCategories();
      if (selectedCategory) {
        loadItems(selectedCategory.id);
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (selectedCategory) {
      loadItems(selectedCategory.id);
      setExpandedItemId(null);
    } else {
      setItems([]);
      setExpandedItemId(null);
    }
  }, [selectedCategory]);

  // Quick Add Item
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim() || !selectedCategory) return;

    setQuickAddSubmitting(true);
    const titleToAdd = quickAddTitle.trim();
    setQuickAddTitle('');

    try {
      await brainService.addItem(userId, {
        category_id: selectedCategory.id,
        title: titleToAdd,
      });
      await loadItems(selectedCategory.id);
      await loadCategories();
      showToast('Note captured!');
    } catch (err) {
      showToast('Failed to save note');
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  // Item Updates
  const handleUpdateItem = async (itemId: string, updates: Partial<BrainItem>) => {
    try {
      await brainService.updateItem(userId, itemId, updates);
      await loadItems(selectedCategory ? selectedCategory.id : undefined);
      showToast('Saved');
    } catch {
      showToast('Failed to save changes');
    }
  };

  const handleTogglePin = async (itemId: string) => {
    try {
      const updated = await brainService.togglePin(userId, itemId);
      await loadItems(selectedCategory ? selectedCategory.id : undefined);
      showToast(updated.is_pinned ? 'Pinned to top 📌' : 'Unpinned');
    } catch {
      showToast('Failed to update pin');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await brainService.deleteItem(userId, itemId);
      await loadItems(selectedCategory ? selectedCategory.id : undefined);
      await loadCategories();
      showToast('Item deleted');
    } catch {
      showToast('Failed to delete item');
    }
  };

  // Category Save / Delete
  const handleSaveCategory = async (data: { name: string; icon: string; color: string }) => {
    if (editingCategory) {
      await brainService.updateCategory(userId, editingCategory.id, data);
      showToast('Category updated');
    } else {
      await brainService.addCategory(userId, data);
      showToast('Category created ✨');
    }
    await loadCategories();
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    const count = selectedCategory.item_count || 0;
    const confirmed = window.confirm(
      `This will delete "${selectedCategory.name}" and all ${count} notes inside. Are you sure?`
    );
    if (!confirmed) return;

    try {
      await brainService.deleteCategory(userId, selectedCategory.id);
      setSelectedCategory(null);
      await loadCategories();
      showToast('Category deleted');
    } catch {
      showToast('Failed to delete category');
    }
  };

  // Global search filtering across categories
  const [allSearchItems, setAllSearchItems] = useState<BrainItem[]>([]);
  useEffect(() => {
    if (searchQuery.trim()) {
      brainService.fetchAllItems(userId).then(setAllSearchItems);
    }
  }, [searchQuery, userId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSearchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.links?.some((l) => l.label.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)) ||
        item.checklist?.some((c) => c.text.toLowerCase().includes(q))
    );
  }, [allSearchItems, searchQuery]);

  const SelectedIcon = selectedCategory ? getBrainIcon(selectedCategory.icon) : Brain;
  const selectedColorMeta = selectedCategory ? getBrainColorMeta(selectedCategory.color) : null;

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-full px-4 pt-3 pb-24 overflow-x-hidden space-y-3.5">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-gray-900/90 text-white dark:bg-white/95 dark:text-gray-900 text-xs font-semibold shadow-lg backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
              Second Brain
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              Personal Wiki
            </span>
          </div>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
            Frictionless mobile capture · Vertical collections
          </p>
        </div>

        {/* Action icons: Schema & Search */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSchemaModalOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:border-purple-300 transition-colors cursor-pointer"
            title="Database schema"
          >
            <Database className="w-4 h-4 text-purple-500" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs transition-colors cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                : 'bg-white dark:bg-[#1e293b] text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] border-[#e5e7eb] dark:border-[#334155]'
            }`}
            title="Search notes"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH BAR (Expandable) */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all notes, tasks, checklists, URLs..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6b7280]" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#6b7280] hover:text-[#111827]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* SEARCH RESULTS VIEW (When query active) */}
      {searchQuery.trim() ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
              Search Results ({searchResults.length})
            </h3>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((item) => {
                const cat = categories.find((c) => c.id === item.category_id);
                return (
                  <div key={item.id} className="space-y-1">
                    {cat && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b7280] dark:text-[#94a3b8] px-1">
                        In {cat.name}
                      </span>
                    )}
                    <BrainItemCard
                      item={item}
                      isExpanded={expandedItemId === item.id}
                      onToggleExpand={() =>
                        setExpandedItemId(expandedItemId === item.id ? null : item.id)
                      }
                      onTogglePin={handleTogglePin}
                      onUpdateItem={handleUpdateItem}
                      onDeleteItem={handleDeleteItem}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center text-xs text-[#6b7280]">
              No notes match &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      ) : selectedCategory ? (
        /* CATEGORY DETAIL VIEW */
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Category Detail Header */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Back to categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedColorMeta?.iconBg || 'bg-purple-100'
                } ${selectedColorMeta?.text || 'text-purple-600'}`}
              >
                <SelectedIcon className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9] truncate">
                  {selectedCategory.name}
                </h2>
                <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            {/* Edit / Delete Category buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(selectedCategory);
                  setIsCategoryModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit category"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDeleteCategory}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sticky Quick Add Bar (Frictionless capture: Type title -> Enter) */}
          <form
            onSubmit={handleQuickAdd}
            className="sticky top-14 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-md backdrop-blur-md"
          >
            <input
              type="text"
              required
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Add note or task title (Enter to save)..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border-none bg-transparent text-[#111827] dark:text-[#f1f5f9] focus:outline-none placeholder:text-[#6b7280] dark:placeholder:text-[#94a3b8]"
            />
            <button
              type="submit"
              disabled={quickAddSubmitting || !quickAddTitle.trim()}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Items List */}
          {loadingItems ? (
            <div className="p-8 text-center text-xs text-[#6b7280] animate-pulse">
              Loading notes...
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <BrainItemCard
                  key={item.id}
                  item={item}
                  isExpanded={expandedItemId === item.id}
                  onToggleExpand={() =>
                    setExpandedItemId(expandedItemId === item.id ? null : item.id)
                  }
                  onTogglePin={handleTogglePin}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Collection is empty
              </h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                Type above to quickly capture your first note or task for &ldquo;{selectedCategory.name}&rdquo;.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* DEFAULT VIEW: CATEGORIES GRID */
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] uppercase tracking-wider">
              Collections ({categories.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>

          <CategoryGrid
            categories={categories}
            loading={loadingCats}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onNewCategory={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
          />
        </div>
      )}

      {/* MODALS */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      <BrainSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
