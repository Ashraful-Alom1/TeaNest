import React, { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

export const BusinessSettingsPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const settings = state.businessSettings;

  const [brandName, setBrandName] = useState(settings.brandName);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [whatsappOrderNumber, setWhatsappOrderNumber] = useState(settings.whatsappOrderNumber);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [stateName, setStateName] = useState(settings.state);
  const [pincode, setPincode] = useState(settings.pincode);
  const [gstin, setGstin] = useState(settings.gstin);
  const [pan, setPan] = useState(settings.pan);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [lowStockDefaultPercent, setLowStockDefaultPercent] = useState(settings.lowStockDefaultPercent);
  const [bankName, setBankName] = useState(settings.bankName);
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber);
  const [ifsc, setIfsc] = useState(settings.ifsc);
  const [upi, setUpi] = useState(settings.upi);
  const [terms, setTerms] = useState(settings.terms);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateBusinessSettings({
      brandName,
      businessName,
      whatsappOrderNumber,
      phone,
      email,
      address,
      city,
      state: stateName,
      pincode,
      gstin,
      pan,
      invoicePrefix,
      lowStockDefaultPercent: Number(lowStockDefaultPercent),
      bankName,
      accountNumber,
      ifsc,
      upi,
      terms,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Business & Invoicing Settings</h1>
          <p className="text-xs text-admin-muted mt-1">
            Configure WhatsApp dispatch phone number, GSTIN, legal business address, and banking details.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-950/60 border border-green-800 text-green-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>Settings successfully saved and synchronized!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-admin-surface border border-admin-border p-6 rounded-2xl space-y-6 text-xs shadow-sm">
        {/* Brand & Contact */}
        <div className="space-y-4">
          <h3 className="font-serif text-sm font-bold text-admin-gold uppercase tracking-wider pb-2 border-b border-admin-border">
            1. Brand Identity & Communication
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Business / Company Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">WhatsApp Order Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 919876543210"
                value={whatsappOrderNumber}
                onChange={(e) => setWhatsappOrderNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Public Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Public Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        {/* Legal Address & Tax */}
        <div className="space-y-4 pt-4 border-t border-admin-border">
          <h3 className="font-serif text-sm font-bold text-admin-gold uppercase tracking-wider pb-2 border-b border-admin-border">
            2. Legal Registration & Tax Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">GSTIN</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">PAN</label>
              <input
                type="text"
                required
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Invoice Prefix</label>
              <input
                type="text"
                required
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Default Low Stock %</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={lowStockDefaultPercent}
                onChange={(e) => setLowStockDefaultPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        {/* Banking */}
        <div className="space-y-4 pt-4 border-t border-admin-border">
          <h3 className="font-serif text-sm font-bold text-admin-gold uppercase tracking-wider pb-2 border-b border-admin-border">
            3. Banking Details (Printed on Invoices)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">Account Number</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-admin-muted mb-1">UPI ID</label>
              <input
                type="text"
                required
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-admin-muted mb-1">Terms & Conditions (On Invoice)</label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-admin-border">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-admin-accent hover:bg-admin-gold text-black rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
