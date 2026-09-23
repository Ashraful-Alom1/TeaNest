import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

export const ContactPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const settings = state.businessSettings;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-forest-700">
            Get in Touch
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal-950">
            Contact Tea Nest
          </h1>
          <p className="text-charcoal-700 text-sm sm:text-base max-w-xl mx-auto">
            Whether you have questions about bulk orders, tea tasting notes, or estate shipments, we are here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-charcoal-950 text-cream-100 p-8 rounded-2xl border border-gold-500/30 shadow-xl space-y-6">
            <h3 className="font-serif text-2xl font-bold text-cream-50 pb-3 border-b border-charcoal-800">
              {settings?.businessName || 'Tea Nest'}
            </h3>
            <p className="text-xs text-cream-400">
              Official Single-Estate Orthodox & CTC Tea from Naharkatia, Upper Assam.
            </p>

            <div className="space-y-4 text-sm text-cream-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-cream-100">{settings?.businessName || 'Tea Nest'}</p>
                  <p className="text-xs text-cream-400 mt-0.5">
                    {settings?.address || 'Naharkatia Tea Estate'}, {settings?.city || 'Dibrugarh'}, {settings?.state || 'Assam'} - {settings?.pincode || '786610'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'care@teanest.in'}`} className="hover:text-gold-300 text-xs">
                  {settings?.email || 'care@teanest.in'}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-400 shrink-0" />
                <a
                  href={`https://wa.me/${(settings?.whatsappOrderNumber || '918822308551').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-300 text-xs flex items-center gap-1.5"
                >
                  <span>{settings?.phone || '+91 88223 08551'}</span>
                  <span className="text-[10px] bg-forest-700 text-[#4ade80] px-1.5 py-0.5 rounded font-medium">WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-charcoal-800 text-xs text-cream-400 space-y-1">
              <p><strong>GSTIN:</strong> {settings.gstin}</p>
              <p><strong>PAN:</strong> {settings.pan}</p>
              <p><strong>Hours:</strong> Mon - Sat: 9:00 AM - 6:30 PM IST</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-cream-300 shadow-sm space-y-6">
            <h3 className="font-serif text-2xl font-bold text-charcoal-950">
              Send Us a Message
            </h3>

            {submitted && (
              <div className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Thank you! Your inquiry has been sent to our customer desk.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-cream-300 rounded-lg outline-none focus:border-forest-700 text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 hover:bg-forest-900 text-gold-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow"
              >
                <Send className="w-4 h-4" />
                <span>Send Inquiry</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
