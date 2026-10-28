import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Filter,
  Search,
  Calendar,
  Layers,
  Database,
  Check,
  AlertCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Task, TaskFilterType } from '../types/task';
import { taskService } from '../services/taskService';
import { isTaskToday, isTaskUpcoming, isTaskOverdue, getTodayString } from '../utils/taskDate';
import { QuickAddBar } from '../components/tasks/QuickAddBar';
import { TopSummaryBar } from '../components/tasks/TopSummaryBar';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskAddModal } from '../components/tasks/TaskAddModal';
import { TaskSchemaModal } from '../components/tasks/TaskSchemaModal';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load & Seed sample tasks if empty
  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { tasks: fetched, fromDatabase, error } = await taskService.getTasks(userId);

    if (fetched.length === 0) {
      // Seed friendly starter tasks
      const starter1 = await taskService.createTask(userId, 'Welcome to ORBIT Tasks — tap to expand and view details', {
        category: 'Personal',
        priority: 'high',
        due_date: getTodayString(),
        description: 'You can add notes, due dates, and categories to any task.',
      });
      const starter2 = await taskService.createTask(userId, 'Swipe right on mobile to quickly cycle priority', {
        category: 'Work',
        priority: 'medium',
        due_date: getTodayString(),
      });
      const starter3 = await taskService.createTask(userId, 'Tap the circle on the left to mark task done', {
        category: 'General',
        priority: 'low',
      });
      setTasks([starter1.task, starter2.task, starter3.task]);
    } else {
      setTasks(fetched);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 2. Realtime Subscription (Postgres Changes)
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id || user.id.startsWith('demo-')) {
      return;
    }

    try {
      const channel = supabase
        .channel(`public:tasks:user_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task;
              setTasks((prev) => {
                if (prev.some((t) => t.id === newTask.id)) return prev;
                return [newTask, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Task;
              setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription not supported or table missing:', e);
    }
  }, [user?.id]);

  // 3. Quick Add Task handler (Enter key on single input)
  const handleQuickAdd = async (title: string) => {
    const { task, error } = await taskService.createTask(userId, title);
    // Optimistic UI updates state immediately
    setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
    showToast('Task added');
    if (error && !error.includes('relation "public.tasks" does not exist')) {
      showToast(`Saved locally: ${error}`);
    }
  };

  // 4. Detailed Add Task handler (via FAB modal)
  const handleDetailedAdd = async (
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>>
  ) => {
    const { task } = await taskService.createTask(userId, title, extra);
    setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
    showToast('Task created with details');
  };

  // 5. Toggle status (mark done / pending)
  const handleToggleStatus = async (taskId: string) => {
    // Optimistic state toggle
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const nextStatus = currentTask.status === 'done' ? 'pending' : 'done';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
            }
          : t
      )
    );

    showToast(nextStatus === 'done' ? 'Task completed! ✨' : 'Task marked as pending');
    await taskService.toggleTaskStatus(userId, taskId);
  };

  // 6. Delete task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
    showToast('Task deleted');
    await taskService.deleteTask(userId, taskId);
  };

  // 7. Update task
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    showToast('Task updated');
    await taskService.updateTask(userId, taskId, updates);
  };

  // 8. Cycle Priority
  const handleCyclePriority = async (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    const nextMap = { low: 'medium', medium: 'high', high: 'low' } as const;
    const nextPriority = nextMap[t.priority || 'medium'];

    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, priority: nextPriority } : item))
    );
    showToast(`Priority set to ${nextPriority}`);
    await taskService.cyclePriority(userId, taskId);
  };

  // 9. Compute counts for summary and filter tabs
  const counts = useMemo(() => {
    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    let done = 0;

    tasks.forEach((t) => {
      if (t.status === 'done') {
        done++;
      } else {
        if (isTaskOverdue(t.due_date, t.status)) overdue++;
        if (isTaskToday(t.due_date, t.created_at)) today++;
        if (isTaskUpcoming(t.due_date)) upcoming++;
      }
    });

    return {
      all: tasks.filter((t) => t.status === 'pending').length + done,
      today,
      upcoming,
      overdue,
      done,
    };
  }, [tasks]);

  // 10. Filter and sort tasks (client-side state, zero API calls)
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }

    // Tab filter
    switch (activeFilter) {
      case 'today':
        list = list.filter((t) => t.status === 'pending' && isTaskToday(t.due_date, t.created_at));
        break;
      case 'upcoming':
        list = list.filter((t) => t.status === 'pending' && isTaskUpcoming(t.due_date));
        break;
      case 'overdue':
        list = list.filter((t) => isTaskOverdue(t.due_date, t.status));
        break;
      case 'done':
        list = list.filter((t) => t.status === 'done');
        break;
      case 'all':
      default:
        // Sort pending first, done at the bottom
        list.sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return a.status === 'done' ? 1 : -1;
        });
        break;
    }

    return list;
  }, [tasks, activeFilter, searchQuery]);

  return (
    <div className="relative min-h-full pb-20 p-4 space-y-3.5 transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-gray-900/95 text-white dark:bg-white dark:text-gray-950 text-xs font-semibold shadow-lg shadow-black/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP TITLE & CONTROLS */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
              Tasks
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/80 dark:text-[#818cf8] rounded-full border border-indigo-100 dark:border-indigo-900/60">
              Live OS
            </span>
          </div>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
            Daily focus, priorities & routines
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              showSearch
                ? 'bg-[#6366f1] text-white dark:bg-[#818cf8] dark:text-slate-900'
                : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155]'
            }`}
            title="Search tasks"
            aria-label="Search tasks"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Database Schema modal button */}
          <button
            type="button"
            onClick={() => setIsSchemaModalOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] transition-colors cursor-pointer"
            title="Supabase Schema Setup"
            aria-label="Supabase Schema Setup"
          >
            <Database className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SEARCH BAR (if toggled) */}
      {showSearch && (
        <div className="animate-in fade-in duration-150">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, or notes..."
            className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1] shadow-xs"
            autoFocus
          />
        </div>
      )}

      {/* QUICK ADD BAR (Sticky at top) */}
      <QuickAddBar onAddTask={handleQuickAdd} />

      {/* TOP SUMMARY STATS ROW */}
      <TopSummaryBar
        totalCount={counts.all}
        todayCount={counts.today}
        overdueCount={counts.overdue}
        doneCount={counts.done}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* FILTER TABS */}
      <TaskFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* TASK LIST */}
      <div className="space-y-2.5 pt-1">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#6b7280] dark:text-[#94a3b8]">
            <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12 px-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] text-center space-y-2 shadow-xs transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] mx-auto flex items-center justify-center">
              {activeFilter === 'done' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : activeFilter === 'overdue' ? (
                <Sparkles className="w-6 h-6 text-emerald-500" />
              ) : (
                <Inbox className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
              {tasks.length === 0
                ? 'Nothing here yet'
                : activeFilter === 'overdue'
                ? 'No overdue tasks 🎉'
                : activeFilter === 'today'
                ? 'No tasks due today'
                : activeFilter === 'done'
                ? 'No completed tasks yet'
                : 'No tasks found'}
            </h3>

            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
              {tasks.length === 0
                ? 'Add your first task in the input bar above 👆'
                : activeFilter === 'overdue'
                ? 'You are all caught up with your schedule!'
                : 'Try switching filters or add a new task.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTaskId === task.id}
              onToggleExpand={() =>
                setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
              }
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
              onCyclePriority={handleCyclePriority}
            />
          ))
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-5 z-20 w-12 h-12 rounded-full bg-[#6366f1] hover:bg-indigo-600 dark:bg-[#818cf8] dark:hover:bg-indigo-400 text-white dark:text-slate-900 shadow-xl shadow-indigo-500/30 dark:shadow-none flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer focus:outline-none"
        title="Add task with full details"
        aria-label="Add task with full details"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* DETAILED ADD TASK MODAL */}
      <TaskAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveTask={handleDetailedAdd}
      />

      {/* SUPABASE SCHEMA SETUP MODAL */}
      <TaskSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

    </div>
  );
};
