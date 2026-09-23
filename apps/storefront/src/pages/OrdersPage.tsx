import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';
import { OrderTrackingStepper } from '../components/OrderTrackingStepper';

export const OrdersPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const customer = state.currentCustomer;

  // Filter orders for this customer (or show all if demo customer) and sort newest first (LIFO)
  const orders = (customer
    ? state.orders.filter((o) => o.customerId === customer.uid)
    : state.orders
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WHATSAPP_PENDING':
      case 'PENDING_CONFIRMATION':
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs rounded-full font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Wait for Confirmation</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 text-xs rounded-full font-semibold">
            Order Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs rounded-full font-semibold">
            Garden Packing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 text-xs rounded-full font-semibold">
            Dispatched / In Transit
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs rounded-full font-semibold">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs rounded-full font-semibold">
            Cancelled
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
            <h1 className="font-serif text-3xl font-bold text-charcoal-950">My Orders & Shipments</h1>
            <p className="text-sm text-charcoal-600 mt-1">
              Live tracking for your authentic Assam tea harvests direct from Naharkatia, Dibrugarh.
            </p>
          </div>
          <Link
            to="/shop"
            className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-gold-300 text-xs font-bold uppercase rounded-lg transition-colors shadow"
          >
            Explore Teas
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-cream-300 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-cream-100 text-charcoal-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900">No Orders Placed Yet</h3>
            <p className="text-sm text-charcoal-600 max-w-md mx-auto">
              You haven't ordered any tea yet. Discover our fresh single-estate Assam Black Tea harvest today!
            </p>
            <Link
              to="/shop"
              className="inline-block mt-2 px-6 py-2.5 bg-forest-800 text-gold-300 text-xs font-bold uppercase rounded-xl shadow hover:bg-forest-900 transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm hover:shadow-md transition-shadow space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-forest-950">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-charcoal-500">
                      Placed on {formatDate(order.createdAt)} • {order.items.length} item(s) • Total: <strong className="text-forest-800">{formatCurrency(order.grandTotal, false)}</strong>
                    </p>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-forest-900 hover:bg-forest-950 text-gold-300 text-xs font-bold rounded-xl transition-all shadow self-start sm:self-auto"
                  >
                    <span>Full Tracking & Invoice</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Visual Line and Circle Stepper Track */}
                <div className="pt-2 pb-1 px-1 bg-cream-50/60 rounded-xl border border-cream-200">
                  <OrderTrackingStepper order={order} compact={true} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cream-200 text-xs text-charcoal-600">
                  <div>
                    <span className="font-medium text-charcoal-800">Items:</span> {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                  </div>
                  {order.trackingNumber && (
                    <div className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{order.courierName || 'Logistics'}: {order.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
