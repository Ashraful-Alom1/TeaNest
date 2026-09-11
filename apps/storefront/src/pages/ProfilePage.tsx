import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, CheckCircle, LogOut, Package } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { Link, useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const navigate = useNavigate();
  const customer = state.currentCustomer;

  const [name, setName] = useState(customer?.name || '');
  const [mobile, setMobile] = useState(customer?.mobile || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [city, setCity] = useState(customer?.city || '');
  const [stateName, setStateName] = useState(customer?.state || '');
  const [pincode, setPincode] = useState(customer?.pincode || '');
  const [success, setSuccess] = useState(false);

  if (!customer) {
    return (
      <div className="min-h-[70vh] bg-cream-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-5 p-8 bg-white rounded-3xl border border-cream-300 shadow-xl">
          <div className="w-16 h-16 bg-forest-900/10 text-forest-900 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-charcoal-950">Welcome to Tea Nest</h2>
          <p className="text-sm text-charcoal-600">
            Sign in or create an account to view your live orders, manage delivery addresses, and track shipments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Link
              to="/login"
              className="px-6 py-3 bg-forest-800 hover:bg-forest-900 text-gold-300 text-xs font-bold uppercase rounded-xl transition-all shadow-md"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-cream-100 hover:bg-cream-200 text-charcoal-800 border border-cream-300 text-xs font-bold uppercase rounded-xl transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Real, dynamic orders and expenditure calculation
  const customerOrders = state.orders.filter((o) => o.customerId === customer.uid);
  const totalOrdersCount = customerOrders.length;
  const totalSpentAmount = customerOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const handleLogout = () => {
    store.logoutCustomer();
    navigate('/');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateCustomerProfile({
      name,
      mobile,
      address,
      city,
      state: stateName,
      pincode,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-charcoal-950">Customer Profile</h1>
            <p className="text-sm text-charcoal-600 mt-1">
              Manage your personal contact info and primary delivery address.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-800 border border-cream-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-forest-800" />
              <span>My Orders ({totalOrdersCount})</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm">
            <span className="text-xs text-charcoal-500 uppercase font-semibold">Total Orders</span>
            <div className="text-2xl font-bold text-forest-800 mt-1">{totalOrdersCount}</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm">
            <span className="text-xs text-charcoal-500 uppercase font-semibold">Total Spent</span>
            <div className="text-2xl font-bold text-forest-800 mt-1">
              {formatCurrency(totalSpentAmount, false)}
            </div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm">
            <span className="text-xs text-charcoal-500 uppercase font-semibold">Account Status</span>
            <div className="text-2xl font-bold text-green-600 mt-1">{customer.status}</div>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Email Address (Tied to Account)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={customer.email}
                    className="w-full pl-9 pr-3 py-2 bg-cream-100 border border-cream-300 rounded-lg text-charcoal-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Delivery Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Apartment / Road, Landmark"
                    className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dibrugarh"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assam"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 786610"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-cream-200">
              <button
                type="submit"
                className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 text-gold-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
