import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { AuthModal } from '../components/AuthModal';

export const CartPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState(state.currentCustomer?.address || '');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(state.currentCustomer?.city || '');
  const [stateName, setStateName] = useState(state.currentCustomer?.state || 'Assam');
  const [pincode, setPincode] = useState(state.currentCustomer?.pincode || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cart = state.cart;
  const customer = state.currentCustomer;

  useEffect(() => {
    if (customer) {
      if (customer.address) setStreetArea(customer.address);
      if (customer.city) setCity(customer.city);
      if (customer.state) setStateName(customer.state);
      if (customer.pincode) setPincode(customer.pincode);
    }
  }, [customer]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 50;
  const grandTotal = subtotal + shipping;

  const handleCheckout = () => {
    setError('');

    if (!customer) {
      setAuthModalOpen(true);
      return;
    }

    if (!houseNo.trim() || houseNo.trim().length < 2) {
      setError('Please enter Flat / House No., Building or Apartment Name.');
      return;
    }

    if (!streetArea.trim() || streetArea.trim().length < 3) {
      setError('Please enter Street / Road, Area, Locality or Sector.');
      return;
    }

    if (!landmark.trim() || landmark.trim().length < 3) {
      setError('Please enter a nearby landmark (e.g. Opposite SBI Bank, Near Kali Mandir).');
      return;
    }

    if (!city || city.trim().length < 2) {
      setError('Please enter your delivery city or town.');
      return;
    }

    if (!stateName || stateName.trim().length < 2) {
      setError('Please enter your delivery state.');
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setLoading(true);

    try {
      const fullStreetAddress = `${houseNo.trim()}, ${streetArea.trim()}, Landmark: ${landmark.trim()}`;

      store.updateCustomerProfile({
        address: fullStreetAddress,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });

      const address = {
        fullName: customer.name,
        mobile: customer.mobile,
        houseNo: houseNo.trim(),
        street: fullStreetAddress,
        area: streetArea.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      };

      const { order, whatsappUrl } = store.createCartOrder(customer, address, notes);
      setLoading(false);
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Checkout failed. Please check your stock quantities.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] bg-cream-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-20 h-20 bg-cream-200 rounded-full flex items-center justify-center text-charcoal-400 mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-charcoal-900">Your Cart is Empty</h2>
          <p className="text-charcoal-600 text-sm">
            Experience the rich, aromatic taste of authentic Assam black tea fresh from the Dibrugarh gardens.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 hover:bg-forest-900 text-gold-300 font-bold text-sm uppercase rounded-xl transition-all shadow-lg"
          >
            <span>Explore Teas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-950 mb-8">
          Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cart items list */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="p-4 sm:p-6 bg-white rounded-2xl border border-cream-300 shadow-sm flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-24 h-24 bg-[#f5f2eb] rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-cream-300">
                  <img
                    src={product.thumbnail?.secureUrl || '/images/tea_nest_front.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="text-[10px] font-semibold text-gold-600 uppercase tracking-widest">
                    {product.weight}{product.unit} Pouch
                  </span>
                  <h3 className="font-serif text-lg font-bold text-charcoal-950">{product.name}</h3>
                  <p className="text-xs text-charcoal-500">SKU: {product.sku}</p>
                  <p className="text-sm font-bold text-forest-800">
                    {formatCurrency(product.sellingPrice, false)} per unit
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Quantity */}
                  <div className="flex items-center border border-cream-300 rounded-lg overflow-hidden bg-cream-50">
                    <button
                      onClick={() => store.updateCartQuantity(product.id, quantity - 1)}
                      className="p-2 hover:bg-cream-200 text-charcoal-700"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => store.updateCartQuantity(product.id, quantity + 1)}
                      className="p-2 hover:bg-cream-200 text-charcoal-700"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="font-bold text-base text-charcoal-900">
                      {formatCurrency(product.sellingPrice * quantity, false)}
                    </div>
                  </div>

                  <button
                    onClick={() => store.removeFromCart(product.id)}
                    className="p-2 text-charcoal-400 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout & Delivery Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
              <h3 className="font-serif text-xl font-bold text-charcoal-950 pb-3 border-b border-cream-200">
                Delivery Address
              </h3>

              {!customer && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-3">
                  Please <button onClick={() => setAuthModalOpen(true)} className="font-bold underline">sign in</button> or provide details to proceed.
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                    Flat / House No., Building Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 3B, Nilachal Residency"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                    Street, Road, Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graham Bazar, Near College Road"
                    value={streetArea}
                    onChange={(e) => setStreetArea(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                    Prominent Landmark (Mandatory) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Opposite SBI Bank / Near Kali Mandir"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-2.5 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-2.5 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="PIN"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-800 uppercase tracking-wider mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring the doorbell, leave at gate"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 bg-cream-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Order Total breakdown */}
            <div className="p-6 bg-charcoal-950 text-cream-100 rounded-2xl border border-gold-500/30 shadow-xl space-y-4">
              <h3 className="font-serif text-xl font-bold text-cream-50 pb-3 border-b border-charcoal-800">
                Order Summary
              </h3>

              <div className="space-y-2 text-sm text-cream-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, false)}</span>
                </div>
                <div className="flex justify-between text-xs text-cream-400">
                  <span>GST (Included @ 5%)</span>
                  <span>{formatCurrency(subtotal * 0.0476, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-400">FREE</span> : formatCurrency(shipping, false)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-gold-400/80">
                    Add {formatCurrency(999 - subtotal, false)} more for FREE Delivery
                  </p>
                )}
                <div className="pt-3 border-t border-charcoal-800 flex justify-between text-base font-bold text-cream-50">
                  <span>Grand Total</span>
                  <span className="text-xl text-gold-400">{formatCurrency(grandTotal, false)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-charcoal-950 font-bold text-sm tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Validating Stock & Placing Order...' : 'Confirm & Place Order'}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-cream-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Encrypted & Guaranteed Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleCheckout}
      />
    </div>
  );
};
