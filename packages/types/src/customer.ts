export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  role: 'customer';
  status: 'ACTIVE' | 'INACTIVE';
  totalOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
}

export type TimelineEventType =
  | 'REGISTERED'
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'INVOICE_GENERATED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'NOTE_ADDED';

export interface CRMTimelineEvent {
  id: string;
  customerId: string;
  type: TimelineEventType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}
