import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { LowStockPage } from './pages/LowStockPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { BusinessSettingsPage } from './pages/BusinessSettingsPage';
import { BackupSecurityPage } from './pages/BackupSecurityPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { BlogsPage } from './pages/BlogsPage';

export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/blogs"
        element={
          <AdminLayout>
            <BlogsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/"
        element={
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <AdminLayout>
            <OrdersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/products"
        element={
          <AdminLayout>
            <ProductsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/inventory"
        element={
          <AdminLayout>
            <InventoryPage />
          </AdminLayout>
        }
      />
      <Route
        path="/low-stock"
        element={
          <AdminLayout>
            <LowStockPage />
          </AdminLayout>
        }
      />
      <Route
        path="/purchases"
        element={
          <AdminLayout>
            <PurchasesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/suppliers"
        element={
          <AdminLayout>
            <SuppliersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/customers"
        element={
          <AdminLayout>
            <CustomersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/sales"
        element={
          <AdminLayout>
            <SalesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/invoices"
        element={
          <AdminLayout>
            <InvoicesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/expenses"
        element={
          <AdminLayout>
            <ExpensesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/finance"
        element={
          <AdminLayout>
            <FinancePage />
          </AdminLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AdminLayout>
            <ReportsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/users"
        element={
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <AdminLayout>
            <AuditLogsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AdminLayout>
            <BusinessSettingsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/backup-security"
        element={
          <AdminLayout>
            <BackupSecurityPage />
          </AdminLayout>
        }
      />
      <Route
        path="*"
        element={
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        }
      />
    </Routes>
    </>
  );
};

export default App;
