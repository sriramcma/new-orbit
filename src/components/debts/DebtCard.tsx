import React, { useState, useRef } from 'react';
import {
  Calendar,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { Debt, DebtDirection } from '../../types/debt';
import { formatCurrency, formatReturnDateBadge } from '../../utils/debtDate';
import { Button } from '../ui';

interface DebtCardProps {
  debt: Debt;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSettleClick: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onUpdate: (debtId: string, updates: Partial<Debt>) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  isExpanded,
  onToggleExpand,
  onSettleClick,
  onDelete,
  onUpdate,
}) => {
  const isSettled = debt.status === 'settled';
  const isBorrowed = debt.direction === 'borrowed';

  const dateBadge = formatReturnDateBadge(debt.return_date, debt.status, debt.settled_at);

  // Menu and modal states
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit fields
  const [editPerson, setEditPerson] = useState(debt.person);
  const [editAmount, setEditAmount] = useState(String(debt.amount));
  const [editDirection, setEditDirection] = useState<DebtDirection>(debt.direction);
  const [editReturnDate, setEditReturnDate] = useState(debt.return_date);
  const [editNotes, setEditNotes] = useState(debt.notes || '');

  // Mobile swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Long press detection for quick settle
  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    if (!isSettled) {
      longPressTimer.current = window.setTimeout(() => {
        onSettleClick(debt);
      }, 700);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) < 120) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (swipeOffset < -70) {
      // Swiped left: Delete prompt
      setShowDeleteConfirm(true);
    }
    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSave = (e: React.FormEvent) => {
    e.stopPropagation();
    if (!editPerson.trim() || Number(editAmount) <= 0 || !editReturnDate) return;

    onUpdate(debt.id, {
      person: editPerson.trim(),
      amount: Number(editAmount),
      direction: editDirection,
      return_date: editReturnDate,
      notes: editNotes.trim() || null,
    });
    onToggleExpand();
  };

  // Border and accent styling
  let borderBarColor = 'bg-slate-400 dark:bg-slate-500';
  if (!isSettled) {
    borderBarColor = isBorrowed ? 'bg-rose-500' : 'bg-orange-500';
  }

  let cardBgClass = 'bg-white dark:bg-[#1e293b]';
  if (isSettled) {
    cardBgClass = 'bg-gray-50/70 dark:bg-slate-800/40 opacity-75';
  } else if (dateBadge.isToday) {
    cardBgClass = 'bg-amber-50/50 dark:bg-amber-950/20';
  }

  const borderClass = dateBadge.isOverdue && !isSettled
    ? 'border-rose-400 dark:border-rose-700/80 ring-1 ring-rose-400/20'
    : 'border-[#e5e7eb] dark:border-[#334155]';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset * 0.4}px)` : undefined,
      }}
      className={`relative rounded-xl border ${borderClass} ${cardBgClass} shadow-xs transition-all duration-200 overflow-hidden`}
    >
      {/* LEFT COLOR ACCENT BAR */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderBarColor}`} />

      {/* CARD MAIN ROW */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 pl-4 flex items-start justify-between gap-3 cursor-pointer select-none group"
      >
        {/* LEFT: Person & Badges */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9] truncate">
              {debt.person}
            </span>

            {/* DIRECTION BADGE */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                isSettled
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  : isBorrowed
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
              }`}
            >
              {isBorrowed ? (
                <>
                  <ArrowDownLeft className="w-3 h-3" />
                  Borrowed
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-3 h-3" />
                  Lent
                </>
              )}
            </span>
          </div>

          {/* NOTES PREVIEW */}
          {debt.notes && (
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] truncate mt-1">
              {debt.notes}
            </p>
          )}

          {/* DATE BADGE */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                dateBadge.isSettled
                  ? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                  : dateBadge.isOverdue
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 font-semibold'
                  : dateBadge.isToday
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-semibold'
                  : dateBadge.isTomorrow
                  ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              {dateBadge.isOverdue && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              {dateBadge.isSettled ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              {dateBadge.label}
            </span>
          </div>
        </div>

        {/* RIGHT: Amount & Action Button */}
        <div className="flex flex-col items-end shrink-0 gap-1.5">
          <span
            className={`text-base font-extrabold tracking-tight ${
              isSettled
                ? 'text-slate-400 dark:text-slate-500 line-through'
                : isBorrowed
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}
          >
            ₹{formatCurrency(debt.amount)}
          </span>

          <div className="flex items-center gap-1">
            {!isSettled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettleClick(debt);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#6366f1] hover:bg-indigo-600 text-white transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                title="Mark Settled"
              >
                <CheckCircle2 className="w-3 h-3" />
                Settle
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-[#6b7280] hover:text-[#111827] dark:hover:text-[#f1f5f9] rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-12 z-20 w-36 rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {!isSettled && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onSettleClick(debt);
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Settled
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              if (!isExpanded) onToggleExpand();
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Record
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              setShowDeleteConfirm(true);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* DELETE CONFIRM INLINE OVERLAY */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Delete debt record with <strong>{debt.person}</strong>?</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete(debt.id);
              }}
              className="px-2.5 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-2xs"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* INLINE EXPANDED EDIT FORM */}
      {isExpanded && (
        <form
          onSubmit={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="border-t border-[#e5e7eb] dark:border-[#334155] p-3.5 bg-gray-50/60 dark:bg-slate-900/40 space-y-3 text-xs animate-in fade-in duration-150"
        >
          {/* DIRECTION PICKER */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">Direction</label>
            <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-[#1e293b] p-1 rounded-lg border border-[#e5e7eb] dark:border-[#334155]">
              <button
                type="button"
                onClick={() => setEditDirection('borrowed')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  editDirection === 'borrowed'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[#6b7280] dark:text-[#94a3b8]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Borrowed (I Owe)
              </button>
              <button
                type="button"
                onClick={() => setEditDirection('lent')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  editDirection === 'lent'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-[#6b7280] dark:text-[#94a3b8]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Lent (Owed to Me)
              </button>
            </div>
          </div>

          {/* PERSON & AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Person Name
              </label>
              <input
                type="text"
                value={editPerson}
                onChange={(e) => setEditPerson(e.target.value)}
                placeholder="Person name"
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-6 pr-3 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>
            </div>
          </div>

          {/* RETURN DATE */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#6366f1] dark:text-[#818cf8]" />
              Return Date
            </label>
            <input
              type="date"
              value={editReturnDate}
              onChange={(e) => setEditReturnDate(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
              required
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#6b7280]" />
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Notes or reason for loan..."
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-1.5 text-xs text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {!isSettled && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleExpand();
                    onSettleClick(debt);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Settled
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleExpand}
                className="text-xs py-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs py-1 font-semibold"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
