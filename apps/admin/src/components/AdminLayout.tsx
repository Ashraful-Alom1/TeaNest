import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BookOpen,
  Boxes,
  Truck,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  Settings,
  Database,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { state, store } = useTeaNestStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const admin = state.currentAdmin;
  if (!admin || !admin.isActive) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const activeAlerts = state.lowStockAlerts.filter((a) => a.status === 'ACTIVE');

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: ShoppingBag, badge: state.orders.filter(o => o.status === 'WHATSAPP_PENDING').length },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Blog Articles', path: '/blogs', icon: BookOpen },
    { label: 'Inventory & Moves', path: '/inventory', icon: Boxes },
    { label: 'Low Stock Alerts', path: '/low-stock', icon: AlertTriangle, badge: activeAlerts.length, badgeDanger: true },
    { label: 'Purchases (PO)', path: '/purchases', icon: Truck },
    { label: 'Suppliers', path: '/suppliers', icon: Users },
    { label: 'Customers & CRM', path: '/customers', icon: UserCheck },
    { label: 'Sales Ledger', path: '/sales', icon: TrendingUp },
    { label: 'GST Tax Invoices', path: '/invoices', icon: FileText },
    { label: 'Expense Ledger', path: '/expenses', icon: DollarSign },
    { label: 'Finance & P&L', path: '/finance', icon: PieChart },
    { label: 'Reports & Exports', path: '/reports', icon: BarChart3 },
    { label: 'Admin Users & RBAC', path: '/users', icon: ShieldAlert },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
    { label: 'Business Settings', path: '/settings', icon: Settings },
    { label: 'Backup & Security', path: '/backup-security', icon: Database },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    store.logoutAdmin();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-admin-bg text-gray-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-admin-surface border-r border-admin-border shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-admin-border gap-3">
          <img src={`${import.meta.env.BASE_URL}images/tea_nest_logo.svg`} alt="Tea Nest" className="h-10 w-auto" />
          <div className="overflow-hidden">
            <h1 className="font-serif text-sm font-bold text-admin-gold tracking-widest truncate">TEA NEST ERP</h1>
            <p className="text-[10px] text-admin-muted truncate font-medium">Enterprise Management</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? 'bg-admin-border text-admin-gold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-admin-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-admin-gold' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeDanger
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-admin-forest text-green-400 border border-green-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Storefront Link & Admin Pill */}
        <div className="p-4 border-t border-admin-border space-y-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-admin-card hover:bg-admin-border text-xs text-admin-gold transition-colors"
          >
            <span>Visit Customer Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {admin && (
            <div className="flex items-center justify-between pt-2">
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-200 truncate">{admin.name}</p>
                <span className="text-[10px] uppercase tracking-wider text-admin-gold font-semibold">
                  {admin.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-admin-surface border-r border-admin-border flex flex-col z-50">
            <div className="h-16 flex items-center justify-between px-4 border-b border-admin-border">
              <span className="font-serif text-sm font-bold text-admin-gold">TEA NEST ERP</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive(item.path) ? 'bg-admin-border text-admin-gold' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-admin-surface border-b border-admin-border flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Quick Search */}
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders, SKU, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-200 placeholder:text-gray-500 outline-none focus:border-admin-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Low stock notifications */}
            <Link
              to="/low-stock"
              className="relative p-2 text-gray-400 hover:text-admin-gold transition-colors"
              title="Low Stock Alerts"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </Link>

            {/* Role Badge */}
            {admin && (
              <div className="hidden sm:flex items-center gap-2 bg-admin-card border border-admin-border px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-gray-300">
                  {admin.role.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
