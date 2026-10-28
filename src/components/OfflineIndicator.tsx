import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 dark:bg-slate-800/95 border border-amber-500/50 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-amber-300 shadow-xl animate-in slide-in-from-bottom duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff size={13} className="text-amber-400" />
      <span>Offline Mode — Cached data active</span>
    </div>
  );
};
