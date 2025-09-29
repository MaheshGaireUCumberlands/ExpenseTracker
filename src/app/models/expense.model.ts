export interface Expense {
  id?: number;
  title: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  category: string;
  notes?: string;
}
