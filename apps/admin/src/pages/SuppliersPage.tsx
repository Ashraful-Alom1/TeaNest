import React, { useState } from 'react';
import { Plus, Phone, Mail, MapPin } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';

export const SuppliersPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dibrugarh');
  const [stateName, setStateName] = useState('Assam');
  const [pincode, setPincode] = useState('786610');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const suppliers = state.suppliers;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    store.createSupplier({
      name,
      companyName,
      phone,
      email,
      gstin,
      address,
      city,
      state: stateName,
      pincode,
      paymentTerms,
      openingBalance: 0,
      currentBalance: 0,
      status: 'ACTIVE',
    });

    setModalOpen(false);
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setGstin('');
    setAddress('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Tea Estate Suppliers</h1>
          <p className="text-xs text-admin-muted mt-1">
            Maintain authorized growers and partner tea estate directories with GST compliance records.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s) => {
          const supplierPurchases = state.purchases.filter((p) => p.supplierId === s.id);
          const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

          return (
            <div
              key={s.id}
              className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-base font-bold text-gray-100">{s.companyName}</h3>
                    <p className="text-xs text-admin-muted">Contact: {s.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                    {s.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-admin-muted pt-2 border-t border-admin-border">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                    <span>{s.address}, {s.city}, {s.state} - {s.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                    <span>{s.email}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-gray-300">
                    <strong>GSTIN:</strong> {s.gstin}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-admin-border flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-admin-muted uppercase block">Total Purchases</span>
                  <span className="font-bold text-admin-gold">{formatCurrency(totalSpent, false)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-admin-muted uppercase block">Terms</span>
                  <span className="font-semibold text-gray-200">{s.paymentTerms}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">Add New Supplier</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Estate / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper Brahmaputra Tea Gardens"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pranab Borah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">GSTIN (15 Digits)</label>
                <input
                  type="text"
                  required
                  placeholder="18AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">PIN</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Payment Terms</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Net 30, Net 15, COD"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
