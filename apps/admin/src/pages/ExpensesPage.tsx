import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate } from '@tea-nest/shared';

export const ExpensesPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Packaging');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1500);
  const [gstAmount, setGstAmount] = useState(270);
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));

  const expenses = state.expenses;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'CUSTOM' ? customCategory.trim() : category;

    store.createExpense({
      category: finalCategory || 'Miscellaneous',
      description,
      amount: Number(amount),
      gstAmount: Number(gstAmount),
      vendor,
      expenseDate,
      paymentMethod,
      status: 'PAID',
    });

    setModalOpen(false);
    setDescription('');
    setVendor('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Operating Expense Ledger</h1>
          <p className="text-xs text-admin-muted mt-1">
            Track business overheads (Packaging, Transport, Advertising, Shipping) to calculate accurate Net Profit.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl">
          <span className="text-xs text-admin-muted uppercase font-bold">Total Operating Expenses</span>
          <div className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(totalExpenses, false)}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl">
          <span className="text-xs text-admin-muted uppercase font-bold">Total Entries</span>
          <div className="text-2xl font-bold text-gray-100 mt-1">{expenses.length} Records</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl">
          <span className="text-xs text-admin-muted uppercase font-bold">Input GST Credit</span>
          <div className="text-2xl font-bold text-admin-gold mt-1">
            {formatCurrency(expenses.reduce((sum, e) => sum + e.gstAmount, 0), false)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Amount</th>
                <th className="p-4">GST</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {expenses.map((e) => (
                <tr key={e.expenseId} className="hover:bg-admin-card/50 transition-colors">
                  <td className="p-4 font-bold text-admin-gold">{e.category}</td>
                  <td className="p-4 font-medium text-gray-200">{e.description}</td>
                  <td className="p-4 text-admin-muted">{e.vendor}</td>
                  <td className="p-4 font-bold text-white">{formatCurrency(e.amount, false)}</td>
                  <td className="p-4 text-gray-400">{formatCurrency(e.gstAmount, false)}</td>
                  <td className="p-4 text-gray-300">{e.paymentMethod}</td>
                  <td className="p-4 text-admin-muted">{formatDate(e.expenseDate)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">Record Operating Expense</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                >
                  <option value="Packaging">Packaging (Pouches, Foils, Cartons)</option>
                  <option value="Transport">Transport & Freight</option>
                  <option value="Advertising">Advertising & Marketing</option>
                  <option value="Shipping">Customer Shipping & Couriers</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Internet">Internet & Software</option>
                  <option value="Office">Office & Admin</option>
                  <option value="Salary">Salary & Wages</option>
                  <option value="CUSTOM">+ Add Custom Category</option>
                </select>
              </div>

              {category === 'CUSTOM' && (
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000 Stand-up black pouches with gold printing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">GST Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={gstAmount}
                    onChange={(e) => setGstAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Vendor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Vendor / Payee"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg font-bold shadow"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
