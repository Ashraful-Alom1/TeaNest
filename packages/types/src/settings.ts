export interface BusinessSettings {
  brandName: string; // e.g. "Tea Nest"
  businessName: string; // e.g. "Fortunate Ventures"
  logoUrl?: string;
  phone: string;
  email: string;
  whatsappOrderNumber: string; // e.g. "918822308551" without symbols for wa.me
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  currency: string; // 'INR'
  currencySymbol: string; // '₹'
  invoicePrefix: string; // 'INV-2026-'
  startingInvoiceNumber: number; // 1
  orderPrefix: string; // 'TN-2026-'
  lowStockDefaultPercent: number; // 70
  terms: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
  orderSettings: {
    allowDirectWhatsapp: boolean;
    minOrderValue: number;
    freeShippingThreshold: number;
    defaultShippingCharge: number;
  };
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  footerContent: string;
  updatedAt: string;
}
