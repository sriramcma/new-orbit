import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, ListChecks, Circle } from 'lucide-react';
import { Subtask, Task, TaskPriority, TaskRepeatRule } from '../../types/task';
import { Button, Input } from '../ui';
import { getTodayString } from '../../utils/taskDate';
import { syncRuleWithAnchorDate } from '../../utils/taskRepeat';
import { RepeatPicker } from './RepeatPicker';

interface TaskAddModalProps {
  isOpen: boolean;
  defaultDueDate?: string;
  onClose: () => void;
  onSaveTask: (
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>>
  ) => Promise<void> | void;
}

export const TaskAddModal: React.FC<TaskAddModalProps> = ({
  isOpen,
  defaultDueDate,
  onClose,
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(defaultDueDate || getTodayString());
  const [reminder, setReminder] = useState('');
  const [repeatRule, setRepeatRule] = useState<TaskRepeatRule | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [draftSubtask, setDraftSubtask] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form cleanly whenever modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultDueDate || getTodayString());
      setReminder('');
      setRepeatRule(null);
      setSubtasks([]);
      setDraftSubtask('');
      setSubmitting(false);
    }
  }, [isOpen, defaultDueDate]);

  if (!isOpen) return null;

  const handleDueDateChange = (nextDate: string) => {
    setDueDate(nextDate);
    if (nextDate) {
      setRepeatRule((prev) => syncRuleWithAnchorDate(prev, nextDate));
    }
  };

  const handleAddDraftSubtask = () => {
    const trimmed = draftSubtask.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: trimmed,
        completed: false,
      },
    ]);
    setDraftSubtask('');
  };

  const handleRemoveDraftSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    const finalDueDate = dueDate || defaultDueDate || getTodayString();
    const finalRepeatRule = syncRuleWithAnchorDate(repeatRule, finalDueDate);

    // Include any pending typed subtask automatically
    const finalSubtasks = draftSubtask.trim()
      ? [
          ...subtasks,
          {
            id:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: draftSubtask.trim(),
            completed: false,
          },
        ]
      : subtasks;

    setSubmitting(true);
    try {
      await onSaveTask(title.trim(), {
        description: description.trim() || null,
        priority,
        due_date: finalDueDate,
        reminder_at: reminder ? new Date(reminder).toISOString() : null,
        repeat_rule: finalRepeatRule,
        subtasks: finalSubtasks,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[90dvh] bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200 border border-[#e5e7eb] dark:border-[#334155]"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center font-bold shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] truncate">New Task</h2>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] truncate">Add details &amp; subtasks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form wrapper with scrollable body + pinned footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 text-xs min-w-0">
            {/* Title */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Finish quarterly design review"
                required
                autoFocus
              />
            </div>

            {/* Subtasks Builder */}
            <div className="space-y-2 min-w-0">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#a78bfa] shrink-0" />
                Subtasks
                {subtasks.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#a78bfa]">
                    {subtasks.length}
                  </span>
                )}
              </label>

              {subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-[#e5e7eb] dark:border-[#334155] min-w-0"
                    >
                      <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="flex-1 min-w-0 text-xs text-[#111827] dark:text-[#f1f5f9] break-words [overflow-wrap:anywhere]">
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftSubtask(sub.id)}
                        className="p-0.5 text-gray-400 hover:text-rose-500 shrink-0 cursor-pointer"
                        aria-label="Remove subtask"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  type="text"
                  value={draftSubtask}
                  onChange={(e) => setDraftSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDraftSubtask();
                    }
                  }}
                  placeholder="Add a subtask step..."
                  className="flex-1 min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1]"
                />
                <button
                  type="button"
                  onClick={handleAddDraftSubtask}
                  disabled={!draftSubtask.trim()}
                  className="shrink-0 h-8 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#111827] dark:text-[#f1f5f9] font-semibold text-xs inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add extra context or links..."
                className="w-full min-w-0 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1 min-w-0">
              <label className="block font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-[#e5e7eb] dark:border-[#334155]">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`min-w-0 py-1.5 px-1 text-[11px] font-semibold rounded-lg capitalize truncate transition-colors cursor-pointer ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-500 text-white shadow-xs'
                        : 'text-[#6b7280] dark:text-[#94a3b8]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Reminder (Full-width rows) */}
            <div className="grid grid-cols-1 gap-3.5 min-w-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8] shrink-0" /> Date
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDueDateChange(getTodayString())}
                    className="text-[10px] font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline cursor-pointer shrink-0"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="block w-full min-w-0 max-w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8] shrink-0" /> Reminder
                  </label>
                  {reminder && (
                    <button
                      type="button"
                      onClick={() => setReminder('')}
                      className="text-[10px] text-[#6b7280] hover:text-rose-500 cursor-pointer shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  className="block w-full min-w-0 max-w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              {/* Repeat Picker */}
              <RepeatPicker
                value={repeatRule}
                anchorDate={dueDate || defaultDueDate}
                onChange={setRepeatRule}
              />
            </div>
          </div>

          {/* Pinned Footer Submit */}
          <div className="shrink-0 px-4 sm:px-5 py-3.5 border-t border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-5 font-semibold"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
