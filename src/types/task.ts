export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'done';
export type TaskCategory = 'Work' | 'Personal' | 'Learning' | 'Health' | 'General';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: TaskCategory | string | null;
  priority?: TaskPriority | null;
  status: TaskStatus;
  due_date?: string | null; // format: YYYY-MM-DD
  reminder_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export type TaskFilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'done';

export const TASK_CATEGORIES: TaskCategory[] = [
  'Work',
  'Personal',
  'Learning',
  'Health',
  'General',
];
