import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'customer' | 'admin';
export type CustomerSegment = 'new' | 'repeat' | 'high_value' | 'inactive';

export interface Media {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  alt?: string;
}

export interface UserStats {
  ordersCount: number;
  lifetimeValuePaise: number;
  lastOrderAt?: Timestamp | null;
}

export interface UserDoc {
  name: string;
  email: string;
  phone?: string;
  photo?: Media;
  role: UserRole;
  isActive: boolean;
  marketingOptIn: boolean;
  segment: CustomerSegment;
  gstin?: string;
  companyName?: string;
  tags: string[];
  notes?: string;
  stats: UserStats;
  lastLoginAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AddressDoc {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: 'IN';
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface CategoryDoc {
  name: string;
  slug: string;
  parentId?: string;
  image?: Media;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductVariantDoc {
  sku: string;
  barcode?: string;
  name: string;
  weightGrams: number;
  mrpPaise: number;
  sellingPricePaise: number;
  costPricePaise: number;
  priceIncludesTax: boolean;
  gstRate?: number;
  hsnCode?: string;
  images?: Media[];
  onHand: number;
  reserved: number;
  reorderLevel: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductDoc {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  brand?: string;
  teaType?: string;
  origin?: string;
  tags: string[];
  searchKeywords: string[];
  images: Media[];
  hsnCode: string;
  gstRate: number;
  minPricePaise: number;
  maxPricePaise: number;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BatchDoc {
  productId: string;
  variantId: string;
  batchNo: string;
  supplierId?: string;
  grnId?: string;
  qtyReceived: number;
  qtyRemaining: number;
  costPricePaise: number;
  manufacturedOn?: Timestamp | null;
  expiryDate?: Timestamp | null;
  receivedAt: Timestamp;
}

export type MovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'return_in'
  | 'adjustment'
  | 'damage'
  | 'reserve'
  | 'release'
  | 'purchase_return';

export type MovementRefType = 'order' | 'grn' | 'adjustment';

export interface StockMovementDoc {
  productId: string;
  variantId: string;
  batchId?: string;
  type: MovementType;
  quantity: number; // signed
  refType: MovementRefType;
  refId?: string;
  reason?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export type AlertType =
  | 'low_stock'
  | 'expiry'
  | 'new_order'
  | 'return_request'
  | 'payment_failed'
  | 'backup_failed'
  | 'stock_mismatch';

export interface AlertDoc {
  type: AlertType;
  variantId?: string;
  orderId?: string;
  message: string;
  threshold?: number;
  currentQty?: number;
  status: 'open' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Timestamp;
  resolvedAt?: Timestamp | null;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed_delivery'
  | 'rto'
  | 'return_requested'
  | 'return_approved'
  | 'return_picked'
  | 'return_received'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cod_pending'
  | 'cod_collected';

export type PaymentMethod = 'online' | 'cod';

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  image?: Media;
  hsnCode: string;
  quantity: number;
  unitPricePaise: number;
  discountPaise: number;
  taxableValuePaise: number;
  gstRate: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  lineTotalPaise: number;
  batchId?: string;
  costPriceSnapshotPaise?: number;
}

export interface OrderDoc {
  orderNumber: string;
  userId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItemSnapshot[];
  subtotalPaise: number;
  discountTotalPaise: number;
  shippingChargePaise: number;
  codFeePaise: number;
  taxTotalPaise: number;
  grandTotalPaise: number;
  couponCode?: string;
  shippingAddress: AddressDoc;
  billingAddress: AddressDoc;
  placeOfSupply: string;
  supplyType: 'intra' | 'inter';
  customerNote?: string;
  internalNote?: string;
  shipmentId?: string;
  awb?: string;
  courierName?: string;
  trackingUrl?: string;
  expectedDeliveryDate?: Timestamp | null;
  invoiceId?: string;
  invoiceNumber?: string;
  reservationExpiresAt?: Timestamp | null;
  placedAt: Timestamp;
  confirmedAt?: Timestamp | null;
  packedAt?: Timestamp | null;
  shippedAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  cancelledAt?: Timestamp | null;
  cancelReason?: string;
  cancelledBy?: string;
  dayKey: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimelineEventDoc {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  title: string;
  description: string;
  location?: string;
  source: 'system' | 'admin' | 'courier' | 'customer';
  actorUid?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}

export interface BusinessSettingsDoc {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: string;
  stateCode: string;
  stateName?: string;
  pincode: string;
  phone: string;
  email: string;
  logo?: Media;
  signature?: Media;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    upiId?: string;
  };
  invoicePrefix: string;
  financialYearStartMonth: number;
  terms?: string;
  codFeePaise?: number;
  freeShippingThresholdPaise?: number;
}

export interface InvoiceItemSnapshot {
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  ratePaise: number;
  discountPaise: number;
  taxableValuePaise: number;
  gstRate: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

export interface InvoiceDoc {
  invoiceNumber: string;
  financialYear: string;
  orderId: string;
  userId: string;
  invoiceDate: Timestamp;
  seller: {
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    address: string;
    stateCode: string;
    pincode: string;
    phone: string;
    email: string;
  };
  buyer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    stateCode: string;
    pincode: string;
  };
  buyerGstin?: string;
  placeOfSupply: string;
  supplyType: 'intra' | 'inter';
  items: InvoiceItemSnapshot[];
  taxableTotalPaise: number;
  cgstTotalPaise: number;
  sgstTotalPaise: number;
  igstTotalPaise: number;
  shippingTaxablePaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  amountInWords: string;
  pdf: {
    publicId: string;
    type: 'authenticated';
    resourceType: 'raw';
    url?: string;
  };
  irn?: string;
  qrCode?: string;
  status: 'issued' | 'cancelled';
  createdAt: Timestamp;
}

export interface CreditNoteDoc {
  creditNoteNumber: string;
  invoiceId: string;
  returnId?: string;
  reason: string;
  items: InvoiceItemSnapshot[];
  taxableTotalPaise: number;
  cgstTotalPaise: number;
  sgstTotalPaise: number;
  igstTotalPaise: number;
  grandTotalPaise: number;
  pdf?: {
    publicId: string;
    type: 'authenticated';
    resourceType: 'raw';
  };
  issuedAt: Timestamp;
}

export interface SupplierDoc {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  pan?: string;
  address: string;
  stateCode: string;
  paymentTermsDays: number;
  openingBalancePaise: number;
  outstandingPaise: number;
  notes?: string;
  isActive: boolean;
  isDeleted: boolean;
  products: {
    variantId: string;
    supplierSku?: string;
    lastPricePaise: number;
  }[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PurchaseOrderDoc {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled' | 'closed';
  orderDate: Timestamp;
  expectedDate?: Timestamp | null;
  items: {
    variantId: string;
    sku: string;
    name: string;
    qtyOrdered: number;
    qtyReceived: number;
    ratePaise: number;
    gstRate: number;
    totalPaise: number;
  }[];
  subtotalPaise: number;
  taxTotalPaise: number;
  totalPaise: number;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface GoodsReceiptDoc {
  grnNumber: string;
  poId?: string;
  supplierId: string;
  receivedDate: Timestamp;
  items: {
    variantId: string;
    quantity: number;
    batchNo: string;
    expiryDate?: Timestamp | null;
    costPricePaise: number;
  }[];
  notes?: string;
  createdAt: Timestamp;
}

export interface ExpenseDoc {
  categoryId: string;
  categoryName: string;
  title: string;
  amountPaise: number;
  gstAmountPaise?: number;
  expenseDate: Timestamp;
  dayKey: string;
  monthKey: string;
  paymentMode: string;
  vendorName?: string;
  referenceNo?: string;
  receipt?: Media;
  notes?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface DailySummaryDoc {
  date: string; // YYYY-MM-DD
  ordersPlaced: number;
  ordersConfirmed: number;
  ordersDelivered: number;
  ordersCancelled: number;
  itemsSold: number;
  grossSalesPaise: number;
  discountsPaise: number;
  taxPaise: number;
  netSalesPaise: number;
  shippingCollectedPaise: number;
  refundsPaise: number;
  cogsPaise: number;
  expensesPaise: number;
  newCustomers: number;
  byPaymentMethod: {
    online: { count: number; amountPaise: number };
    cod: { count: number; amountPaise: number };
  };
  byProduct: Record<string, { name: string; qty: number; revenuePaise: number }>;
  byCategory: Record<string, { qty: number; revenuePaise: number }>;
  byState: Record<string, { orders: number; revenuePaise: number }>;
  byCity: Record<string, { orders: number; revenuePaise: number }>;
  updatedAt: Timestamp;
}
