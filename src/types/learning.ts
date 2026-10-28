export type LearningType = 'skill' | 'language' | 'doubt' | 'wishlist';

export type LearningStatus = 'todo' | 'learning' | 'done';

export interface LearningLink {
  label: string;
  url: string;
}

export interface LearningItem {
  id: string;
  user_id: string;
  title: string;
  type: LearningType;
  status: LearningStatus;
  notes?: string | null;
  links: LearningLink[];
  created_at?: string;
}

export interface LearningSummary {
  total: number;
  learning: number;
  todo: number;
  done: number;
  byType: Record<LearningType, number>;
  activeLearningItem?: LearningItem | null;
}
