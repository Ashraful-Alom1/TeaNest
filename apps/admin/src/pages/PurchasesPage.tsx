import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const PurchasesPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(state.suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [unitCost, setUnitCost] = useState(220);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const purchases = [...state.purchases].sort(
    (a, b) => new Date(b.createdAt || b.purchaseDate).getTime() - new Date(a.createdAt || a.purchaseDate).getTime()
  );
  const suppliers = state.suppliers;
  const products = state.products;

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const product = products.find((p) => p.id === selectedProductId);

    if (!supplier || !product) {
      setError('Please select a valid supplier and product.');
      return;
    }

    const taxableAmount = quantity * unitCost;
    const tax = Math.round(((taxableAmount * 5) / 100) * 100) / 100;
    const grandTotal = taxableAmount + tax;

    store.createPurchase({
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      purchaseDate: new Date().toISOString().substring(0, 10),
      items: [
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity,
          receivedQuantity: 0,
          unitCost,
          gstRate: 5,
          taxableAmount,
          tax,
          total: grandTotal,
        },
      ],
      subtotal: taxableAmount,
      tax,
      discount: 0,
      shipping: 0,
      grandTotal,
      paymentStatus: 'UNPAID',
      purchaseStatus: 'ORDERED',
      notes,
    });

    setCreateModalOpen(false);
    setSuccess('Purchase order created successfully with status ORDERED.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleReceiveStock = (purchaseId: string) => {
    try {
      store.receivePurchase(purchaseId);
      setSuccess('Stock received! Inventory quantity increased and movement logged.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to receive purchase');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Supplier Purchases (PO)</h1>
          <p className="text-xs text-admin-muted mt-1">
            Manage procurement batches from Assam tea gardens. Only received stock updates physical inventory.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-950/60 border border-green-800 text-green-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier / Estate</th>
                <th className="p-4">Supplier Invoice</th>
                <th className="p-4">Items / Qty</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">PO Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {purchases.map((p) => (
                <tr key={p.purchaseId} className="hover:bg-admin-card/50 transition-colors">
                  <td className="p-4 font-bold text-admin-gold font-mono">{p.purchaseNumber}</td>
                  <td className="p-4 font-semibold text-gray-200">{p.supplierName}</td>
                  <td className="p-4 text-admin-muted">{p.invoiceNumber}</td>
                  <td className="p-4 text-gray-300">
                    {p.items.map((i) => `${i.name} (${i.quantity} units)`).join(', ')}
                  </td>
                  <td className="p-4 font-bold text-gray-100">
                    {formatCurrency(p.grandTotal, false)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.purchaseStatus === 'RECEIVED'
                          ? 'bg-green-950 text-green-400 border border-green-800'
                          : p.purchaseStatus === 'ORDERED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {p.purchaseStatus}
                    </span>
                  </td>
                  <td className="p-4 text-admin-muted">{p.paymentStatus}</td>
                  <td className="p-4 text-admin-muted">{formatDate(p.purchaseDate)}</td>
                  <td className="p-4 text-right">
                    {p.purchaseStatus === 'ORDERED' ? (
                      <button
                        onClick={() => handleReceiveStock(p.purchaseId)}
                        className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors shadow"
                      >
                        Receive Stock (+)
                      </button>
                    ) : (
                      <span className="text-[11px] text-green-400 font-medium">Stock Stored</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">New Purchase Order</h3>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Supplier Estate</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.city}, {s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Supplier Invoice Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOTE-INV-2026-09"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">PO Notes</label>
                <input
                  type="text"
                  placeholder="e.g. First flush whole leaf batch, estate quality check passed"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="p-3 bg-admin-card rounded-xl text-admin-muted space-y-1">
                <div className="flex justify-between">
                  <span>Taxable:</span>
                  <span>{formatCurrency(quantity * unitCost, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>5% GST:</span>
                  <span>{formatCurrency((quantity * unitCost * 5) / 100, false)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-admin-border">
                  <span>Grand Total:</span>
                  <span className="text-admin-gold">{formatCurrency((quantity * unitCost * 1.05), false)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg font-bold shadow"
                >
                  Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
