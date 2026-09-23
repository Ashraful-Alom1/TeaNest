import React, { useState } from 'react';
import { Printer, Eye } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';
import { Invoice } from '@tea-nest/types';

export const InvoicesPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoices = [...state.invoices].sort(
    (a, b) => new Date(b.createdAt || b.invoiceDate).getTime() - new Date(a.createdAt || a.invoiceDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">GST Tax Invoices</h1>
          <p className="text-xs text-admin-muted mt-1">
            Configurable GST billing compliant with Indian tax rules (HSN 0902, CGST, SGST, IGST, amount in words).
          </p>
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-admin-muted">
            No invoices generated yet. Confirming customer orders automatically creates official GST tax invoices.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Taxable</th>
                  <th className="p-4">Total Tax (5%)</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Invoice Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-admin-gold">{inv.invoiceNumber}</td>
                    <td className="p-4 font-mono text-gray-300">{inv.orderNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-200">{inv.customerDetails.name}</p>
                      <p className="text-[11px] text-admin-muted">{inv.customerDetails.mobile}</p>
                    </td>
                    <td className="p-4 text-gray-300">{formatCurrency(inv.taxableAmount, false)}</td>
                    <td className="p-4 text-gray-400">
                      {formatCurrency(inv.cgst + inv.sgst + inv.igst, false)}
                    </td>
                    <td className="p-4 font-bold text-white">{formatCurrency(inv.grandTotal, false)}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-admin-card hover:bg-admin-border text-admin-gold rounded-lg font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-gray-900 rounded-2xl p-6 sm:p-10 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
              <div>
                <img src={`${import.meta.env.BASE_URL}images/tea_nest_logo.svg`} alt="Tea Nest" className="h-12 mb-2" />
                <h2 className="font-serif text-2xl font-bold text-gray-900">TAX INVOICE</h2>
                <p className="text-xs text-gray-600 font-mono font-bold mt-1">
                  Invoice No: {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Date: {formatDate(selectedInvoice.invoiceDate)}
                </p>
                <p className="text-xs text-gray-500">
                  Order Ref: {selectedInvoice.orderNumber}
                </p>
              </div>

              <div className="text-right text-xs text-gray-600 space-y-1">
                <p className="font-bold text-sm text-gray-900">{selectedInvoice.businessDetails.businessName}</p>
                <p>{selectedInvoice.businessDetails.address}</p>
                <p>{selectedInvoice.businessDetails.city}, {selectedInvoice.businessDetails.state} - {selectedInvoice.businessDetails.pincode}</p>
                <p><strong>GSTIN:</strong> {selectedInvoice.businessDetails.gstin}</p>
                <p><strong>PAN:</strong> {selectedInvoice.businessDetails.pan}</p>
                <p><strong>Email:</strong> {selectedInvoice.businessDetails.email}</p>
              </div>
            </div>

            {/* Bill to */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 text-xs space-y-1 border border-gray-200">
              <span className="font-bold text-gray-500 uppercase">Billed To (Customer):</span>
              <p className="font-bold text-sm text-gray-900">{selectedInvoice.customerDetails.name}</p>
              <p>{selectedInvoice.customerDetails.address}, {selectedInvoice.customerDetails.city}, {selectedInvoice.customerDetails.state} - {selectedInvoice.customerDetails.pincode}</p>
              <p>Phone: {selectedInvoice.customerDetails.mobile} | Email: {selectedInvoice.customerDetails.email}</p>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left mb-6 border border-gray-200">
              <thead className="bg-gray-100 uppercase font-semibold text-gray-700">
                <tr>
                  <th className="p-3 border">Description of Goods</th>
                  <th className="p-3 border">HSN</th>
                  <th className="p-3 border text-center">Qty</th>
                  <th className="p-3 border text-right">Unit Rate</th>
                  <th className="p-3 border text-right">Taxable Value</th>
                  <th className="p-3 border text-right">GST (5%)</th>
                  <th className="p-3 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3 border font-medium">
                      {item.productName} ({item.weight}{item.unit})
                      <span className="block text-[10px] text-gray-500">SKU: {item.sku}</span>
                    </td>
                    <td className="p-3 border font-mono">{item.hsnCode}</td>
                    <td className="p-3 border text-center font-bold">{item.quantity}</td>
                    <td className="p-3 border text-right">{formatCurrency(item.unitPrice, false)}</td>
                    <td className="p-3 border text-right">{formatCurrency(item.taxableValue, false)}</td>
                    <td className="p-3 border text-right">{formatCurrency(item.cgst + item.sgst + item.igst, false)}</td>
                    <td className="p-3 border text-right font-bold">{formatCurrency(item.total, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6">
              <div className="space-y-2 border border-gray-200 p-4 rounded-xl">
                <p><strong>Amount in Words:</strong></p>
                <p className="italic text-gray-700">{selectedInvoice.amountInWords}</p>
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <p><strong>Bank Name:</strong> {selectedInvoice.bankDetails.bankName}</p>
                  <p><strong>A/C No:</strong> {selectedInvoice.bankDetails.accountNumber}</p>
                  <p><strong>IFSC:</strong> {selectedInvoice.bankDetails.ifsc}</p>
                  <p><strong>UPI ID:</strong> {selectedInvoice.bankDetails.upi}</p>
                </div>
              </div>

              <div className="space-y-2 text-right p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal (Taxable Value):</span>
                  <span>{formatCurrency(selectedInvoice.taxableAmount, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (2.5%):</span>
                  <span>{formatCurrency(selectedInvoice.cgst, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%):</span>
                  <span>{formatCurrency(selectedInvoice.sgst, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Delivery:</span>
                  <span>{selectedInvoice.shipping === 0 ? 'FREE' : formatCurrency(selectedInvoice.shipping, false)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal, false)}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 pb-4 border-b border-gray-200 leading-relaxed">
              <strong>Terms & Conditions:</strong><br />
              {selectedInvoice.termsAndConditions}
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold"
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
