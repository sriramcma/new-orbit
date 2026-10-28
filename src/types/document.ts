export type DocumentCategory =
  | 'HR Docs'
  | 'Certificates'
  | 'IDs'
  | 'Warranties'
  | 'Invoices'
  | 'Other';

export type DocumentFileType = 'pdf' | 'image' | 'other';

export interface AppDocument {
  id: string;
  user_id: string;
  title: string;
  category: DocumentCategory;
  file_url?: string | null;
  file_path: string;
  file_type: DocumentFileType;
  file_size?: number | null;
  expiry_date?: string | null; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
}

export interface ExpiryStatus {
  status: 'expired' | 'today' | 'soon' | 'future' | 'none';
  daysLeft: number | null;
  label: string;
  badgeClass: string;
  textClass: string;
}

export interface DocumentSummary {
  totalCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}
