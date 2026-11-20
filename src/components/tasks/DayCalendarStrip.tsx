import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatMonthYearLabel,
  formatWeekdayHeading,
  getMonthGridDays,
  getTodayString,
  getWeekDays,
  parseDateOnly,
  shiftDateByDays,
} from '../../utils/taskDate';

export interface DayTaskDotInfo {
  pending: number;
  done: number;
  hasOverdue: boolean;
}

interface DayCalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  dayCountsMap: Record<string, DayTaskDotInfo>;
}

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DayCalendarStrip: React.FC<DayCalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  dayCountsMap,
}) => {
  const todayStr = getTodayString();
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const selectedParsed = useMemo(() => parseDateOnly(selectedDate), [selectedDate]);
  const [viewYear, setViewYear] = useState(selectedParsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedParsed.getMonth());

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const monthGridDays = useMemo(
    () => getMonthGridDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const weekdayHeading = useMemo(() => formatWeekdayHeading(selectedDate), [selectedDate]);
  const monthYearLabel = useMemo(() => formatMonthYearLabel(selectedDate), [selectedDate]);

  const monthPickerTitle = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Touch swipe on the 7-day strip to navigate previous/next week
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      onSelectDate(shiftDateByDays(selectedDate, diffX < 0 ? 7 : -7));
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleToggleMonth = () => {
    if (!isMonthOpen) {
      setViewYear(selectedParsed.getFullYear());
      setViewMonth(selectedParsed.getMonth());
    }
    setIsMonthOpen((prev) => !prev);
  };

  const handleStepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handlePickFromMonth = (dateStr: string) => {
    onSelectDate(dateStr);
    setIsMonthOpen(false);
  };

  const handleJumpToday = () => {
    onSelectDate(todayStr);
    const todayDate = parseDateOnly(todayStr);
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setIsMonthOpen(false);
  };

  return (
    <div className="w-full max-w-full rounded-2xl bg-white dark:bg-[#0b1120] border border-[#e5e7eb] dark:border-[#1e293b] px-3.5 pt-4 pb-3 shadow-xs transition-colors duration-200 select-none">
      {/* TOP HEADER ROW: Weekday (serif) + Month/Year dropdown */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="font-editorial text-[30px] sm:text-[32px] leading-none font-medium tracking-tight text-[#111827] dark:text-white truncate">
            {weekdayHeading}
          </h2>
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#6366f1] hover:bg-indigo-100 dark:bg-violet-500/15 dark:text-[#a78bfa] dark:hover:bg-violet-500/25 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectDate(shiftDateByDays(selectedDate, -7))}
            className="p-1 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Previous week"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleMonth}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold tracking-wider uppercase text-[#111827] dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
            aria-expanded={isMonthOpen}
            aria-label="Toggle month calendar"
          >
            <span>{monthYearLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMonthOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => onSelectDate(shiftDateByDays(selectedDate, 7))}
            className="p-1 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Next week"
            aria-label="Next week"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7-DAY WEEK STRIP (M T W T F S S) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-7 gap-1 mt-4"
      >
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const isToday = day.dateStr === todayStr;
          const info = dayCountsMap[day.dateStr];
          const hasPending = (info?.pending || 0) > 0;
          const hasDoneOnly = !hasPending && (info?.done || 0) > 0;
          const hasOverdue = info?.hasOverdue;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={`min-w-0 flex flex-col items-center justify-center py-2.5 px-0.5 rounded-2xl transition-all duration-150 cursor-pointer focus:outline-none ${
                isSelected
                  ? 'bg-indigo-50/95 text-[#6366f1] ring-1 ring-indigo-200/80 dark:bg-white/[0.09] dark:text-[#a78bfa] dark:ring-white/[0.08]'
                  : isToday
                  ? 'text-[#111827] dark:text-slate-200 ring-1 ring-[#6366f1]/35 dark:ring-[#a78bfa]/35 hover:bg-gray-100/80 dark:hover:bg-white/[0.04]'
                  : 'text-[#6b7280] dark:text-slate-400 hover:bg-gray-100/70 dark:hover:bg-white/[0.04]'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${day.date.toDateString()}`}
            >
              <span
                className={`text-[11px] uppercase tracking-wider leading-none ${
                  isSelected
                    ? 'font-bold text-[#6366f1] dark:text-[#a78bfa]'
                    : 'font-semibold text-[#6b7280] dark:text-slate-400'
                }`}
              >
                {day.weekdayShort}
              </span>

              <span
                className={`font-editorial text-[22px] sm:text-[24px] leading-none mt-2 ${
                  isSelected
                    ? 'font-medium text-[#6366f1] dark:text-[#a78bfa]'
                    : isToday
                    ? 'font-medium text-[#111827] dark:text-slate-200'
                    : 'font-normal text-[#4b5563] dark:text-slate-400'
                }`}
              >
                {day.dayNumber}
              </span>

              {/* Subtle task indicator dot */}
              <span className="h-1.5 mt-1.5 flex items-center justify-center">
                {hasPending ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasOverdue
                        ? 'bg-rose-500'
                        : isSelected
                        ? 'bg-[#6366f1] dark:bg-[#a78bfa]'
                        : 'bg-[#6366f1]/65 dark:bg-[#a78bfa]/70'
                    }`}
                  />
                ) : hasDoneOnly ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* EXPANDABLE MONTH PICKER GRID */}
      {isMonthOpen && (
        <div className="mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#1e293b] animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
            <button
              type="button"
              onClick={() => handleStepMonth(-1)}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#111827] dark:text-slate-100">
              {monthPickerTitle}
            </span>
            <button
              type="button"
              onClick={() => handleStepMonth(1)}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_HEADERS.map((letter, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold uppercase text-[#6b7280] dark:text-slate-500 py-1"
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthGridDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const info = dayCountsMap[cell.dateStr];
              const hasPending = (info?.pending || 0) > 0;
              const hasDoneOnly = !hasPending && (info?.done || 0) > 0;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handlePickFromMonth(cell.dateStr)}
                  className={`min-w-0 flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#6366f1] text-white dark:bg-[#a78bfa] dark:text-slate-950 font-bold'
                      : isToday
                      ? 'bg-indigo-50 text-[#6366f1] dark:bg-white/[0.08] dark:text-[#a78bfa] font-semibold'
                      : cell.inMonth
                      ? 'text-[#111827] dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                      : 'text-gray-300 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="leading-none">{cell.dayNumber}</span>
                  <span className="h-1 mt-1 flex items-center justify-center">
                    {hasPending ? (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected
                            ? 'bg-white dark:bg-slate-950'
                            : info?.hasOverdue
                            ? 'bg-rose-500'
                            : 'bg-[#6366f1] dark:bg-[#a78bfa]'
                        }`}
                      />
                    ) : hasDoneOnly ? (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white dark:bg-slate-950' : 'bg-emerald-500'
                        }`}
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
