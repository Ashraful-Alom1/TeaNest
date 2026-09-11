import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Eye,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate, formatDateTime } from '@tea-nest/shared';
import { Order, OrderStatus } from '@tea-nest/types';

export const OrdersPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmModalOrder, setConfirmModalOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const orders = state.orders;

  const getTabCount = (statusKey: string) => {
    if (statusKey === 'ALL') return orders.length;
    if (statusKey === 'WHATSAPP_PENDING') {
      return orders.filter(
        (o) => o.status === 'WHATSAPP_PENDING' || o.status === 'PENDING_CONFIRMATION'
      ).length;
    }
    return orders.filter((o) => o.status === statusKey).length;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-950 text-green-400 border border-green-800';
      case 'WHATSAPP_PENDING':
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-950 text-amber-400 border border-amber-800';
      case 'PROCESSING':
        return 'bg-blue-950 text-blue-400 border border-blue-800';
      case 'SHIPPED':
        return 'bg-purple-950 text-purple-400 border border-purple-800';
      case 'DELIVERED':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
      case 'CANCELLED':
        return 'bg-rose-950 text-rose-400 border border-rose-800';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === 'ALL' ||
      order.status === selectedStatus ||
      (selectedStatus === 'WHATSAPP_PENDING' && order.status === 'PENDING_CONFIRMATION');
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerMobile.includes(query) ||
      order.customerEmail.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const handleConfirmOrder = async (order: Order) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await store.confirmOrder(order.id);
      setLoading(false);
      setConfirmModalOrder(null);
      setSuccessMessage(
        `Order ${order.orderNumber} successfully confirmed! Generated GST Invoice: ${res.invoice.invoiceNumber}. Inventory deducted atomically.`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to confirm order.');
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'CANCELLED') {
      const confirmCancel = window.confirm(
        'Are you sure you want to cancel this order? Any deducted stock will be returned to inventory, and sales records will be voided.'
      );
      if (!confirmCancel) return;
    }
    store.updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = store.getState().orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handlePaymentToggle = (order: Order) => {
    if (order.status === 'CANCELLED') {
      alert('Cancelled orders cannot be marked as PAID.');
      return;
    }
    const nextPayment: 'UNPAID' | 'PAID' = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    store.updateOrderPaymentStatus(order.id, nextPayment);
    if (selectedOrder && selectedOrder.id === order.id) {
      const updated = store.getState().orders.find((o) => o.id === order.id);
      if (updated) setSelectedOrder(updated);
    }
    setSuccessMessage(`Order ${order.orderNumber} payment marked as ${nextPayment}.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Customer Order Pipeline</h1>
          <p className="text-xs text-admin-muted mt-1">
            Review incoming WhatsApp intents, verify payments, confirm stock deduction, and issue GST tax invoices.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-950/60 border border-green-800 text-green-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills with Dynamic Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {['ALL', 'WHATSAPP_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedStatus === s
                  ? 'bg-admin-accent text-black font-bold shadow'
                  : 'bg-admin-surface hover:bg-admin-card text-gray-300 border border-admin-border'
              }`}
            >
              <span>{s.replace('_', ' ')}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedStatus === s
                    ? 'bg-black/20 text-black'
                    : 'bg-admin-card text-admin-muted'
                }`}
              >
                {getTabCount(s)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, customer, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-gray-200 outline-none focus:border-admin-accent"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-admin-muted">
            No orders found matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-bold text-admin-gold flex items-center gap-1.5">
                      {order.isWhatsAppOrder && (
                        <span title="WhatsApp Order Intent">
                          <MessageSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        </span>
                      )}
                      <span>{order.orderNumber}</span>
                    </td>
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.status === 'CANCELLED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                          UNPAID
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePaymentToggle(order)}
                          title="Click to toggle Payment Received / Unpaid"
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-green-950 hover:bg-green-900 text-green-300 border border-green-700/60'
                              : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.paymentStatus === 'PAID' ? 'bg-green-400' : 'bg-amber-400'
                            }`}
                          />
                          <span>{order.paymentStatus}</span>
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(order.createdAt)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {order.status === 'WHATSAPP_PENDING' || order.status === 'PENDING_CONFIRMATION' ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setConfirmModalOrder(order)}
                            className="px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors shadow"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                            className="px-2 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="bg-admin-card border border-admin-border text-gray-200 text-xs px-2 py-1 rounded-lg outline-none"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Order Modal */}
      {confirmModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-gray-100">
              Confirm Order {confirmModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-admin-muted">
              Confirming this order will trigger atomic transactional actions:
            </p>

            <div className="space-y-2 text-xs bg-admin-card p-3 rounded-xl border border-admin-border">
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Re-read and verify real-time available stock</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Atomically deduct stock units from inventory</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Create official GST Tax Invoice with INV-2026 sequence</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Record inventory movement & audit trail</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Check 70% threshold and trigger Low Stock Alert if needed</span>
              </div>
            </div>

            <div className="p-3 bg-admin-bg rounded-xl text-xs space-y-1">
              <p><strong>Customer:</strong> {confirmModalOrder.customerName} ({confirmModalOrder.customerMobile})</p>
              <p><strong>Total Amount:</strong> {formatCurrency(confirmModalOrder.grandTotal, false)}</p>
              <p><strong>Items:</strong> {confirmModalOrder.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOrder(null)}
                className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConfirmOrder(confirmModalOrder)}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow"
              >
                {loading ? 'Processing Transaction...' : 'Confirm & Deduct Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-admin-border pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-admin-gold">
                  Order Details: {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-admin-muted">Placed: {formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-admin-card p-3 rounded-xl border border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-gray-400 uppercase block mb-1">Status & Payment</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                    <button
                      type="button"
                      disabled={selectedOrder.status === 'CANCELLED'}
                      onClick={() => handlePaymentToggle(selectedOrder)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                        selectedOrder.paymentStatus === 'PAID'
                          ? 'bg-green-950 text-green-300 border border-green-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedOrder.paymentStatus === 'PAID' ? 'bg-green-400' : 'bg-amber-400'
                        }`}
                      />
                      <span>{selectedOrder.paymentStatus}</span>
                      {selectedOrder.status !== 'CANCELLED' && (
                        <span className="text-[9px] text-gray-400 underline ml-1">Click to Toggle</span>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Update Pipeline Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    className="bg-admin-bg border border-admin-border text-gray-200 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                  >
                    <option value="WHATSAPP_PENDING">WHATSAPP_PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="bg-admin-card p-3 rounded-xl border border-admin-border space-y-1">
                <span className="font-bold text-gray-400 uppercase">Customer Information</span>
                <p className="font-semibold text-gray-200">{selectedOrder.customerName}</p>
                <p className="text-admin-muted">{selectedOrder.customerEmail} | {selectedOrder.customerMobile}</p>
                <p className="text-gray-300 mt-1">
                  <strong>Delivery:</strong>{' '}
                  {selectedOrder.shippingAddress?.street
                    ? `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} - ${selectedOrder.shippingAddress.pincode}`
                    : 'No delivery address provided'}
                </p>
              </div>

              <div className="bg-admin-card p-3 rounded-xl border border-admin-border space-y-2">
                <span className="font-bold text-gray-400 uppercase">Purchased Items</span>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-admin-border last:border-none">
                    <div>
                      <p className="font-semibold text-gray-200">{item.name}</p>
                      <p className="text-[11px] text-admin-muted">SKU: {item.sku} • Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-admin-gold">{formatCurrency(item.total, false)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-admin-bg p-3 rounded-xl space-y-1 text-right">
                <p className="text-gray-400">Subtotal: {formatCurrency(selectedOrder.subtotal, false)}</p>
                <p className="text-gray-400">GST (5%): {formatCurrency(selectedOrder.tax, false)}</p>
                <p className="text-gray-400">Shipping: {selectedOrder.shipping === 0 ? 'FREE' : formatCurrency(selectedOrder.shipping, false)}</p>
                <p className="text-sm font-bold text-white pt-1 border-t border-admin-border">
                  Grand Total: {formatCurrency(selectedOrder.grandTotal, false)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
