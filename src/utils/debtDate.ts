export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultReturnDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7); // Default 7 days from today
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatReturnDateBadge(
  returnDate: string,
  status: 'pending' | 'settled',
  settledAt?: string | null
): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isDueSoon: boolean;
  isSettled: boolean;
} {
  if (status === 'settled') {
    let settledLabel = 'Settled';
    if (settledAt) {
      const d = new Date(settledAt);
      settledLabel = `Settled on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return {
      label: settledLabel,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isDueSoon: false,
      isSettled: true,
    };
  }

  const today = getTodayString();
  if (returnDate === today) {
    return {
      label: 'Due today',
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      isDueSoon: true,
      isSettled: false,
    };
  }

  const todayDate = parseDateOnly(today);
  const targetDate = parseDateOnly(returnDate);
  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      isDueSoon: true,
      isSettled: false,
    };
  }

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      isDueSoon: false,
      isSettled: false,
    };
  }

  if (diffDays <= 3) {
    return {
      label: `${diffDays} days left`,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isDueSoon: true,
      isSettled: false,
    };
  }

  return {
    label: `${diffDays} days left`,
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    isDueSoon: false,
    isSettled: false,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}
