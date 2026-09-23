import React, { useState } from 'react';
import { Plus, Phone, Mail, MapPin, Trash2, Edit2, Building2, AlertTriangle } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { Supplier } from '@tea-nest/types';

export const SuppliersPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const suppliers = state.suppliers || [];

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setGstin('');
    setAddress('');
    setCity('Dibrugarh');
    setStateName('Assam');
    setPincode('786610');
    setPaymentTerms('Net 30');
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name || '');
    setCompanyName(supplier.companyName || '');
    setPhone(supplier.phone || '');
    setEmail(supplier.email || '');
    setGstin(supplier.gstin || '');
    setAddress(supplier.address || '');
    setCity(supplier.city || 'Dibrugarh');
    setStateName(supplier.state || 'Assam');
    setPincode(supplier.pincode || '786610');
    setPaymentTerms(supplier.paymentTerms || 'Net 30');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      store.updateSupplier(editingSupplier.id, {
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
      });
    } else {
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
    }

    setModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = (id: string) => {
    store.deleteSupplier(id);
    setDeleteConfirmId(null);
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
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-admin-card text-admin-gold rounded-full flex items-center justify-center mx-auto border border-admin-border">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-gray-200">No Suppliers Registered</h3>
          <p className="text-xs text-admin-muted leading-relaxed">
            There are currently no active tea estate suppliers. Click below to add your authorized garden or wholesale grower partners.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => {
            const supplierPurchases = state.purchases.filter((p) => p.supplierId === s.id);
            const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

            return (
              <div
                key={s.id}
                className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between hover:border-admin-accent/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base font-bold text-gray-100 truncate">{s.companyName}</h3>
                      <p className="text-xs text-admin-muted truncate">Contact: {s.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                        {s.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-admin-muted pt-2 border-t border-admin-border">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                      <span className="truncate">{s.address}, {s.city}, {s.state} - {s.pincode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="pt-1 text-[11px] text-gray-300">
                      <strong>GSTIN:</strong> {s.gstin}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-admin-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-admin-muted uppercase block">Total Purchases</span>
                    <span className="font-bold text-admin-gold">{formatCurrency(totalSpent, false)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-admin-muted hover:text-admin-gold hover:bg-admin-card rounded-lg transition-colors cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-1.5 text-admin-muted hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <div className="w-10 h-10 bg-red-950/60 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-base font-bold text-gray-100">Delete Supplier?</h3>
              <p className="text-xs text-admin-muted">
                Are you sure you want to remove this supplier? This action will permanently remove the record from your supplier directory.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg text-xs font-semibold hover:bg-admin-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Estate / Company Name *</label>
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
                <label className="block font-semibold uppercase text-admin-muted mb-1">Contact Person *</label>
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
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">Email *</label>
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
                <label className="block font-semibold uppercase text-admin-muted mb-1">GSTIN (15 Digits) *</label>
                <input
                  type="text"
                  required
                  placeholder="18AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot / Division / Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-admin-muted mb-1">PIN *</label>
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
                  onClick={() => {
                    setModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg font-bold shadow cursor-pointer"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
