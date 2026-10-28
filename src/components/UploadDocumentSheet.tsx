import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as FileImage,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FolderLock,
} from 'lucide-react';
import { DocumentCategory, DocumentFileType } from '../types/document';
import {
  DOCUMENT_CATEGORIES,
  detectFileType,
  formatFileSize,
} from '../utils/documentUtils';
import { Button } from './ui';

interface UploadDocumentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    file: File;
    title: string;
    category: DocumentCategory;
    expiry_date?: string | null;
    notes?: string | null;
  }) => Promise<void>;
}

export const UploadDocumentSheet: React.FC<UploadDocumentSheetProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Warranties');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      setError('Only PDF, JPG, and PNG files are supported.');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Default title to filename without extension
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setError('');

    // Simulated progress steps for smooth UX
    const interval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 25 : p));
    }, 150);

    try {
      await onUpload({
        file: selectedFile,
        title: title.trim(),
        category,
        expiry_date: expiryDate ? expiryDate : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      setUploadProgress(100);
      clearInterval(interval);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'Failed to upload document.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setCategory('Warranties');
    setExpiryDate('');
    setNotes('');
    setError('');
    setUploading(false);
    setUploadProgress(0);
  };

  const fileType = selectedFile ? detectFileType(selectedFile.name, selectedFile.type) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] max-h-[92vh] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e5e7eb] dark:border-[#334155] overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderLock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                Add to Document Vault
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Secure private storage with expiry tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: File Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1.5">
              Document File (PDF, JPG, PNG &bull; Max 5MB) <span className="text-rose-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#111827] dark:text-[#f1f5f9]">
                  Tap to select file
                </span>
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                  PDF, JPG or PNG up to 5MB
                </span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {fileType === 'pdf' ? <FileText className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-[#111827] dark:text-[#f1f5f9] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                      {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'file'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Details Form */}
          <div className="space-y-3 pt-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Laptop Warranty, PAN Card, House Deed..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DOCUMENT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                          : 'border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#6b7280] dark:text-[#94a3b8] hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1 flex items-center justify-between">
                <span>Expiry / Renewal Date (Optional)</span>
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-normal">
                  Warranty end, ID renewal, etc.
                </span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
                Notes &amp; Policy / Reference Numbers (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Policy #, coverage terms, support hotline..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Upload Progress Bar during upload */}
          {uploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>Encrypting &amp; Uploading to Vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={uploading || !selectedFile || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
