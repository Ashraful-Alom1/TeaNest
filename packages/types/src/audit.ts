import { AdminRole } from './auth';

export type AuditAction =
  | 'LOGIN'
  | 'ROLE_CHANGED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_ARCHIVED'
  | 'PRODUCT_DELETED'
  | 'STOCK_UPDATED'
  | 'PURCHASE_CREATED'
  | 'PURCHASE_RECEIVED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_PAYMENT_UPDATED'
  | 'PAYMENT_STATUS_UPDATED'
  | 'ORDER_SHIPPED'
  | 'INVOICE_CREATED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'SUPPLIER_CREATED'
  | 'SUPPLIER_UPDATED'
  | 'SUPPLIER_DELETED'
  | 'BLOG_CREATED'
  | 'BLOG_UPDATED'
  | 'BLOG_DELETED';

export interface AuditLog {
  logId: string;
  actorUid: string;
  actorEmail: string;
  actorRole: AdminRole | 'SYSTEM' | 'CUSTOMER';
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  timestamp: string;
}
