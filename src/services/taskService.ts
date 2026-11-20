import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Subtask, Task, TaskPriority, TaskStatus } from '../types/task';

const LOCAL_STORAGE_PREFIX = 'orbit_tasks_cache_';

export const TASKS_SQL_SCHEMA = `-- Create the tasks table for ORBIT Personal Life OS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'done')) DEFAULT 'pending',
  due_date TEXT,
  reminder_at TIMESTAMPTZ,
  subtasks JSONB DEFAULT '[]'::jsonb,
  repeat_rule JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If upgrading an existing table, add subtasks & repeat_rule columns:
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS repeat_rule JSONB;

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own tasks"
  ON public.tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`;

const normalizeTask = (raw: Task): Task => ({
  ...raw,
  subtasks: Array.isArray(raw.subtasks) ? raw.subtasks : [],
  repeat_rule: raw.repeat_rule || null,
});

const getLocalTasks = (userId: string): Task[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Task[];
      return Array.isArray(parsed) ? parsed.map(normalizeTask) : [];
    }
  } catch (e) {
    console.error('Error reading tasks cache:', e);
  }
  return [];
};

const saveLocalTasks = (userId: string, tasks: Task[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks cache:', e);
  }
};

export const taskService = {
  async getTasks(userId: string): Promise<{ tasks: Task[]; fromDatabase: boolean; error?: string }> {
    const local = getLocalTasks(userId);

    if (!isSupabaseConfigured || !userId) {
      return { tasks: local, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { tasks: local, fromDatabase: false, error: error.message };
      }

      const tasks = ((data as Task[]) || []).map(normalizeTask);
      saveLocalTasks(userId, tasks);
      return { tasks, fromDatabase: true };
    } catch (err: unknown) {
      return { tasks: local, fromDatabase: false, error: err instanceof Error ? err.message : 'Fetch failed' };
    }
  },

  async createTask(
    userId: string,
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>> = {}
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const newTask: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title: title.trim(),
      description: extra.description || null,
      priority: extra.priority || 'medium',
      status: 'pending',
      due_date: extra.due_date || null,
      reminder_at: extra.reminder_at || null,
      subtasks: Array.isArray(extra.subtasks) ? extra.subtasks : [],
      repeat_rule: extra.repeat_rule || null,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    const current = getLocalTasks(userId);
    const updated = [newTask, ...current];
    saveLocalTasks(userId, updated);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { task: newTask, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        return { task: newTask, fromDatabase: false, error: error.message };
      }

      if (data) {
        const normalized = normalizeTask(data as Task);
        const finalTasks = updated.map((t) => (t.id === newTask.id ? normalized : t));
        saveLocalTasks(userId, finalTasks);
        return { task: normalized, fromDatabase: true };
      }

      return { task: newTask, fromDatabase: true };
    } catch (err: unknown) {
      return { task: newTask, fromDatabase: false, error: err instanceof Error ? err.message : 'Insert failed' };
    }
  },

  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId);
    if (!existing) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = normalizeTask({
      ...existing,
      ...updates,
    });

    const nextList = current.map((t) => (t.id === taskId ? updatedTask : t));
    saveLocalTasks(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { task: updatedTask, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { task: updatedTask, fromDatabase: false, error: error.message };
      }

      return { task: data ? normalizeTask(data as Task) : updatedTask, fromDatabase: true };
    } catch (err: unknown) {
      return { task: updatedTask, fromDatabase: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  },

  async updateSubtasks(
    userId: string,
    taskId: string,
    subtasks: Subtask[]
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    return this.updateTask(userId, taskId, { subtasks });
  },

  async toggleTaskStatus(
    userId: string,
    taskId: string
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId);
    if (!existing) throw new Error('Task not found');

    const isDone = existing.status === 'done';
    const nextStatus: TaskStatus = isDone ? 'pending' : 'done';
    const nextCompletedAt = isDone ? null : new Date().toISOString();

    return this.updateTask(userId, taskId, {
      status: nextStatus,
      completed_at: nextCompletedAt,
    });
  },

  async cyclePriority(
    userId: string,
    taskId: string
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId);
    if (!existing) throw new Error('Task not found');

    const map: Record<TaskPriority, TaskPriority> = {
      low: 'medium',
      medium: 'high',
      high: 'low',
    };
    const nextPriority = map[existing.priority || 'medium'];

    return this.updateTask(userId, taskId, {
      priority: nextPriority,
    });
  },

  async deleteTask(userId: string, taskId: string): Promise<{ success: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const nextList = current.filter((t) => t.id !== taskId);
    saveLocalTasks(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  },
};
