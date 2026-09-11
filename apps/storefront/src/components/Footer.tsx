import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Store,
  Gift,
  Award,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';

export const Footer: React.FC = () => {
  const { state } = useTeaNestStore();
  const settings = state.businessSettings;

  return (
    <footer className="bg-[#0c1811] text-[#e3ded2] border-t border-[#c5a059]/20 font-sans">
      {/* Upper Service Trust Bar matching PDF Page 1 */}
      <div className="border-b border-[#c5a059]/15 bg-[#0f2016]/90 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {/* Delivery */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 flex items-center justify-center mb-2.5 text-[#c5a059] group-hover:bg-[#c5a059]/10 group-hover:scale-105 transition-all">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#f5f2e9]">
                EXPRESS DELIVERY
              </span>
              <span className="text-[10px] text-[#9eb0a2] mt-0.5">Pan-India Direct from Assam</span>
            </div>

            {/* Our Tea Rooms / Estates */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 flex items-center justify-center mb-2.5 text-[#c5a059] group-hover:bg-[#c5a059]/10 group-hover:scale-105 transition-all">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#f5f2e9]">
                OUR ESTATES
              </span>
              <span className="text-[10px] text-[#9eb0a2] mt-0.5">Naharkatia, Dibrugarh, Assam</span>
            </div>

            {/* Franchise / B2B */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 flex items-center justify-center mb-2.5 text-[#c5a059] group-hover:bg-[#c5a059]/10 group-hover:scale-105 transition-all">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#f5f2e9]">
                BULK & B2B TRADE
              </span>
              <span className="text-[10px] text-[#9eb0a2] mt-0.5">Direct Garden Wholesale</span>
            </div>

            {/* Corporate Gifts */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 flex items-center justify-center mb-2.5 text-[#c5a059] group-hover:bg-[#c5a059]/10 group-hover:scale-105 transition-all">
                <Gift className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#f5f2e9]">
                CORPORATE GIFTS
              </span>
              <span className="text-[10px] text-[#9eb0a2] mt-0.5">Curated Luxury Tea Chests</span>
            </div>

            {/* Certification */}
            <div className="flex flex-col items-center group col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 flex items-center justify-center mb-2.5 text-[#c5a059] group-hover:bg-[#c5a059]/10 group-hover:scale-105 transition-all">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#f5f2e9]">
                FSSAI CERTIFIED
              </span>
              <span className="text-[10px] text-[#9eb0a2] mt-0.5">100% Pure Tested Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Column Mega Footer matching PDF Page 1 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 text-xs">
          {/* Column 1: Tea Flushes / Seasons */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-[#c5a059] text-[13px] border-b border-[#c5a059]/20 pb-2">
              TEA FLUSHES / SEASONS
            </h4>
            <ul className="space-y-2 text-[#b8c7bc]">
              <li>
                <Link to="/shop?season=first-flush" className="hover:text-[#f5f2e9] transition-colors">
                  First / Spring Flush
                </Link>
              </li>
              <li>
                <Link to="/shop?season=second-flush" className="hover:text-[#f5f2e9] transition-colors">
                  Second / Summer Reserve
                </Link>
              </li>
              <li>
                <Link to="/shop?season=autumn-flush" className="hover:text-[#f5f2e9] transition-colors">
                  Autumn / Pre-Winter Crop
                </Link>
              </li>
              <li>
                <Link to="/product/assam-black-tea" className="hover:text-[#f5f2e9] transition-colors">
                  Monsoon High-Brisk CTC
                </Link>
              </li>
              <li>
                <Link to="/shop?season=single-harvest" className="hover:text-[#f5f2e9] transition-colors">
                  Single-Estate 2026 Vintage
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Tea Types */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-[#c5a059] text-[13px] border-b border-[#c5a059]/20 pb-2">
              TEA TYPES
            </h4>
            <ul className="space-y-2 text-[#b8c7bc]">
              <li>
                <Link to="/shop?category=best-selling" className="hover:text-[#f5f2e9] transition-colors">
                  Best Selling Teas
                </Link>
              </li>
              <li>
                <Link to="/product/assam-black-tea" className="hover:text-[#f5f2e9] transition-colors">
                  Assam Black Tea (500g)
                </Link>
              </li>
              <li>
                <Link to="/shop?category=chai" className="hover:text-[#f5f2e9] transition-colors">
                  Kadak CTC Chai
                </Link>
              </li>
              <li>
                <Link to="/shop?category=black-tea" className="hover:text-[#f5f2e9] transition-colors">
                  Orthodox Whole Leaf
                </Link>
              </li>
              <li>
                <Link to="/shop?category=green-tea" className="hover:text-[#f5f2e9] transition-colors">
                  Green Tea Leaves
                </Link>
              </li>
              <li>
                <Link to="/shop?category=white-tea" className="hover:text-[#f5f2e9] transition-colors">
                  White Needle Tea
                </Link>
              </li>
              <li>
                <Link to="/shop?category=oolong-tea" className="hover:text-[#f5f2e9] transition-colors">
                  Artisanal Oolong
                </Link>
              </li>
              <li>
                <Link to="/shop?category=herbal" className="hover:text-[#f5f2e9] transition-colors">
                  Herbal & Ayurvedic Infusions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tea Regions */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-[#c5a059] text-[13px] border-b border-[#c5a059]/20 pb-2">
              TEA REGIONS
            </h4>
            <ul className="space-y-2 text-[#b8c7bc]">
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Naharkatia Estate (Home)
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Dibrugarh Tea District
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Brahmaputra River Valley
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Upper Assam Foothills
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Darjeeling High Hills
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  Nilgiri Blue Mountains
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#f5f2e9] transition-colors">
                  All Indian Estates
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Tea Flavours */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-[#c5a059] text-[13px] border-b border-[#c5a059]/20 pb-2">
              TEA FLAVOURS & BREWS
            </h4>
            <ul className="space-y-2 text-[#b8c7bc]">
              <li>
                <Link to="/shop?flavour=cardamom" className="hover:text-[#f5f2e9] transition-colors">
                  Cardamom & Elaichi
                </Link>
              </li>
              <li>
                <Link to="/shop?flavour=cinnamon" className="hover:text-[#f5f2e9] transition-colors">
                  Cinnamon & Clove
                </Link>
              </li>
              <li>
                <Link to="/shop?flavour=tulsi" className="hover:text-[#f5f2e9] transition-colors">
                  Holy Krishna Tulsi
                </Link>
              </li>
              <li>
                <Link to="/shop?flavour=rose" className="hover:text-[#f5f2e9] transition-colors">
                  Royal Kashmiri Rose
                </Link>
              </li>
              <li>
                <Link to="/shop?flavour=ginger" className="hover:text-[#f5f2e9] transition-colors">
                  Assam Sun-dried Ginger
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#f5f2e9] text-[#c5a059] font-medium transition-colors">
                  Authentic Brewing Masterclass →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Customer Care & Compliance */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="font-serif font-bold uppercase tracking-wider text-[#c5a059] text-[13px] border-b border-[#c5a059]/20 pb-2">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-2 text-[#b8c7bc]">
              <li>
                <Link to="/orders" className="hover:text-[#f5f2e9] transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#f5f2e9] transition-colors">
                  Bulk Tea Enquiries
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#f5f2e9] transition-colors">
                  Shipping & Return Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#f5f2e9] transition-colors">
                  Privacy Policy & GST
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-[#f5f2e9] text-[#c5a059] font-medium transition-colors">
                  Tea Nest Blog & Stories
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#f5f2e9] transition-colors">
                  About Fortunate Ventures
                </Link>
              </li>
              <li className="pt-2 border-t border-[#c5a059]/15">
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#c5a059] hover:underline font-medium"
                >
                  <span>Staff & Admin ERP Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>

            {/* Packer Notice */}
            <div className="pt-2 text-[11px] text-[#8e9f93] space-y-1">
              <p className="font-semibold text-[#f5f2e9]">Packed & Marketed by:</p>
              <p>{settings.businessName}</p>
              <p>{settings.address}, {settings.city}, Assam - {settings.pincode}</p>
              <p className="text-[#c5a059] font-mono">GSTIN: {settings.gstin}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="mt-12 pt-8 border-t border-[#c5a059]/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8e9f93]">
          <div className="flex items-center gap-3">
            <img src="/images/tea_nest_logo.svg" alt="Tea Nest" className="h-6 w-auto" />
            <p>© 2026 Tea Nest. All rights reserved. Fortunate Ventures.</p>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1 text-[#c5a059]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Authentic Assam Harvest Guarantee</span>
            </span>
            <span>HSN: 0902 | GST 5%</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
