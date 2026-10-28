import CryptoJS from 'crypto-js';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { CredentialItem } from '../types/credential';

const LS_CREDENTIALS_KEY = 'orbit_credentials_cache_';
const LS_CANARY_KEY = 'orbit_vault_canary_';
const CANARY_STRING = 'ORBIT_VAULT_CANARY_VALID';

export const CREDENTIALS_SQL_SCHEMA = `-- ============================================
-- ORBIT — Credentials Vault (Client-Side Encrypted)
-- ============================================

CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,  -- AES-256 encrypted password/PIN
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credentials"
  ON public.credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_credentials_user ON public.credentials(user_id);
`;

class CredentialService {
  /**
   * Encrypt plain text using AES-256 with Master PIN
   */
  encrypt(text: string, pin: string): string {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, pin).toString();
  }

  /**
   * Decrypt ciphertext using AES-256 with Master PIN
   * Returns empty string if PIN is incorrect or decryption fails
   */
  decrypt(ciphertext: string, pin: string): string {
    if (!ciphertext || !pin) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, pin);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Local storage cache access
   */
  private getLocalCache(userId: string): CredentialItem[] {
    try {
      const data = localStorage.getItem(`${LS_CREDENTIALS_KEY}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalCache(userId: string, items: CredentialItem[]): void {
    try {
      localStorage.setItem(`${LS_CREDENTIALS_KEY}${userId}`, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to cache credentials locally:', err);
    }
  }

  /**
   * Check if user already set up a Master PIN for this vault
   */
  hasMasterPin(userId: string): boolean {
    const canary = localStorage.getItem(`${LS_CANARY_KEY}${userId}`);
    const items = this.getLocalCache(userId);
    return Boolean(canary || items.length > 0);
  }

  /**
   * Setup a new Master PIN by creating a verification canary
   */
  setupMasterPin(userId: string, pin: string): void {
    const encryptedCanary = this.encrypt(CANARY_STRING, pin);
    localStorage.setItem(`${LS_CANARY_KEY}${userId}`, encryptedCanary);
  }

  /**
   * Verify an entered Master PIN against the canary or existing credentials
   */
  verifyMasterPin(userId: string, pin: string, cachedItems?: CredentialItem[]): boolean {
    // 1. Try checking against canary if stored
    const canary = localStorage.getItem(`${LS_CANARY_KEY}${userId}`);
    if (canary) {
      const test = this.decrypt(canary, pin);
      if (test === CANARY_STRING) return true;
    }

    // 2. Try decrypting an existing item
    const items = cachedItems || this.getLocalCache(userId);
    if (items.length > 0) {
      const first = items[0];
      const test = this.decrypt(first.encrypted_data, pin);
      if (test && test.length > 0) {
        // Also refresh canary for future instant checks
        this.setupMasterPin(userId, pin);
        return true;
      }
      return false;
    }

    // If no canary and no items exist, any new PIN can be set
    return canary ? false : true;
  }

  /**
   * Fetch all encrypted credentials for user
   */
  async fetchCredentials(userId: string): Promise<CredentialItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('credentials')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          this.setLocalCache(userId, data);
          return data;
        }
        console.warn('Supabase fetch credentials error, using local cache:', error);
      } catch (err) {
        console.warn('Supabase connection error on credentials fetch:', err);
      }
    }

    return this.getLocalCache(userId);
  }

  /**
   * Add a new credential (encrypts password before saving)
   */
  async addCredential(
    userId: string,
    data: {
      platform: string;
      username: string;
      password: string;
      url?: string | null;
      notes?: string | null;
    },
    pin: string
  ): Promise<CredentialItem> {
    const encryptedData = this.encrypt(data.password, pin);
    const now = new Date().toISOString();

    const newItem: CredentialItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      platform: data.platform.trim(),
      username: data.username.trim(),
      encrypted_data: encryptedData,
      url: data.url ? data.url.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      created_at: now,
      updated_at: now,
    };

    // Save locally
    const current = this.getLocalCache(userId);
    const updated = [newItem, ...current];
    this.setLocalCache(userId, updated);

    // Ensure canary is set with this PIN
    this.setupMasterPin(userId, pin);

    // Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('credentials')
          .insert({
            id: newItem.id,
            user_id: userId,
            platform: newItem.platform,
            username: newItem.username,
            encrypted_data: newItem.encrypted_data,
            url: newItem.url,
            notes: newItem.notes,
            created_at: newItem.created_at,
            updated_at: newItem.updated_at,
          })
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert credential failed, kept in local storage:', error);
        } else if (inserted) {
          return inserted;
        }
      } catch (err) {
        console.warn('Supabase connection error during addCredential:', err);
      }
    }

    return newItem;
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    userId: string,
    id: string,
    updates: {
      platform?: string;
      username?: string;
      password?: string;
      url?: string | null;
      notes?: string | null;
    },
    pin?: string
  ): Promise<CredentialItem> {
    const current = this.getLocalCache(userId);
    const index = current.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Credential not found');

    const existing = current[index];
    const now = new Date().toISOString();

    let newEncryptedData = existing.encrypted_data;
    if (updates.password !== undefined && pin) {
      newEncryptedData = this.encrypt(updates.password, pin);
    }

    const updatedItem: CredentialItem = {
      ...existing,
      platform: updates.platform !== undefined ? updates.platform.trim() : existing.platform,
      username: updates.username !== undefined ? updates.username.trim() : existing.username,
      encrypted_data: newEncryptedData,
      url: updates.url !== undefined ? (updates.url?.trim() || null) : existing.url,
      notes: updates.notes !== undefined ? (updates.notes?.trim() || null) : existing.notes,
      updated_at: now,
    };

    current[index] = updatedItem;
    this.setLocalCache(userId, [...current]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('credentials')
          .update({
            platform: updatedItem.platform,
            username: updatedItem.username,
            encrypted_data: updatedItem.encrypted_data,
            url: updatedItem.url,
            notes: updatedItem.notes,
            updated_at: updatedItem.updated_at,
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase update credential failed:', error);
        }
      } catch (err) {
        console.warn('Supabase error during updateCredential:', err);
      }
    }

    return updatedItem;
  }

  /**
   * Delete a credential
   */
  async deleteCredential(userId: string, id: string): Promise<void> {
    const current = this.getLocalCache(userId);
    const filtered = current.filter((c) => c.id !== id);
    this.setLocalCache(userId, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('credentials')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase delete credential failed:', error);
        }
      } catch (err) {
        console.warn('Supabase error during deleteCredential:', err);
      }
    }
  }

  /**
   * Count total credentials for dashboard
   */
  async getCredentialsCount(userId: string): Promise<number> {
    const items = await this.fetchCredentials(userId);
    return items.length;
  }
}

export const credentialService = new CredentialService();
