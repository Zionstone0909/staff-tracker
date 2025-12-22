// server/api/expenses/expenses.types.ts (AFTER FIX)
export interface ClientExpense {
  type?: 'EXPENSE' | 'DEPOSIT'; // Add this line
  description: string;
  amount: number;
  date: string;
  category: string;
  reference?: string;
  supplierId?: string;
  status?: 'Paid' | 'Pending';
  paymentMethod?: string;
  recordedByName?: string;
}