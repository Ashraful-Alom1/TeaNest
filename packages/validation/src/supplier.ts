import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Contact person name is required'),
  companyName: z.string().trim().min(2, 'Company/Estate name is required'),
  phone: z.string().trim().min(10, 'Valid phone number is required'),
  email: z.string().trim().email('Valid email is required'),
  gstin: z.string().trim().min(15, 'Valid 15-character GSTIN is required'),
  address: z.string().trim().min(5, 'Address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Valid 6-digit PIN code is required'),
  paymentTerms: z.string().default('Net 30'),
  openingBalance: z.number().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
