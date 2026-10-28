import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  Lock,
  Unlock,
  Search,
  X,
  Plus,
  Database,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Eye,
  Globe,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CredentialItem } from '../types/credential';
import { credentialService } from '../services/credentialService';
import { LockScreen } from '../components/LockScreen';
import { CredentialCard } from '../components/CredentialCard';
import { AddCredentialSheet } from '../components/AddCredentialSheet';
import { CredentialSchemaModal } from '../components/credentials/CredentialSchemaModal';
import { Button } from '../components/ui';

export const CredentialsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // Master PIN kept in React state only (never in localStorage)
  const [masterPin, setMasterPin] = useState<string | null>(null);

  // Vault data
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded card ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load credentials from service
  const loadCredentials = async () => {
    setLoading(true);
    try {
      const data = await credentialService.fetchCredentials(userId);
      setCredentials(data);
    } catch {
      showToast('Error loading credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, [userId]);

  // Check if first time setup
  const isFirstTime = useMemo(() => {
    return !credentialService.hasMasterPin(userId) && credentials.length === 0;
  }, [userId, credentials]);

  // Filtered credentials based on search
  const filteredCredentials = useMemo(() => {
    if (!searchQuery.trim()) return credentials;
    const q = searchQuery.toLowerCase().trim();
    return credentials.filter(
      (c) =>
        c.platform.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [credentials, searchQuery]);

  // Unlock handler from LockScreen
  const handleUnlock = (enteredPin: string): boolean => {
    if (isFirstTime) {
      credentialService.setupMasterPin(userId, enteredPin);
      setMasterPin(enteredPin);
      showToast('Master PIN set & Vault unlocked ✨');
      return true;
    }

    const isValid = credentialService.verifyMasterPin(userId, enteredPin, credentials);
    if (isValid) {
      setMasterPin(enteredPin);
      showToast('Vault unlocked 🔓');
      return true;
    }
    return false;
  };

  // Manual Lock action
  const handleLockVault = () => {
    setMasterPin(null);
    setExpandedId(null);
    showToast('Vault locked 🔒');
  };

  // Add Credential
  const handleAddCredential = async (data: {
    platform: string;
    username: string;
    password: string;
    url?: string | null;
    notes?: string | null;
  }) => {
    if (!masterPin) return;
    const created = await credentialService.addCredential(userId, data, masterPin);
    setCredentials((prev) => [created, ...prev]);
    showToast(`Added "${created.platform}" ✨`);
  };

  // Delete Credential
  const handleDeleteCredential = async (id: string) => {
    await credentialService.deleteCredential(userId, id);
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="min-h-full pb-24 text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 dark:text-teal-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* RENDER LOCK SCREEN IF MASTER PIN IS NOT ENTERED */}
      {!masterPin ? (
        <LockScreen
          isFirstTime={isFirstTime}
          onUnlock={handleUnlock}
          onToast={showToast}
        />
      ) : (
        /* UNLOCKED VAULT MAIN SCREEN */
        <div className="animate-in fade-in duration-200">
          {/* HEADER */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
                      Credentials
                    </h1>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/80 dark:text-teal-300 px-1.5 py-0.2 rounded-full border border-teal-200 dark:border-teal-800/60">
                      AES-256
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                    Client-side encrypted password &amp; token vault
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
                      ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 font-bold'
                      : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  title="Search credentials"
                  aria-label="Search credentials"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* SQL Schema button */}
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="View Database Schema"
                >
                  <Database className="w-4 h-4" />
                </button>

                {/* Lock Vault button */}
                <button
                  type="button"
                  onClick={handleLockVault}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer"
                  title="Lock Vault & clear PIN from memory"
                  aria-label="Lock Vault"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STICKY SEARCH BAR (Collapsible) */}
            {isSearchOpen && (
              <div className="mt-2.5 pt-2 border-t border-[#e5e7eb] dark:border-[#334155] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-3 text-[#6b7280] dark:text-[#94a3b8]" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by platform, username or notes..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] mt-1 px-1">
                    Found {filteredCredentials.length}{' '}
                    {filteredCredentials.length === 1 ? 'match' : 'matches'} for "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="px-4 py-3 space-y-3.5">
            {/* SECURITY STRIP */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-[#111827] dark:text-[#f1f5f9] font-medium text-[11px]">
                  Vault Unlocked •{' '}
                  <span className="font-bold text-teal-700 dark:text-teal-300">
                    {credentials.length} {credentials.length === 1 ? 'credential' : 'credentials'}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleLockVault}
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Now</span>
              </button>
            </div>

            {/* LIST VIEW */}
            {loading ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Accessing vault...</p>
              </div>
            ) : filteredCredentials.length === 0 ? (
              /* EMPTY STATE */
              <div className="p-8 text-center bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                    {searchQuery ? 'No matching credentials' : 'Your vault is empty'}
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 max-w-[280px] mx-auto leading-relaxed">
                    {searchQuery
                      ? 'Try searching for another service name, username, or keyword.'
                      : 'Add your first login, Wi-Fi password, or private recovery token.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (searchQuery) setSearchQuery('');
                      else setIsAddOpen(true);
                    }}
                    className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {searchQuery ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Clear Search</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Credential</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* CARDS LIST */
              <div className="space-y-3">
                {filteredCredentials.map((item) => (
                  <CredentialCard
                    key={item.id}
                    item={item}
                    masterPin={masterPin}
                    isExpanded={expandedId === item.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    onDelete={handleDeleteCredential}
                    onToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FLOATING ACTION BUTTON (FAB: [+ Add Credential], bottom-right, above bottom nav) */}
          <div className="fixed bottom-20 right-4 z-40 max-w-[480px]">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 active:scale-95 transition-all cursor-pointer"
              title="Add a new credential"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Credential</span>
            </button>
          </div>

          {/* ADD CREDENTIAL SHEET */}
          <AddCredentialSheet
            isOpen={isAddOpen}
            masterPin={masterPin}
            onClose={() => setIsAddOpen(false)}
            onSubmit={handleAddCredential}
            onToast={showToast}
          />

          {/* SQL SCHEMA MODAL */}
          <CredentialSchemaModal
            isOpen={isSchemaModalOpen}
            onClose={() => setIsSchemaModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
