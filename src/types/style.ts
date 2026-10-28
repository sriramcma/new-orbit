export type StyleCategory = 'clothes' | 'accessories' | 'watches' | 'haircut';

export type StyleStatus = 'idea' | 'shortlisted' | 'bought';

export interface StyleLink {
  label: string;
  url: string;
}

export interface StyleItem {
  id: string;
  user_id: string;
  title: string;
  category: StyleCategory;
  brand?: string | null;
  links: StyleLink[];
  notes?: string | null;
  status: StyleStatus;
  created_at?: string;
}

export interface StyleSummary {
  total: number;
  idea: number;
  shortlisted: number;
  bought: number;
  byCategory: Record<StyleCategory, number>;
}
