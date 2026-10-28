import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  Plus,
  Database,
  Calendar,
  Sparkles,
  CheckCircle2,
  ListOrdered,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingItem,
  EssentialItem,
  ShoppingCategory,
  ShoppingLink,
} from '../types/shopping';
import { shoppingService } from '../services/shoppingService';
import { CategoryFilter } from '../components/shopping/CategoryFilter';
import { WishlistCard } from '../components/shopping/WishlistCard';
import { EssentialsList } from '../components/shopping/EssentialsList';
import { BoughtHistory } from '../components/shopping/BoughtHistory';
import { ItemFormModal } from '../components/shopping/ItemFormModal';
import { PlanToBuyModal } from '../components/shopping/PlanToBuyModal';
import { MarkBoughtModal } from '../components/shopping/MarkBoughtModal';
import { ShoppingSchemaModal } from '../components/shopping/ShoppingSchemaModal';
import { SHOPPING_CATEGORIES, getCategoryMeta } from '../utils/shoppingUtils';
import { formatIndianCurrency } from '../utils/budgetUtils';

export const ShoppingPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [activeTab, setActiveTab] = useState<'wishlist' | 'essentials' | 'bought'>('wishlist');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [essentials, setEssentials] = useState<EssentialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterPlannedOnly, setFilterPlannedOnly] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planningItem, setPlanningItem] = useState<ShoppingItem | null>(null);
  const [isMarkBoughtModalOpen, setIsMarkBoughtModalOpen] = useState(false);
  const [markingItem, setMarkingItem] = useState<ShoppingItem | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Collapsed category states when viewing 'All'
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Fetch data
  const loadData = async () => {
    try {
      const [items, ess] = await Promise.all([
        shoppingService.fetchShoppingItems(userId),
        shoppingService.fetchEssentials(userId),
      ]);
      setShoppingItems(items);
      setEssentials(ess);
    } catch (err) {
      console.warn('Error loading shopping data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = shoppingService.subscribeToShopping(userId, () => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Derived Counts & Summaries
  const activeWishlistItems = useMemo(
    () => shoppingItems.filter((i) => i.status === 'wishlist' || i.status === 'planned'),
    [shoppingItems]
  );
  const plannedCount = useMemo(
    () => shoppingItems.filter((i) => i.status === 'planned').length,
    [shoppingItems]
  );
  const essentialsNeedCount = useMemo(
    () => essentials.filter((e) => e.status === 'need').length,
    [essentials]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeWishlistItems.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [activeWishlistItems]);

  // Filtered Wishlist Items
  const filteredWishlistItems = useMemo(() => {
    return activeWishlistItems.filter((item) => {
      if (filterPlannedOnly && item.status !== 'planned') return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCat && !matchesNotes) return false;
      }
      return true;
    });
  }, [activeWishlistItems, filterPlannedOnly, selectedCategory, searchQuery]);

  // Grouped items by category for Wishlist view
  const groupedWishlistByCategory = useMemo(() => {
    if (selectedCategory !== 'All') {
      return [{ category: selectedCategory as ShoppingCategory, items: filteredWishlistItems }];
    }

    const groups: { category: ShoppingCategory; items: ShoppingItem[] }[] = [];
    SHOPPING_CATEGORIES.forEach((cat) => {
      const catItems = filteredWishlistItems.filter((i) => i.category === cat.id);
      if (catItems.length > 0) {
        groups.push({ category: cat.id, items: catItems });
      }
    });

    return groups;
  }, [filteredWishlistItems, selectedCategory]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Handlers for Wishlist
  const handleSaveItem = async (data: {
    name: string;
    brand?: string | null;
    category: ShoppingCategory;
    target_price?: number | null;
    priority: any;
    notes?: string | null;
    links: ShoppingLink[];
    checklist: { text: string; done: boolean }[];
  }) => {
    if (editingItem) {
      await shoppingService.updateShoppingItem(userId, editingItem.id, data);
    } else {
      await shoppingService.addShoppingItem(userId, data);
    }
    await loadData();
  };

  const handleDeleteItem = async (id: string) => {
    await shoppingService.deleteShoppingItem(userId, id);
    await loadData();
  };

  const handlePlanConfirm = async (targetMonth: string) => {
    if (!planningItem) return;
    await shoppingService.planToBuy(userId, planningItem.id, targetMonth);
    await loadData();
  };

  const handleMarkBoughtConfirm = async (actualPrice: number | null) => {
    if (!markingItem) return;
    await shoppingService.markBought(userId, markingItem.id, actualPrice);
    await loadData();
  };

  const handleBuyAgainShopping = async (item: ShoppingItem) => {
    await shoppingService.restoreToWishlist(userId, item.id);
    await loadData();
    setActiveTab('wishlist');
  };

  const handleToggleChecklist = async (itemId: string, index: number) => {
    await shoppingService.toggleChecklistItem(userId, itemId, index);
    await loadData();
  };

  const handleAddChecklist = async (itemId: string, text: string) => {
    await shoppingService.addChecklistItem(userId, itemId, text);
    await loadData();
  };

  const handleRemoveChecklist = async (itemId: string, index: number) => {
    await shoppingService.removeChecklistItem(userId, itemId, index);
    await loadData();
  };

  const handleAddLink = async (itemId: string, link: ShoppingLink) => {
    await shoppingService.addLink(userId, itemId, link);
    await loadData();
  };

  const handleRemoveLink = async (itemId: string, index: number) => {
    await shoppingService.removeLink(userId, itemId, index);
    await loadData();
  };

  // Handlers for Essentials
  const handleAddEssential = async (name: string, recurring: boolean, notes?: string) => {
    await shoppingService.addEssential(userId, { name, recurring, notes });
    await loadData();
  };

  const handleToggleEssentialStatus = async (id: string, currentStatus: 'need' | 'bought') => {
    if (currentStatus === 'need') {
      await shoppingService.markEssentialBought(userId, id);
    } else {
      await shoppingService.resetEssentialToNeed(userId, id);
    }
    await loadData();
  };

  const handleToggleEssentialRecurring = async (id: string, currentRecurring: boolean) => {
    await shoppingService.updateEssential(userId, id, { recurring: !currentRecurring });
    await loadData();
  };

  const handleDeleteEssential = async (id: string) => {
    await shoppingService.deleteEssential(userId, id);
    await loadData();
  };

  const handleResetAllRecurring = async () => {
    await shoppingService.resetAllRecurringEssentials(userId);
    await loadData();
  };

  const handleBuyAgainEssential = async (item: EssentialItem) => {
    await shoppingService.resetEssentialToNeed(userId, item.id);
    await loadData();
    setActiveTab('essentials');
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-full px-4 pt-3 pb-24 overflow-x-hidden space-y-3.5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
              Shopping
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/80 dark:text-pink-400 border border-pink-200 dark:border-pink-800/60">
              Wishlist &amp; Needs
            </span>
          </div>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
            Impulse-free wishlist, budget planning &amp; essential supplies
          </p>
        </div>

        {/* Action icons: Schema & Search */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSchemaModalOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:border-pink-300 transition-colors cursor-pointer"
            title="Database schema"
          >
            <Database className="w-4 h-4 text-pink-500" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs transition-colors cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-800'
                : 'bg-white dark:bg-[#1e293b] text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] border-[#e5e7eb] dark:border-[#334155]'
            }`}
            title="Search items"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP SUMMARY STRIP */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs flex items-center justify-between text-xs transition-colors duration-200">
        {/* Wishlist count */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('wishlist');
            setFilterPlannedOnly(false);
            setSelectedCategory('All');
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'wishlist' && !filterPlannedOnly
              ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className="font-bold text-sm block text-[#111827] dark:text-[#f1f5f9]">
            {activeWishlistItems.length}
          </span>
          <span className="text-[10px] uppercase font-semibold">Wishlist</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

        {/* To Buy / Planned count */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('wishlist');
            setFilterPlannedOnly(true);
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'wishlist' && filterPlannedOnly
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-[#6366f1] dark:text-[#818cf8] font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className="font-bold text-sm block text-[#6366f1] dark:text-[#818cf8]">
            {plannedCount}
          </span>
          <span className="text-[10px] uppercase font-semibold">To Buy</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

        {/* Essentials Need count */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('essentials');
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'essentials'
              ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className="font-bold text-sm block text-pink-600 dark:text-pink-400">
            {essentialsNeedCount}
          </span>
          <span className="text-[10px] uppercase font-semibold">Essentials</span>
        </button>
      </div>

      {/* SEARCH BAR (Expandable) */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wishlist items, brands, notes..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-pink-300 dark:border-pink-800 bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-xs"
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

      {/* 3 MAIN TABS */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-200/80 dark:bg-slate-900 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab('wishlist');
            setFilterPlannedOnly(false);
          }}
          className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-white dark:bg-[#1e293b] text-pink-600 dark:text-pink-400 shadow-xs font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Wishlist ({activeWishlistItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('essentials')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'essentials'
              ? 'bg-white dark:bg-[#1e293b] text-pink-600 dark:text-pink-400 shadow-xs font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Essentials ({essentialsNeedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bought')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'bought'
              ? 'bg-white dark:bg-[#1e293b] text-pink-600 dark:text-pink-400 shadow-xs font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Bought History
        </button>
      </div>

      {/* TAB 1: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-3.5">
          {/* Horizontal Category Chips */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setFilterPlannedOnly(false);
            }}
            categoryCounts={categoryCounts}
            totalCount={activeWishlistItems.length}
          />

          {/* Planned Only Filter Pill Toggle */}
          {filterPlannedOnly && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-[#6366f1] dark:text-[#818cf8]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5" /> Filtering items planned for budget
              </span>
              <button
                type="button"
                onClick={() => setFilterPlannedOnly(false)}
                className="text-xs font-bold underline cursor-pointer"
              >
                Show All
              </button>
            </div>
          )}

          {/* Items grouped by category */}
          {loading ? (
            <div className="p-8 text-center text-xs text-[#6b7280]">
              Loading wishlist items...
            </div>
          ) : groupedWishlistByCategory.length > 0 ? (
            <div className="space-y-4">
              {groupedWishlistByCategory.map((group) => {
                const catMeta = getCategoryMeta(group.category);
                const isCollapsed = collapsedCategories[group.category];
                const CatIcon = catMeta.icon;

                return (
                  <div key={group.category} className="space-y-2">
                    {/* Collapsible Category Header when in 'All' view */}
                    {selectedCategory === 'All' && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(group.category)}
                        className="w-full flex items-center justify-between px-1 text-xs font-bold text-[#111827] dark:text-[#f1f5f9] select-none cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center ${catMeta.badgeBg} ${catMeta.badgeText}`}
                          >
                            <CatIcon className="w-3 h-3" />
                          </div>
                          <span>{catMeta.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-slate-800 text-[#6b7280] dark:text-[#94a3b8] font-normal">
                            {group.items.length}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-[#6b7280]" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-[#6b7280]" />
                        )}
                      </button>
                    )}

                    {!isCollapsed && (
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <WishlistCard
                            key={item.id}
                            item={item}
                            onPlanToBuy={(it) => {
                              setPlanningItem(it);
                              setIsPlanModalOpen(true);
                            }}
                            onMarkBought={(it) => {
                              setMarkingItem(it);
                              setIsMarkBoughtModalOpen(true);
                            }}
                            onEdit={(it) => {
                              setEditingItem(it);
                              setIsItemModalOpen(true);
                            }}
                            onDelete={handleDeleteItem}
                            onToggleChecklist={handleToggleChecklist}
                            onAddChecklist={handleAddChecklist}
                            onRemoveChecklist={handleRemoveChecklist}
                            onAddLink={handleAddLink}
                            onRemoveLink={handleRemoveLink}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
                {searchQuery
                  ? 'No items match your search'
                  : 'Wishlist is empty'}
              </h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                Save items you want to buy later, attach price targets and comparison links, and prevent impulse purchases.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-pink-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Wishlist Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ESSENTIALS */}
      {activeTab === 'essentials' && (
        <EssentialsList
          items={essentials}
          onAdd={handleAddEssential}
          onToggleStatus={handleToggleEssentialStatus}
          onToggleRecurring={handleToggleEssentialRecurring}
          onDelete={handleDeleteEssential}
          onResetAllRecurring={handleResetAllRecurring}
        />
      )}

      {/* TAB 3: BOUGHT */}
      {activeTab === 'bought' && (
        <BoughtHistory
          shoppingItems={shoppingItems}
          essentialItems={essentials}
          onBuyAgainShopping={handleBuyAgainShopping}
          onBuyAgainEssential={handleBuyAgainEssential}
          onDeleteShopping={handleDeleteItem}
          onDeleteEssential={handleDeleteEssential}
        />
      )}

      {/* FLOATING ACTION BUTTON FOR WISHLIST */}
      {activeTab === 'wishlist' && (
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          className="fixed bottom-20 right-4 sm:right-auto sm:left-[calc(50%+160px)] z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white shadow-xl shadow-pink-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Add Wishlist Item"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* MODALS */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSaveItem}
      />

      <PlanToBuyModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setPlanningItem(null);
        }}
        item={planningItem}
        userId={userId}
        onConfirm={handlePlanConfirm}
      />

      <MarkBoughtModal
        isOpen={isMarkBoughtModalOpen}
        onClose={() => {
          setIsMarkBoughtModalOpen(false);
          setMarkingItem(null);
        }}
        item={markingItem}
        onConfirm={handleMarkBoughtConfirm}
      />

      <ShoppingSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
