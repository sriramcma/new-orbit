import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  ShoppingItem,
  EssentialItem,
  ShoppingLink,
  ShoppingPriority,
  ShoppingCategory,
  ShoppingSummary,
} from '../types/shopping';
import { budgetService } from './budgetService';
import { getCategoryMeta } from '../utils/shoppingUtils';

const LS_SHOPPING_ITEMS = 'orbit_shopping_items_cache_';
const LS_ESSENTIALS = 'orbit_essentials_cache_';

export const SHOPPING_SQL_SCHEMA = `-- Tables for the ORBIT Shopping & Wishlist Hub module

-- 1. Shopping Items (Wishlist, Planned, Bought)
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  target_price NUMERIC,
  actual_price NUMERIC,
  priority TEXT CHECK (priority IN ('high', 'med', 'low')) DEFAULT 'med',
  status TEXT CHECK (status IN ('wishlist', 'planned', 'bought')) DEFAULT 'wishlist',
  links JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  planned_month TEXT,
  bought_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own shopping items"
  ON public.shopping_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_user ON public.shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_status ON public.shopping_items(status);

-- 2. Daily & Grocery Essentials Checklist
CREATE TABLE IF NOT EXISTS public.essentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('need', 'bought')) DEFAULT 'need',
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.essentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own essentials"
  ON public.essentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_essentials_user ON public.essentials(user_id);
`;

const INITIAL_SHOPPING_ITEMS: Omit<ShoppingItem, 'user_id'>[] = [
  {
    id: 'shop_seed_1',
    name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    brand: 'Sony',
    category: 'Gadgets',
    target_price: 24990,
    actual_price: null,
    priority: 'high',
    status: 'wishlist',
    links: [
      { url: 'https://amazon.in/dp/B09XS7JWHH', label: 'Amazon India' },
    ],
    checklist: [
      { text: 'Wait for Great Indian Festival sale discount', done: true },
      { text: 'Compare Midnight Blue vs Black finish', done: false },
      { text: 'Check card discount offers (HDFC / ICICI)', done: false },
    ],
    notes: 'Prioritize for work focus and travel.',
    planned_month: null,
    bought_date: null,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'shop_seed_2',
    name: 'Minimalist Automatic Watch (Seiko 5 Sport)',
    brand: 'Seiko',
    category: 'Watches',
    target_price: 21500,
    actual_price: null,
    priority: 'med',
    status: 'wishlist',
    links: [
      { url: 'https://ethoswatches.com', label: 'Ethos Watches' },
    ],
    checklist: [
      { text: 'Try 38mm dial in store', done: false },
      { text: 'Check metal bracelet vs leather strap', done: false },
    ],
    notes: 'Gift for upcoming milestone celebration.',
    planned_month: null,
    bought_date: null,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'shop_seed_3',
    name: 'Ergonomic Desk Chair with Lumbar Support',
    brand: 'Green Soul',
    category: 'Home',
    target_price: 13999,
    actual_price: null,
    priority: 'high',
    status: 'planned',
    links: [
      { url: 'https://greensoul.online', label: 'Official Store' },
    ],
    checklist: [
      { text: 'Measure desk clearance height', done: true },
      { text: 'Check 3-year warranty terms', done: true },
    ],
    notes: 'Planned for November setup refresh.',
    planned_month: '2026-11',
    bought_date: null,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const INITIAL_ESSENTIALS: Omit<EssentialItem, 'user_id'>[] = [
  {
    id: 'ess_seed_1',
    name: 'Organic Almond Milk (1L)',
    notes: 'Unsweetened barista edition',
    status: 'need',
    recurring: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ess_seed_2',
    name: 'Cold Pressed Coconut Oil',
    notes: 'For cooking & hair care',
    status: 'need',
    recurring: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ess_seed_3',
    name: 'Microfiber Cleaning Cloths (Pack of 4)',
    notes: 'For screen and glasses',
    status: 'bought',
    recurring: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ess_seed_4',
    name: 'Dark Roast Coffee Beans (500g)',
    notes: 'Medium coarse grind',
    status: 'need',
    recurring: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class ShoppingService {
  // ================= SHOPPING ITEMS =================

  async fetchShoppingItems(userId: string): Promise<ShoppingItem[]> {
    const cacheKey = `${LS_SHOPPING_ITEMS}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    let items: ShoppingItem[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          items = data.map((d) => ({
            ...d,
            target_price: d.target_price !== null ? Number(d.target_price) : null,
            actual_price: d.actual_price !== null ? Number(d.actual_price) : null,
            links: Array.isArray(d.links) ? d.links : [],
            checklist: Array.isArray(d.checklist) ? d.checklist : [],
          })) as ShoppingItem[];
          localStorage.setItem(cacheKey, JSON.stringify(items));
        }
      } catch (err) {
        console.warn('Supabase fetch shopping items failed, using cache:', err);
      }
    }

    if (items.length === 0 && cachedStr) {
      try {
        items = JSON.parse(cachedStr);
      } catch {}
    }

    // First time fallback seeds if empty
    if (items.length === 0 && !cachedStr) {
      items = INITIAL_SHOPPING_ITEMS.map((item) => ({
        ...item,
        user_id: userId,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(items));
    }

    return items;
  }

  async addShoppingItem(
    userId: string,
    item: {
      name: string;
      brand?: string | null;
      category: ShoppingCategory;
      target_price?: number | null;
      priority: ShoppingPriority;
      notes?: string | null;
      links?: ShoppingLink[];
      checklist?: { text: string; done: boolean }[];
    }
  ): Promise<ShoppingItem> {
    const newItem: ShoppingItem = {
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: item.name.trim(),
      brand: item.brand?.trim() || null,
      category: item.category,
      target_price: item.target_price || null,
      actual_price: null,
      priority: item.priority || 'med',
      status: 'wishlist',
      links: item.links || [],
      checklist: item.checklist || [],
      notes: item.notes?.trim() || null,
      planned_month: null,
      bought_date: null,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_SHOPPING_ITEMS}${userId}`;
    const all = await this.fetchShoppingItems(userId);
    const updated = [newItem, ...all];
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shopping_items')
          .insert({
            user_id: userId,
            name: newItem.name,
            brand: newItem.brand,
            category: newItem.category,
            target_price: newItem.target_price,
            actual_price: null,
            priority: newItem.priority,
            status: newItem.status,
            links: newItem.links,
            checklist: newItem.checklist,
            notes: newItem.notes,
            planned_month: null,
            bought_date: null,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            target_price: data.target_price !== null ? Number(data.target_price) : null,
            actual_price: data.actual_price !== null ? Number(data.actual_price) : null,
            links: Array.isArray(data.links) ? data.links : [],
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
          } as ShoppingItem;
        }
      } catch (err) {
        console.warn('Supabase add shopping item failed:', err);
      }
    }

    return newItem;
  }

  async updateShoppingItem(
    userId: string,
    id: string,
    updates: Partial<ShoppingItem>
  ): Promise<ShoppingItem> {
    const cacheKey = `${LS_SHOPPING_ITEMS}${userId}`;
    const all = await this.fetchShoppingItems(userId);
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Shopping item not found');

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(cacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shopping_items')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            target_price: data.target_price !== null ? Number(data.target_price) : null,
            actual_price: data.actual_price !== null ? Number(data.actual_price) : null,
            links: Array.isArray(data.links) ? data.links : [],
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
          } as ShoppingItem;
        }
      } catch (err) {
        console.warn('Supabase update shopping item failed:', err);
      }
    }

    return updated;
  }

  async deleteShoppingItem(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_SHOPPING_ITEMS}${userId}`;
    const all = await this.fetchShoppingItems(userId);
    const filtered = all.filter((i) => i.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('shopping_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete shopping item failed:', err);
      }
    }
  }

  async markBought(
    userId: string,
    id: string,
    actualPrice?: number | null
  ): Promise<ShoppingItem> {
    const now = new Date().toISOString();
    return this.updateShoppingItem(userId, id, {
      status: 'bought',
      actual_price: actualPrice !== undefined ? actualPrice : null,
      bought_date: now,
    });
  }

  async restoreToWishlist(userId: string, id: string): Promise<ShoppingItem> {
    return this.updateShoppingItem(userId, id, {
      status: 'wishlist',
      actual_price: null,
      bought_date: null,
    });
  }

  // --- Link Helpers ---
  async addLink(
    userId: string,
    itemId: string,
    link: ShoppingLink
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const updatedLinks = [...(item.links || []), link];
    return this.updateShoppingItem(userId, itemId, { links: updatedLinks });
  }

  async removeLink(
    userId: string,
    itemId: string,
    index: number
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const updatedLinks = (item.links || []).filter((_, i) => i !== index);
    return this.updateShoppingItem(userId, itemId, { links: updatedLinks });
  }

  // --- Checklist Helpers ---
  async toggleChecklistItem(
    userId: string,
    itemId: string,
    index: number
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const currentChecklist = [...(item.checklist || [])];
    if (currentChecklist[index]) {
      currentChecklist[index] = {
        ...currentChecklist[index],
        done: !currentChecklist[index].done,
      };
    }
    return this.updateShoppingItem(userId, itemId, { checklist: currentChecklist });
  }

  async addChecklistItem(
    userId: string,
    itemId: string,
    text: string
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const currentChecklist = [...(item.checklist || []), { text: text.trim(), done: false }];
    return this.updateShoppingItem(userId, itemId, { checklist: currentChecklist });
  }

  async removeChecklistItem(
    userId: string,
    itemId: string,
    index: number
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const currentChecklist = (item.checklist || []).filter((_, i) => i !== index);
    return this.updateShoppingItem(userId, itemId, { checklist: currentChecklist });
  }

  // --- Plan to Buy Integration ---
  async planToBuy(
    userId: string,
    itemId: string,
    targetMonth: string
  ): Promise<ShoppingItem> {
    const all = await this.fetchShoppingItems(userId);
    const item = all.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    // 1. Update shopping item
    const updated = await this.updateShoppingItem(userId, itemId, {
      status: 'planned',
      planned_month: targetMonth,
    });

    // 2. Insert into budget planned_purchases
    try {
      const categoryMeta = getCategoryMeta(item.category);
      await budgetService.addPlanned(userId, {
        name: item.name,
        amount: item.target_price || 0,
        category: categoryMeta.budgetCategoryName || 'Other',
        target_month: targetMonth,
        status: 'planned',
        notes: `From Shopping Hub (${item.brand ? `${item.brand} • ` : ''}${item.category})`,
      });
    } catch (err) {
      console.warn('Failed to insert into budget planned_purchases:', err);
    }

    return updated;
  }

  // ================= ESSENTIALS =================

  async fetchEssentials(userId: string): Promise<EssentialItem[]> {
    const cacheKey = `${LS_ESSENTIALS}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    let items: EssentialItem[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('essentials')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          items = data as EssentialItem[];
          localStorage.setItem(cacheKey, JSON.stringify(items));
        }
      } catch (err) {
        console.warn('Supabase fetch essentials failed, using cache:', err);
      }
    }

    if (items.length === 0 && cachedStr) {
      try {
        items = JSON.parse(cachedStr);
      } catch {}
    }

    if (items.length === 0 && !cachedStr) {
      items = INITIAL_ESSENTIALS.map((item) => ({
        ...item,
        user_id: userId,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(items));
    }

    return items;
  }

  async addEssential(
    userId: string,
    item: {
      name: string;
      notes?: string | null;
      recurring?: boolean;
    }
  ): Promise<EssentialItem> {
    const newItem: EssentialItem = {
      id: `ess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: item.name.trim(),
      notes: item.notes?.trim() || null,
      status: 'need',
      recurring: !!item.recurring,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_ESSENTIALS}${userId}`;
    const all = await this.fetchEssentials(userId);
    const updated = [newItem, ...all];
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('essentials')
          .insert({
            user_id: userId,
            name: newItem.name,
            notes: newItem.notes,
            status: newItem.status,
            recurring: newItem.recurring,
          })
          .select()
          .single();

        if (!error && data) {
          return data as EssentialItem;
        }
      } catch (err) {
        console.warn('Supabase add essential failed:', err);
      }
    }

    return newItem;
  }

  async updateEssential(
    userId: string,
    id: string,
    updates: Partial<EssentialItem>
  ): Promise<EssentialItem> {
    const cacheKey = `${LS_ESSENTIALS}${userId}`;
    const all = await this.fetchEssentials(userId);
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Essential item not found');

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(cacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('essentials')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as EssentialItem;
        }
      } catch (err) {
        console.warn('Supabase update essential failed:', err);
      }
    }

    return updated;
  }

  async deleteEssential(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_ESSENTIALS}${userId}`;
    const all = await this.fetchEssentials(userId);
    const filtered = all.filter((i) => i.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('essentials')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete essential failed:', err);
      }
    }
  }

  async markEssentialBought(userId: string, id: string): Promise<EssentialItem> {
    return this.updateEssential(userId, id, { status: 'bought' });
  }

  async resetEssentialToNeed(userId: string, id: string): Promise<EssentialItem> {
    return this.updateEssential(userId, id, { status: 'need' });
  }

  async resetAllRecurringEssentials(userId: string): Promise<void> {
    const all = await this.fetchEssentials(userId);
    const updated = all.map((item) =>
      item.recurring && item.status === 'bought'
        ? { ...item, status: 'need' as const }
        : item
    );

    const cacheKey = `${LS_ESSENTIALS}${userId}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('essentials')
          .update({ status: 'need' })
          .eq('user_id', userId)
          .eq('recurring', true)
          .eq('status', 'bought');
      } catch (err) {
        console.warn('Supabase reset recurring essentials failed:', err);
      }
    }
  }

  // ================= SUMMARY & REALTIME =================

  async getShoppingSummary(userId: string): Promise<ShoppingSummary> {
    const [items, essentials] = await Promise.all([
      this.fetchShoppingItems(userId),
      this.fetchEssentials(userId),
    ]);

    const wishlistItems = items.filter((i) => i.status === 'wishlist');
    const plannedItems = items.filter((i) => i.status === 'planned');
    const boughtItems = items.filter((i) => i.status === 'bought');
    const essentialsNeed = essentials.filter((e) => e.status === 'need');

    const totalWishlistValue = items
      .filter((i) => i.status !== 'bought')
      .reduce((sum, i) => sum + (Number(i.target_price) || 0), 0);

    return {
      wishlistCount: wishlistItems.length,
      plannedCount: plannedItems.length,
      essentialsNeedCount: essentialsNeed.length,
      boughtCount: boughtItems.length,
      totalWishlistValue,
    };
  }

  subscribeToShopping(userId: string, callback: () => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`shopping_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_items', filter: `user_id=eq.${userId}` },
        () => callback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'essentials', filter: `user_id=eq.${userId}` },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const shoppingService = new ShoppingService();
