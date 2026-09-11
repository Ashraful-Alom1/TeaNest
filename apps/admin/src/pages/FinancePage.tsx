import React from 'react';

import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';

export const FinancePage: React.FC = () => {
  const { state } = useTeaNestStore();

  const sales = state.sales;
  const expenses = state.expenses;

  const grossSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const discounts = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
  const netSales = grossSales - discounts;
  const cogs = sales.reduce((sum, s) => sum + s.costOfGoods, 0);
  const grossProfit = netSales - cogs;
  const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-100">Financial Performance & P&L</h1>
        <p className="text-xs text-admin-muted mt-1">
          Automated operational profit and loss statement derived dynamically from sales and expense ledgers.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-2">
          <span className="text-xs text-admin-muted uppercase font-bold">Net Sales Revenue</span>
          <div className="text-3xl font-bold text-admin-gold">{formatCurrency(netSales, false)}</div>
          <p className="text-xs text-gray-400">After deducting customer discounts</p>
        </div>

        <div className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-2">
          <span className="text-xs text-admin-muted uppercase font-bold">Gross Profit (Margin: {grossMarginPct.toFixed(1)}%)</span>
          <div className="text-3xl font-bold text-gray-100">{formatCurrency(grossProfit, false)}</div>
          <p className="text-xs text-gray-400">Net Sales minus Cost of Goods Sold (COGS)</p>
        </div>

        <div className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-2">
          <span className="text-xs text-admin-muted uppercase font-bold">Estimated Net Profit (Margin: {netMarginPct.toFixed(1)}%)</span>
          <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit, false)}
          </div>
          <p className="text-xs text-gray-400">Gross Profit minus Operating Overheads</p>
        </div>
      </div>

      {/* P&L Statement breakdown table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-6">
        <h3 className="font-serif text-lg font-bold text-gray-100 pb-3 border-b border-admin-border">
          Statement of Profit & Loss (Operational INR)
        </h3>

        <div className="divide-y divide-admin-border text-xs space-y-3">
          {/* Revenue */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between font-bold text-gray-200">
              <span>Gross Sales (Inc. 5% GST)</span>
              <span>{formatCurrency(grossSales, false)}</span>
            </div>
            <div className="flex justify-between text-admin-muted pl-4">
              <span>Less: Sales Discounts & Coupons</span>
              <span>({formatCurrency(discounts, false)})</span>
            </div>
            <div className="flex justify-between font-bold text-admin-gold pt-1">
              <span>= Net Sales Revenue</span>
              <span>{formatCurrency(netSales, false)}</span>
            </div>
          </div>

          {/* COGS */}
          <div className="space-y-2 pt-3">
            <div className="flex justify-between font-bold text-gray-200">
              <span>Cost of Goods Sold (COGS)</span>
              <span>({formatCurrency(cogs, false)})</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1">
              <span>= Gross Profit</span>
              <span className="text-sm text-green-400">{formatCurrency(grossProfit, false)}</span>
            </div>
          </div>

          {/* Operating Overheads */}
          <div className="space-y-2 pt-3">
            <span className="font-bold text-gray-200 uppercase text-[10px] block">
              Operating Expenses Breakdown
            </span>
            {['Packaging', 'Transport', 'Advertising', 'Shipping', 'Office'].map((cat) => {
              const amt = expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
              return (
                <div key={cat} className="flex justify-between text-admin-muted pl-4">
                  <span>{cat} Overheads</span>
                  <span>{formatCurrency(amt, false)}</span>
                </div>
              );
            })}
            <div className="flex justify-between font-bold text-red-400 pt-1">
              <span>Total Operating Expenses</span>
              <span>({formatCurrency(totalExpenses, false)})</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="pt-4 flex justify-between text-base font-bold text-white">
            <span>Estimated Net Profit</span>
            <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(netProfit, false)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
