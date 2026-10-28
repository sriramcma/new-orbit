import {
  Briefcase,
  Award,
  IdCard,
  Shield,
  Receipt,
  FileText,
  Image as FileImage,
  File,
  LucideIcon,
} from 'lucide-react';
import { DocumentCategory, DocumentFileType, ExpiryStatus } from '../types/document';

export interface CategoryMeta {
  id: DocumentCategory;
  label: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  border: string;
}

export const DOCUMENT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'HR Docs',
    label: 'HR Docs',
    icon: Briefcase,
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  {
    id: 'Certificates',
    label: 'Certificates',
    icon: Award,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  {
    id: 'IDs',
    label: 'IDs',
    icon: IdCard,
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
  {
    id: 'Warranties',
    label: 'Warranties',
    icon: Shield,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  {
    id: 'Invoices',
    label: 'Invoices',
    icon: Receipt,
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/60',
  },
  {
    id: 'Other',
    label: 'Other',
    icon: File,
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
];

export function getCategoryMeta(category: DocumentCategory | string): CategoryMeta {
  const found = DOCUMENT_CATEGORIES.find((c) => c.id === category);
  return (
    found || {
      id: 'Other',
      label: category || 'Other',
      icon: File,
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
    }
  );
}

export function getFileTypeMeta(type: DocumentFileType | string) {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF Document',
        icon: FileText,
        colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60',
      };
    case 'image':
      return {
        label: 'Image Scan',
        icon: FileImage,
        colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60',
      };
    default:
      return {
        label: 'File',
        icon: File,
        colorClass: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      };
  }
}

export function detectFileType(fileName: string, mimeType?: string): DocumentFileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext || '') || mimeType?.includes('image')) return 'image';
  return 'other';
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getExpiryStatus(expiryDateStr?: string | null): ExpiryStatus {
  if (!expiryDateStr) {
    return {
      status: 'none',
      daysLeft: null,
      label: 'No Expiry',
      badgeClass: 'bg-transparent',
      textClass: 'text-transparent',
    };
  }

  // Parse expiry date as local date
  const parts = expiryDateStr.split('-');
  if (parts.length !== 3) {
    return {
      status: 'none',
      daysLeft: null,
      label: expiryDateStr,
      badgeClass: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-600 dark:text-slate-400',
    };
  }

  const expYear = parseInt(parts[0], 10);
  const expMonth = parseInt(parts[1], 10) - 1;
  const expDay = parseInt(parts[2], 10);

  const expDate = new Date(expYear, expMonth, expDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return {
      status: 'expired',
      daysLeft,
      label: daysAgo === 1 ? 'Expired yesterday' : `Expired ${daysAgo} days ago`,
      badgeClass: 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800/80 animate-pulse',
      textClass: 'text-rose-700 dark:text-rose-300 font-bold',
    };
  }

  if (daysLeft === 0) {
    return {
      status: 'today',
      daysLeft,
      label: 'Expires today',
      badgeClass: 'bg-orange-100 dark:bg-orange-950/70 border-orange-300 dark:border-orange-800/80',
      textClass: 'text-orange-700 dark:text-orange-300 font-bold',
    };
  }

  if (daysLeft <= 30) {
    return {
      status: 'soon',
      daysLeft,
      label: daysLeft === 1 ? 'Expires in 1 day' : `Expires in ${daysLeft} days`,
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800/80',
      textClass: 'text-amber-700 dark:text-amber-300 font-bold',
    };
  }

  const formattedMonth = expDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return {
    status: 'future',
    daysLeft,
    label: `Expires ${formattedMonth}`,
    badgeClass: 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
    textClass: 'text-[#6b7280] dark:text-[#94a3b8]',
  };
}
