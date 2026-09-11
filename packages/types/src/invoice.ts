export interface BusinessDetails {
  businessName: string;
  brandName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

export interface CustomerDetails {
  customerId: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode: string;
  weight: number;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string; // e.g. INV-2026-000001
  orderId: string;
  orderNumber: string;
  saleId: string;
  invoiceDate: string;
  dueDate: string;
  businessDetails: BusinessDetails;
  customerDetails: CustomerDetails;
  items: InvoiceItem[];
  subtotal: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  shipping: number;
  grandTotal: number;
  amountInWords: string;
  termsAndConditions: string;
  bankDetails: BankDetails;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  paymentStatus?: 'PAID' | 'UNPAID';
  pdfUrl?: string;
  createdAt: string;
}
