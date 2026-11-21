import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Subtask, Task, TaskPriority, TaskRepeatRule, TaskStatus } from '../types/task';
import { getTaskDateKey } from '../utils/taskDate';
import { getNextRepeatDate, shiftReminderForNextDate } from '../utils/taskRepeat';

const LOCAL_STORAGE_PREFIX = 'orbit_tasks_cache_';
const LOCAL_META_PREFIX = 'orbit_tasks_meta_';
const PENDING_SYNC_PREFIX = 'orbit_tasks_pending_';

interface TaskLocalMeta {
  subtasks?: Subtask[];
  repeat_rule?: TaskRepeatRule | null;
}

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

-- If upgrading an existing table, run this in Supabase SQL Editor:
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

const getLocalMetaMap = (userId: string): Record<string, TaskLocalMeta> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_META_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw) as Record<string, TaskLocalMeta>;
  } catch (e) {
    console.error('Error reading tasks meta cache:', e);
  }
  return {};
};

const saveLocalMeta = (userId: string, taskId: string, meta: TaskLocalMeta): void => {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalMetaMap(userId);
    map[taskId] = { ...(map[taskId] || {}), ...meta };
    localStorage.setItem(`${LOCAL_META_PREFIX}${userId}`, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving tasks meta cache:', e);
  }
};

const deleteLocalMeta = (userId: string, taskId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalMetaMap(userId);
    if (taskId in map) {
      delete map[taskId];
      localStorage.setItem(`${LOCAL_META_PREFIX}${userId}`, JSON.stringify(map));
    }
  } catch (e) {
    console.error('Error deleting tasks meta cache:', e);
  }
};

const getPendingSyncIds = (userId: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${PENDING_SYNC_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
  return [];
};

const markPendingSync = (userId: string, taskId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const ids = new Set(getPendingSyncIds(userId));
    ids.add(taskId);
    localStorage.setItem(`${PENDING_SYNC_PREFIX}${userId}`, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
};

const clearPendingSync = (userId: string, taskId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const ids = getPendingSyncIds(userId).filter((id) => id !== taskId);
    localStorage.setItem(`${PENDING_SYNC_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
};

/**
 * Extracts a missing column name from PostgREST / Postgres schema cache errors, e.g.:
 * "Could not find the 'repeat_rule' column of 'tasks' in the schema cache"
 */
function extractMissingColumn(errorMessage?: string): string | null {
  if (!errorMessage) return null;
  const pgrstMatch = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (pgrstMatch?.[1]) return pgrstMatch[1];
  const pgMatch = errorMessage.match(/column "([^"]+)" of relation "tasks" does not exist/i);
  if (pgMatch?.[1]) return pgMatch[1];
  return null;
}

/**
 * Inserts a task into Supabase, automatically stripping optional new columns
 * (like `repeat_rule` or `subtasks`) if the remote DB schema hasn't been migrated yet.
 */
async function insertWithSchemaFallback(
  payload: Record<string, unknown>
): Promise<{ data: Task | null; error: string | null }> {
  const mutablePayload = { ...payload };
  const optionalCols = new Set(['repeat_rule', 'subtasks']);

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([mutablePayload])
      .select()
      .single();

    if (!error) {
      return { data: (data as Task) || null, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol && optionalCols.has(missingCol) && missingCol in mutablePayload) {
      delete mutablePayload[missingCol];
      continue;
    }

    return { data: null, error: error.message };
  }

  return { data: null, error: 'Insert retry limit reached' };
}

/**
 * Updates a task in Supabase, automatically stripping optional new columns
 * if the remote DB schema hasn't been migrated yet.
 */
async function updateWithSchemaFallback(
  userId: string,
  taskId: string,
  updates: Record<string, unknown>
): Promise<{ data: Task | null; error: string | null }> {
  const mutableUpdates = { ...updates };
  const optionalCols = new Set(['repeat_rule', 'subtasks']);

  for (let attempt = 0; attempt < 4; attempt++) {
    if (Object.keys(mutableUpdates).length === 0) {
      // Only optional unmigrated columns were changed — already saved in local meta cache
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(mutableUpdates)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error) {
      return { data: (data as Task) || null, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol && optionalCols.has(missingCol) && missingCol in mutableUpdates) {
      delete mutableUpdates[missingCol];
      continue;
    }

    return { data: null, error: error.message };
  }

  return { data: null, error: 'Update retry limit reached' };
}

export const taskService = {
  /**
   * Keeps local cache aligned when external events (like Supabase Realtime) update React state.
   */
  syncLocalCache(userId: string, tasks: Task[]): void {
    saveLocalTasks(userId, tasks.map(normalizeTask));
  },

  async getTasks(userId: string): Promise<{ tasks: Task[]; fromDatabase: boolean; error?: string }> {
    const local = getLocalTasks(userId);
    const metaMap = getLocalMetaMap(userId);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
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

      const dbTasks = ((data as Record<string, unknown>[]) || []).map((row) => {
        const id = String(row.id);
        const cachedMeta = metaMap[id];
        const hasDbSubtasks = Object.prototype.hasOwnProperty.call(row, 'subtasks');
        const hasDbRepeat = Object.prototype.hasOwnProperty.call(row, 'repeat_rule');

        return normalizeTask({
          ...(row as unknown as Task),
          subtasks: hasDbSubtasks
            ? (row.subtasks as Subtask[] | undefined) || []
            : cachedMeta?.subtasks || [],
          repeat_rule: hasDbRepeat
            ? (row.repeat_rule as TaskRepeatRule | null | undefined) || null
            : cachedMeta?.repeat_rule || null,
        });
      });

      // Preserve any locally created tasks that haven't synced to Supabase yet (e.g., offline)
      const pendingIds = new Set(getPendingSyncIds(userId));
      const dbIdSet = new Set(dbTasks.map((t) => t.id));
      const unsyncedLocal = local.filter((t) => pendingIds.has(t.id) && !dbIdSet.has(t.id));

      // Attempt background sync for any unsynced tasks
      const syncedOrRemaining: Task[] = [];
      for (const pendingTask of unsyncedLocal) {
        const res = await insertWithSchemaFallback(
          pendingTask as unknown as Record<string, unknown>
        );
        if (!res.error) {
          clearPendingSync(userId, pendingTask.id);
          if (res.data) {
            syncedOrRemaining.push(
              normalizeTask({
                ...res.data,
                subtasks: Object.prototype.hasOwnProperty.call(res.data, 'subtasks')
                  ? res.data.subtasks
                  : pendingTask.subtasks,
                repeat_rule: Object.prototype.hasOwnProperty.call(res.data, 'repeat_rule')
                  ? res.data.repeat_rule
                  : pendingTask.repeat_rule,
              })
            );
            continue;
          }
        }
        syncedOrRemaining.push(pendingTask);
      }

      const merged = [...syncedOrRemaining, ...dbTasks];
      saveLocalTasks(userId, merged);
      return { tasks: merged, fromDatabase: true };
    } catch (err: unknown) {
      return {
        tasks: local,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Fetch failed',
      };
    }
  },

  async createTask(
    userId: string,
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>> & {
      status?: TaskStatus;
      completed_at?: string | null;
    } = {}
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const newTask: Task = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title: title.trim(),
      description: extra.description || null,
      priority: extra.priority || 'medium',
      status: extra.status || 'pending',
      due_date: extra.due_date || null,
      reminder_at: extra.reminder_at || null,
      subtasks: Array.isArray(extra.subtasks) ? extra.subtasks : [],
      repeat_rule: extra.repeat_rule || null,
      completed_at: extra.completed_at ?? (extra.status === 'done' ? new Date().toISOString() : null),
      created_at: new Date().toISOString(),
    };

    // Always persist subtasks & repeat_rule in local meta cache too
    saveLocalMeta(userId, newTask.id, {
      subtasks: newTask.subtasks,
      repeat_rule: newTask.repeat_rule,
    });

    // Optimistic local update
    const current = getLocalTasks(userId);
    const updated = [newTask, ...current.filter((t) => t.id !== newTask.id)];
    saveLocalTasks(userId, updated);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { task: newTask, fromDatabase: false };
    }

    try {
      const { data, error } = await insertWithSchemaFallback(
        newTask as unknown as Record<string, unknown>
      );

      if (error) {
        markPendingSync(userId, newTask.id);
        return { task: newTask, fromDatabase: false, error };
      }

      clearPendingSync(userId, newTask.id);

      if (data) {
        const mergedTask = normalizeTask({
          ...data,
          subtasks: Object.prototype.hasOwnProperty.call(data, 'subtasks')
            ? data.subtasks
            : newTask.subtasks,
          repeat_rule: Object.prototype.hasOwnProperty.call(data, 'repeat_rule')
            ? data.repeat_rule
            : newTask.repeat_rule,
        });
        const latestLocal = getLocalTasks(userId);
        const finalTasks = latestLocal.map((t) => (t.id === newTask.id ? mergedTask : t));
        saveLocalTasks(userId, finalTasks);
        return { task: mergedTask, fromDatabase: true };
      }

      return { task: newTask, fromDatabase: true };
    } catch (err: unknown) {
      markPendingSync(userId, newTask.id);
      return {
        task: newTask,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Insert failed',
      };
    }
  },

  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>,
    fallbackTask?: Task
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId) || fallbackTask;
    if (!existing) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = normalizeTask({
      ...existing,
      ...updates,
    });

    if ('subtasks' in updates || 'repeat_rule' in updates) {
      saveLocalMeta(userId, taskId, {
        ...(updates.subtasks !== undefined ? { subtasks: updates.subtasks } : {}),
        ...(updates.repeat_rule !== undefined ? { repeat_rule: updates.repeat_rule } : {}),
      });
    }

    const existsInLocal = current.some((t) => t.id === taskId);
    const nextList = existsInLocal
      ? current.map((t) => (t.id === taskId ? updatedTask : t))
      : [updatedTask, ...current];
    saveLocalTasks(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { task: updatedTask, fromDatabase: false };
    }

    try {
      const { data, error } = await updateWithSchemaFallback(
        userId,
        taskId,
        updates as Record<string, unknown>
      );

      if (error) {
        return { task: updatedTask, fromDatabase: false, error };
      }

      if (data) {
        const merged = normalizeTask({
          ...data,
          subtasks: Object.prototype.hasOwnProperty.call(data, 'subtasks')
            ? data.subtasks
            : updatedTask.subtasks,
          repeat_rule: Object.prototype.hasOwnProperty.call(data, 'repeat_rule')
            ? data.repeat_rule
            : updatedTask.repeat_rule,
        });
        const latestLocal = getLocalTasks(userId);
        saveLocalTasks(
          userId,
          latestLocal.map((t) => (t.id === taskId ? merged : t))
        );
        return { task: merged, fromDatabase: true };
      }

      return { task: updatedTask, fromDatabase: true };
    } catch (err: unknown) {
      return {
        task: updatedTask,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Update failed',
      };
    }
  },

  async updateSubtasks(
    userId: string,
    taskId: string,
    subtasks: Subtask[],
    fallbackTask?: Task
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    return this.updateTask(userId, taskId, { subtasks }, fallbackTask);
  },

  async toggleTaskStatus(
    userId: string,
    taskId: string,
    fallbackTask?: Task
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId) || fallbackTask;
    if (!existing) throw new Error('Task not found');

    const isDone = existing.status === 'done';
    const nextStatus: TaskStatus = isDone ? 'pending' : 'done';
    const nextCompletedAt = isDone ? null : new Date().toISOString();

    return this.updateTask(
      userId,
      taskId,
      {
        status: nextStatus,
        completed_at: nextCompletedAt,
      },
      existing
    );
  },

  /**
   * Shared single-source-of-truth toggle handler for Tasks page & Dashboard:
   * toggles status and, when completing a repeating task, safely creates the next occurrence
   * if one does not already exist for that date.
   */
  async toggleTaskWithRepeat(
    userId: string,
    taskId: string,
    fallbackTask?: Task
  ): Promise<{
    task: Task;
    spawnedTask: Task | null;
    nextDueDate: string | null;
    error?: string;
  }> {
    const localBefore = getLocalTasks(userId);
    const sourceTask = localBefore.find((t) => t.id === taskId) || fallbackTask;
    if (!sourceTask) throw new Error('Task not found');

    const toggleRes = await this.toggleTaskStatus(userId, taskId, sourceTask);
    const updatedTask = toggleRes.task;

    if (updatedTask.status === 'done' && sourceTask.repeat_rule) {
      const currentDateKey = getTaskDateKey(sourceTask);
      const nextDueDate = getNextRepeatDate(currentDateKey, sourceTask.repeat_rule);
      const latestLocal = getLocalTasks(userId);

      const normalizedTitle = sourceTask.title.trim().toLowerCase();
      const alreadyExists = latestLocal.some(
        (t) =>
          t.id !== sourceTask.id &&
          t.title.trim().toLowerCase() === normalizedTitle &&
          getTaskDateKey(t) === nextDueDate
      );

      if (!alreadyExists) {
        const resetSubtasks: Subtask[] = (sourceTask.subtasks || []).map((s, idx) => ({
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `sub_${Date.now()}_${idx}`,
          title: s.title,
          completed: false,
        }));

        const nextReminder = shiftReminderForNextDate(
          sourceTask.reminder_at,
          currentDateKey,
          nextDueDate
        );

        const { task: nextTask } = await this.createTask(userId, sourceTask.title, {
          description: sourceTask.description || null,
          priority: sourceTask.priority || 'medium',
          due_date: nextDueDate,
          reminder_at: nextReminder,
          repeat_rule: sourceTask.repeat_rule,
          subtasks: resetSubtasks,
        });

        return {
          task: updatedTask,
          spawnedTask: nextTask,
          nextDueDate,
          error: toggleRes.error,
        };
      }

      return {
        task: updatedTask,
        spawnedTask: null,
        nextDueDate,
        error: toggleRes.error,
      };
    }

    return {
      task: updatedTask,
      spawnedTask: null,
      nextDueDate: null,
      error: toggleRes.error,
    };
  },

  async cyclePriority(
    userId: string,
    taskId: string,
    fallbackTask?: Task
  ): Promise<{ task: Task; fromDatabase: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const existing = current.find((t) => t.id === taskId) || fallbackTask;
    if (!existing) throw new Error('Task not found');

    const map: Record<TaskPriority, TaskPriority> = {
      low: 'medium',
      medium: 'high',
      high: 'low',
    };
    const nextPriority = map[existing.priority || 'medium'];

    return this.updateTask(
      userId,
      taskId,
      {
        priority: nextPriority,
      },
      existing
    );
  },

  async deleteTask(userId: string, taskId: string): Promise<{ success: boolean; error?: string }> {
    const current = getLocalTasks(userId);
    const nextList = current.filter((t) => t.id !== taskId);
    saveLocalTasks(userId, nextList);
    deleteLocalMeta(userId, taskId);
    clearPendingSync(userId, taskId);

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
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Delete failed',
      };
    }
  },
};
