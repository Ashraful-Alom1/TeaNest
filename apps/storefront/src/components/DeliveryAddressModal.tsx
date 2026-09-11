import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, MessageSquare, ShieldCheck } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { Product, Order } from '@tea-nest/types';

interface DeliveryAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantity?: number;
  onOrderPlaced: (result: { order: Order; whatsappUrl: string }) => void;
}

export const DeliveryAddressModal: React.FC<DeliveryAddressModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity = 1,
  onOrderPlaced,
}) => {
  const { state, store } = useTeaNestStore();
  const customer = state.currentCustomer;

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync with current customer profile when modal opens or customer changes
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setMobile(customer.mobile || '');
      setStreet(customer.address || '');
      setCity(customer.city || '');
      setStateName(customer.state || '');
      setPincode(customer.pincode || '');
    }
  }, [customer, isOpen]);

  if (!isOpen || !product) return null;

  const orderTotal = product.sellingPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customer) {
      setError('Please sign in before placing your order.');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full recipient name.');
      return;
    }

    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number for delivery updates.');
      return;
    }

    if (!street.trim() || street.trim().length < 5) {
      setError('Please provide your complete delivery street address (House/Flat, Road, Area).');
      return;
    }

    if (!city.trim() || city.trim().length < 2) {
      setError('Please enter your delivery city or town.');
      return;
    }

    if (!stateName.trim() || stateName.trim().length < 2) {
      setError('Please enter your delivery state.');
      return;
    }

    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update customer profile with real address so it's remembered for future orders
      store.updateCustomerProfile({
        name: name.trim(),
        mobile: mobile.trim(),
        address: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });

      const deliveryAddress = {
        fullName: name.trim(),
        mobile: mobile.trim(),
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      };

      // 2. Create the genuine order intent
      const result = store.createWhatsAppOrder(
        customer,
        deliveryAddress,
        product,
        quantity,
        notes.trim()
      );

      setLoading(false);
      onClose();
      onOrderPlaced(result);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initialize order.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white border border-[#e8dece] rounded-2xl shadow-2xl p-6 sm:p-7 text-charcoal-900 my-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-forest-50 text-forest-800 rounded-full text-xs font-semibold mb-2">
              <MapPin className="w-3.5 h-3.5 text-forest-700" />
              <span>Step 2 of 2: Delivery Details</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-charcoal-950">
              Where should we deliver?
            </h3>
            <p className="text-xs text-charcoal-600 mt-1">
              Please provide your genuine delivery address so our fulfillment team can dispatch your tea accurately.
            </p>
          </div>

          {/* Product Summary Card */}
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-xl flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={product.thumbnail?.secureUrl || '/images/tea_nest_front.jpg'}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-contain bg-white border border-cream-300 shrink-0 p-1"
              />
              <div>
                <h4 className="font-serif font-bold text-sm text-charcoal-900 leading-tight">
                  {product.name}
                </h4>
                <p className="text-xs text-charcoal-500">
                  {product.weight}{product.unit} • Qty: {quantity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-500 block">Total</span>
              <span className="font-serif font-bold text-forest-800 text-base">
                {formatCurrency(orderTotal, false)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Customer Contact row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Recipient Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                House / Flat No., Street, Landmark *
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Flat 3B, Sunshine Apartments, MG Road"
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dibrugarh"
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Assam"
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-digit PIN"
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Order Notes / Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please ring bell on arrival or call before dispatch"
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-900 outline-none focus:border-forest-700 focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500">
                <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Saved securely to your profile for next time</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-cream-300 text-charcoal-700 hover:bg-cream-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : 'Confirm & Order via WhatsApp'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
