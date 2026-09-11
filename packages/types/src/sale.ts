import { OrderItem } from './order';

export interface Sale {
  saleId: string;
  saleNumber: string; // e.g. SL-2026-000001
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  shipping: number;
  grandTotal: number;
  costOfGoods: number;
  profit: number;
  paymentStatus?: 'PAID' | 'UNPAID';
  saleDate: string;
  createdAt: string;
}
