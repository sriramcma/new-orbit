import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  formatMonthLabel,
  getPrevMonth,
  getNextMonth,
  getCurrentMonthString,
} from '../../utils/budgetUtils';

interface MonthSelectorProps {
  currentMonth: string;
  onMonthChange: (newMonth: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onMonthChange }) => {
  const systemCurrentMonth = getCurrentMonthString();
  const isCurrentMonth = currentMonth === systemCurrentMonth;

  const handlePrev = () => {
    onMonthChange(getPrevMonth(currentMonth));
  };

  const handleNext = () => {
    onMonthChange(getNextMonth(currentMonth));
  };

  const handleResetCurrent = () => {
    onMonthChange(systemCurrentMonth);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-[#1e293b] rounded-xl px-3 py-2 border border-[#e5e7eb] dark:border-[#334155] shadow-xs transition-colors duration-200">
      <button
        type="button"
        onClick={handlePrev}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
        aria-label="Previous month"
        title="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight">
          {formatMonthLabel(currentMonth)}
        </span>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={handleResetCurrent}
            className="flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] dark:text-[#818cf8] bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60 transition-colors cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900"
            title="Jump to current month"
          >
            <Calendar className="w-2.5 h-2.5" />
            Today
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
        aria-label="Next month"
        title="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
