import React from 'react';
import { TaskFilterType } from '../../types/task';

interface TopSummaryBarProps {
  totalCount: number;
  todayCount: number;
  overdueCount: number;
  doneCount: number;
  activeFilter: TaskFilterType;
  onSelectFilter: (filter: TaskFilterType) => void;
}

export const TopSummaryBar: React.FC<TopSummaryBarProps> = ({
  totalCount,
  todayCount,
  overdueCount,
  doneCount,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex items-center justify-between px-1 text-xs text-[#6b7280] dark:text-[#94a3b8] font-medium select-none">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onSelectFilter('all')}
          className={`hover:underline cursor-pointer ${
            activeFilter === 'all' ? 'text-[#6366f1] dark:text-[#818cf8] font-bold' : ''
          }`}
        >
          {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => onSelectFilter('today')}
          className={`hover:underline cursor-pointer ${
            activeFilter === 'today' ? 'text-[#6366f1] dark:text-[#818cf8] font-bold' : ''
          }`}
        >
          {todayCount} due today
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => onSelectFilter('overdue')}
          className={`hover:underline cursor-pointer ${
            overdueCount > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
          } ${activeFilter === 'overdue' ? 'underline font-bold' : ''}`}
        >
          {overdueCount} overdue
        </button>
      </div>

      {doneCount > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('done')}
          className={`text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ${
            activeFilter === 'done' ? 'font-bold underline' : ''
          }`}
        >
          {doneCount} done
        </button>
      )}
    </div>
  );
};
