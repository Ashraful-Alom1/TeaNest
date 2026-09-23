import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  AlertCircle,
  Truck,
  Package,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate, formatDateTime } from '@tea-nest/shared';
import { Order, OrderStatus } from '@tea-nest/types';

export const OrdersPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Ship Modal State
  const [shipModalOrder, setShipModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const orders = state.orders;

  const tabs = ['ALL', 'WHATSAPP_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const getTabCount = (statusKey: string) => {
    if (statusKey === 'ALL') return orders.length;
    if (statusKey === 'WHATSAPP_PENDING') {
      return orders.filter((o) => o.status === 'WHATSAPP_PENDING' || o.status === 'PENDING_CONFIRMATION' || o.status === 'DRAFT').length;
    }
    return orders.filter((o) => o.status === statusKey).length;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'WHATSAPP_PENDING':
      case 'PENDING_CONFIRMATION':
      case 'DRAFT':
        return 'bg-amber-950 text-amber-400 border border-amber-800';
      case 'CONFIRMED':
        return 'bg-green-950 text-green-400 border border-green-800';
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

  const filteredOrders = orders
    .filter((order) => {
      let matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
      if (selectedStatus === 'WHATSAPP_PENDING') {
        matchesStatus =
          order.status === 'WHATSAPP_PENDING' ||
          order.status === 'PENDING_CONFIRMATION' ||
          order.status === 'DRAFT';
      }
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerMobile.includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleConfirmOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    try {
      await store.confirmOrder(orderId);
      setSuccessMessage(`Order ${target.orderNumber} successfully confirmed! Inventory deducted and Invoice generated.`);
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = store.getState().orders.find((o) => o.id === orderId);
        if (updated) setSelectedOrder(updated);
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm order');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order ${target.orderNumber}?` +
      (target.status === 'CONFIRMED' || target.status === 'PROCESSING' || target.status === 'SHIPPED'
        ? ' Any deducted stock will be automatically returned to garden inventory.'
        : '')
    );
    if (!confirmCancel) return;

    try {
      await store.cancelOrder(orderId);
      setSuccessMessage(`Order ${target.orderNumber} cancelled successfully.`);
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = store.getState().orders.find((o) => o.id === orderId);
        if (updated) setSelectedOrder(updated);
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel order');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'CANCELLED') {
      await handleCancelOrder(orderId);
      return;
    }

    if (newStatus === 'SHIPPED') {
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        setShipModalOrder(target);
        setTrackingNumber(`TN-TRK-${Math.floor(100000 + Math.random() * 900000)}`);
        return;
      }
    }

    if (newStatus === 'CONFIRMED') {
      const target = orders.find((o) => o.id === orderId);
      if (target && target.status !== 'CONFIRMED') {
        await handleConfirmOrder(orderId);
        return;
      }
    }

    store.updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = store.getState().orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
    setSuccessMessage(`Order updated to ${newStatus}.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipModalOrder) return;

    if (!trackingNumber.trim()) {
      setErrorMessage('Please provide a tracking / AWB number.');
      return;
    }

    store.shipOrder(
      shipModalOrder.id,
      courierName.trim(),
      trackingNumber.trim(),
      trackingUrl.trim() || undefined
    );

    setSuccessMessage(`Order ${shipModalOrder.orderNumber} successfully marked as SHIPPED with tracking ID ${trackingNumber.trim()}.`);
    setShipModalOrder(null);
    if (selectedOrder && selectedOrder.id === shipModalOrder.id) {
      const updated = store.getState().orders.find((o) => o.id === shipModalOrder.id);
      if (updated) setSelectedOrder(updated);
    }
    setTimeout(() => setSuccessMessage(''), 5000);
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

  const openCustomerWhatsApp = (order: Order) => {
    let cleanPhone = (order.customerMobile || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert(`Customer mobile number (${order.customerMobile || 'empty'}) is invalid or missing.`);
      return;
    }
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const itemsSummary = order.items
      .map((item, idx) => `  ${idx + 1}. *${item.name}* (Qty: ${item.quantity}) — ₹${item.total.toFixed(2)}`)
      .join('\n');

    const addressText = order.shippingAddress?.street
      ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
      : 'On file';

    const trackingText = order.trackingNumber
      ? `\n🚚 *Courier Logistics:* ${order.courierName || 'Express Logistics'}\n📦 *Tracking ID:* ${order.trackingNumber}${
          order.trackingUrl ? `\n🔗 *Track Online:* ${order.trackingUrl}` : ''
        }`
      : '';

    const msg = `🌿 *TEA NEST — OFFICIAL ORDER UPDATE* 🌿

Dear *${order.customerName}*,

Greetings from Tea Nest Assam! This is an official update regarding your order:

📦 *Order Number:* ${order.orderNumber}
📊 *Current Status:* *${order.status}*
💳 *Payment Status:* *${order.paymentStatus}*
💰 *Grand Total:* ₹${order.grandTotal.toFixed(2)} (Incl. 5% GST)

📍 *Delivery Address:*
${addressText}

🛍️ *Order Items:*
${itemsSummary}${trackingText}

---
Thank you for choosing Tea Nest! Feel free to reply directly to this message for any queries or delivery instructions.

_Tea Nest Official Customer Desk_
📞 +91 88223 08551 | 🌐 www.teanest.in`;

    const encoded = encodeURIComponent(msg);
    // Opens WhatsApp Web/App connected to Admin account, with message pre-filled to the Customer's phone number
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Customer Order Pipeline</h1>
          <p className="text-xs text-admin-muted mt-1">
            Real-time fulfillment tracking pipeline: Confirm, Process, Dispatch with Courier Tracking, and Deliver.
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
          {tabs.map((s) => {
            const displayLabel = s === 'WHATSAPP_PENDING' ? 'NEW ORDERS' : s;
            return (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-admin-accent text-black font-bold shadow'
                    : 'bg-admin-surface hover:bg-admin-card text-gray-300 border border-admin-border'
                }`}
              >
                <span>{displayLabel}</span>
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
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, customer, tracking..."
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
            No customer orders found under the selected filter criteria.
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
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Quick Pipeline Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredOrders.map((order) => {
                  const isPending =
                    order.status === 'WHATSAPP_PENDING' ||
                    order.status === 'PENDING_CONFIRMATION' ||
                    order.status === 'DRAFT';

                  return (
                    <tr key={order.id} className="hover:bg-admin-card/50 transition-colors">
                      <td className="p-4 font-bold text-admin-gold">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                          <span>{order.orderNumber}</span>
                        </div>
                        {order.trackingNumber && (
                          <span className="text-[10px] text-purple-400 font-normal block mt-0.5">
                            AWB: {order.trackingNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-200">{order.customerName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-admin-muted">{order.customerMobile}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomerWhatsApp(order);
                            }}
                            className="p-0.5 hover:bg-[#25D366]/20 text-[#25D366] rounded transition-colors cursor-pointer"
                            title={`Send WhatsApp message from Admin (+91 88223 08551) to ${order.customerName} (${order.customerMobile})`}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">
                        {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                      </td>
                      <td className="p-4 font-bold text-gray-100">
                        {formatCurrency(order.grandTotal, false)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                          {isPending ? 'NEW ORDER' : order.status}
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
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {/* Status progression buttons */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              className="px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Confirm order, deduct stock from garden inventory, and issue sequential GST tax invoice"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Order</span>
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2.5 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Cancel order and mark as cancelled"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'PROCESSING')}
                              className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                              title="Move to Garden Packing / Processing"
                            >
                              Pack & Process →
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Cancel order and return stock to inventory"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {order.status === 'PROCESSING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                              className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Dispatch and assign Courier Tracking Number"
                            >
                              <Truck className="w-3 h-3 inline mr-1" />
                              <span>Ship Order</span>
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Cancel order and return stock to inventory"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                            title="Mark Order as Successfully Delivered"
                          >
                            Mark Delivered ✓
                          </button>
                        )}

                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="bg-admin-card border border-admin-border text-gray-200 text-xs px-2 py-1.5 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="WHATSAPP_PENDING">NEW ORDER</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center align-middle"
                          title="View Full Order Details & Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ship Order Modal (Courier & Tracking ID) */}
      {shipModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Truck className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold text-gray-100">
                Dispatch Order {shipModalOrder.orderNumber}
              </h3>
            </div>
            <p className="text-xs text-admin-muted">
              Enter courier shipment information so the customer can track their tea package live.
            </p>

            <form onSubmit={handleShipSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">
                  Courier / Logistics Partner *
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent cursor-pointer"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="DTDC Express">DTDC Express</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="Ekart Logistics">Ekart Logistics</option>
                  <option value="Self Hand Delivery (Dibrugarh/Assam)">Self Hand Delivery (Dibrugarh/Assam)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">
                  Tracking / AWB Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEL-78904321"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">
                  Tracking Web Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://delhivery.com/track/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShipModalOrder(null)}
                  className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Shipment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-admin-surface border border-admin-border w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-admin-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Order Details:</span>
                  <span className="text-admin-gold">{selectedOrder.orderNumber}</span>
                </h3>
                <p className="text-xs text-admin-muted mt-0.5">
                  Placed on {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-admin-card cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Visual Tracking Progress Timeline (5-Step Horizontal Line & Circle Stepper) */}
            <div className="bg-admin-bg p-4 rounded-xl border border-admin-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-gold block">
                  Order Fulfillment Tracker
                </span>
                <span className="text-[10px] font-semibold text-gray-400">
                  {selectedOrder.status === 'CANCELLED'
                    ? 'CANCELLED'
                    : selectedOrder.status === 'DELIVERED'
                    ? 'Delivered to Customer'
                    : selectedOrder.status === 'SHIPPED'
                    ? 'In Transit with Carrier'
                    : selectedOrder.status === 'PROCESSING'
                    ? 'Packing at Estate'
                    : selectedOrder.status === 'CONFIRMED'
                    ? 'Confirmed (Stock Reserved)'
                    : 'New Order Received (Pending Admin Confirmation)'}
                </span>
              </div>

              {selectedOrder.status === 'CANCELLED' ? (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>This order has been cancelled. Inventory has been restored.</span>
                </div>
              ) : (
                (() => {
                  let stepIdx = 0;
                  if (selectedOrder.status === 'CONFIRMED') stepIdx = 1;
                  if (selectedOrder.status === 'PROCESSING') stepIdx = 2;
                  if (selectedOrder.status === 'SHIPPED') stepIdx = 3;
                  if (selectedOrder.status === 'DELIVERED') stepIdx = 4;

                  const adminSteps = [
                    { key: 'placed', label: 'New Order', sub: 'Received', date: selectedOrder.createdAt },
                    { key: 'confirmed', label: 'Confirmed', sub: 'Reserved', date: selectedOrder.confirmedAt },
                    { key: 'packing', label: 'Packing', sub: 'Garden', date: selectedOrder.processingAt },
                    { key: 'shipped', label: 'Dispatched', sub: selectedOrder.courierName || 'Shipped', date: selectedOrder.shippedAt },
                    { key: 'delivered', label: 'Delivered', sub: 'Received', date: selectedOrder.deliveredAt },
                  ];

                  const pct = (stepIdx / 4) * 100;

                  return (
                    <div className="relative py-2 px-1">
                      {/* Horizontal background track line */}
                      <div className="absolute top-4 left-4 right-4 h-1 bg-gray-800 -translate-y-1/2 z-0 rounded-full" />
                      
                      {/* Vibrant Green Filled Progress Line */}
                      <div
                        className="absolute top-4 left-4 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                        style={{ width: `calc(${pct}% - ${pct === 100 ? '0px' : '8px'})` }}
                      />

                      {/* Stepper circles */}
                      <div className="relative z-10 flex items-start justify-between">
                        {adminSteps.map((st, i) => {
                          const isDone = i < stepIdx;
                          const isCur = i === stepIdx;

                          return (
                            <div key={st.key} className="flex flex-col items-center text-center max-w-[65px]">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all duration-300 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                                    : isCur
                                    ? 'bg-emerald-500 text-black font-extrabold shadow-md ring-4 ring-emerald-400/50 animate-pulse'
                                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                                }`}
                              >
                                {isDone ? '✓' : i + 1}
                              </div>
                              <p
                                className={`text-[10px] font-bold mt-1.5 leading-tight ${
                                  isCur
                                    ? 'text-emerald-400 font-extrabold'
                                    : isDone
                                    ? 'text-gray-200'
                                    : 'text-gray-500'
                                }`}
                              >
                                {st.label}
                              </p>
                              <p className="text-[8px] text-gray-500 truncate max-w-[60px] leading-tight">
                                {st.date ? formatDate(st.date) : st.sub}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {selectedOrder.trackingNumber && (
                <div className="pt-2 border-t border-admin-border text-[11px] text-purple-300 flex items-center justify-between">
                  <span>
                    <strong>Carrier:</strong> {selectedOrder.courierName || 'Express Logistics'} • <strong>AWB:</strong> {selectedOrder.trackingNumber}
                  </span>
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-admin-gold hover:underline flex items-center gap-1"
                    >
                      <span>Track Online</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-admin-card p-3.5 rounded-xl border border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-gray-400 uppercase block mb-1">Pipeline & Payment</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedOrder.status === 'CANCELLED'}
                      onClick={() => handlePaymentToggle(selectedOrder)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                      <span className="text-[9px] text-gray-400 underline ml-1">Toggle</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCustomerWhatsApp(selectedOrder)}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    title="Send WhatsApp update to customer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </button>
                </div>
              </div>

              <div className="bg-admin-card p-3 rounded-xl border border-admin-border space-y-1">
                <span className="font-bold text-gray-400 uppercase">Customer Information</span>
                <p className="font-semibold text-gray-200">{selectedOrder.customerName}</p>
                <p className="text-admin-muted">{selectedOrder.customerEmail} | {selectedOrder.customerMobile}</p>
                <p className="text-gray-300 mt-1">
                  <strong>Delivery Address:</strong>{' '}
                  {selectedOrder.shippingAddress?.street
                    ? `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} - ${selectedOrder.shippingAddress.pincode}`
                    : 'No address provided'}
                </p>
                {selectedOrder.notes && (
                  <p className="text-amber-300 text-[11px] pt-1">
                    <strong>Customer Notes:</strong> {selectedOrder.notes}
                  </p>
                )}
              </div>

              <div className="bg-admin-card p-3 rounded-xl border border-admin-border space-y-2">
                <span className="font-bold text-gray-400 uppercase">Ordered Items</span>
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

            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-admin-border">
              <div className="flex flex-wrap items-center gap-2">
                {/* Modal Direct Action Buttons */}
                {(selectedOrder.status === 'WHATSAPP_PENDING' ||
                  selectedOrder.status === 'PENDING_CONFIRMATION' ||
                  selectedOrder.status === 'DRAFT') && (
                  <>
                    <button
                      onClick={() => handleConfirmOrder(selectedOrder.id)}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Order</span>
                    </button>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-bold shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancel Order</span>
                    </button>
                  </>
                )}

                {selectedOrder.status !== 'CANCELLED' &&
                  selectedOrder.status !== 'DELIVERED' &&
                  selectedOrder.status !== 'WHATSAPP_PENDING' &&
                  selectedOrder.status !== 'PENDING_CONFIRMATION' &&
                  selectedOrder.status !== 'DRAFT' && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-bold shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancel Order</span>
                    </button>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 font-semibold">Change Status:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    className="bg-admin-card border border-admin-border text-gray-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="WHATSAPP_PENDING">NEW ORDER</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING (PACKING)</option>
                    <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
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
