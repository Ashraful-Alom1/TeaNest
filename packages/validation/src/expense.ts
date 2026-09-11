import { z } from 'zod';

export const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().trim().min(3, 'Description must be at least 3 characters'),
  amount: z.number().positive('Amount must be greater than 0'),
  gstAmount: z.number().min(0).default(0),
  vendor: z.string().trim().min(2, 'Vendor is required'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  paymentMethod: z.string().default('Bank Transfer'),
  status: z.enum(['PAID', 'PENDING']).default('PAID'),
  notes: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
