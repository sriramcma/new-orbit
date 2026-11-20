import React, { useState } from 'react';
import { Repeat, X, Check, ChevronDown } from 'lucide-react';
import { RepeatPreset, RepeatUnit, TaskRepeatRule, WeekdayIndex } from '../../types/task';
import {
  createPresetRule,
  formatRepeatLabel,
  WEEKDAY_OPTIONS,
} from '../../utils/taskRepeat';
import { parseDateOnly } from '../../utils/taskDate';
import { Button } from '../ui';

interface RepeatPickerProps {
  value: TaskRepeatRule | null;
  anchorDate?: string; // YYYY-MM-DD used to default weekday for weekly/custom
  onChange: (rule: TaskRepeatRule | null) => void;
}

const UNIT_OPTIONS: { value: RepeatUnit; label: string }[] = [
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
  { value: 'years', label: 'years' },
];

const PresetGlyph: React.FC<{ preset: RepeatPreset }> = ({ preset }) => {
  switch (preset) {
    case 'daily':
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="1.4" />
          <circle cx="9" cy="4.5" r="1.4" />
          <circle cx="13.5" cy="4.5" r="1.4" />
          <circle cx="4.5" cy="9" r="1.4" />
          <circle cx="9" cy="9" r="1.4" />
          <circle cx="13.5" cy="9" r="1.4" />
          <circle cx="4.5" cy="13.5" r="1.4" />
          <circle cx="9" cy="13.5" r="1.4" />
          <circle cx="13.5" cy="13.5" r="1.4" />
        </svg>
      );
    case 'weekdays':
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="1.4" />
          <circle cx="9" cy="4.5" r="1.4" />
          <circle cx="13.5" cy="4.5" r="1.1" opacity="0.35" />
          <circle cx="4.5" cy="9" r="1.4" />
          <circle cx="9" cy="9" r="1.4" />
          <circle cx="13.5" cy="9" r="1.1" opacity="0.35" />
          <circle cx="4.5" cy="13.5" r="1.4" />
          <circle cx="9" cy="13.5" r="1.4" />
          <circle cx="13.5" cy="13.5" r="1.1" opacity="0.35" />
        </svg>
      );
    case 'weekly':
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="1.1" opacity="0.35" />
          <circle cx="9" cy="4.5" r="1.1" opacity="0.35" />
          <circle cx="13.5" cy="4.5" r="1.4" />
          <circle cx="4.5" cy="9" r="1.1" opacity="0.35" />
          <circle cx="9" cy="9" r="1.1" opacity="0.35" />
          <circle cx="13.5" cy="9" r="1.4" />
          <circle cx="4.5" cy="13.5" r="1.1" opacity="0.35" />
          <circle cx="9" cy="13.5" r="1.1" opacity="0.35" />
          <circle cx="13.5" cy="13.5" r="1.4" />
        </svg>
      );
    case 'monthly':
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="1.5" />
          <circle cx="9" cy="4.5" r="1" opacity="0.3" />
          <circle cx="13.5" cy="4.5" r="1" opacity="0.3" />
          <circle cx="4.5" cy="9" r="1" opacity="0.3" />
          <circle cx="9" cy="9" r="1" opacity="0.3" />
          <circle cx="13.5" cy="9" r="1" opacity="0.3" />
          <circle cx="4.5" cy="13.5" r="1" opacity="0.3" />
          <circle cx="9" cy="13.5" r="1" opacity="0.3" />
          <circle cx="13.5" cy="13.5" r="1" opacity="0.3" />
        </svg>
      );
    case 'yearly':
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <line x1="9" y1="2.5" x2="9" y2="5.5" />
          <line x1="9" y1="12.5" x2="9" y2="15.5" />
          <line x1="2.5" y1="9" x2="5.5" y2="9" />
          <line x1="12.5" y1="9" x2="15.5" y2="9" />
          <line x1="4.4" y1="4.4" x2="6.5" y2="6.5" />
          <line x1="11.5" y1="11.5" x2="13.6" y2="13.6" />
          <line x1="13.6" y1="4.4" x2="11.5" y2="6.5" />
          <line x1="6.5" y1="11.5" x2="4.4" y2="13.6" />
        </svg>
      );
    case 'custom':
    default:
      return (
        <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="1.2" />
          <circle cx="9" cy="4.5" r="1.2" />
          <circle cx="13.5" cy="4.5" r="1.2" />
          <circle cx="4.5" cy="9" r="1.2" />
          <circle cx="9" cy="9" r="1.2" />
          <circle cx="13.5" cy="9" r="1.2" />
          <circle cx="4.5" cy="13.5" r="1.2" />
          <circle cx="9" cy="13.5" r="1.2" />
          <circle cx="13.5" cy="13.5" r="1.2" />
        </svg>
      );
  }
};

export const RepeatPicker: React.FC<RepeatPickerProps> = ({
  value,
  anchorDate,
  onChange,
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  // Draft state for "Repeat every ..." modal
  const [customInterval, setCustomInterval] = useState<string>('1');
  const [customUnit, setCustomUnit] = useState<RepeatUnit>('weeks');
  const [customWeekdays, setCustomWeekdays] = useState<WeekdayIndex[]>([1]);

  const activeLabel = formatRepeatLabel(value);

  const getDefaultWeekday = (): WeekdayIndex => {
    const d = anchorDate ? parseDateOnly(anchorDate) : new Date();
    return d.getDay() as WeekdayIndex;
  };

  const handleSelectPreset = (preset: RepeatPreset) => {
    setShowPresetMenu(false);
    if (preset === 'custom') {
      if (value) {
        setCustomInterval(String(Math.max(1, value.interval || 1)));
        setCustomUnit(value.unit || 'weeks');
        setCustomWeekdays(
          value.weekdays && value.weekdays.length > 0
            ? value.weekdays
            : [getDefaultWeekday()]
        );
      } else {
        setCustomInterval('1');
        setCustomUnit('weeks');
        setCustomWeekdays([getDefaultWeekday()]);
      }
      setShowUnitMenu(false);
      setShowCustomModal(true);
      return;
    }

    onChange(createPresetRule(preset, anchorDate));
  };

  const toggleWeekday = (dayIdx: WeekdayIndex) => {
    setCustomWeekdays((prev) => {
      if (prev.includes(dayIdx)) {
        // Keep at least one weekday selected
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayIdx);
      }
      return [...prev, dayIdx];
    });
  };

  const handleSaveCustom = () => {
    const parsed = parseInt(customInterval, 10);
    const safeInterval = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(999, parsed));
    const nextRule: TaskRepeatRule = {
      preset: 'custom',
      interval: safeInterval,
      unit: customUnit,
      ...(customUnit === 'weeks'
        ? {
            weekdays:
              customWeekdays.length > 0 ? customWeekdays : [getDefaultWeekday()],
          }
        : {}),
    };
    onChange(nextRule);
    setShowCustomModal(false);
    setShowUnitMenu(false);
  };

  const presetItems: { key: RepeatPreset; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekdays', label: 'Weekdays' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'custom', label: 'Customised' },
  ];

  return (
    <div className="space-y-1 min-w-0">
      <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
        <Repeat className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#a78bfa] shrink-0" />
        Repeat
      </label>

      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={() => setShowPresetMenu(true)}
          className={`flex-1 min-w-0 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition-colors cursor-pointer ${
            activeLabel
              ? 'border-[#6366f1]/50 bg-indigo-50/70 text-[#6366f1] dark:border-[#a78bfa]/40 dark:bg-indigo-950/40 dark:text-[#a78bfa] font-semibold'
              : 'border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:border-gray-300 dark:hover:border-slate-600'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{activeLabel || 'Repeat'}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
        </button>

        {activeLabel && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 w-8 h-8 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#6b7280] hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
            title="Clear repeat"
            aria-label="Clear repeat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* PRESET SELECTION OVERLAY (Matches Screenshot 1) */}
      {showPresetMenu && (
        <div
          onClick={() => setShowPresetMenu(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#a78bfa]" />
                Repeat Task
              </span>
              <button
                type="button"
                onClick={() => setShowPresetMenu(false)}
                className="p-1 rounded-lg text-[#6b7280] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                aria-label="Close repeat menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-1.5 space-y-0.5">
              {presetItems.map((item) => {
                const isSelected = value?.preset === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectPreset(item.key)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#a78bfa] font-semibold'
                        : 'text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <PresetGlyph preset={item.key} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}

              {value && (
                <>
                  <div className="border-t border-[#e5e7eb] dark:border-[#334155] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setShowPresetMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>Don&apos;t repeat</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMISED "Repeat every ..." DIALOG (Matches Screenshot 2) */}
      {showCustomModal && (
        <div
          onClick={() => {
            setShowCustomModal(false);
            setShowUnitMenu(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (showUnitMenu) setShowUnitMenu(false);
            }}
            className="w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-2xl p-5 space-y-5 animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-bold text-[#111827] dark:text-[#f1f5f9]">
              Repeat every ...
            </h3>

            {/* Interval + Unit Row */}
            <div className="flex items-center gap-4 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                onBlur={() => {
                  const n = parseInt(customInterval, 10);
                  setCustomInterval(String(Number.isNaN(n) || n < 1 ? 1 : Math.min(999, n)));
                }}
                className="w-16 text-center text-base font-semibold bg-transparent border-b-2 border-[#6366f1] dark:border-[#a78bfa] py-1.5 text-[#111827] dark:text-[#f1f5f9] focus:outline-none shrink-0"
                aria-label="Repeat interval"
              />

              {/* Custom Unit Dropdown (days / weeks / months / years) */}
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUnitMenu((prev) => !prev);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50 dark:bg-slate-800/80 text-sm font-medium text-[#111827] dark:text-[#f1f5f9] cursor-pointer"
                >
                  <span>{customUnit}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6b7280] dark:text-[#94a3b8] transition-transform ${
                      showUnitMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showUnitMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl bg-white dark:bg-[#0f172a] border border-[#e5e7eb] dark:border-[#334155] shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCustomUnit(opt.value);
                          setShowUnitMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          customUnit === opt.value
                            ? 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/60 dark:text-[#a78bfa] font-semibold'
                            : 'text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {customUnit === opt.value && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Circular Weekday Selector (Shown when unit === 'weeks', matches Screenshot 2) */}
            {customUnit === 'weeks' && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-[#6b7280] dark:text-[#94a3b8]">
                  Repeat on
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {WEEKDAY_OPTIONS.map((wd) => {
                    const active = customWeekdays.includes(wd.index);
                    return (
                      <button
                        key={wd.index}
                        type="button"
                        onClick={() => toggleWeekday(wd.index)}
                        className={`w-10 h-10 rounded-full text-[11px] font-semibold flex items-center justify-center border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#6366f1] border-[#6366f1] text-white dark:bg-[#a78bfa] dark:border-[#a78bfa] dark:text-slate-950 shadow-xs'
                            : 'bg-transparent border-[#d1d5db] dark:border-slate-600 text-[#6b7280] dark:text-slate-300 hover:border-[#6366f1] dark:hover:border-[#a78bfa]'
                        }`}
                        aria-pressed={active}
                      >
                        {wd.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb] dark:border-[#334155]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomModal(false);
                  setShowUnitMenu(false);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveCustom}
                className="text-xs px-4 font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
