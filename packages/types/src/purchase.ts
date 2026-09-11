export type PurchaseStatus =
  | 'DRAFT'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  gstRate: number;
  taxableAmount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  purchaseId: string;
  purchaseNumber: string; // e.g. PO-2026-000001
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  grandTotal: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  purchaseStatus: PurchaseStatus;
  notes?: string;
  receivedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
