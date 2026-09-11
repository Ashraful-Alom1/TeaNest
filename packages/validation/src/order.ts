import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  street: z.string().trim().min(5, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code'),
  landmark: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string(),
  name: z.string(),
  weight: z.number().positive(),
  unit: z.string(),
  price: z.number().positive(),
  purchasePrice: z.number().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  gstRate: z.number().min(0),
  taxableAmount: z.number().min(0),
  tax: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  image: z.string().optional(),
});

export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().optional(),
  paymentMethod: z.string().default('WHATSAPP_COD'),
  isWhatsAppOrder: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().trim().min(3, 'Reason is required for manual inventory adjustment'),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
