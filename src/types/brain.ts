export interface BrainLink {
  url: string;
  label: string;
}

export interface BrainChecklistItem {
  text: string;
  done: boolean;
}

export interface BrainCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // purple | indigo | emerald | amber | rose | cyan
  item_count?: number;
  created_at?: string;
}

export interface BrainItem {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  notes?: string | null;
  links: BrainLink[];
  checklist: BrainChecklistItem[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}
