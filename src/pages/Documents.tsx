import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  X,
  Plus,
  Database,
  AlertTriangle,
  AlertCircle,
  FolderLock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppDocument, DocumentCategory } from '../types/document';
import { documentService } from '../services/documentService';
import { DocumentCard } from '../components/DocumentCard';
import { UploadDocumentSheet } from '../components/UploadDocumentSheet';
import { DocumentSchemaModal } from '../components/documents/DocumentSchemaModal';
import { DOCUMENT_CATEGORIES, getCategoryMeta, getExpiryStatus } from '../utils/documentUtils';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterExpiringOnly, setFilterExpiringOnly] = useState<'all' | 'soon' | 'expired'>('all');

  // Inline expanded item
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Modals state
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Collapsed categories when viewing All
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.fetchDocuments(userId);
      setDocuments(docs);
    } catch (err) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    const unsub = documentService.subscribeToDocuments(userId, () => {
      loadDocuments();
    });
    return () => unsub();
  }, [userId]);

  // Derived summaries & counts
  const summary = useMemo(() => {
    let expiringSoon = 0;
    let expired = 0;

    documents.forEach((d) => {
      const exp = getExpiryStatus(d.expiry_date);
      if (exp.status === 'expired') expired++;
      if (exp.status === 'soon' || exp.status === 'today') expiringSoon++;
    });

    return {
      total: documents.length,
      expiringSoon,
      expired,
    };
  }, [documents]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Expiry filter
      if (filterExpiringOnly === 'expired') {
        if (getExpiryStatus(doc.expiry_date).status !== 'expired') return false;
      } else if (filterExpiringOnly === 'soon') {
        const s = getExpiryStatus(doc.expiry_date).status;
        if (s !== 'soon' && s !== 'today') return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesNotes = doc.notes?.toLowerCase().includes(q);
        const matchesCat = doc.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesCat) return false;
      }

      return true;
    });
  }, [documents, filterExpiringOnly, selectedCategory, searchQuery]);

  // Grouped documents by category for List View
  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== 'All' || filterExpiringOnly !== 'all') {
      return [{ category: selectedCategory as DocumentCategory, docs: filteredDocuments }];
    }

    const groups: { category: DocumentCategory; docs: AppDocument[] }[] = [];
    DOCUMENT_CATEGORIES.forEach((cat) => {
      const catDocs = filteredDocuments.filter((d) => d.category === cat.id);
      if (catDocs.length > 0) {
        groups.push({ category: cat.id, docs: catDocs });
      }
    });

    return groups;
  }, [filteredDocuments, selectedCategory, filterExpiringOnly]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Actions
  const handleUploadDocument = async (data: {
    file: File;
    title: string;
    category: DocumentCategory;
    expiry_date?: string | null;
    notes?: string | null;
  }) => {
    const uploaded = await documentService.uploadFile(userId, data.file);
    await documentService.addDocument(userId, {
      title: data.title,
      category: data.category,
      file_path: uploaded.filePath,
      file_type: uploaded.fileType,
      file_size: uploaded.fileSize,
      expiry_date: data.expiry_date || null,
      notes: data.notes || null,
    });
    await loadDocuments();
    showToast('Document uploaded ✓');
  };

  const handleUpdateDocument = async (id: string, updates: Partial<AppDocument>) => {
    await documentService.updateDocument(userId, id, updates);
    await loadDocuments();
    showToast('Document updated');
  };

  const handleDeleteDocument = async (id: string) => {
    await documentService.deleteDocument(userId, id);
    await loadDocuments();
    showToast('Document deleted');
  };

  const handleReplaceFile = async (id: string, file: File) => {
    const uploaded = await documentService.uploadFile(userId, file);
    await documentService.updateDocument(userId, id, {
      file_path: uploaded.filePath,
      file_type: uploaded.fileType,
      file_size: uploaded.fileSize,
    });
    await loadDocuments();
    showToast('File replaced ✓');
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-full px-4 pt-3 pb-24 overflow-x-hidden space-y-3.5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-gray-900/90 text-white dark:bg-white/95 dark:text-gray-900 text-xs font-semibold shadow-lg backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
              Documents
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
              Vault &amp; Warranties
            </span>
          </div>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
            Encrypted private vault with warranty expiry tracking
          </p>
        </div>

        {/* Action icons: Schema & Search */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSchemaModalOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
            title="Database schema"
          >
            <Database className="w-4 h-4 text-blue-500" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs transition-colors cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                : 'bg-white dark:bg-[#1e293b] text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] border-[#e5e7eb] dark:border-[#334155]'
            }`}
            title="Search documents"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP SUMMARY STRIP */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs flex items-center justify-between text-xs transition-colors duration-200">
        {/* Total Documents */}
        <button
          type="button"
          onClick={() => {
            setFilterExpiringOnly('all');
            setSelectedCategory('All');
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            filterExpiringOnly === 'all'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className="font-bold text-sm block text-[#111827] dark:text-[#f1f5f9]">
            {summary.total}
          </span>
          <span className="text-[10px] uppercase font-semibold">In Vault</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

        {/* Expiring Soon */}
        <button
          type="button"
          onClick={() => {
            setFilterExpiringOnly(filterExpiringOnly === 'soon' ? 'all' : 'soon');
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            filterExpiringOnly === 'soon'
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className={`font-bold text-sm block ${summary.expiringSoon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#111827] dark:text-[#f1f5f9]'}`}>
            {summary.expiringSoon > 0 ? `⚠️ ${summary.expiringSoon}` : '0'}
          </span>
          <span className="text-[10px] uppercase font-semibold">Expiring Soon</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

        {/* Expired */}
        <button
          type="button"
          onClick={() => {
            setFilterExpiringOnly(filterExpiringOnly === 'expired' ? 'all' : 'expired');
          }}
          className={`flex-1 text-center py-1 rounded-xl transition-all cursor-pointer ${
            filterExpiringOnly === 'expired'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold'
              : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827]'
          }`}
        >
          <span className={`font-bold text-sm block ${summary.expired > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#111827] dark:text-[#f1f5f9]'}`}>
            {summary.expired > 0 ? `🔴 ${summary.expired}` : '0'}
          </span>
          <span className="text-[10px] uppercase font-semibold">Expired</span>
        </button>
      </div>

      {/* SEARCH BAR (Expandable) */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, policy number, notes..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6b7280]" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#6b7280] hover:text-[#111827]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* CATEGORY FILTER (Horizontal chips) */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 min-w-max px-0.5">
          {/* All Chip */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setFilterExpiringOnly('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
              selectedCategory === 'All' && filterExpiringOnly === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] border border-[#e5e7eb] dark:border-[#334155]'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'All' && filterExpiringOnly === 'all'
                  ? 'bg-blue-700/60 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-[#6b7280] dark:text-[#94a3b8]'
              }`}
            >
              {documents.length}
            </span>
          </button>

          {/* Category Chips */}
          {DOCUMENT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id && filterExpiringOnly === 'all';
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setFilterExpiringOnly('all');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-[#1e293b] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9] border border-[#e5e7eb] dark:border-[#334155]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-blue-700/60 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-[#6b7280] dark:text-[#94a3b8]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER NOTICE if soon or expired active */}
      {filterExpiringOnly !== 'all' && (
        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
          filterExpiringOnly === 'expired'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          <span className="font-semibold flex items-center gap-1.5">
            {filterExpiringOnly === 'expired' ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            Filtering: {filterExpiringOnly === 'expired' ? 'Expired Documents' : 'Expiring within 30 days'}
          </span>
          <button
            type="button"
            onClick={() => setFilterExpiringOnly('all')}
            className="font-bold underline cursor-pointer"
          >
            Show All
          </button>
        </div>
      )}

      {/* DOCUMENT LIST */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 rounded-2xl bg-gray-100 dark:bg-slate-800/60 animate-pulse border border-[#e5e7eb] dark:border-[#334155]"
            />
          ))}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {groupedByCategory.map((group) => {
            const catMeta = getCategoryMeta(group.category);
            const isCollapsed = collapsedCategories[group.category];
            const CatIcon = catMeta.icon;

            return (
              <div key={group.category} className="space-y-2">
                {/* Collapsible Category Header when in 'All' view and not filtering expiry */}
                {selectedCategory === 'All' && filterExpiringOnly === 'all' && (
                  <button
                    type="button"
                    onClick={() => toggleCategoryCollapse(group.category)}
                    className="w-full flex items-center justify-between px-1 text-xs font-bold text-[#111827] dark:text-[#f1f5f9] select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${catMeta.badgeBg} ${catMeta.badgeText}`}
                      >
                        <CatIcon className="w-3 h-3" />
                      </div>
                      <span>{catMeta.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-slate-800 text-[#6b7280] dark:text-[#94a3b8] font-normal">
                        {group.docs.length}
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-[#6b7280]" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-[#6b7280]" />
                    )}
                  </button>
                )}

                {!isCollapsed && (
                  <div className="space-y-2">
                    {group.docs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        userId={userId}
                        isExpanded={expandedDocId === doc.id}
                        onToggleExpand={() =>
                          setExpandedDocId(expandedDocId === doc.id ? null : doc.id)
                        }
                        onUpdate={handleUpdateDocument}
                        onDelete={handleDeleteDocument}
                        onReplaceFile={handleReplaceFile}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <FolderLock className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm text-[#111827] dark:text-[#f1f5f9]">
            {searchQuery ? 'No documents match your search' : 'Vault is empty'}
          </h4>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] max-w-xs mx-auto">
            Store warranty cards, passport scans, contracts &amp; invoices safely with expiry alerts.
          </p>
          <button
            type="button"
            onClick={() => setIsUploadSheetOpen(true)}
            className="mt-2 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Upload First Document
          </button>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => setIsUploadSheetOpen(true)}
        className="fixed bottom-20 right-4 sm:right-auto sm:left-[calc(50%+160px)] z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Upload Document"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* MODALS & SHEETS */}
      <UploadDocumentSheet
        isOpen={isUploadSheetOpen}
        onClose={() => setIsUploadSheetOpen(false)}
        onUpload={handleUploadDocument}
      />

      <DocumentSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
