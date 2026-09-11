export interface CloudinaryImage {
  cloudinaryPublicId: string;
  secureUrl: string;
  width: number;
  height: number;
  altText: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  weight: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs';
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  gstRate: number; // e.g. 5 for 5%
  hsnCode: string; // e.g. '0902' for Tea
  stockQuantity: number;
  stockReferenceQty: number;
  lowStockPercent: number; // default 70
  lowStockThresholdQty: number; // ceil(stockReferenceQty * lowStockPercent / 100)
  images: CloudinaryImage[];
  thumbnail: CloudinaryImage;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
