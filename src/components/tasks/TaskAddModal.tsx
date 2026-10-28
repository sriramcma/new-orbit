import React, { useState } from 'react';
import { X, Calendar, Clock, Flag, Check, Plus } from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TASK_CATEGORIES } from '../../types/task';
import { Button, Input } from '../ui';
import { getTodayString } from '../../utils/taskDate';

interface TaskAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (
    title: string,
    extra: Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'status' | 'created_at'>>
  ) => Promise<void> | void;
}

export const TaskAddModal: React.FC<TaskAddModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [reminder, setReminder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSaveTask(title.trim(), {
        description: description.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
        reminder_at: reminder ? new Date(reminder).toISOString() : null,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('General');
      setPriority('medium');
      setDueDate('');
      setReminder('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] max-h-[90vh] bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200 border border-[#e5e7eb] dark:border-[#334155]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">New Task</h2>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Create with full details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Renew car insurance policy"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Description / Details</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra context, steps, or checklist items..."
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] focus:outline-none focus:border-[#6366f1]"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2.5 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Priority</label>
              <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-[#e5e7eb] dark:border-[#334155]">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
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
          </div>

          {/* Due date & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" /> Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                />
              </div>
              <div className="flex gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDueDate(getTodayString())}
                  className="text-[10px] text-[#6366f1] dark:text-[#818cf8] hover:underline"
                >
                  Set Today
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" /> Reminder
              </label>
              <input
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-end gap-2">
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
