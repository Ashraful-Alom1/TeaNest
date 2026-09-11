import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white p-8 sm:p-12 rounded-2xl border border-cream-300 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-charcoal-950 pb-4 border-b border-cream-200">
          Terms & Conditions
        </h1>
        <div className="text-sm text-charcoal-700 space-y-4 leading-relaxed">
          <p>
            Welcome to <strong>Tea Nest</strong>. By accessing our website, creating an account, or placing an order via WhatsApp or our web shop, you agree to the following terms:
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">1. Orders & Pricing</h3>
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of 5% Goods & Services Tax (GST under HSN 0902). Prices and stock availability are subject to change based on seasonal harvest yields.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">2. WhatsApp Order Intents</h3>
          <p>
            Creating a WhatsApp order records an intent in our system under status <code>WHATSAPP_PENDING</code>. Inventory is officially deducted only upon confirmation by our dispatch team.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">3. Returns & Refunds</h3>
          <p>
            As tea is a consumable food beverage product, returns are accepted only if the outer packaging was delivered damaged or if a verified defect is reported within 48 hours of delivery.
          </p>
          <h3 className="font-serif text-lg font-bold text-charcoal-950 pt-2">4. Jurisdiction</h3>
          <p>
            All disputes are subject to the exclusive jurisdiction of the competent courts in Dibrugarh, Assam.
          </p>
        </div>
      </div>
    </div>
  );
};
