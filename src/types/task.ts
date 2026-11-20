export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'done';

export type RepeatPreset = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type RepeatUnit = 'days' | 'weeks' | 'months' | 'years';
/** 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TaskRepeatRule {
  preset: RepeatPreset;
  interval: number;
  unit: RepeatUnit;
  weekdays?: WeekdayIndex[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority | null;
  status: TaskStatus;
  due_date?: string | null; // format: YYYY-MM-DD
  reminder_at?: string | null;
  subtasks?: Subtask[];
  repeat_rule?: TaskRepeatRule | null;
  completed_at?: string | null;
  created_at: string;
}
