import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const OrdersPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const customer = state.currentCustomer;

  // Filter orders for this customer (or show all if demo customer)
  const orders = customer
    ? state.orders.filter((o) => o.customerId === customer.uid)
    : state.orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WHATSAPP_PENDING':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 text-xs rounded-full font-semibold">
            WhatsApp Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs rounded-full font-semibold">
            Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 text-xs rounded-full font-semibold">
            Processing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs rounded-full font-semibold">
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 text-xs rounded-full font-semibold">
            Delivered
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-300 text-xs rounded-full font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-charcoal-950">My Orders</h1>
            <p className="text-sm text-charcoal-600 mt-1">
              Track your authentic Assam tea shipments and view invoices.
            </p>
          </div>
          <Link
            to="/shop"
            className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-gold-300 text-xs font-bold uppercase rounded-lg transition-colors"
          >
            Order More Tea
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-cream-300 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-cream-100 text-charcoal-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900">No Orders Placed Yet</h3>
            <p className="text-sm text-charcoal-600 max-w-md mx-auto">
              You haven't ordered any tea yet. Discover our fresh single-estate Assam Black Tea today!
            </p>
            <Link
              to="/shop"
              className="inline-block mt-2 px-6 py-2.5 bg-forest-800 text-gold-300 text-xs font-bold uppercase rounded-xl"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-forest-900">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-charcoal-500">
                    Placed on {formatDate(order.createdAt)} • {order.items.length} item(s)
                  </p>
                  <div className="text-xs text-charcoal-700">
                    {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-cream-200">
                  <div className="text-right">
                    <div className="text-xs text-charcoal-400 uppercase font-semibold">Total Amount</div>
                    <div className="text-lg font-bold text-forest-800">
                      {formatCurrency(order.grandTotal, false)}
                    </div>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-900 text-xs font-bold rounded-lg border border-cream-300 transition-colors"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
