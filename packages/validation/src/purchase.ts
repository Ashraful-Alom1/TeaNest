import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().positive('Quantity must be positive'),
  receivedQuantity: z.number().int().min(0).default(0),
  unitCost: z.number().positive('Unit cost must be positive'),
  gstRate: z.number().min(0).default(5),
  taxableAmount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierName: z.string().min(1),
  invoiceNumber: z.string().trim().min(1, 'Supplier invoice number is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  grandTotal: z.number().positive(),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).default('UNPAID'),
  purchaseStatus: z
    .enum(['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])
    .default('ORDERED'),
  notes: z.string().optional(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
