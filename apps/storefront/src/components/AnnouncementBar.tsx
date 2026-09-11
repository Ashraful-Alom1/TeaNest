import React from 'react';
import { Sparkles, Phone, Truck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-[#0d2315] via-[#1b3b27] to-[#0d2315] text-[#e8dbb5] text-xs py-2 px-4 border-b border-[#c5a059]/20 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 tracking-wide font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#c5a059] animate-pulse" />
          <span>Fresh Single-Estate 2026 Harvest Just Arrived from Naharkatia, Assam</span>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-[#c5a059]">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3 h-3" />
            <span className="text-[#f5f2e9]">Free Pan-India Delivery on Orders ₹999+</span>
          </div>
          <a
            href="tel:+91690132"
            className="hidden sm:flex items-center gap-1.5 hover:text-[#f5f2e9] transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>+91 6901320430</span>
          </a>
        </div>
      </div>
    </div>
  );
};
