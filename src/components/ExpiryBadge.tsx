import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getExpiryStatus } from '../utils/documentUtils';

interface ExpiryBadgeProps {
  expiryDate?: string | null;
  className?: string;
}

export const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiryDate, className = '' }) => {
  if (!expiryDate) return null;

  const status = getExpiryStatus(expiryDate);
  if (status.status === 'none') return null;

  const getIcon = () => {
    switch (status.status) {
      case 'expired':
        return <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />;
      case 'today':
        return <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />;
      case 'soon':
        return <Clock className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'future':
      default:
        return <Clock className="w-3 h-3 text-[#6b7280] dark:text-[#94a3b8] shrink-0" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-semibold ${status.badgeClass} ${status.textClass} ${className}`}
    >
      {getIcon()}
      <span>{status.label}</span>
    </span>
  );
};
