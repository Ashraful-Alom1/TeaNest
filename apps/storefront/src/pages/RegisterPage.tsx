import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

export const RegisterPage: React.FC = () => {
  const { store } = useTeaNestStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    store.registerCustomer({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      password,
    });

    navigate('/');
  };

  return (
    <div className="min-h-[80vh] bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-cream-300 rounded-2xl p-8 shadow-lg text-charcoal-900 space-y-6">
        <div className="text-center space-y-2">
          <img src="/images/tea_nest_logo.svg" alt="Tea Nest" className="h-10 mx-auto" />
          <h1 className="font-serif text-2xl font-bold">Join Tea Nest</h1>
          <p className="text-xs text-charcoal-500">Create an account to order pure single-estate tea.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-gold-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow"
          >
            Create Account
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-2 border-t border-cream-200">
          Already have an account?{' '}
          <Link to="/login" className="text-forest-800 font-bold underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
