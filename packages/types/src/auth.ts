export type AdminRole =
  | 'SUPER_ADMIN'
  | 'INVENTORY_MANAGER'
  | 'SALES_MANAGER'
  | 'ACCOUNTANT'
  | 'PROCUREMENT_MANAGER';

export interface AdminUser {
  uid: string;
  email: string;
  phone?: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminLoginCredentials {
  loginId: string; // Email or Phone number
  password: string;
  captchaInput: string;
  captchaToken: string;
}

export type Permission =
  | 'manage_all'
  | 'view_products'
  | 'manage_products'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_purchases'
  | 'manage_purchases'
  | 'view_suppliers'
  | 'manage_suppliers'
  | 'view_orders'
  | 'manage_orders'
  | 'confirm_orders'
  | 'view_customers'
  | 'manage_customers'
  | 'view_crm'
  | 'view_sales'
  | 'manage_sales'
  | 'view_invoices'
  | 'manage_invoices'
  | 'view_expenses'
  | 'manage_expenses'
  | 'view_reports'
  | 'export_reports'
  | 'view_audit_logs'
  | 'manage_settings'
  | 'manage_users'
  | 'view_backups';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'manage_all',
    'view_products',
    'manage_products',
    'view_inventory',
    'manage_inventory',
    'view_purchases',
    'manage_purchases',
    'view_suppliers',
    'manage_suppliers',
    'view_orders',
    'manage_orders',
    'confirm_orders',
    'view_customers',
    'manage_customers',
    'view_crm',
    'view_sales',
    'manage_sales',
    'view_invoices',
    'manage_invoices',
    'view_expenses',
    'manage_expenses',
    'view_reports',
    'export_reports',
    'view_audit_logs',
    'manage_settings',
    'manage_users',
    'view_backups',
  ],
  INVENTORY_MANAGER: [
    'view_products',
    'manage_products',
    'view_inventory',
    'manage_inventory',
    'view_purchases',
    'manage_purchases',
    'view_suppliers',
    'manage_suppliers',
    'view_reports',
  ],
  SALES_MANAGER: [
    'view_products',
    'view_orders',
    'manage_orders',
    'confirm_orders',
    'view_customers',
    'manage_customers',
    'view_crm',
    'view_sales',
    'manage_sales',
    'view_invoices',
    'view_reports',
    'export_reports',
  ],
  ACCOUNTANT: [
    'view_orders',
    'view_sales',
    'view_invoices',
    'manage_invoices',
    'view_expenses',
    'manage_expenses',
    'view_purchases',
    'view_reports',
    'export_reports',
  ],
  PROCUREMENT_MANAGER: [
    'view_suppliers',
    'manage_suppliers',
    'view_purchases',
    'manage_purchases',
    'view_inventory',
    'view_reports',
  ],
};
