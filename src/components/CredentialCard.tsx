import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
  Wifi,
  FileText,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { CredentialItem } from '../types/credential';
import { credentialService } from '../services/credentialService';
import { Button } from './ui';

interface CredentialCardProps {
  item: CredentialItem;
  masterPin: string;
  isExpanded?: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  item,
  masterPin,
  isExpanded = false,
  onToggleExpand,
  onDelete,
  onToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Timer refs
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, []);

  // Decrypt password helper
  const getDecrypted = (): string | null => {
    if (decryptedPassword) return decryptedPassword;
    try {
      const plain = credentialService.decrypt(item.encrypted_data, masterPin);
      if (!plain) {
        onToast('Incorrect PIN or corrupted data');
        return null;
      }
      setDecryptedPassword(plain);
      return plain;
    } catch {
      onToast('Incorrect PIN or corrupted data');
      return null;
    }
  };

  // Toggle Eye Icon (10s auto-hide)
  const handleToggleShow = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (showPassword) {
      // Hide immediately
      setShowPassword(false);
      setSecondsRemaining(0);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const plain = getDecrypted();
    if (plain === null) return;

    setShowPassword(true);
    setSecondsRemaining(10);

    // Auto-hide after 10s
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    hideTimerRef.current = setTimeout(() => {
      setShowPassword(false);
      setSecondsRemaining(0);
    }, 10000);
  };

  // Copy Password (clear after 30s)
  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const plain = getDecrypted();
    if (plain === null) return;

    try {
      await navigator.clipboard.writeText(plain);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      onToast('Password copied. Will clear in 30s.');

      // Clear clipboard after 30 seconds
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
      }, 30000);
    } catch {
      onToast('Failed to copy to clipboard');
    }
  };

  // Copy Username
  const handleCopyUsername = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.username);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
      onToast('Username copied to clipboard');
    } catch {
      onToast('Failed to copy username');
    }
  };

  // Delete handler
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await onDelete(item.id);
      onToast(`Deleted "${item.platform}"`);
    } catch {
      onToast('Failed to delete credential');
    }
  };

  // Get Platform Icon
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('wifi') || p.includes('wi-fi') || p.includes('router') || p.includes('network')) {
      return <Wifi className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
    return <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isExpanded
          ? 'bg-white dark:bg-[#1e293b] border-teal-300 dark:border-teal-500/50 ring-1 ring-teal-200 dark:ring-teal-900/40'
          : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155] hover:border-teal-200 dark:hover:border-slate-600'
      }`}
    >
      {/* CARD HEADER / MAIN CLICKABLE ROW */}
      <div
        onClick={onToggleExpand}
        className="p-4 cursor-pointer select-none space-y-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Platform & Username */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800/50 flex items-center justify-center shrink-0">
              {getPlatformIcon(item.platform)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9] truncate">
                {item.platform}
              </h3>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] truncate font-mono">
                {item.username}
              </p>
            </div>
          </div>

          {/* Expand Chevron */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* PASSWORD FIELD WITH EYE & COPY ACTIONS */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
            <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-mono text-xs tracking-wider text-[#111827] dark:text-[#f1f5f9] select-all truncate">
              {showPassword && decryptedPassword
                ? decryptedPassword
                : '••••••••••••'}
            </span>
            {showPassword && secondsRemaining > 0 && (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0 ml-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{secondsRemaining}s</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* 👁️ Eye Icon (Decrypt & show, auto-hide in 10s) */}
            <button
              type="button"
              onClick={handleToggleShow}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showPassword
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-white dark:hover:bg-slate-800'
              }`}
              title={showPassword ? 'Hide password' : 'Show password for 10s'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* 📋 Copy Button */}
            <button
              type="button"
              onClick={handleCopyPassword}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                copiedPassword
                  ? 'bg-emerald-500 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs active:scale-95'
              }`}
              title="Copy password to clipboard (auto-clears in 30s)"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAILS (Notes, URL, Delete) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
          {/* Quick copy username */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[#6b7280] dark:text-[#94a3b8] text-[11px]">Username:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-[#111827] dark:text-[#f1f5f9]">
                {item.username}
              </span>
              <button
                type="button"
                onClick={handleCopyUsername}
                className="text-teal-600 dark:text-teal-400 hover:underline text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer ml-1"
              >
                {copiedUsername ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUsername ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* URL if available */}
          {item.url && (
            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[#6b7280] dark:text-[#94a3b8] text-[11px]">Login URL:</span>
              <a
                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-teal-600 dark:text-teal-400 hover:underline text-xs flex items-center gap-1 truncate max-w-[200px]"
              >
                <span className="truncate">{item.url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Notes if available */}
          {item.notes && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs">
              <span className="block text-[10px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-0.5">
                Notes &amp; Recovery Hint:
              </span>
              <p className="text-[#111827] dark:text-[#f1f5f9] leading-relaxed whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Confirm Delete?</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
