import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Truck } from 'lucide-react';
import { useTeaNestStore, calculateLowStockThreshold, formatDate } from '@tea-nest/shared';

export const LowStockPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const products = state.products;
  const alerts = state.lowStockAlerts;

  const lowStockProducts = products.filter((p) => {
    const threshold = p.lowStockThresholdQty || calculateLowStockThreshold(p.stockReferenceQty, p.lowStockPercent || 70);
    return p.stockQuantity < threshold;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Low Stock Alert Center</h1>
          <p className="text-xs text-admin-muted mt-1">
            Dynamic threshold rule: <code>ceil(stockReferenceQty × lowStockPercent / 100)</code>. Default: 70%.
          </p>
        </div>

        <Link
          to="/purchases"
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <Truck className="w-4 h-4" />
          <span>Procure Restock (PO)</span>
        </Link>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="p-12 bg-admin-surface border border-admin-border rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-green-950 text-green-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-gray-100">All Product Stocks Are Optimal</h3>
          <p className="text-xs text-admin-muted max-w-md mx-auto">
            Every catalog item has sufficient physical inventory exceeding its configured 70% threshold.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lowStockProducts.map((p) => {
            const threshold = p.lowStockThresholdQty || calculateLowStockThreshold(p.stockReferenceQty, p.lowStockPercent || 70);
            const deficit = threshold - p.stockQuantity;

            return (
              <div
                key={p.id}
                className="bg-admin-surface border-2 border-red-900/60 p-6 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-red-200">{p.name}</h3>
                      <p className="text-xs text-admin-muted">SKU: {p.sku} • {p.weight}{p.unit}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-950 border border-red-800 text-red-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>CRITICAL LOW</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-admin-card rounded-xl border border-admin-border text-center">
                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block">Current Stock</span>
                      <span className="text-xl font-bold text-red-400">{p.stockQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block">Threshold (70%)</span>
                      <span className="text-xl font-bold text-admin-gold">{threshold}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-admin-muted uppercase block">Deficit</span>
                      <span className="text-xl font-bold text-white">-{deficit}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-admin-border flex items-center justify-between">
                  <span className="text-xs text-admin-muted">
                    Reference base: <strong>{p.stockReferenceQty} units</strong>
                  </span>
                  <Link
                    to="/purchases"
                    className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Restock Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historical Alerts Log */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-gray-100">
          Threshold Alert History Log ({alerts.length})
        </h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-admin-muted">No alert entries recorded in system.</p>
        ) : (
          <div className="divide-y divide-admin-border text-xs">
            {alerts.map((a) => (
              <div key={a.alertId} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200">{a.productName}</p>
                  <p className="text-[11px] text-admin-muted">
                    Stock dropped to {a.currentStock} (below {a.threshold})
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'ACTIVE'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-green-950 text-green-400 border border-green-800'
                    }`}
                  >
                    {a.status}
                  </span>
                  <p className="text-[10px] text-admin-muted mt-0.5">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
