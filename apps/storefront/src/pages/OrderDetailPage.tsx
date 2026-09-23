import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  FileText,
  MapPin,
  Printer,
  MessageSquare,
} from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate, formatDateTime, generateOrderSupportWhatsAppUrl } from '@tea-nest/shared';
import { OrderTrackingStepper } from '../components/OrderTrackingStepper';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useTeaNestStore();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const order = state.orders.find((o) => o.id === id);
  const invoice = order?.invoiceId ? state.invoices.find((i) => i.invoiceId === order.invoiceId) : null;
  const settings = state.businessSettings;

  if (!order) {
    return (
      <div className="min-h-[70vh] bg-cream-50 flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="font-serif text-2xl font-bold">Order Not Found</h2>
          <Link to="/orders" className="text-forest-700 underline mt-4 block">
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const supportWhatsAppUrl = generateOrderSupportWhatsAppUrl(
    settings.whatsappOrderNumber,
    order.orderNumber,
    order.customerName
  );

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-charcoal-500 hover:text-forest-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {/* Order Header */}
        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-charcoal-950">
                Order {order.orderNumber}
              </h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                order.status === 'WHATSAPP_PENDING' || order.status === 'PENDING_CONFIRMATION' || order.status === 'DRAFT'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : order.status === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-forest-900 text-gold-300'
              }`}>
                {order.status === 'WHATSAPP_PENDING' || order.status === 'PENDING_CONFIRMATION' || order.status === 'DRAFT'
                  ? 'WAIT FOR CONFIRMATION'
                  : order.status}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={supportWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs rounded-xl shadow transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>

            {invoice && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-forest-800 hover:bg-forest-900 text-gold-300 font-semibold text-xs rounded-xl shadow transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>GST Tax Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Global Horizontal Order Tracking Stepper */}
        <div className="mb-6">
          <OrderTrackingStepper order={order} />
        </div>

        {/* Items List */}
        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm mb-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pb-3 border-b border-cream-200">
            Order Items
          </h3>
          <div className="divide-y divide-cream-200">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900">{item.name}</h4>
                  <p className="text-xs text-charcoal-500">
                    {item.weight}{item.unit} Pouch • SKU: {item.sku}
                  </p>
                  <p className="text-xs text-charcoal-600">
                    {formatCurrency(item.price, false)} × {item.quantity} unit(s)
                  </p>
                </div>
                <div className="font-bold text-base text-forest-800">
                  {formatCurrency(item.total, false)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-cream-300 space-y-2 text-sm text-charcoal-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, false)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>GST (Included @ 5%)</span>
              <span>{formatCurrency(order.tax, false)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping, false)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-charcoal-950 pt-2 border-t border-cream-200">
              <span>Grand Total</span>
              <span className="text-lg text-forest-800">{formatCurrency(order.grandTotal, false)}</span>
            </div>
          </div>
        </div>

        {/* Shipping details */}
        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-2 text-sm">
          <div className="flex items-center gap-2 font-serif text-base font-bold text-charcoal-950">
            <MapPin className="w-4 h-4 text-gold-600" />
            <span>Delivery Destination</span>
          </div>
          <p className="font-semibold text-charcoal-900">{order.shippingAddress.fullName}</p>
          <p className="text-charcoal-600">{order.shippingAddress.street}</p>
          <p className="text-charcoal-600">
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </p>
          <p className="text-charcoal-600">Contact: {order.shippingAddress.mobile}</p>
          {order.notes && (
            <p className="text-xs text-charcoal-500 pt-1 border-t border-cream-200 mt-2">
              <strong>Order Instructions:</strong> {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 text-charcoal-900 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
              <div>
                <img src="/images/tea_nest_logo.svg" alt="Tea Nest" className="h-10 mb-2" />
                <h3 className="font-serif text-xl font-bold">TAX INVOICE</h3>
                <p className="text-xs text-gray-500">Invoice: {invoice.invoiceNumber}</p>
                <p className="text-xs text-gray-500">Date: {formatDate(invoice.invoiceDate)}</p>
              </div>
              <div className="text-right text-xs text-gray-600 space-y-1">
                <p className="font-bold text-sm text-gray-900">{invoice.businessDetails.businessName}</p>
                <p>{invoice.businessDetails.address}</p>
                <p>{invoice.businessDetails.city}, {invoice.businessDetails.state} - {invoice.businessDetails.pincode}</p>
                <p><strong>GSTIN:</strong> {invoice.businessDetails.gstin}</p>
                <p><strong>PAN:</strong> {invoice.businessDetails.pan}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="text-xs bg-gray-50 p-3 rounded-lg mb-4 space-y-1">
              <span className="font-bold uppercase text-gray-500">Billed To:</span>
              <p className="font-semibold text-gray-900">{invoice.customerDetails.name}</p>
              <p>{invoice.customerDetails.address}, {invoice.customerDetails.city}, {invoice.customerDetails.state} - {invoice.customerDetails.pincode}</p>
              <p>Phone: {invoice.customerDetails.mobile} | Email: {invoice.customerDetails.email}</p>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left mb-4 border border-gray-200">
              <thead className="bg-gray-100 uppercase font-semibold">
                <tr>
                  <th className="p-2 border">Item</th>
                  <th className="p-2 border">HSN</th>
                  <th className="p-2 border text-center">Qty</th>
                  <th className="p-2 border text-right">Taxable</th>
                  <th className="p-2 border text-right">GST (5%)</th>
                  <th className="p-2 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 border">{item.productName} ({item.weight}{item.unit})</td>
                    <td className="p-2 border">{item.hsnCode}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-right">{formatCurrency(item.taxableValue, false)}</td>
                    <td className="p-2 border text-right">{formatCurrency(item.cgst + item.sgst + item.igst, false)}</td>
                    <td className="p-2 border text-right font-bold">{formatCurrency(item.total, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total in words & Bank */}
            <div className="flex justify-between items-start text-xs mb-4">
              <div className="max-w-xs space-y-1">
                <p><strong>Amount in Words:</strong> {invoice.amountInWords}</p>
                <p><strong>Bank:</strong> {invoice.bankDetails.bankName} (A/C: {invoice.bankDetails.accountNumber}, IFSC: {invoice.bankDetails.ifsc})</p>
                <p><strong>UPI:</strong> {invoice.bankDetails.upi}</p>
              </div>
              <div className="text-right space-y-1">
                <p>Subtotal: {formatCurrency(invoice.subtotal, false)}</p>
                <p>CGST (2.5%): {formatCurrency(invoice.cgst, false)}</p>
                <p>SGST (2.5%): {formatCurrency(invoice.sgst, false)}</p>
                <p className="text-base font-bold text-gray-900 pt-1 border-t">
                  Grand Total: {formatCurrency(invoice.grandTotal, false)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold"
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
