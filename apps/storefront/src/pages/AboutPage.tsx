import React from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-forest-700">
            Our Roots & Vision
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal-950">
            About Tea Nest
          </h1>
          <p className="font-serif italic text-gold-600 text-xl">
            "Born in Assam, Loved Everywhere"
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-cream-300">
          <img
            src="/images/hero_slide_1.jpg"
            alt="Tea Nest Assam Tea Plantation"
            className="w-full h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/30 to-transparent flex items-end p-8 text-cream-100">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
                Naharkatia, Dibrugarh, Assam
              </span>
              <h3 className="font-serif text-2xl font-bold text-cream-50">
                The World's Finest Tea Terroir
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-cream-300 shadow-sm space-y-6 text-charcoal-700 leading-relaxed text-base">
          <h2 className="font-serif text-2xl font-bold text-charcoal-950">
            A Product from Fortunate Ventures
          </h2>
          <p>
            At <strong>Tea Nest</strong>, tea is not merely a morning beverage—it is an age-old tradition, an art form, and the beating heart of Assam’s culture. Packaged and marketed by <strong>Fortunate Ventures</strong> in Naharkatia, Dibrugarh, our mission is simple: bring the purest, unblended flavor of authentic Assam black tea directly from the tea estates to your tea table.
          </p>
          <p>
            Located along the Brahmaputra River valley, Naharkatia benefits from deep rich alluvial soils and unique subtropical microclimates. The high humidity and monsoon rains result in tea leaves with unmatched briskness, deep amber liquor, and distinctive malty undertones.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-cream-200">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-forest-900 text-gold-300 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-charcoal-950 text-sm">Direct Garden Freshness</h4>
                <p className="text-xs text-charcoal-600 mt-1">
                  We bypass long supply chains and multi-layered brokerages, vacuum sealing our tea within weeks of harvest.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-forest-900 text-gold-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-charcoal-950 text-sm">Strict Quality Assurance</h4>
                <p className="text-xs text-charcoal-600 mt-1">
                  Every 500g pouch is inspected for moisture content, aroma retention, and consistent granule sizing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
