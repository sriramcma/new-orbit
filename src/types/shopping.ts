export type ShoppingPriority = 'high' | 'med' | 'low';
export type ShoppingStatus = 'wishlist' | 'planned' | 'bought';
export type EssentialStatus = 'need' | 'bought';

export type ShoppingCategory =
  | 'Clothes'
  | 'Watches'
  | 'Accessories'
  | 'Gadgets'
  | 'Home'
  | 'Beauty'
  | 'Other';

export interface ShoppingLink {
  url: string;
  label: string;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string | null;
  category: ShoppingCategory;
  target_price?: number | null;
  actual_price?: number | null;
  priority: ShoppingPriority;
  status: ShoppingStatus;
  links: ShoppingLink[];
  checklist: ChecklistItem[];
  notes?: string | null;
  planned_month?: string | null; // e.g. '2026-11'
  bought_date?: string | null;
  created_at: string;
}

export interface EssentialItem {
  id: string;
  user_id: string;
  name: string;
  notes?: string | null;
  status: EssentialStatus;
  recurring: boolean;
  created_at: string;
}

export interface ShoppingSummary {
  wishlistCount: number;
  plannedCount: number;
  essentialsNeedCount: number;
  boughtCount: number;
  totalWishlistValue: number;
}
