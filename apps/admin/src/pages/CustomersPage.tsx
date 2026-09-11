import React, { useState } from 'react';
import { Eye, Phone, MapPin } from 'lucide-react';
import { useTeaNestStore, formatCurrency, formatDate, formatDateTime } from '@tea-nest/shared';
import { CustomerProfile } from '@tea-nest/types';

export const CustomersPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const customers = state.customers;
  const orders = state.orders;
  const timeline = state.crmTimeline;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Customer CRM & Lifetime Value</h1>
          <p className="text-xs text-admin-muted mt-1">
            Registered customer accounts, purchasing frequencies, timeline events, and addresses.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-center">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Avg Order Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {customers.map((c) => {
                const customerOrders = orders.filter((o) => o.customerId === c.uid);
                const totalSpent = customerOrders
                  .filter((o) => o.status === 'CONFIRMED')
                  .reduce((sum, o) => sum + o.grandTotal, 0);
                const aov = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;

                return (
                  <tr key={c.uid} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-bold text-gray-200">{c.name}</td>
                    <td className="p-4">
                      <p className="text-gray-300">{c.mobile}</p>
                      <p className="text-[11px] text-admin-muted">{c.email}</p>
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(c.createdAt)}</td>
                    <td className="p-4 text-center font-bold text-admin-gold">
                      {customerOrders.length}
                    </td>
                    <td className="p-4 font-bold text-green-400">
                      {formatCurrency(totalSpent, false)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {formatCurrency(aov, false)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 bg-admin-card hover:bg-admin-border text-admin-gold rounded-lg transition-colors"
                        title="View CRM Timeline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRM Customer Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl h-full max-h-[95vh] flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-start border-b border-admin-border pb-3 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-admin-gold">{selectedCustomer.name}</h3>
                <p className="text-xs text-admin-muted">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              <div className="bg-admin-card p-3 rounded-xl border border-admin-border space-y-1">
                <span className="font-bold text-gray-400 uppercase text-[10px]">Contact & Address</span>
                <p className="flex items-center gap-1.5 text-gray-300">
                  <Phone className="w-3 h-3 text-admin-gold" />
                  <span>{selectedCustomer.mobile}</span>
                </p>
                <p className="flex items-center gap-1.5 text-gray-300">
                  <MapPin className="w-3 h-3 text-admin-gold" />
                  <span>
                    {selectedCustomer.address || 'Naharkatia'}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                  </span>
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <span className="font-bold text-gray-400 uppercase text-[10px] block">
                  CRM Activity Timeline
                </span>
                <div className="space-y-3 pl-2 border-l-2 border-admin-border">
                  {timeline
                    .filter((t) => t.customerId === selectedCustomer.uid)
                    .map((item) => (
                      <div key={item.id} className="relative pl-4 space-y-0.5">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-admin-gold border-2 border-admin-surface" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-200">{item.type}</span>
                          <span className="text-[10px] text-admin-muted">{formatDateTime(item.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">{item.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-admin-border flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
