import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
  MoreVertical,
  Flag,
  ChevronDown,
  ChevronUp,
  Clock,
  Save,
  AlertTriangle,
  ListChecks,
  Plus,
  X,
  CalendarArrowUp,
  Repeat,
} from 'lucide-react';
import { Subtask, Task, TaskPriority, TaskRepeatRule } from '../../types/task';
import {
  formatDueBadge,
  getTaskDateKey,
  isTaskOverdue,
  toDateTimeLocalInput,
} from '../../utils/taskDate';
import { formatRepeatLabel, syncRuleWithAnchorDate } from '../../utils/taskRepeat';
import { RepeatPicker } from './RepeatPicker';
import { Button } from '../ui';

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  isProjected?: boolean;
  showDateBadge?: boolean;
  onToggleExpand: () => void;
  onToggleStatus: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
  onCyclePriority: (taskId: string) => void;
  onMoveToToday?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  isProjected = false,
  showDateBadge = false,
  onToggleExpand,
  onToggleStatus,
  onDelete,
  onUpdate,
  onUpdateSubtasks,
  onCyclePriority,
  onMoveToToday,
}) => {
  const isDone = task.status === 'done';
  const isOverdue = !isProjected && isTaskOverdue(task.due_date, task.status);
  const dueInfo = formatDueBadge(task.due_date, task.status);
  const repeatLabel = formatRepeatLabel(task.repeat_rule);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Menu & confirmation state
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Instant subtask add input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Edit fields inside expanded state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');
  const [editReminder, setEditReminder] = useState(toDateTimeLocalInput(task.reminder_at));
  const [editRepeatRule, setEditRepeatRule] = useState<TaskRepeatRule | null>(
    task.repeat_rule || null
  );

  // Only reset form fields when card transitions collapsed -> expanded or task ID changes,
  // so instant-save subtask toggles or repeat changes NEVER wipe unsaved Title/Notes/Date edits.
  const wasExpandedRef = useRef(false);
  const prevTaskIdRef = useRef(task.id);

  useEffect(() => {
    const opening = isExpanded && !wasExpandedRef.current;
    const switchedTask = prevTaskIdRef.current !== task.id;
    if (opening || switchedTask) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority || 'medium');
      setEditDueDate(task.due_date || '');
      setEditReminder(toDateTimeLocalInput(task.reminder_at));
      setEditRepeatRule(task.repeat_rule || null);
      setNewSubtaskTitle('');
    }
    wasExpandedRef.current = isExpanded;
    prevTaskIdRef.current = task.id;
  }, [isExpanded, task]);

  // Keep repeat pill synced if updated externally without wiping other form inputs
  useEffect(() => {
    setEditRepeatRule(task.repeat_rule || null);
  }, [task.repeat_rule]);

  // Mobile swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExpanded || showMenu || showDeleteConfirm) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isExpanded || showMenu || showDeleteConfirm) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) < 120) {
      setSwipeOffset(Math.max(-100, Math.min(100, diffX)));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -70) {
      setShowDeleteConfirm(true);
    } else if (swipeOffset > 70) {
      onCyclePriority(task.id);
    }
    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const nextSubtask: Subtask = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      completed: false,
    };
    onUpdateSubtasks(task.id, [...subtasks, nextSubtask]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const next = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateSubtasks(task.id, next);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const next = subtasks.filter((s) => s.id !== subtaskId);
    onUpdateSubtasks(task.id, next);
  };

  const handleDueDateChange = (nextDate: string) => {
    setEditDueDate(nextDate);
    if (nextDate && editRepeatRule?.preset === 'weekly') {
      const synced = syncRuleWithAnchorDate(editRepeatRule, nextDate);
      setEditRepeatRule(synced);
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const syncedRule = syncRuleWithAnchorDate(editRepeatRule, editDueDate || undefined);
    onUpdate(task.id, {
      title: editTitle.trim() || task.title,
      description: editDescription.trim() || null,
      priority: editPriority,
      ...(isProjected ? {} : { due_date: editDueDate || null }),
      reminder_at: editReminder ? new Date(editReminder).toISOString() : null,
      repeat_rule: syncedRule,
    });
    onToggleExpand();
  };

  const anchorForRepeat = editDueDate || getTaskDateKey(task);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset * 0.35}px)` : undefined,
      }}
      className={`relative w-full max-w-full rounded-xl border bg-white dark:bg-[#1e293b] shadow-xs transition-all duration-200 ${
        showMenu ? 'z-30' : 'z-0'
      } ${
        isOverdue && !isDone
          ? 'border-l-4 border-l-rose-500 border-r-[#e5e7eb] border-y-[#e5e7eb] dark:border-r-[#334155] dark:border-y-[#334155]'
          : isProjected
          ? 'border-dashed border-violet-300/90 dark:border-violet-700/70'
          : 'border-[#e5e7eb] dark:border-[#334155]'
      } ${isDone ? 'opacity-70 dark:opacity-60 bg-gray-50/50 dark:bg-slate-800/40' : ''}`}
    >
      {/* CARD MAIN ROW */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 flex items-start gap-3 cursor-pointer select-none group w-full min-w-0"
      >
        {/* CHECKBOX */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id);
          }}
          className="mt-0.5 text-gray-400 hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors duration-150 focus:outline-none shrink-0 cursor-pointer"
          aria-label={isDone ? 'Mark task as incomplete' : 'Mark task as completed'}
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-[#6366f1] dark:text-[#818cf8] fill-indigo-100 dark:fill-indigo-950/60" />
          ) : (
            <Circle className="w-5 h-5 hover:text-[#6366f1] dark:hover:text-[#818cf8]" />
          )}
        </button>

        {/* TITLE & BADGES */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold text-[#111827] dark:text-[#f1f5f9] leading-snug break-words [overflow-wrap:anywhere] transition-all duration-150 ${
              isDone ? 'line-through text-[#6b7280] dark:text-[#94a3b8]' : ''
            }`}
          >
            {task.title}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 min-w-0">
            {/* Priority Badge */}
            {task.priority === 'high' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                High
              </span>
            )}
            {task.priority === 'medium' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Med
              </span>
            )}
            {task.priority === 'low' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Low
              </span>
            )}

            {/* Subtask Progress Pill */}
            {subtasks.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                  completedSubtasks === subtasks.length
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/50'
                    : 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#a78bfa] border-indigo-200/70 dark:border-indigo-900/50'
                }`}
              >
                <ListChecks className="w-3 h-3 shrink-0" />
                <span>
                  {completedSubtasks}/{subtasks.length}
                </span>
              </span>
            )}

            {/* Repeat Rule Pill */}
            {repeatLabel && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border max-w-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/70 dark:border-violet-900/50">
                <Repeat className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {isProjected ? `${repeatLabel} · Upcoming` : repeatLabel}
                </span>
              </span>
            )}

            {/* Due Date Badge (shown when searching or overdue) */}
            {(showDateBadge || (dueInfo?.isOverdue && !isDone)) && dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border max-w-full ${
                  dueInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                    : dueInfo.isToday
                    ? 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#818cf8] border-indigo-200 dark:border-indigo-900'
                    : 'bg-gray-100 text-[#6b7280] dark:bg-slate-800 dark:text-[#94a3b8] border-gray-200 dark:border-slate-700'
                }`}
              >
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">{dueInfo.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: 3-DOTS MENU TRIGGER */}
        <div className="relative shrink-0 flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="More task options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Quick Menu Popover */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-8 z-40 w-44 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onToggleExpand();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg text-left cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {isExpanded ? 'Collapse details' : 'Subtasks & edit'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onCyclePriority(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg text-left cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Toggle priority</span>
                </button>

                {onMoveToToday && isOverdue && !isDone && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onMoveToToday(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#6366f1] dark:text-[#a78bfa] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-left cursor-pointer"
                  >
                    <CalendarArrowUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Move to Today</span>
                  </button>
                )}

                <div className="border-t border-[#e5e7eb] dark:border-[#334155] my-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {isProjected ? 'Stop repeat' : 'Delete task'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE / STOP REPEAT DIALOG (inline) */}
      {showDeleteConfirm && (
        <div
          className={`p-3 bg-rose-50/90 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150 ${
            !isExpanded ? 'rounded-b-xl' : ''
          }`}
        >
          <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-medium min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {isProjected ? 'Stop repeating this task?' : 'Delete this task?'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs h-7 px-2"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete(task.id);
              }}
              className="text-xs h-7 px-2.5"
            >
              {isProjected ? 'Stop Repeat' : 'Delete'}
            </Button>
          </div>
        </div>
      )}

      {/* INLINE EXPANDED PANEL: SUBTASKS CHECKLIST + DETAILS EDIT */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3.5 sm:p-4 border-t border-[#e5e7eb] dark:border-[#334155] bg-gray-50/70 dark:bg-slate-900/40 rounded-b-xl space-y-4 text-xs animate-in fade-in duration-200 overflow-x-hidden"
        >
          {isProjected && (
            <div className="px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200/70 dark:border-violet-800/50 text-[11px] text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 shrink-0" />
              <span>Upcoming repeat occurrence · Edits below update the repeating schedule.</span>
            </div>
          )}

          {/* SUBTASKS SECTION (Instant-save checklist) */}
          <div className="space-y-2.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#a78bfa] shrink-0" />
                Subtasks
              </span>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8] shrink-0">
                  {completedSubtasks} of {subtasks.length} done
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    subtaskProgress === 100
                      ? 'bg-emerald-500'
                      : 'bg-[#6366f1] dark:bg-[#a78bfa]'
                  }`}
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            )}

            {/* Subtask items */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(sub.id)}
                      className="mt-0.5 text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a78bfa] transition-colors shrink-0 cursor-pointer"
                      aria-label={
                        sub.completed ? 'Mark subtask incomplete' : 'Mark subtask completed'
                      }
                    >
                      {sub.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#6366f1] dark:text-[#a78bfa]" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      onClick={() => handleToggleSubtask(sub.id)}
                      className={`flex-1 min-w-0 text-xs leading-snug break-words [overflow-wrap:anywhere] cursor-pointer ${
                        sub.completed
                          ? 'line-through text-[#6b7280] dark:text-[#94a3b8]'
                          : 'text-[#111827] dark:text-[#f1f5f9]'
                      }`}
                    >
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-0.5 rounded-md text-gray-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                      aria-label="Delete subtask"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Subtask Input */}
            <div className="flex items-center gap-1.5 min-w-0">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="shrink-0 h-8 px-2.5 rounded-xl bg-[#6366f1] hover:bg-indigo-600 dark:bg-[#818cf8] dark:hover:bg-indigo-400 text-white dark:text-slate-900 font-semibold text-xs inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-[#e5e7eb] dark:border-[#334155]" />

          {/* TASK DETAILS EDIT FORM */}
          <form onSubmit={handleSaveDetails} className="space-y-3.5 min-w-0">
            {/* Title edit */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Task Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
                placeholder="Task title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Notes
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add details, links, or notes..."
                className="w-full min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              />
            </div>

            {/* Priority Toggle */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] p-1">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPriority(p)}
                    className={`min-w-0 py-1.5 px-1 text-[11px] font-medium rounded-lg capitalize truncate transition-colors cursor-pointer ${
                      editPriority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white font-semibold'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white font-semibold'
                          : 'bg-emerald-500 text-white font-semibold'
                        : 'text-[#6b7280] dark:text-[#94a3b8] hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date & Reminder (Full-width rows) */}
            <div className="grid grid-cols-1 gap-3 min-w-0">
              {!isProjected && (
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8] shrink-0" /> Date
                    </label>
                    {editDueDate && (
                      <button
                        type="button"
                        onClick={() => handleDueDateChange('')}
                        className="text-[10px] text-[#6b7280] hover:text-rose-500 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="block w-full min-w-0 max-w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
                  />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8] shrink-0" /> Reminder
                  </label>
                  {editReminder && (
                    <button
                      type="button"
                      onClick={() => setEditReminder('')}
                      className="text-[10px] text-[#6b7280] hover:text-rose-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={editReminder}
                  onChange={(e) => setEditReminder(e.target.value)}
                  className="block w-full min-w-0 max-w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
                />
              </div>

              {/* Repeat Picker (Instant-save) */}
              <RepeatPicker
                value={editRepeatRule}
                anchorDate={anchorForRepeat}
                onChange={(nextRule) => {
                  setEditRepeatRule(nextRule);
                  onUpdate(task.id, { repeat_rule: nextRule });
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs h-8 px-2.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> {isProjected ? 'Stop Repeat' : 'Delete'}
              </Button>

              <div className="flex items-center gap-2 ml-auto shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleExpand}
                  className="text-xs h-8 px-3"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 px-3.5 font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
