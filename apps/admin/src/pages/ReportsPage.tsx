import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const ReportsPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [reportType, setReportType] = useState('SALES');
  const [dateRange, setDateRange] = useState('30DAYS');

  const sales = state.sales;
  const expenses = state.expenses;
  const orders = state.orders;

  const exportToCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'SALES') {
      csvContent += 'Sale Number,Order Number,Customer Name,Date,Subtotal,Tax (5%),Grand Total,COGS,Profit\n';
      sales.forEach((s) => {
        csvContent += `${s.saleNumber},${s.orderNumber},"${s.customerName}",${s.saleDate},${s.taxableAmount},${s.gst},${s.grandTotal},${s.costOfGoods},${s.profit}\n`;
      });
    } else if (reportType === 'GST') {
      csvContent += 'Invoice Number,Order Number,Customer,Date,Taxable Amount,CGST (2.5%),SGST (2.5%),Total Tax,Grand Total\n';
      state.invoices.forEach((inv) => {
        csvContent += `${inv.invoiceNumber},${inv.orderNumber},"${inv.customerDetails.name}",${inv.invoiceDate},${inv.taxableAmount},${inv.cgst},${inv.sgst},${inv.cgst + inv.sgst},${inv.grandTotal}\n`;
      });
    } else if (reportType === 'EXPENSES') {
      csvContent += 'Expense ID,Category,Description,Vendor,Date,Amount,GST Amount,Status\n';
      expenses.forEach((e) => {
        csvContent += `${e.expenseId},${e.category},"${e.description}","${e.vendor}",${e.expenseDate},${e.amount},${e.gstAmount},${e.status}\n`;
      });
    } else {
      csvContent += 'Order Number,Customer,Mobile,Status,Items Count,Total,Created At\n';
      orders.forEach((o) => {
        csvContent += `${o.orderNumber},"${o.customerName}",${o.customerMobile},${o.status},${o.items.length},${o.grandTotal},${o.createdAt}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tea_Nest_Report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Enterprise Reports & Export</h1>
          <p className="text-xs text-admin-muted mt-1">
            Generate and export CSV/Excel accounting summaries for GST filings and executive audits.
          </p>
        </div>

        <button
          onClick={exportToCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors shadow"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export to Excel/CSV</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 bg-admin-surface border border-admin-border p-4 rounded-2xl">
        <div>
          <label className="block text-[10px] uppercase font-bold text-admin-muted mb-1">Report Module</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-1.5 bg-admin-card border border-admin-border text-xs text-gray-200 rounded-lg outline-none focus:border-admin-accent"
          >
            <option value="SALES">Sales & Profit Margins</option>
            <option value="GST">GST Tax Summary (HSN 0902)</option>
            <option value="EXPENSES">Operating Expense Ledger</option>
            <option value="ORDERS">Customer Order Statuses</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-admin-muted mb-1">Date Scope</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 bg-admin-card border border-admin-border text-xs text-gray-200 rounded-lg outline-none focus:border-admin-accent"
          >
            <option value="TODAY">Today</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
            <option value="MONTH">This Month</option>
            <option value="ALL">All Recorded Data</option>
          </select>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-gray-100">
          Report Preview: {reportType} Summary
        </h3>

        <div className="overflow-x-auto">
          {reportType === 'SALES' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase border-b border-admin-border">
                <tr>
                  <th className="p-3">Sale #</th>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Taxable</th>
                  <th className="p-3">GST (5%)</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">COGS</th>
                  <th className="p-3">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {sales.map((s) => (
                  <tr key={s.saleId}>
                    <td className="p-3 font-mono font-bold text-admin-gold">{s.saleNumber}</td>
                    <td className="p-3 font-mono text-gray-300">{s.orderNumber}</td>
                    <td className="p-3 text-gray-200">{s.customerName}</td>
                    <td className="p-3 text-gray-300">{formatCurrency(s.taxableAmount, false)}</td>
                    <td className="p-3 text-gray-400">{formatCurrency(s.gst, false)}</td>
                    <td className="p-3 font-bold text-white">{formatCurrency(s.grandTotal, false)}</td>
                    <td className="p-3 text-gray-400">{formatCurrency(s.costOfGoods, false)}</td>
                    <td className="p-3 font-bold text-green-400">{formatCurrency(s.profit, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'GST' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase border-b border-admin-border">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Taxable Base</th>
                  <th className="p-3">CGST (2.5%)</th>
                  <th className="p-3">SGST (2.5%)</th>
                  <th className="p-3">Total Tax</th>
                  <th className="p-3">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {state.invoices.map((inv) => (
                  <tr key={inv.invoiceId}>
                    <td className="p-3 font-mono font-bold text-admin-gold">{inv.invoiceNumber}</td>
                    <td className="p-3 text-gray-200">{inv.customerDetails.name}</td>
                    <td className="p-3 text-admin-muted">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-3 text-gray-300">{formatCurrency(inv.taxableAmount, false)}</td>
                    <td className="p-3 text-gray-400">{formatCurrency(inv.cgst, false)}</td>
                    <td className="p-3 text-gray-400">{formatCurrency(inv.sgst, false)}</td>
                    <td className="p-3 text-admin-gold">{formatCurrency(inv.cgst + inv.sgst, false)}</td>
                    <td className="p-3 font-bold text-white">{formatCurrency(inv.grandTotal, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'EXPENSES' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase border-b border-admin-border">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Input GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {expenses.map((e) => (
                  <tr key={e.expenseId}>
                    <td className="p-3 font-bold text-admin-gold">{e.category}</td>
                    <td className="p-3 text-gray-200">{e.description}</td>
                    <td className="p-3 text-admin-muted">{e.vendor}</td>
                    <td className="p-3 text-admin-muted">{formatDate(e.expenseDate)}</td>
                    <td className="p-3 font-bold text-white">{formatCurrency(e.amount, false)}</td>
                    <td className="p-3 text-gray-400">{formatCurrency(e.gstAmount, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'ORDERS' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase border-b border-admin-border">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3 font-mono font-bold text-admin-gold">{o.orderNumber}</td>
                    <td className="p-3 text-gray-200">{o.customerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-admin-card text-gray-300">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">{o.items.length} item(s)</td>
                    <td className="p-3 font-bold text-white">{formatCurrency(o.grandTotal, false)}</td>
                    <td className="p-3 text-admin-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
