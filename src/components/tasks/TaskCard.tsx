import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TASK_CATEGORIES } from '../../types/task';
import { formatDueBadge, isTaskOverdue } from '../../utils/taskDate';
import { Button } from '../ui';

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onCyclePriority: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onDelete,
  onUpdate,
  onCyclePriority,
}) => {
  const isDone = task.status === 'done';
  const isOverdue = isTaskOverdue(task.due_date, task.status);
  const dueInfo = formatDueBadge(task.due_date, task.status);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit fields inside expanded state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editCategory, setEditCategory] = useState<TaskCategory | string>(task.category || 'General');
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');
  const [editReminder, setEditReminder] = useState(task.reminder_at ? task.reminder_at.slice(0, 16) : '');

  // Mobile swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Only swipe horizontally if vertical scroll is minimal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) < 120) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -70) {
      // Swiped left: Delete
      setShowDeleteConfirm(true);
    } else if (swipeOffset > 70) {
      // Swiped right: Toggle priority
      onCyclePriority(task.id);
    }
    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.stopPropagation();
    onUpdate(task.id, {
      title: editTitle.trim() || task.title,
      description: editDescription.trim() || null,
      category: editCategory,
      priority: editPriority,
      due_date: editDueDate || null,
      reminder_at: editReminder ? new Date(editReminder).toISOString() : null,
    });
    onToggleExpand();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset * 0.4}px)` : undefined,
      }}
      className={`relative rounded-xl border bg-white dark:bg-[#1e293b] shadow-xs transition-all duration-200 overflow-hidden ${
        isOverdue && !isDone
          ? 'border-l-4 border-l-rose-500 border-r-[#e5e7eb] border-y-[#e5e7eb] dark:border-r-[#334155] dark:border-y-[#334155]'
          : 'border-[#e5e7eb] dark:border-[#334155]'
      } ${isDone ? 'opacity-70 dark:opacity-60 bg-gray-50/50 dark:bg-slate-800/40' : ''}`}
    >
      {/* CARD MAIN ROW */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 flex items-start gap-3 cursor-pointer select-none group"
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
            className={`text-sm font-semibold text-[#111827] dark:text-[#f1f5f9] leading-snug break-words transition-all duration-150 ${
              isDone ? 'line-through text-[#6b7280] dark:text-[#94a3b8]' : ''
            }`}
          >
            {task.title}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Priority Badge */}
            {task.priority === 'high' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                High
              </span>
            )}
            {task.priority === 'medium' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Med
              </span>
            )}
            {task.priority === 'low' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Low
              </span>
            )}

            {/* Due Date Badge */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                  dueInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                    : dueInfo.isToday
                    ? 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#818cf8] border-indigo-200 dark:border-indigo-900'
                    : 'bg-gray-100 text-[#6b7280] dark:bg-slate-800 dark:text-[#94a3b8] border-gray-200 dark:border-slate-700'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {dueInfo.label}
              </span>
            )}

            {/* Category Badge */}
            {task.category && task.category !== 'General' && (
              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[#6b7280] dark:text-[#94a3b8] border border-gray-200/80 dark:border-slate-700">
                {task.category}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: 3-DOTS MENU TRIGGER */}
        <div className="relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
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
              <div className="absolute right-0 top-7 z-40 w-44 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onToggleExpand();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg text-left"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {isExpanded ? 'Collapse details' : 'Edit details'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onCyclePriority(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg text-left"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500" />
                  Toggle priority
                </button>

                <div className="border-t border-[#e5e7eb] dark:border-[#334155] my-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG (inline) */}
      {showDeleteConfirm && (
        <div className="p-3 bg-rose-50/90 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Delete this task?
          </span>
          <div className="flex items-center gap-1.5">
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
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* INLINE EXPANDED DETAILS (Smooth inline expand without modal) */}
      {isExpanded && (
        <form
          onSubmit={handleSaveDetails}
          onClick={(e) => e.stopPropagation()}
          className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] bg-gray-50/70 dark:bg-slate-900/40 space-y-3.5 text-xs animate-in fade-in duration-200"
        >
          {/* Title edit */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Task Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              placeholder="Task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Description / Notes</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add details, links, or notes..."
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-2.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Toggle */}
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Priority</label>
              <div className="flex rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] p-0.5">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPriority(p)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                      editPriority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white font-semibold'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white font-semibold'
                          : 'bg-emerald-500 text-white font-semibold'
                        : 'text-[#6b7280] dark:text-[#94a3b8]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date & Reminder */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8]" /> Due Date
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-2.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8]" /> Reminder
              </label>
              <input
                type="datetime-local"
                value={editReminder}
                onChange={(e) => setEditReminder(e.target.value)}
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-2 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs h-8 px-2.5"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleExpand}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8 px-3.5 font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
