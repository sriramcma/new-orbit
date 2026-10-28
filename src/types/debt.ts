export type DebtDirection = 'borrowed' | 'lent';
export type DebtStatus = 'pending' | 'settled';

export interface Debt {
  id: string;
  user_id: string;
  person: string;
  amount: number;
  direction: DebtDirection;
  return_date: string; // YYYY-MM-DD
  status: DebtStatus;
  notes?: string | null;
  settled_at?: string | null;
  created_at: string;
}

export type DebtTabType = 'borrowed' | 'lent' | 'settled';
