import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

export const LoginPage: React.FC = () => {
  const { store } = useTeaNestStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    store.loginCustomer(email);
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-cream-300 rounded-2xl p-8 shadow-lg text-charcoal-900 space-y-6">
        <div className="text-center space-y-2">
          <img src="/images/tea_nest_logo.svg" alt="Tea Nest" className="h-10 mx-auto" />
          <h1 className="font-serif text-2xl font-bold">Welcome Back</h1>
          <p className="text-xs text-charcoal-500">Sign in to your Tea Nest customer account.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
            Sign In
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-2 border-t border-cream-200">
          Don't have an account?{' '}
          <Link to="/register" className="text-forest-800 font-bold underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
