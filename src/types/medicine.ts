export type MedicineStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  purpose: string;
  dosage_notes?: string | null;
  stock_status: MedicineStockStatus;
  expiry_date?: string | null; // YYYY-MM-DD
  created_at?: string;
}

export interface MedicineSummary {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  expired: number;
}
