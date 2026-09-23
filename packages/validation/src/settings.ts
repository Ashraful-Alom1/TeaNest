import { z } from 'zod';

export const businessSettingsSchema = z.object({
  brandName: z.string().trim().min(2),
  businessName: z.string().trim().min(2),
  logoUrl: z.string().optional(),
  phone: z.string().trim().min(10),
  email: z.string().trim().email(),
  whatsappOrderNumber: z
    .string()
    .trim()
    .regex(/^\d{10,13}$/, 'WhatsApp number must be 10 to 13 digits (e.g. 918822308551)'),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().trim().regex(/^\d{6}$/),
  gstin: z.string().trim().min(15),
  pan: z.string().trim().min(10),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  invoicePrefix: z.string().default('INV-2026-'),
  startingInvoiceNumber: z.number().int().positive().default(1),
  orderPrefix: z.string().default('TN-2026-'),
  lowStockDefaultPercent: z.number().min(1).max(100).default(70),
  terms: z.string(),
  bankName: z.string().min(2),
  accountNumber: z.string().min(5),
  ifsc: z.string().min(4),
  upi: z.string().min(3),
  orderSettings: z.object({
    allowDirectWhatsapp: z.boolean().default(true),
    minOrderValue: z.number().min(0).default(0),
    freeShippingThreshold: z.number().min(0).default(999),
    defaultShippingCharge: z.number().min(0).default(50),
  }),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }),
  footerContent: z.string(),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
