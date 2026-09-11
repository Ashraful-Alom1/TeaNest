import React from 'react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const SalesPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const sales = state.sales;

  const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalTaxable = sales.reduce((sum, s) => sum + s.taxableAmount, 0);
  const totalGst = sales.reduce((sum, s) => sum + s.gst, 0);
  const totalCogs = sales.reduce((sum, s) => sum + s.costOfGoods, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Sales Register & COGS</h1>
          <p className="text-xs text-admin-muted mt-1">
            Confirmed customer orders, taxable revenues, GST breakdowns (CGST/SGST), and gross margin.
          </p>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-admin-muted">Gross Revenue</span>
          <div className="text-xl font-bold text-admin-gold mt-1">{formatCurrency(totalSales, false)}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-admin-muted">Taxable Base</span>
          <div className="text-xl font-bold text-gray-200 mt-1">{formatCurrency(totalTaxable, false)}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-admin-muted">Output GST (5%)</span>
          <div className="text-xl font-bold text-admin-gold mt-1">{formatCurrency(totalGst, false)}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-admin-muted">Cost of Goods (COGS)</span>
          <div className="text-xl font-bold text-gray-200 mt-1">{formatCurrency(totalCogs, false)}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-admin-muted">Gross Profit</span>
          <div className="text-xl font-bold text-green-400 mt-1">{formatCurrency(totalProfit, false)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        {sales.length === 0 ? (
          <div className="p-12 text-center text-xs text-admin-muted">
            No confirmed sales yet. Sales are officially generated when incoming orders are confirmed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
                <tr>
                  <th className="p-4">Sale ID</th>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Taxable</th>
                  <th className="p-4">CGST (2.5%)</th>
                  <th className="p-4">SGST (2.5%)</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">COGS</th>
                  <th className="p-4">Gross Margin</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {sales.map((s) => (
                  <tr key={s.saleId} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-admin-gold">{s.saleNumber}</td>
                    <td className="p-4 font-mono text-gray-300">{s.orderNumber}</td>
                    <td className="p-4 font-semibold text-gray-200">{s.customerName}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(s.taxableAmount, false)}</td>
                    <td className="p-4 text-gray-400">{formatCurrency(s.cgst, false)}</td>
                    <td className="p-4 text-gray-400">{formatCurrency(s.sgst, false)}</td>
                    <td className="p-4 font-bold text-white">{formatCurrency(s.grandTotal, false)}</td>
                    <td className="p-4 text-gray-400">{formatCurrency(s.costOfGoods, false)}</td>
                    <td className="p-4 font-bold text-green-400">{formatCurrency(s.profit, false)}</td>
                    <td className="p-4 text-admin-muted">{formatDate(s.saleDate)}</td>
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
