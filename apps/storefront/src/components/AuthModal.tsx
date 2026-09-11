import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Welcome to Tea Nest',
  subtitle = 'Sign in or register to place your order seamlessly.',
}) => {
  const { store } = useTeaNestStore();
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isRegister) {
      if (!name || name.trim().length < 2) {
        setError('Please enter your full name.');
        return;
      }
      if (!mobile || !/^[6-9]\d{9}$/.test(mobile.trim())) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        store.registerCustomer({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
        });
      } else {
        store.loginCustomer(email.trim());
      }

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-charcoal-900 border border-gold-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-cream-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-cream-300 hover:text-gold-400 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand Header */}
          <div className="text-center mb-6">
            <img
              src="/images/tea_nest_logo.svg"
              alt="Tea Nest"
              className="h-10 mx-auto mb-2"
            />
            <h3 className="font-serif text-2xl font-bold text-cream-50">{title}</h3>
            <p className="text-sm text-cream-300/80 mt-1">{subtitle}</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-b border-charcoal-700 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                isRegister
                  ? 'text-gold-400 font-semibold'
                  : 'text-cream-400 hover:text-cream-200'
              }`}
            >
              Create Account
              {isRegister && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                !isRegister
                  ? 'text-gold-400 font-semibold'
                  : 'text-cream-400 hover:text-cream-200'
              }`}
            >
              Sign In
              {!isRegister && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                />
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cream-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gold-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-charcoal-800 border border-charcoal-700 focus:border-gold-400 rounded-lg text-cream-100 placeholder:text-cream-400/50 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cream-300 mb-1">
                    Mobile Number (for WhatsApp Updates)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gold-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 bg-charcoal-800 border border-charcoal-700 focus:border-gold-400 rounded-lg text-cream-100 placeholder:text-cream-400/50 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cream-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gold-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-800 border border-charcoal-700 focus:border-gold-400 rounded-lg text-cream-100 placeholder:text-cream-400/50 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cream-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gold-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-800 border border-charcoal-700 focus:border-gold-400 rounded-lg text-cream-100 placeholder:text-cream-400/50 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-charcoal-950 font-bold rounded-lg shadow-lg shadow-gold-500/10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRegister ? 'Complete Registration' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-cream-400">
              Protected by Tea Nest SSL encryption. Your information is securely stored.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
