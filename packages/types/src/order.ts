export type OrderStatus =
  | 'DRAFT'
  | 'WHATSAPP_PENDING'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface Address {
  fullName: string;
  mobile: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  weight: number;
  unit: string;
  price: number;
  purchasePrice?: number;
  quantity: number;
  gstRate: number;
  taxableAmount: number;
  tax: number;
  subtotal: number;
  total: number;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. TN-2026-000001
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  shipping: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  whatsappMessageSent: boolean;
  isWhatsAppOrder?: boolean;
  invoiceId?: string;
  saleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
