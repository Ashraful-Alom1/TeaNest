import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What makes Tea Nest Assam Black Tea special?',
      a: 'Tea Nest is sourced directly from Naharkatia, Dibrugarh in Upper Assam—a region celebrated worldwide for producing teas with rich body, invigorating briskness, and natural sweet malt notes. Unlike mass-market dust blends, we preserve whole leaf orthodox and premium CTC cuts.',
    },
    {
      q: 'How does the ordering process work?',
      a: 'When you click "ORDER NOW", our system generates a unique order reference number (e.g. TN-2026-000001) with your chosen product details and quantity. It opens WhatsApp with a pre-filled confirmation message directly connected to our tea fulfillment manager for prompt confirmation and dispatch.',
    },
    {
      q: 'What is the shelf life of the 500g pouch?',
      a: 'Tea Nest has a shelf life of 24 months from the date of packaging. Each pouch features a high-barrier foil lining and zip lock seal to protect against moisture, sunlight, and humidity.',
    },
    {
      q: 'How should I store my tea after opening?',
      a: 'Always store in a cool, dry place. Reseal the airtight zip lock immediately after every use, and keep away from strong odors (like spices or perfumes) which tea leaves naturally absorb.',
    },
    {
      q: 'What are the shipping charges and delivery timelines?',
      a: 'Orders above ₹999 qualify for FREE standard delivery across India. Standard orders are dispatched within 24 to 48 hours and typically arrive within 3 to 6 business days.',
    },
    {
      q: 'Do you offer GST tax invoices for business purchases?',
      a: 'Yes! Every confirmed order automatically generates an official GST Tax Invoice (with HSN 0902 and 5% GST breakdown) complete with business details and customer GSTIN if provided.',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-forest-700">
            Got Questions?
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal-950">
            Frequently Asked Questions
          </h1>
          <p className="text-charcoal-600 text-sm sm:text-base">
            Everything you need to know about our tea harvests, ordering, and delivery.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-lg font-bold text-charcoal-950 hover:text-forest-800 transition-colors"
              >
                <span>{faq.q}</span>
                {openIdx === idx ? (
                  <ChevronUp className="w-5 h-5 text-forest-700 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-charcoal-400 shrink-0" />
                )}
              </button>

              {openIdx === idx && (
                <div className="px-6 pb-6 text-sm text-charcoal-700 leading-relaxed border-t border-cream-200 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
