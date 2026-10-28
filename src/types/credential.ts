export interface CredentialItem {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  encrypted_data: string; // AES-256 encrypted password/PIN
  url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecryptedCredential extends Omit<CredentialItem, 'encrypted_data'> {
  password?: string;
  encrypted_data: string;
}
