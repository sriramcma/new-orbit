import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Eye,
  File,
  Sparkles,
} from 'lucide-react';
import { AppDocument } from '../types/document';
import {
  getCategoryMeta,
  getFileTypeMeta,
  formatFileSize,
} from '../utils/documentUtils';
import { ExpiryBadge } from './ExpiryBadge';
import { documentService } from '../services/documentService';

interface DocumentCardProps {
  document: AppDocument;
  userId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, updates: Partial<AppDocument>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReplaceFile: (id: string, file: File) => Promise<void>;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  userId,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onReplaceFile,
}) => {
  const [notes, setNotes] = useState(doc.notes || '');
  const [expiryDate, setExpiryDate] = useState(doc.expiry_date || '');
  const [loadingFile, setLoadingFile] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNotes(doc.notes || '');
    setExpiryDate(doc.expiry_date || '');
  }, [doc]);

  const categoryMeta = getCategoryMeta(doc.category);
  const fileTypeMeta = getFileTypeMeta(doc.file_type);
  const FileIcon = fileTypeMeta.icon;

  const handleNotesBlur = () => {
    if (notes !== (doc.notes || '')) {
      onUpdate(doc.id, { notes: notes.trim() || null });
    }
  };

  const handleExpiryChange = (newDate: string) => {
    setExpiryDate(newDate);
    onUpdate(doc.id, { expiry_date: newDate || null });
  };

  const handleViewFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingFile(true);
    try {
      const url = await documentService.getSignedUrl(userId, doc.file_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not open file URL. Please try again.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDownloadFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingFile(true);
    try {
      const url = await documentService.getSignedUrl(userId, doc.file_path);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.title;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch {
      alert('Could not download file. Please try again.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setReplacing(true);
    try {
      await onReplaceFile(doc.id, file);
    } finally {
      setReplacing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] shadow-xs overflow-hidden transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500/40">
      {/* Hidden file input for Replace File */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Main Collapsed Card */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* File Icon Container */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${fileTypeMeta.colorClass}`}
          >
            <FileIcon className="w-4 h-4" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md ${categoryMeta.badgeBg} ${categoryMeta.badgeText}`}
              >
                {doc.category}
              </span>
              {doc.file_size && (
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                  • {formatFileSize(doc.file_size)}
                </span>
              )}
            </div>

            <h4 className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9] mt-0.5 line-clamp-1 leading-snug">
              {doc.title}
            </h4>

            {/* Expiry Badge Preview */}
            <div className="mt-1 flex items-center gap-2">
              <ExpiryBadge expiryDate={doc.expiry_date} />
              {doc.notes && !isExpanded && (
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] truncate max-w-[140px]">
                  {doc.notes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Toggle */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleViewFile}
            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
            title="Quick view"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <div className="p-1 rounded-lg text-[#6b7280] dark:text-[#94a3b8]">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Inline Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#e5e7eb] dark:border-[#334155]/60 space-y-3 animate-in fade-in duration-200">
          {/* Notes textarea */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1">
              Document Notes &amp; Policy Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add policy numbers, account IDs, renewal instructions..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50/50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expiry Date Editor */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-500" />
              Expiry / Renewal Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => handleExpiryChange(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {expiryDate && (
                <button
                  type="button"
                  onClick={() => handleExpiryChange('')}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Clear expiry
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 border-t border-[#e5e7eb] dark:border-[#334155]/60 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* View File Button */}
              <button
                type="button"
                onClick={handleViewFile}
                disabled={loadingFile}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{loadingFile ? 'Opening...' : 'View File'}</span>
              </button>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownloadFile}
                disabled={loadingFile}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#111827] dark:text-[#f1f5f9] font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Download local copy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {/* Replace File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={replacing}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#111827] dark:text-[#f1f5f9] font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Upload replacement file"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${replacing ? 'animate-spin' : ''}`} />
                <span>{replacing ? 'Uploading...' : 'Replace'}</span>
              </button>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`This will permanently delete "${doc.title}" and its file from storage. Are you sure?`)) {
                  onDelete(doc.id);
                }
              }}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
