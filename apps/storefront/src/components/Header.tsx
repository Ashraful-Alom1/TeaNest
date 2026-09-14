import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  Heart,
  LogOut,
  Package,
  ChevronDown,
} from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';
import { AuthModal } from './AuthModal';
import { AnnouncementBar } from './AnnouncementBar';

export const Header: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const totalCartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const customer = state.currentCustomer;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const utilityLinks = [
    { name: 'ABOUT', path: '/about' },
    { name: 'SHOWROOMS & ESTATES', path: '/about' },
    { name: 'TEA BLOG', path: '/blog' },
    { name: 'CONTACT', path: '/contact' },
  ];

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 w-full bg-[#121513]/95 backdrop-blur-md border-b border-[#c5a059]/25 transition-all shadow-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* 1. Brand Logo + Name — far left */}
            <Link to="/" className="flex items-center gap-2 group shrink min-w-0">
              <img
                src="/images/tea_nest_emblem.svg"
                alt="Tea Nest Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-105 shrink-0"
              />
              <div className="flex flex-col text-left leading-none min-w-0">
                <span className="font-serif text-[18px] sm:text-[22px] tracking-[0.12em] sm:tracking-[0.14em] font-bold text-[#f5f2e9] group-hover:text-[#c5a059] transition-colors leading-none truncate">
                  TEA NEST
                </span>
                <span className="text-[6.5px] sm:text-[7.5px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-[#c5a059] font-medium mt-[3px] truncate">
                  BORN IN ASSAM • LOVED EVERYWHERE
                </span>
              </div>
            </Link>

            {/* 2. Search Bar — grows to fill middle space */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#c5a059] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search teas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b241e] text-[11px] text-[#f5f2e9] placeholder-[#6b7c6f] pl-8 pr-3 py-1.5 rounded-full border border-[#2b3a30] focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-all"
              />
            </form>

            {/* 3. Navigation Text Links */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-[10px] lg:text-[10.5px] font-semibold tracking-widest text-[#c8bfad] shrink-0">
              {utilityLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:text-[#c5a059] transition-colors relative group whitespace-nowrap"
                >
                  {link.name}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#c5a059] transition-all duration-200 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* 4. Right Icons: Wishlist, Cart, Account, Menu */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Wishlist */}
              <Link to="/shop" className="p-1 text-[#c8bfad] hover:text-[#c5a059] transition-colors" title="Wishlist">
                <Heart className="w-[18px] h-[18px]" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="flex items-center gap-1 p-1 text-[#c8bfad] hover:text-[#c5a059] transition-colors"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                <span className="text-[11px] font-semibold text-[#c5a059]">({totalCartCount})</span>
              </Link>

              {/* User Profile / Sign In */}
              {customer ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-1 text-[11px] text-[#f5f2e9] bg-[#1a2e21] border border-[#c5a059]/40 py-1 px-2 sm:px-3 rounded-full hover:border-[#c5a059] transition-all"
                  >
                    <User className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-[#c5a059]" />
                    <span className="hidden sm:inline max-w-[70px] truncate">{customer.name.split(' ')[0]}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#c5a059]" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#171d19] border border-[#c5a059]/30 rounded-xl shadow-2xl py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-[#232d26]">
                        <p className="font-semibold text-[#f5f2e9] truncate">{customer.name}</p>
                        <p className="text-[11px] text-[#8e9c91] truncate">{customer.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#d8cfbe] hover:bg-[#1f2b23] hover:text-[#c5a059] transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#d8cfbe] hover:bg-[#1f2b23] hover:text-[#c5a059] transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>My Orders</span>
                      </Link>
                      <button
                        onClick={() => {
                          store.logoutCustomer();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-[#1f2b23] transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] text-[#c5a059] border border-[#c5a059]/40 bg-[#c5a059]/10 hover:bg-[#c5a059]/20 px-2 sm:px-3 py-1 rounded-full font-medium transition-all"
                  title="Sign In"
                >
                  <User className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1 text-[#c8bfad] hover:text-[#c5a059]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>


        {/* Mobile Slide-down Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#121714] border-t border-[#c5a059]/30 px-6 py-5 shadow-2xl space-y-4">
            <form onSubmit={handleSearch} className="flex items-center relative mb-4">
              <input
                type="text"
                placeholder="Search teas, collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b241e] text-sm text-[#f5f2e9] placeholder-[#8a968d] pl-9 pr-3 py-2 rounded-lg border border-[#2b3a30] focus:outline-none focus:border-[#c5a059]"
              />
              <Search className="w-4 h-4 text-[#c5a059] absolute left-3 pointer-events-none" />
            </form>

            <div className="space-y-2 border-b border-[#232f27] pb-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">
                Collections & Teas
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to="/product/assam-black-tea"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#f5f2e9] hover:text-[#c5a059]"
                >
                  Assam Black Tea (500g)
                </Link>
                <Link
                  to="/shop?category=chai"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#f5f2e9] hover:text-[#c5a059]"
                >
                  Assam CTC Chai
                </Link>
                <Link
                  to="/shop?category=black-tea"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#f5f2e9] hover:text-[#c5a059]"
                >
                  Orthodox Whole Leaf
                </Link>
                <Link
                  to="/shop?category=green-tea"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#f5f2e9] hover:text-[#c5a059]"
                >
                  Green Tea
                </Link>
                <Link
                  to="/shop?category=white-tea"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#f5f2e9] hover:text-[#c5a059]"
                >
                  White Tea
                </Link>
                <Link
                  to="/shop?tag=sale"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#4ade80] font-bold"
                >
                  Seasonal Sale (30% Off)
                </Link>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">
                Company & Heritage
              </p>
              <div className="flex flex-col space-y-2">
                {utilityLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#d8cfbe] hover:text-[#c5a059]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </>
  );
};
