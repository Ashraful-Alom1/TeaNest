export type DefaultExpenseCategory =
  | 'Packaging'
  | 'Transport'
  | 'Advertising'
  | 'Shipping'
  | 'Electricity'
  | 'Internet'
  | 'Office'
  | 'Salary'
  | 'Miscellaneous';

export type ExpenseCategory = DefaultExpenseCategory | string;

export interface Expense {
  expenseId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  gstAmount: number;
  vendor: string;
  expenseDate: string;
  paymentMethod: string;
  status: 'PAID' | 'PENDING';
  createdBy: string;
  createdAt: string;
  notes?: string;
}
