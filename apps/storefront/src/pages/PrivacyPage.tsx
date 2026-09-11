import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white p-8 sm:p-12 rounded-2xl border border-cream-300 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-charcoal-950 pb-4 border-b border-cream-200">
          Privacy Policy
        </h1>
        <div className="text-sm text-charcoal-700 space-y-4 leading-relaxed">
          <p>
            At <strong>Tea Nest</strong> (marketed by <strong>Fortunate Ventures</strong>), we value your privacy and trust. This policy describes how we collect and manage your personal data.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">1. Information We Collect</h3>
          <p>
            When registering or ordering via WhatsApp/online checkout, we collect your Name, Mobile Number, Email Address, and Shipping Address solely for invoice generation and delivery fulfillment.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">2. How We Use Information</h3>
          <p>
            Your information is strictly used to process tea shipments, generate official GST tax invoices, provide tracking updates via WhatsApp/SMS, and respond to your customer inquiries. We never sell your personal information to third parties.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">3. Data Security</h3>
          <p>
            Our systems utilize enterprise cloud encryption and strict access controls to safeguard customer records.
          </p>
          <p className="text-xs text-charcoal-500 pt-4">
            Last updated: September 2026. Fortunate Ventures, Naharkatia, Dibrugarh, Assam 786610.
          </p>
        </div>
      </div>
    </div>
  );
};
