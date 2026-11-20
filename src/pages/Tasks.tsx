import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Database,
  Check,
  Inbox,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Subtask, Task } from '../types/task';
import { taskService } from '../services/taskService';
import {
  formatShortDateLabel,
  getTaskDateKey,
  getTodayString,
  isTaskOverdue,
} from '../utils/taskDate';
import { getNextRepeatDate, shiftReminderForNextDate } from '../utils/taskRepeat';
import { QuickAddBar } from '../components/tasks/QuickAddBar';
import { DayCalendarStrip, DayTaskDotInfo } from '../components/tasks/DayCalendarStrip';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskAddModal } from '../components/tasks/TaskAddModal';
import { TaskSchemaModal } from '../components/tasks/TaskSchemaModal';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const todayStr = getTodayString();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load & Seed starter tasks if empty
  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { tasks: fetched } = await taskService.getTasks(userId);

    if (fetched.length === 0) {
      const today = getTodayString();
      const starter1 = await taskService.createTask(
        userId,
        'Welcome to ORBIT Tasks — tap to check off subtasks',
        {
          priority: 'high',
          due_date: today,
          description: 'Use the day calendar above to plan any day of the week or month.',
          subtasks: [
            { id: 'sub_starter_1', title: 'Tap a day on the calendar to switch dates', completed: true },
            { id: 'sub_starter_2', title: 'Add your own subtask right below', completed: false },
            { id: 'sub_starter_3', title: 'Tap NOV 2026 to open the full month view', completed: false },
          ],
        }
      );
      const starter2 = await taskService.createTask(
        userId,
        'Swipe right on a task to quickly cycle priority',
        {
          priority: 'medium',
          due_date: today,
          subtasks: [],
        }
      );
      setTasks([starter1.task, starter2.task]);
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
                return [
                  {
                    ...newTask,
                    subtasks: newTask.subtasks || [],
                    repeat_rule: newTask.repeat_rule || null,
                  },
                  ...prev,
                ];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Task;
              const hasSubtasks = Object.prototype.hasOwnProperty.call(updated, 'subtasks');
              const hasRepeat = Object.prototype.hasOwnProperty.call(updated, 'repeat_rule');
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === updated.id
                    ? {
                        ...t,
                        ...updated,
                        subtasks: hasSubtasks ? updated.subtasks || [] : t.subtasks || [],
                        repeat_rule: hasRepeat ? updated.repeat_rule || null : t.repeat_rule || null,
                      }
                    : t
                )
              );
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

  // 3. Quick Add Task handler (automatically schedules for selectedDate)
  const handleQuickAdd = async (title: string) => {
    const { task, error } = await taskService.createTask(userId, title, {
      due_date: selectedDate,
      subtasks: [],
    });
    setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
    showToast(`Added for ${formatShortDateLabel(selectedDate)}`);
    if (error && !error.includes('relation "public.tasks" does not exist')) {
      showToast(`Saved locally: ${error}`);
    }
  };

  // 4. Detailed Add Task handler (via FAB modal)
  const handleDetailedAdd = async (
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>>
  ) => {
    const targetDate = extra.due_date || selectedDate;
    const { task } = await taskService.createTask(userId, title, {
      ...extra,
      due_date: targetDate,
    });
    setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
    if (targetDate && targetDate !== selectedDate) {
      setSelectedDate(targetDate);
    }
    showToast('Task created');
  };

  // 5. Toggle status (mark done / pending) + auto-spawn next repeat occurrence
  const handleToggleStatus = async (taskId: string) => {
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

    await taskService.toggleTaskStatus(userId, taskId);

    // If marking a repeating task as done, schedule its next occurrence automatically
    if (nextStatus === 'done' && currentTask.repeat_rule) {
      const currentDateKey = getTaskDateKey(currentTask);
      const nextDueDate = getNextRepeatDate(currentDateKey, currentTask.repeat_rule);

      // Avoid duplicating if a pending repeat for that exact date already exists
      const alreadyScheduled = tasks.some(
        (t) =>
          t.id !== currentTask.id &&
          t.status === 'pending' &&
          t.title === currentTask.title &&
          getTaskDateKey(t) === nextDueDate
      );

      if (!alreadyScheduled) {
        const resetSubtasks: Subtask[] = (currentTask.subtasks || []).map((s, idx) => ({
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `sub_${Date.now()}_${idx}`,
          title: s.title,
          completed: false,
        }));

        const nextReminder = shiftReminderForNextDate(
          currentTask.reminder_at,
          currentDateKey,
          nextDueDate
        );

        const { task: nextTask } = await taskService.createTask(userId, currentTask.title, {
          description: currentTask.description || null,
          priority: currentTask.priority || 'medium',
          due_date: nextDueDate,
          reminder_at: nextReminder,
          repeat_rule: currentTask.repeat_rule,
          subtasks: resetSubtasks,
        });

        setTasks((prev) => [nextTask, ...prev.filter((t) => t.id !== nextTask.id)]);
        showToast(`Done! Next repeat on ${formatShortDateLabel(nextDueDate)}`);
        return;
      }
    }

    showToast(nextStatus === 'done' ? 'Task completed!' : 'Task marked as pending');
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

  // 7. Update task details
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    showToast('Task updated');
    await taskService.updateTask(userId, taskId, updates);
  };

  // 8. Instant-save Subtasks update
  const handleUpdateSubtasks = async (taskId: string, subtasks: Subtask[]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t)));
    await taskService.updateSubtasks(userId, taskId, subtasks);
  };

  // 9. Cycle Priority
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

  // 10. Move overdue task to Today
  const handleMoveToToday = async (taskId: string) => {
    const today = getTodayString();
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, due_date: today } : t)));
    showToast('Moved to Today');
    await taskService.updateTask(userId, taskId, { due_date: today });
  };

  // 11. Build calendar dot map across all dates
  const dayCountsMap = useMemo(() => {
    const map: Record<string, DayTaskDotInfo> = {};
    tasks.forEach((t) => {
      const key = getTaskDateKey(t);
      if (!map[key]) {
        map[key] = { pending: 0, done: 0, hasOverdue: false };
      }
      if (t.status === 'done') {
        map[key].done += 1;
      } else {
        map[key].pending += 1;
        if (isTaskOverdue(t.due_date, t.status)) {
          map[key].hasOverdue = true;
        }
      }
    });
    return map;
  }, [tasks]);

  // 12. Overdue tasks (from previous days, still pending)
  const overdueTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done' && getTaskDateKey(t) < todayStr)
      .sort((a, b) => getTaskDateKey(a).localeCompare(getTaskDateKey(b)));
  }, [tasks, todayStr]);

  // 13. Visible tasks for selected day OR global search results
  const isSearching = searchQuery.trim().length > 0;

  const visibleTasks = useMemo(() => {
    let list: Task[];

    if (isSearching) {
      const q = searchQuery.toLowerCase().trim();
      list = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.subtasks || []).some((s) => s.title.toLowerCase().includes(q))
      );
    } else {
      list = tasks.filter((t) => getTaskDateKey(t) === selectedDate);
    }

    return [...list].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'done' ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, selectedDate, searchQuery, isSearching]);

  const selectedDayDoneCount = useMemo(
    () => visibleTasks.filter((t) => t.status === 'done').length,
    [visibleTasks]
  );

  const selectedDayLabel = useMemo(() => formatShortDateLabel(selectedDate), [selectedDate]);
  const dayProgressPercent =
    visibleTasks.length > 0 ? Math.round((selectedDayDoneCount / visibleTasks.length) * 100) : 0;

  return (
    <div className="relative min-h-full w-full max-w-full overflow-x-clip pb-28 p-4 space-y-3.5 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)] sm:max-w-[440px] px-4 py-2 rounded-xl bg-gray-900/95 text-white dark:bg-white dark:text-gray-950 text-xs font-semibold shadow-lg shadow-black/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="break-words min-w-0">{toastMessage}</span>
        </div>
      )}

      {/* TOP CONTROLS BAR */}
      <div className="flex items-center justify-between gap-2 pt-0.5 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9] truncate">
              Tasks
            </h1>
            <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/80 dark:text-[#818cf8] rounded-full border border-indigo-100 dark:border-indigo-900/60">
              Day Planner
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
            title="Search tasks & subtasks"
            aria-label="Search tasks & subtasks"
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

      {/* SEARCH BAR (searches across all dates & subtasks) */}
      {showSearch && (
        <div className="relative animate-in fade-in duration-150 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, notes, or subtasks across all days..."
            className="w-full min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-3.5 pr-9 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1] shadow-xs"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6b7280] hover:text-[#111827] dark:hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* DAY CALENDAR STRIP (Editorial Weekday + Month Dropdown + 7-Day Week Strip) */}
      <DayCalendarStrip
        selectedDate={selectedDate}
        onSelectDate={(dateStr) => {
          setSelectedDate(dateStr);
          setExpandedTaskId(null);
        }}
        dayCountsMap={dayCountsMap}
      />

      {/* QUICK ADD BAR (Schedules directly onto selected day) */}
      <QuickAddBar
        onAddTask={handleQuickAdd}
        placeholder={`Add a task for ${selectedDayLabel}...`}
      />

      {/* DAY PROGRESS SUMMARY */}
      {!loading && visibleTasks.length > 0 && (
        <div className="px-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
              {isSearching
                ? `Search results (${visibleTasks.length})`
                : `${selectedDayLabel} · ${visibleTasks.length} ${
                    visibleTasks.length === 1 ? 'task' : 'tasks'
                  }`}
            </span>
            {!isSearching && (
              <span className="shrink-0 text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8]">
                {selectedDayDoneCount}/{visibleTasks.length} done
              </span>
            )}
          </div>
          {!isSearching && (
            <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  dayProgressPercent === 100
                    ? 'bg-emerald-500'
                    : 'bg-[#6366f1] dark:bg-[#a78bfa]'
                }`}
                style={{ width: `${dayProgressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* TASK LIST */}
      <div className="space-y-2.5 pt-0.5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#6b7280] dark:text-[#94a3b8]">
            <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading tasks...</span>
          </div>
        ) : visibleTasks.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-10 px-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] text-center space-y-2 shadow-xs transition-colors duration-200">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#a78bfa] mx-auto flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
              {isSearching
                ? 'No matching tasks'
                : `No tasks for ${selectedDayLabel}`}
            </h3>

            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
              {isSearching
                ? 'Try a different keyword or clear the search bar.'
                : 'Type above or tap + to add a task with subtasks for this day.'}
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTaskId === task.id}
              showDateBadge={isSearching}
              onToggleExpand={() =>
                setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
              }
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
              onUpdateSubtasks={handleUpdateSubtasks}
              onCyclePriority={handleCyclePriority}
              onMoveToToday={handleMoveToToday}
            />
          ))
        )}
      </div>

      {/* COLLAPSIBLE OVERDUE SECTION (Shown neatly when viewing Today so earlier tasks aren't lost) */}
      {!loading && !isSearching && selectedDate === todayStr && overdueTasks.length > 0 && (
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowOverdue((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/35 border border-rose-200/70 dark:border-rose-900/50 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Overdue from earlier days ({overdueTasks.length})
              </span>
            </span>
            {showOverdue ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </button>

          {showOverdue && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              {overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  showDateBadge
                  onToggleExpand={() =>
                    setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                  }
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  onUpdateSubtasks={handleUpdateSubtasks}
                  onCyclePriority={handleCyclePriority}
                  onMoveToToday={handleMoveToToday}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-4 sm:right-[max(1rem,calc(50%-224px))] z-20 w-12 h-12 rounded-full bg-[#6366f1] hover:bg-indigo-600 dark:bg-[#818cf8] dark:hover:bg-indigo-400 text-white dark:text-slate-900 shadow-xl shadow-indigo-500/30 dark:shadow-none flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer focus:outline-none"
        title="Add task with subtasks"
        aria-label="Add task with subtasks"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* DETAILED ADD TASK MODAL */}
      <TaskAddModal
        isOpen={isAddModalOpen}
        defaultDueDate={selectedDate}
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
