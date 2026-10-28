import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  AppDocument,
  DocumentCategory,
  DocumentFileType,
  DocumentSummary,
} from '../types/document';
import { getExpiryStatus, detectFileType } from '../utils/documentUtils';

const LS_DOCUMENTS = 'orbit_documents_cache_';
const LS_FILE_BLOBS = 'orbit_document_blobs_cache_'; // local base64 fallback cache
const BUCKET_NAME = 'documents';

export const DOCUMENTS_SQL_SCHEMA = `-- Tables & Storage for the ORBIT Documents & Warranty Vault Module

-- 1. Documents Metadata Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  file_url TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  file_size BIGINT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_docs_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_expiry ON public.documents(expiry_date);

-- 2. Supabase Storage Policies (Bucket: 'documents' - Private)
-- Run these in Supabase SQL editor to ensure private, user-isolated file storage:

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
`;

const INITIAL_DOCUMENTS: Omit<AppDocument, 'user_id'>[] = [
  {
    id: 'doc_seed_1',
    title: 'MacBook Pro AppleCare+ Warranty',
    category: 'Warranties',
    file_url: null,
    file_path: 'seed/macbook_applecare.pdf',
    file_type: 'pdf',
    file_size: 1420000,
    expiry_date: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0], // expiring in 18 days
    notes: 'Agreement No: AC-984210. Covers accidental damage and battery replacement.',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'doc_seed_2',
    title: 'Government Passport & Visa Scan',
    category: 'IDs',
    file_url: null,
    file_path: 'seed/passport_scan.jpg',
    file_type: 'image',
    file_size: 2350000,
    expiry_date: new Date(Date.now() + 86400000 * 380).toISOString().split('T')[0], // future
    notes: 'Primary passport. Renewal scheduled 6 months prior to expiry.',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'doc_seed_3',
    title: 'Employment Offer Letter & Relocation Term',
    category: 'HR Docs',
    file_url: null,
    file_path: 'seed/employment_letter.pdf',
    file_type: 'pdf',
    file_size: 890000,
    expiry_date: null,
    notes: 'Signed contract copy and HR benefits breakdown booklet.',
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: 'doc_seed_4',
    title: 'Vehicle Insurance Comprehensive Policy',
    category: 'Invoices',
    file_url: null,
    file_path: 'seed/car_insurance.pdf',
    file_type: 'pdf',
    file_size: 1100000,
    expiry_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], // expired 4 days ago
    notes: 'Policy #HDFC-ERGO-88421. Needs renewal with zero-depreciation add-on.',
    created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
  },
];

class DocumentService {
  // ================= STORAGE OPERATIONS =================

  async uploadFile(
    userId: string,
    file: File
  ): Promise<{ filePath: string; fileUrl: string | null; fileType: DocumentFileType; fileSize: number }> {
    const fileType = detectFileType(file.name, file.type);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${Date.now()}_${cleanName}`;
    const fileSize = file.size;

    // Read as Base64 Data URL for offline fallback
    let dataUrl: string | null = null;
    try {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      // Store in local blobs cache
      const blobsCacheKey = `${LS_FILE_BLOBS}${userId}`;
      const existingBlobs = JSON.parse(localStorage.getItem(blobsCacheKey) || '{}');
      existingBlobs[filePath] = dataUrl;
      localStorage.setItem(blobsCacheKey, JSON.stringify(existingBlobs));
    } catch (e) {
      console.warn('Could not cache file data URL locally:', e);
    }

    if (isSupabaseConfigured) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Supabase storage upload error:', uploadError);
        } else {
          return { filePath, fileUrl: null, fileType, fileSize };
        }
      } catch (err) {
        console.warn('Supabase upload exception:', err);
      }
    }

    return { filePath, fileUrl: dataUrl, fileType, fileSize };
  }

  async deleteFile(filePath: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      } catch (err) {
        console.warn('Supabase delete file error:', err);
      }
    }
  }

  async getSignedUrl(userId: string, filePath: string): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(filePath, 60); // 60 seconds expiry

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        console.warn('Supabase createSignedUrl error:', err);
      }
    }

    // Fallback: check local blob cache
    const blobsCacheKey = `${LS_FILE_BLOBS}${userId}`;
    const existingBlobs = JSON.parse(localStorage.getItem(blobsCacheKey) || '{}');
    if (existingBlobs[filePath]) {
      return existingBlobs[filePath];
    }

    // Demo/Sample mock fallback
    return 'data:text/plain;charset=utf-8,Document%20preview%20placeholder%20(Offline%20Mode)';
  }

  // ================= METADATA CRUD =================

  async fetchDocuments(userId: string): Promise<AppDocument[]> {
    const cacheKey = `${LS_DOCUMENTS}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    let docs: AppDocument[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          docs = data as AppDocument[];
          localStorage.setItem(cacheKey, JSON.stringify(docs));
        }
      } catch (err) {
        console.warn('Supabase fetch documents failed, using cache:', err);
      }
    }

    if (docs.length === 0 && cachedStr) {
      try {
        docs = JSON.parse(cachedStr);
      } catch {}
    }

    if (docs.length === 0 && !cachedStr) {
      docs = INITIAL_DOCUMENTS.map((d) => ({
        ...d,
        user_id: userId,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(docs));
    }

    // Sort priority: Expired first, then soon (<= 30 days), then future, then no expiry
    return this.sortDocuments(docs);
  }

  sortDocuments(docs: AppDocument[]): AppDocument[] {
    return [...docs].sort((a, b) => {
      const statusA = getExpiryStatus(a.expiry_date);
      const statusB = getExpiryStatus(b.expiry_date);

      const scoreMap: Record<string, number> = {
        expired: 1,
        today: 2,
        soon: 3,
        future: 4,
        none: 5,
      };

      const scoreA = scoreMap[statusA.status] || 5;
      const scoreB = scoreMap[statusB.status] || 5;

      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }

      if (statusA.daysLeft !== null && statusB.daysLeft !== null) {
        return statusA.daysLeft - statusB.daysLeft;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  async addDocument(
    userId: string,
    doc: {
      title: string;
      category: DocumentCategory;
      file_path: string;
      file_type: DocumentFileType;
      file_size?: number | null;
      expiry_date?: string | null;
      notes?: string | null;
    }
  ): Promise<AppDocument> {
    const newDoc: AppDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title: doc.title.trim(),
      category: doc.category,
      file_path: doc.file_path,
      file_type: doc.file_type,
      file_size: doc.file_size || null,
      expiry_date: doc.expiry_date || null,
      notes: doc.notes?.trim() || null,
      file_url: null,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_DOCUMENTS}${userId}`;
    const all = await this.fetchDocuments(userId);
    const updated = [newDoc, ...all];
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            user_id: userId,
            title: newDoc.title,
            category: newDoc.category,
            file_path: newDoc.file_path,
            file_type: newDoc.file_type,
            file_size: newDoc.file_size,
            expiry_date: newDoc.expiry_date,
            notes: newDoc.notes,
          })
          .select()
          .single();

        if (!error && data) {
          return data as AppDocument;
        }
      } catch (err) {
        console.warn('Supabase add document failed:', err);
      }
    }

    return newDoc;
  }

  async updateDocument(
    userId: string,
    id: string,
    updates: Partial<AppDocument>
  ): Promise<AppDocument> {
    const cacheKey = `${LS_DOCUMENTS}${userId}`;
    const all = await this.fetchDocuments(userId);
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(cacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as AppDocument;
        }
      } catch (err) {
        console.warn('Supabase update document failed:', err);
      }
    }

    return updated;
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_DOCUMENTS}${userId}`;
    const all = await this.fetchDocuments(userId);
    const found = all.find((d) => d.id === id);
    const filtered = all.filter((d) => d.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    // Delete file from storage
    if (found?.file_path) {
      await this.deleteFile(found.file_path);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('documents')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete document failed:', err);
      }
    }
  }

  async getDocumentSummary(userId: string): Promise<DocumentSummary> {
    const docs = await this.fetchDocuments(userId);
    let expiringSoonCount = 0;
    let expiredCount = 0;

    docs.forEach((d) => {
      const exp = getExpiryStatus(d.expiry_date);
      if (exp.status === 'expired') expiredCount++;
      if (exp.status === 'soon' || exp.status === 'today') expiringSoonCount++;
    });

    return {
      totalCount: docs.length,
      expiringSoonCount,
      expiredCount,
    };
  }

  subscribeToDocuments(userId: string, callback: () => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`documents_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${userId}` },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const documentService = new DocumentService();
