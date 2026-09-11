import { z } from 'zod';

export const cloudinaryImageSchema = z.object({
  cloudinaryPublicId: z.string(),
  secureUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  altText: z.string().default(''),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  slug: z.string().trim().min(2, 'Slug is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  sku: z.string().trim().min(2, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  weight: z.number().positive('Weight must be greater than 0'),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'pcs']),
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  purchasePrice: z.number().nonnegative('Purchase price cannot be negative'),
  gstRate: z.number().min(0).max(28, 'GST rate must be between 0 and 28%'),
  hsnCode: z.string().trim().min(2, 'HSN Code is required'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  stockReferenceQty: z.number().int().min(0, 'Stock reference quantity cannot be negative'),
  lowStockPercent: z.number().min(1).max(100, 'Low stock percent must be between 1 and 100'),
  lowStockThresholdQty: z.number().int().min(0),
  images: z.array(cloudinaryImageSchema).min(1, 'At least one product image is required'),
  thumbnail: cloudinaryImageSchema,
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
