import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const DashboardPage: React.FC = () => {
  const { state, store } = useTeaNestStore();

  const orders = state.orders;
  const sales = state.sales;
  const expenses = state.expenses;
  const products = state.products;
  const activeAlerts = state.lowStockAlerts.filter((a) => a.status === 'ACTIVE');

  // Filter out sales belonging to cancelled or returned orders
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const validSales = sales.filter((s) => {
    const matchedOrder = orderMap.get(s.orderId);
    if (matchedOrder && (matchedOrder.status === 'CANCELLED' || matchedOrder.status === 'RETURNED')) {
      return false;
    }
    return true;
  });

  // Operational metrics
  const todayStr = new Date().toISOString().substring(0, 10);
  const todaySales = validSales
    .filter((s) => s.saleDate === todayStr)
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const totalSalesAmount = validSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCogs = validSales.reduce((sum, s) => sum + s.costOfGoods, 0);
  const grossProfit = totalSalesAmount - totalCogs;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const pendingOrders = orders.filter(
    (o) => o.status === 'WHATSAPP_PENDING' || o.status === 'PENDING_CONFIRMATION'
  );
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const processingOrders = orders.filter((o) => o.status === 'PROCESSING');
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED');
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');

  // Dynamic 7-day sales trend computed strictly from valid completed transactions
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const salesTrendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().substring(0, 10);
    const dayName = 6 - i === 0 ? `${dayNames[d.getDay()]} (Today)` : dayNames[d.getDay()];
    const daySales = validSales
      .filter((s) => s.saleDate === dStr)
      .reduce((sum, s) => sum + s.grandTotal, 0);
    return {
      day: dayName,
      date: dStr,
      sales: daySales,
    };
  });

  // Orders by Status chart - strictly real counts across full lifecycle
  const orderStatusData = [
    { name: 'Pending WhatsApp', value: pendingOrders.length, color: '#f59e0b' },
    { name: 'Confirmed', value: confirmedOrders.length, color: '#22c55e' },
    { name: 'Processing', value: processingOrders.length, color: '#3b82f6' },
    { name: 'Shipped', value: shippedOrders.length, color: '#8b5cf6' },
    { name: 'Delivered', value: deliveredOrders.length, color: '#10b981' },
    { name: 'Cancelled', value: cancelledOrders.length, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const pipelineBreakdown = [
    { name: 'Pending WhatsApp', value: pendingOrders.length, color: '#f59e0b' },
    { name: 'Confirmed', value: confirmedOrders.length, color: '#22c55e' },
    { name: 'Processing', value: processingOrders.length, color: '#3b82f6' },
    { name: 'Shipped', value: shippedOrders.length, color: '#8b5cf6' },
    { name: 'Delivered', value: deliveredOrders.length, color: '#10b981' },
    { name: 'Cancelled', value: cancelledOrders.length, color: '#ef4444' },
  ];

  const hasOrdersForPie = orderStatusData.length > 0;



  const handleQuickConfirm = async (orderId: string) => {
    try {
      await store.confirmOrder(orderId);
      alert('Order successfully confirmed! Stock deducted and GST Tax Invoice generated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-100">
            Executive ERP Dashboard
          </h1>
          <p className="text-xs text-admin-muted mt-1">
            Real-time tea inventory, sales ledgers, WhatsApp order pipelines, and P&L metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 bg-admin-card hover:bg-admin-border border border-admin-border text-xs font-semibold rounded-xl text-gray-300 transition-colors"
          >
            View Orders ({orders.length})
          </Link>
          <Link
            to="/products"
            className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow-lg"
          >
            Manage Catalog
          </Link>
        </div>
      </div>

      {/* Low Stock Alert Banner (Dynamic) */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/60 text-red-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">
                Low Stock Warning: {activeAlerts.length} Product(s) Below 70% Threshold
              </h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                {activeAlerts.map((a) => `${a.productName} (${a.currentStock} remaining / threshold: ${a.threshold})`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            to="/purchases"
            className="px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
          >
            Create Purchase Order
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-admin-muted uppercase font-bold tracking-wider">Gross Sales</span>
            <div className="p-2 bg-admin-card text-admin-gold rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(totalSalesAmount, false)}
            </div>
            <p className="text-[11px] text-green-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Today: {formatCurrency(todaySales, false)} • {validSales.length} Active Sale(s)</span>
            </p>
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-admin-muted uppercase font-bold tracking-wider">Pending Orders</span>
            <div className="p-2 bg-admin-card text-yellow-400 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {pendingOrders.length}
            </div>
            <p className="text-[11px] text-admin-muted mt-1">
              {orders.filter(o => o.status === 'WHATSAPP_PENDING').length} WhatsApp intent(s) awaiting confirm
            </p>
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-admin-muted uppercase font-bold tracking-wider">Active Inventory</span>
            <div className="p-2 bg-admin-card text-emerald-400 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {products.reduce((sum, p) => sum + p.stockQuantity, 0)} units
            </div>
            <p className="text-[11px] text-admin-muted mt-1">
              Across {products.length} catalog SKU(s)
            </p>
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-admin-muted uppercase font-bold tracking-wider">Estimated Net Profit</span>
            <div className="p-2 bg-admin-card text-admin-gold rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(netProfit, false)}
            </div>
            <p className="text-[11px] text-admin-muted mt-1">
              Gross: {formatCurrency(grossProfit, false)} - Exp: {formatCurrency(totalExpenses, false)}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-8 bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Revenue & Sales Performance</h3>
              <p className="text-xs text-admin-muted">Daily gross revenue trajectory in INR</p>
            </div>
            <span className="text-xs font-bold text-admin-gold bg-admin-card px-2.5 py-1 rounded-lg border border-admin-border">
              Live Transaction Ledger
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c5a059" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#26332d" />
                <XAxis dataKey="day" stroke="#8e9d95" fontSize={11} />
                <YAxis stroke="#8e9d95" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151b18', borderColor: '#26332d', color: '#fff' }}
                  formatter={(value: any) => [`₹${value}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#dfc07b" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-4 bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Orders by Pipeline Status</h3>
            <p className="text-xs text-admin-muted">Current distribution across lifecycle</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {hasOrdersForPie ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#151b18', borderColor: '#26332d', color: '#fff' }} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-4">
                <ShoppingBag className="w-8 h-8 text-admin-muted/40 mx-auto mb-2" />
                <p className="text-xs text-admin-muted">Awaiting customer orders</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Live distribution will appear as orders arrive</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-admin-border">
            {pipelineBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="font-bold text-gray-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-admin-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Recent Customer Orders</h3>
            <p className="text-xs text-admin-muted">Live queue from WhatsApp and web checkout</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-admin-gold hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-admin-muted">
            No customer orders received yet. Place an order via the customer storefront to see real-time updates!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-bold text-admin-gold">{order.orderNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-200">{order.customerName}</p>
                      <p className="text-[11px] text-admin-muted">{order.customerMobile}</p>
                    </td>
                    <td className="p-4 text-gray-300">
                      {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                    </td>
                    <td className="p-4 font-bold text-gray-100">
                      {formatCurrency(order.grandTotal, false)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          order.status === 'CONFIRMED'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : order.status === 'WHATSAPP_PENDING' || order.status === 'PENDING_CONFIRMATION'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : order.status === 'PROCESSING'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(order.createdAt)}</td>
                    <td className="p-4 text-right">
                      {order.status === 'WHATSAPP_PENDING' || order.status === 'PENDING_CONFIRMATION' ? (
                        <button
                          onClick={() => handleQuickConfirm(order.id)}
                          className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors shadow"
                        >
                          Confirm & Invoice
                        </button>
                      ) : order.status === 'CANCELLED' ? (
                        <span className="text-rose-400 font-semibold text-xs">Void / Cancelled</span>
                      ) : (
                        <Link
                          to={`/invoices`}
                          className="text-xs text-admin-gold hover:underline font-semibold"
                        >
                          Invoice Generated
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
