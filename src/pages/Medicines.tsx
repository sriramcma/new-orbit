import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Search,
  X,
  Plus,
  Database,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Medicine, MedicineStockStatus } from '../types/medicine';
import { medicineService } from '../services/medicineService';
import { MedicineCard } from '../components/MedicineCard';
import { AddMedicineSheet } from '../components/AddMedicineSheet';
import { MedicineSchemaModal } from '../components/medicines/MedicineSchemaModal';

type FilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon';

export const MedicinesPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load medicines
  const loadMedicines = async () => {
    const { medicines: data } = await medicineService.fetchMedicines(userId);
    setMedicines(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMedicines();
    const unsubscribe = medicineService.subscribeToMedicines(userId, () => {
      loadMedicines();
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Summary calculations
  const summary = useMemo(() => {
    return medicineService.calculateSummary(medicines);
  }, [medicines]);

  // Filtering & Sorting
  const filteredAndSortedMedicines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return medicines
      .filter((med) => {
        // Search query filter (name or purpose)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = med.name.toLowerCase().includes(q);
          const matchPurpose = med.purpose.toLowerCase().includes(q);
          const matchNotes = (med.dosage_notes || '').toLowerCase().includes(q);
          if (!matchName && !matchPurpose && !matchNotes) return false;
        }

        // Status chip filter
        if (activeFilter === 'in_stock') return med.stock_status === 'in_stock';
        if (activeFilter === 'low_stock') return med.stock_status === 'low_stock';
        if (activeFilter === 'out_of_stock') return med.stock_status === 'out_of_stock';
        if (activeFilter === 'expiring_soon') {
          if (!med.expiry_date) return false;
          const exp = new Date(med.expiry_date);
          exp.setHours(0, 0, 0, 0);
          return exp <= thirtyDaysFromNow;
        }
        return true;
      })
      .sort((a, b) => {
        // Priority 1: Out of stock first
        if (a.stock_status === 'out_of_stock' && b.stock_status !== 'out_of_stock') return -1;
        if (b.stock_status === 'out_of_stock' && a.stock_status !== 'out_of_stock') return 1;

        // Priority 2: Low stock second
        if (a.stock_status === 'low_stock' && b.stock_status !== 'low_stock') return -1;
        if (b.stock_status === 'low_stock' && a.stock_status !== 'low_stock') return 1;

        // Priority 3: Expiring soon (<30 days)
        const isExpiringSoon = (dateStr?: string | null) => {
          if (!dateStr) return false;
          const exp = new Date(dateStr);
          exp.setHours(0, 0, 0, 0);
          return exp <= thirtyDaysFromNow;
        };
        const aSoon = isExpiringSoon(a.expiry_date);
        const bSoon = isExpiringSoon(b.expiry_date);
        if (aSoon && !bSoon) return -1;
        if (bSoon && !aSoon) return 1;

        // Priority 4: Alphabetical by name
        return a.name.localeCompare(b.name);
      });
  }, [medicines, activeFilter, searchQuery]);

  // Handlers
  const handleAddMedicine = async (data: {
    name: string;
    purpose: string;
    dosage_notes?: string | null;
    stock_status: MedicineStockStatus;
    expiry_date?: string | null;
  }) => {
    const res = await medicineService.addMedicine(userId, data);
    setMedicines((prev) => [res.medicine, ...prev]);
    showToast(`Added "${res.medicine.name}" to cabinet`);
  };

  const handleUpdateMedicine = async (id: string, updates: Partial<Medicine>) => {
    const res = await medicineService.updateMedicine(userId, id, updates);
    setMedicines((prev) => prev.map((m) => (m.id === id ? res.medicine : m)));
    showToast(`Updated "${res.medicine.name}"`);
  };

  const handleRestock = async (id: string) => {
    const res = await medicineService.updateStock(userId, id, 'in_stock');
    setMedicines((prev) => prev.map((m) => (m.id === id ? res.medicine : m)));
    showToast(`Restocked "${res.medicine.name}" to In Stock!`);
  };

  const handleDeleteMedicine = async (id: string) => {
    const target = medicines.find((m) => m.id === id);
    await medicineService.deleteMedicine(userId, id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    showToast(`Removed "${target?.name || 'item'}" from cabinet`);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f9fafb] dark:bg-[#0f172a] transition-colors duration-200">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-full shadow-lg border border-gray-700 animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Medicines
                </h1>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
                  {summary.total} in cabinet
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Home medicine vault, dosages &amp; stock tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title="Search medicines"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* SQL Schema Modal Button */}
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View & Copy Database Schema"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Top Quick Add */}
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(true)}
              className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Add Medicine"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SEARCH INPUT BAR */}
        {isSearchOpen && (
          <div className="mt-2.5 relative animate-in fade-in slide-in-from-top-2 duration-150">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, purpose, or dosage..."
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-slate-800/80 border border-[#e5e7eb] dark:border-slate-700 rounded-xl text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-[480px] mx-auto w-full">
        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-3 gap-2">
          {/* Total In Cabinet */}
          <div className="p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-[#e5e7eb] dark:border-[#334155] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-500" />
              In Cabinet
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[#111827] dark:text-[#f1f5f9]">
                {summary.total}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {summary.inStock} ok
              </span>
            </div>
          </div>

          {/* Running Low */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'low_stock' ? 'all' : 'low_stock')}
            className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
              summary.lowStock > 0
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155]'
            }`}
          >
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                summary.lowStock > 0
                  ? 'text-amber-800 dark:text-amber-400'
                  : 'text-[#6b7280] dark:text-[#94a3b8]'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Running Low
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold ${
                  summary.lowStock > 0
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-[#111827] dark:text-[#f1f5f9]'
                }`}
              >
                {summary.lowStock}
              </span>
              {summary.lowStock > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  alert
                </span>
              )}
            </div>
          </div>

          {/* Out of Stock */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
            className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
              summary.outOfStock > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155]'
            }`}
          >
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                summary.outOfStock > 0
                  ? 'text-rose-800 dark:text-rose-400'
                  : 'text-[#6b7280] dark:text-[#94a3b8]'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-500" />
              Out of Stock
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold ${
                  summary.outOfStock > 0
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-[#111827] dark:text-[#f1f5f9]'
                }`}
              >
                {summary.outOfStock}
              </span>
              {summary.outOfStock > 0 && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                  refill
                </span>
              )}
            </div>
          </div>
        </div>

        {/* EXPIRING SOON WARNING BANNER (if any) */}
        {(summary.expiringSoon > 0 || summary.expired > 0) && (
          <div
            onClick={() => setActiveFilter(activeFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
            className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                {summary.expired > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold mr-1">
                    {summary.expired} expired!
                  </span>
                )}
                {summary.expiringSoon > 0 && (
                  <span>{summary.expiringSoon} expiring within 30 days</span>
                )}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {activeFilter === 'expiring_soon' ? 'Clear' : 'View'}
            </span>
          </div>
        )}

        {/* HORIZONTAL FILTER CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-slate-750'
            }`}
          >
            All ({summary.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('in_stock')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'in_stock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-slate-750'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>In Stock ({summary.inStock})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('low_stock')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-slate-750'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Low Stock ({summary.lowStock})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('out_of_stock')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-slate-750'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Out of Stock ({summary.outOfStock})</span>
          </button>

          {(summary.expiringSoon > 0 || summary.expired > 0) && (
            <button
              type="button"
              onClick={() => setActiveFilter('expiring_soon')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFilter === 'expiring_soon'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e293b] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-slate-750'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Expiring ({summary.expiringSoon + summary.expired})</span>
            </button>
          )}
        </div>

        {/* LIST OF MEDICINES */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#6b7280] dark:text-[#94a3b8]">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading medicine cabinet...</span>
          </div>
        ) : filteredAndSortedMedicines.length > 0 ? (
          <div className="space-y-2.5">
            {filteredAndSortedMedicines.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onUpdate={handleUpdateMedicine}
                onDelete={handleDeleteMedicine}
                onRestock={handleRestock}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-dashed border-[#d1d5db] dark:border-[#334155]">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-3">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
              {searchQuery
                ? 'No matching medicines found'
                : activeFilter !== 'all'
                ? `No medicines in "${activeFilter.replace('_', ' ')}"`
                : 'Your medicine cabinet is empty'}
            </h3>
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 max-w-[260px] mx-auto">
              {searchQuery
                ? 'Try searching with different keywords like fever, pain, or medicine brand.'
                : 'Keep track of paracetamol, first aid essentials, allergy tablets, and expiry dates.'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (searchQuery || activeFilter !== 'all') {
                  setSearchQuery('');
                  setActiveFilter('all');
                } else {
                  setIsAddSheetOpen(true);
                }
              }}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {searchQuery || activeFilter !== 'all' ? (
                <span>Reset Filters</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add First Medicine</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON (+ Add Medicine) */}
      <div className="fixed bottom-22 right-4 z-30 max-w-[480px] w-full pointer-events-none mx-auto flex justify-end pr-4">
        <button
          type="button"
          onClick={() => setIsAddSheetOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer font-semibold text-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* ADD MEDICINE BOTTOM SHEET */}
      <AddMedicineSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSubmit={handleAddMedicine}
      />

      {/* DATABASE SCHEMA MODAL */}
      <MedicineSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
