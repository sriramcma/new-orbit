import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Debt, DebtDirection, DebtTabType } from '../types/debt';
import { debtService } from '../services/debtService';
import { formatCurrency, getDefaultReturnDate, getTodayString } from '../utils/debtDate';
import { DebtCard } from '../components/debts/DebtCard';
import { AddDebtSheet } from '../components/debts/AddDebtSheet';
import { SettleDialog } from '../components/debts/SettleDialog';
import { DebtSchemaModal } from '../components/debts/DebtSchemaModal';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Button } from '../components/ui';

export const BorrowLendPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DebtTabType>('borrowed');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Modals
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [settleDebtTarget, setSettleDebtTarget] = useState<Debt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load & Seed samples if empty
  const loadDebts = useCallback(async () => {
    setLoading(true);
    const { debts: fetched } = await debtService.getDebts(userId);

    if (fetched.length === 0) {
      // Seed friendly starter examples
      const sample1 = await debtService.createDebt(userId, {
        person: 'Ramesh (Lunch split)',
        amount: 350,
        direction: 'borrowed',
        return_date: getTodayString(),
        notes: 'Office cafeteria bill split',
      });
      const sample2 = await debtService.createDebt(userId, {
        person: 'Kavitha',
        amount: 2500,
        direction: 'lent',
        return_date: getDefaultReturnDate(),
        notes: 'Weekend trip advance',
      });
      setDebts([sample1.debt, sample2.debt]);
    } else {
      setDebts(fetched);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // 2. Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id || user.id.startsWith('demo-')) {
      return;
    }

    try {
      const channel = supabase
        .channel(`public:debts:user_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debts',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newDebt = payload.new as Debt;
              setDebts((prev) => {
                if (prev.some((d) => d.id === newDebt.id)) return prev;
                return [newDebt, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Debt;
              setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setDebts((prev) => prev.filter((d) => d.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription error for debts:', e);
    }
  }, [user?.id]);

  // Calculations for summary cards
  const stats = useMemo(() => {
    const pendingBorrowed = debts.filter((d) => d.direction === 'borrowed' && d.status === 'pending');
    const pendingLent = debts.filter((d) => d.direction === 'lent' && d.status === 'pending');
    const settledList = debts.filter((d) => d.status === 'settled');

    const totalBorrowedAmount = pendingBorrowed.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalLentAmount = pendingLent.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      borrowedCount: pendingBorrowed.length,
      borrowedTotal: totalBorrowedAmount,
      lentCount: pendingLent.length,
      lentTotal: totalLentAmount,
      settledCount: settledList.length,
    };
  }, [debts]);

  // Filtered list based on active tab & search
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        // Tab filtering
        if (activeTab === 'borrowed') {
          if (d.direction !== 'borrowed' || d.status !== 'pending') return false;
        } else if (activeTab === 'lent') {
          if (d.direction !== 'lent' || d.status !== 'pending') return false;
        } else if (activeTab === 'settled') {
          if (d.status !== 'settled') return false;
        }

        // Search filtering
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchPerson = d.person.toLowerCase().includes(query);
          const matchNotes = d.notes ? d.notes.toLowerCase().includes(query) : false;
          const matchAmount = String(d.amount).includes(query);
          if (!matchPerson && !matchNotes && !matchAmount) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pending sort by return date; settled sort by settled_at or return_date
        return (a.return_date || '').localeCompare(b.return_date || '');
      });
  }, [debts, activeTab, searchQuery]);

  // Handlers
  const handleAddDebt = async (debtData: {
    person: string;
    amount: number;
    direction: DebtDirection;
    return_date: string;
    notes?: string | null;
  }) => {
    try {
      const res = await debtService.createDebt(userId, debtData);
      setDebts((prev) => [res.debt, ...prev.filter((d) => d.id !== res.debt.id)]);
      // Switch tab to the relevant direction
      setActiveTab(debtData.direction);
      showToast(`Record added for ${debtData.person}`);
    } catch (e) {
      showToast('Error saving record');
    }
  };

  const handleUpdateDebt = async (debtId: string, updates: Partial<Debt>) => {
    try {
      const res = await debtService.updateDebt(userId, debtId, updates);
      setDebts((prev) => prev.map((d) => (d.id === debtId ? res.debt : d)));
      showToast('Record updated successfully');
    } catch (e) {
      showToast('Failed to update record');
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    const toDelete = debts.find((d) => d.id === debtId);
    try {
      setDebts((prev) => prev.filter((d) => d.id !== debtId));
      await debtService.deleteDebt(userId, debtId);
      showToast(toDelete ? `Deleted record with ${toDelete.person}` : 'Record deleted');
    } catch (e) {
      showToast('Failed to delete record');
    }
  };

  const handleConfirmSettle = async (logToBudget: boolean) => {
    if (!settleDebtTarget) return;
    const target = settleDebtTarget;
    setSettleDebtTarget(null);

    try {
      const { debt, loggedToBudget } = await debtService.settleDebt(userId, target.id, logToBudget);
      setDebts((prev) => prev.map((d) => (d.id === target.id ? debt : d)));

      if (loggedToBudget) {
        showToast(`Settled with ${target.person} & logged in Budget!`);
      } else {
        showToast(`Settled with ${target.person}!`);
      }
    } catch (e) {
      showToast('Failed to settle record');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] transition-colors duration-200 pb-24 text-[#111827] dark:text-[#f1f5f9]">
      <div className="max-w-[480px] mx-auto px-4 pt-3 space-y-4">

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* TOP BAR / TITLE */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
                Borrow & Lend
              </h1>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
                Personal lending & debt tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              title="Supabase Schema & SQL"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-white dark:hover:bg-[#1e293b] border border-transparent hover:border-[#e5e7eb] dark:hover:border-[#334155] transition-all"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS (I Owe vs Owed to Me) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* I OWE (BORROWED) */}
          <div
            onClick={() => setActiveTab('borrowed')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 select-none ${
              activeTab === 'borrowed'
                ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30 dark:border-rose-900/80 shadow-xs'
                : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155] hover:border-rose-200 dark:hover:border-rose-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                  I Owe
                </span>
              </div>
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
            </div>

            <div className="mt-2">
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                ₹{formatCurrency(stats.borrowedTotal)}
              </div>
              <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                {stats.borrowedCount === 1 ? '1 person' : `${stats.borrowedCount} people`}
              </div>
            </div>
          </div>

          {/* OWED TO ME (LENT) */}
          <div
            onClick={() => setActiveTab('lent')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 select-none ${
              activeTab === 'lent'
                ? 'bg-orange-50/70 border-orange-300 dark:bg-orange-950/30 dark:border-orange-900/80 shadow-xs'
                : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155] hover:border-orange-200 dark:hover:border-orange-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8]">
                  Owed to Me
                </span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
            </div>

            <div className="mt-2">
              <div className="text-xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight">
                ₹{formatCurrency(stats.lentTotal)}
              </div>
              <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                {stats.lentCount === 1 ? '1 person' : `${stats.lentCount} people`}
              </div>
            </div>
          </div>

        </div>

        {/* SEARCH BAR (STICKY HEADER) */}
        <div className="sticky top-0 z-10 pt-1 pb-1 backdrop-blur-md bg-[#f9fafb]/90 dark:bg-[#0f172a]/90 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person or notes..."
              className="w-full rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-9 pr-3.5 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] placeholder:text-[#6b7280] dark:placeholder:text-[#94a3b8] focus:outline-none focus:border-[#6366f1] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* TABS: Borrowed | Lent | Settled */}
          <div className="flex rounded-xl bg-gray-200/70 dark:bg-slate-800/80 p-1 border border-[#e5e7eb] dark:border-[#334155]">
            <button
              type="button"
              onClick={() => setActiveTab('borrowed')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'borrowed'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
              }`}
            >
              <span>Borrowed</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'borrowed'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-300 dark:bg-slate-700 text-[#111827] dark:text-[#f1f5f9]'
                }`}
              >
                {stats.borrowedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lent')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'lent'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
              }`}
            >
              <span>Lent</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'lent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-300 dark:bg-slate-700 text-[#111827] dark:text-[#f1f5f9]'
                }`}
              >
                {stats.lentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settled')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'settled'
                  ? 'bg-slate-700 text-white dark:bg-slate-700 shadow-xs'
                  : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
              }`}
            >
              <span>Settled</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'settled'
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-300 dark:bg-slate-700 text-[#111827] dark:text-[#f1f5f9]'
                }`}
              >
                {stats.settledCount}
              </span>
            </button>
          </div>
        </div>

        {/* DEBT CARDS LIST */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
              Loading records...
            </div>
          ) : filteredDebts.length > 0 ? (
            filteredDebts.map((item) => (
              <DebtCard
                key={item.id}
                debt={item}
                isExpanded={expandedDebtId === item.id}
                onToggleExpand={() =>
                  setExpandedDebtId((curr) => (curr === item.id ? null : item.id))
                }
                onSettleClick={(d) => setSettleDebtTarget(d)}
                onDelete={handleDeleteDebt}
                onUpdate={handleUpdateDebt}
              />
            ))
          ) : (
            /* EMPTY STATES */
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[#e5e7eb] dark:border-[#334155] bg-white/40 dark:bg-[#1e293b]/40">
              {searchQuery ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                    No matching records
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
                    No debt records found matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : activeTab === 'borrowed' ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                    No borrowed money
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                    You don&apos;t owe money to anyone right now. You&apos;re completely debt-free! 🎉
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddSheetOpen(true)}
                    className="mt-2 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Record a loan
                  </Button>
                </div>
              ) : activeTab === 'lent' ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-500">
                    <HandCoins className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                    No money lent out
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                    Nobody owes you money currently. Tap + below when you lend money or split bills.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddSheetOpen(true)}
                    className="mt-2 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Record lent money
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] dark:text-[#f1f5f9]">
                    No settled records yet
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
                    When loans or borrowings are paid off and marked settled, they will be archived here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-20 right-4 sm:right-[max(1rem,calc(50%-220px))] z-30">
        <button
          type="button"
          onClick={() => setIsAddSheetOpen(true)}
          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-amber-500/20"
          aria-label="Add new debt or loan record"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* MODALS */}
      <AddDebtSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddDebt={handleAddDebt}
      />

      <SettleDialog
        debt={settleDebtTarget}
        isOpen={!!settleDebtTarget}
        onClose={() => setSettleDebtTarget(null)}
        onConfirm={handleConfirmSettle}
      />

      <DebtSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

    </div>
  );
};
