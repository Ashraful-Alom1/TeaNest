import React, { useState } from 'react';
import { AlertTriangle, ArrowUpDown, History } from 'lucide-react';
import { useTeaNestStore, formatDateTime, calculateLowStockThreshold } from '@tea-nest/shared';

export const InventoryPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'>('ADJUSTMENT_IN');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const products = state.products;
  const movements = [...state.inventoryMovements].reverse();

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason || reason.trim().length < 3) {
      setError('Please specify a valid operational reason for stock adjustment.');
      return;
    }

    try {
      store.adjustInventory(selectedProductId, adjustType, quantity, reason.trim());
      setAdjustModalOpen(false);
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Inventory & Stock Movement Ledger</h1>
          <p className="text-xs text-admin-muted mt-1">
            Complete audit trail of stock deductions, purchase intakes, and manual warehouse adjustments.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProductId(products[0]?.id || '');
            setAdjustModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-card hover:bg-admin-border border border-admin-border text-admin-gold text-xs font-bold rounded-xl transition-colors shadow"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      {/* Product Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {products.map((p) => {
          const threshold = p.lowStockThresholdQty || calculateLowStockThreshold(p.stockReferenceQty, p.lowStockPercent || 70);
          const isLow = p.stockQuantity < threshold;

          return (
            <div
              key={p.id}
              className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-base font-bold text-gray-200">{p.name}</h3>
                  <p className="text-[11px] text-admin-muted">SKU: {p.sku} • {p.weight}{p.unit}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isLow
                      ? 'bg-red-950 text-red-400 border border-red-800 flex items-center gap-1'
                      : 'bg-green-950 text-green-400 border border-green-800'
                  }`}
                >
                  {isLow ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low Stock</span>
                    </>
                  ) : (
                    'Healthy Stock'
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-3xl font-bold text-white">{p.stockQuantity}</span>
                <span className="text-xs text-admin-muted">units on hand</span>
              </div>

              <div className="pt-3 border-t border-admin-border text-xs text-admin-muted space-y-1">
                <div className="flex justify-between">
                  <span>Reference Qty:</span>
                  <span className="text-gray-200 font-semibold">{p.stockReferenceQty} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Alert Threshold ({p.lowStockPercent || 70}%):</span>
                  <span className="text-admin-gold font-semibold">&lt; {threshold} units</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Movements History Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-admin-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-admin-gold" />
            <h3 className="text-sm font-bold text-gray-100">Stock Movement History ({movements.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-center">Change</th>
                <th className="p-4 text-center">Before / After</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {movements.map((m) => (
                <tr key={m.movementId} className="hover:bg-admin-card/50 transition-colors">
                  <td className="p-4 text-admin-muted">{formatDateTime(m.createdAt)}</td>
                  <td className="p-4 font-bold text-gray-200">{m.productName}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'PURCHASE' || m.type === 'ADJUSTMENT_IN'
                          ? 'bg-green-950 text-green-400 border border-green-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span
                      className={
                        m.type === 'PURCHASE' || m.type === 'ADJUSTMENT_IN'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {m.type === 'PURCHASE' || m.type === 'ADJUSTMENT_IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </span>
                  </td>
                  <td className="p-4 text-center text-admin-muted">
                    {m.beforeQuantity} → <strong className="text-white">{m.afterQuantity}</strong>
                  </td>
                  <td className="p-4 font-mono text-admin-gold">{m.referenceId}</td>
                  <td className="p-4 text-gray-300 max-w-xs truncate">{m.reason}</td>
                  <td className="p-4 text-admin-muted">{m.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">Manual Inventory Adjustment</h3>

            {error && (
              <div className="p-3 bg-red-950 border border-red-800 text-red-200 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stockQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  >
                    <option value="ADJUSTMENT_IN">Stock In (+)</option>
                    <option value="ADJUSTMENT_OUT">Stock Out (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Operational Reason (Mandatory)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse count reconciliation, Damaged pouch write-off"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg font-bold shadow"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
