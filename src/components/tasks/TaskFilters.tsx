import React from 'react';
import { TaskFilterType } from '../../types/task';

interface TaskFiltersProps {
  activeFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    done: number;
  };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const tabs: { key: TaskFilterType; label: string; count: number; alert?: boolean }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'today', label: 'Today', count: counts.today },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, alert: counts.overdue > 0 },
    { key: 'done', label: 'Done', count: counts.done },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar select-none">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-[#6366f1] text-white dark:bg-[#818cf8] dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-white border border-[#e5e7eb] dark:border-[#334155]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : tab.alert
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                  : 'bg-gray-100 dark:bg-slate-700/80 text-[#6b7280] dark:text-[#94a3b8]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
