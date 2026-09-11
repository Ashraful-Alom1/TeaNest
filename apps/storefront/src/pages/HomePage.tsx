import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  Leaf,
  Award,
  CheckCircle,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';
import { AuthModal } from '../components/AuthModal';
import { DeliveryAddressModal } from '../components/DeliveryAddressModal';
import { Product, getBlogCoverImageUrl } from '@tea-nest/types';

export const HomePage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderNumber: string;
    whatsappUrl: string;
  } | null>(null);

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Review Carousel State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const primaryProduct =
    state.products.find((p) => p.isPublished && p.isActive && p.isFeatured) ||
    state.products.find((p) => p.isPublished && p.isActive) ||
    state.products[0];

  const heroSlides = [
    {
      id: 1,
      tag: 'Born in Assam • Loved Everywhere',
      title: 'Assam Black Tea 500g',
      subheading: 'Rich • Refreshing • Aromatic with Deep Golden Liquor & Natural Malt Notes',
      image: '/images/hero_slide_1.jpg',
      ctaText: 'ORDER ON WHATSAPP',
      secondaryText: 'Explore Tea Details',
      badge: 'Pure Single-Estate Harvest',
    },
    {
      id: 2,
      tag: 'Artisanal Brewing • Pure Heritage',
      title: 'Golden Liquor Kadak Chai',
      subheading: 'Freshly Steeping Rich Amber Cups with Intense Aroma and Brisk Full-Bodied Notes',
      image: '/images/hero_slide_2.jpg',
      ctaText: 'ORDER ON WHATSAPP',
      secondaryText: 'Discover Chai Blends',
      badge: '100% Pure Tested Quality',
    },
    {
      id: 3,
      tag: 'Dawn Harvest 2026 • Naharkatia',
      title: 'Direct Garden Freshness',
      subheading: 'Tender Clonal Tea Shoots with Morning Dew Preserved in Aroma-Lock Stand-Up Foil Pouch',
      image: '/images/hero_slide_3.jpg',
      ctaText: 'ORDER ON WHATSAPP',
      secondaryText: 'Shop All Collections',
      badge: 'Assam High-Brisk Vintage',
    },
  ];

  // Auto-advance hero slides smoothly every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleWhatsAppOrder = (product = primaryProduct) => {
    const targetProduct = product || primaryProduct;
    setOrderProduct(targetProduct);

    if (!state.currentCustomer) {
      setAuthModalOpen(true);
      return;
    }

    setDeliveryModalOpen(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSuccess(true);
      setTimeout(() => setNewsletterSuccess(false), 5000);
      setNewsletterEmail('');
    }
  };

  const reviews = [
    {
      author: 'B. C. Garai',
      location: 'Kolkata, West Bengal',
      rating: 5,
      title: 'Best Assam Tea Ever Tasted',
      text: 'Tea is awesome and best quality. The aroma when you open the pouch is intoxicating and the liquor is brisk with a rich golden rim. Pure authentic Assam tea.',
    },
    {
      author: 'Priyanshu Bora',
      location: 'Guwahati, Assam',
      rating: 5,
      title: 'Authentic Naharkatia Taste',
      text: 'Having grown up around Dibrugarh gardens, I can vouch for the authentic briskness and fresh malt flavour of Tea Nest. The seal lock pouch keeps it exceptionally fresh.',
    },
    {
      author: 'Meera Deshmukh',
      location: 'Mumbai, Maharashtra',
      rating: 5,
      title: 'Fast Delivery via WhatsApp',
      text: 'Seamless ordering through WhatsApp intent. Arrived in Mumbai in 3 days. A fragrant morning tea that has completely replaced our ordinary grocery brand.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#121513] font-sans selection:bg-[#c5a059] selection:text-white">
      {/* ======================================================== */}
      {/* 1. HERO SLIDER CAROUSEL (Matching PDF Page 15 & 3)        */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 1. HERO SLIDER CAROUSEL (WITH SMOOTH RIGHT-TO-LEFT PAN)   */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 1. HERO SLIDER CAROUSEL (WITH SMOOTH RIGHT-TO-LEFT PAN)   */}
      {/* ======================================================== */}
      <section className="relative w-full h-[580px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#0d1711] select-none">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ x: '100%', opacity: 0.2 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              x: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.7 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45 || info.velocity.x < -300) {
                setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
              } else if (info.offset.x > 45 || info.velocity.x > 300) {
                setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Background Image with Continuous Smooth Right-to-Left Pan */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                initial={{ x: '6%', scale: 1.12 }}
                animate={{ x: '-6%', scale: 1.12 }}
                transition={{ duration: 6, ease: 'linear' }}
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </div>
            
            {/* Rich Responsive Gradients for High Readability on Mobile & Desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1711] via-black/75 to-black/35 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/60 sm:to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 sm:bg-transparent pointer-events-none" />

            {/* Slide Content */}
            <div className="absolute inset-0 w-full h-full flex items-center z-10 pointer-events-none">
              <div className="max-w-7xl mx-auto w-full px-6 sm:px-14 lg:px-20 pointer-events-auto">
                <div className="max-w-2xl space-y-4 sm:space-y-5 text-left text-white">
                  <div className="inline-flex items-center gap-2 bg-[#257342]/90 border border-[#4ade80]/40 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-[#d1fae5] uppercase shadow-md backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#fde047] shrink-0" />
                    <span>{heroSlides[currentSlide].badge}</span>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <p className="font-serif italic text-[#e8dbb5] text-lg sm:text-2xl tracking-wide">
                      {heroSlides[currentSlide].tag}
                    </p>
                    <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                      {heroSlides[currentSlide].title}
                    </h1>
                  </div>

                  <p className="text-[#e2dac9] text-xs sm:text-base lg:text-lg font-light leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-none">
                    {heroSlides[currentSlide].subheading}
                  </p>

                  {/* Pricing & In-stock badge */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-1">
                    <span className="text-2xl sm:text-3xl font-bold font-serif text-[#c5a059]">
                      ₹450
                    </span>
                    <span className="text-xs sm:text-sm text-[#a3b3a7] line-through">MRP ₹499</span>
                    <span className="bg-[#257342] text-white text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                      Save 10%
                    </span>
                    <span className="text-xs text-[#4ade80] flex items-center gap-1.5 font-medium ml-1">
                      <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shrink-0" />
                      In Stock ({primaryProduct.stockQuantity} units)
                    </span>
                  </div>

                  {/* Mobile-friendly CTAs: Full-width stacked on mobile, row on tablet/desktop */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleWhatsAppOrder(primaryProduct)}
                      className="flex items-center justify-center gap-2.5 bg-[#257342] hover:bg-[#1e6136] text-white px-7 py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                      <Send className="w-4 h-4 text-[#d1fae5]" />
                      <span>{heroSlides[currentSlide].ctaText}</span>
                    </button>

                    <Link
                      to="/product/assam-black-tea"
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-all"
                    >
                      <span>{heroSlides[currentSlide].secondaryText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls (Hidden on narrow mobile screens to avoid obscuring text, available on tablet/desktop) */}
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
          }
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#c5a059] text-white items-center justify-center transition-all border border-white/20 hover:scale-105 active:scale-95"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#c5a059] text-white items-center justify-center transition-all border border-white/20 hover:scale-105 active:scale-95"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators with Touch-friendly hit target */}
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="p-1.5 focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span
                className={`block h-2 transition-all rounded-full ${
                  currentSlide === idx ? 'w-8 bg-[#c5a059]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. "SHOP OUR TEAS" CATEGORY TILES (Matching PDF Page 10)  */}
      {/* ======================================================== */}
      <section className="py-16 bg-white border-b border-[#ece6d9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1b3b27] uppercase">
              SHOP OUR TEAS
            </h2>
            <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Tile 1: Black Teas */}
            <Link
              to="/product/assam-black-tea"
              className="group flex flex-col items-center text-center p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors">
                <img
                  src="/images/tea_nest_front.jpg"
                  alt="Black Teas"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                Black Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">126 products</p>
            </Link>

            {/* Tile 2: Green Teas */}
            <Link
              to="/shop?category=green-tea"
              className="group flex flex-col items-center text-center p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#f4f7f4] flex items-center justify-center">
                <Leaf className="w-16 h-16 text-[#257342] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                Green Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">42 products</p>
            </Link>

            {/* Tile 3: White Teas */}
            <Link
              to="/shop?category=white-tea"
              className="group flex flex-col items-center text-center p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#fdfaf5] flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-[#c5a059] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                White Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">10 products</p>
            </Link>

            {/* Tile 4: Oolong Teas */}
            <Link
              to="/shop?category=oolong-tea"
              className="group flex flex-col items-center text-center p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#f5f2eb] flex items-center justify-center">
                <Award className="w-16 h-16 text-[#927238] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                Oolong Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">2 products</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. PROMOTIONAL SPLIT BANNERS (Matching PDF Page 7)        */}
      {/* ======================================================== */}
      <section className="py-12 bg-[#fcfaf7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Banner 1: Tea of the Month */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#17281d] to-[#254631] text-white p-8 flex flex-col justify-between min-h-[300px]">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-85 pointer-events-none flex items-center justify-center p-2">
                <img
                  src="/images/tea_nest_front.jpg"
                  alt="Tea Nest Assam Black Tea 500g"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>

              <div className="relative z-10 space-y-3">
                <div className="inline-block bg-[#c5a059] text-[#121513] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  FLAT 30% OFF
                </div>
                <h3 className="text-sm font-semibold tracking-widest text-[#d8e8dc] uppercase">
                  TEA OF THE MONTH
                </h3>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
                  A SIP OF WELLNESS, EVERY DAY.
                </h2>
                <p className="text-xs text-[#b8cfbf] max-w-sm">
                  Single-estate rare clonal Assam leaves, handpicked at dawn and packaged directly at Naharkatia by Fortunate Ventures.
                </p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/product/assam-black-tea"
                  className="inline-flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08b47] text-[#121513] px-6 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <span>Explore Offer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Banner 2: Premix & Chai Blends */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#2a2217] to-[#473b28] text-white p-8 flex flex-col justify-between min-h-[300px]">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-85 pointer-events-none flex items-center justify-center p-2">
                <img
                  src="/images/tea_nest_back.jpg"
                  alt="Tea Nest Assam CTC Back"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>

              <div className="relative z-10 space-y-3">
                <div className="inline-block bg-[#257342] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ESTATE BLENDS
                </div>
                <h3 className="text-sm font-semibold tracking-widest text-[#ead9bf] uppercase">
                  AUTHENTIC KADAK CHAI
                </h3>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
                  PURE FLAVOR. READY IN SECONDS.
                </h2>
                <p className="text-xs text-[#d6c7af] max-w-sm">
                  Hand-crushed elaichi, ginger, and robust CTC tea leaves for an authentic Indian chai experience.
                </p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/shop?category=chai"
                  className="inline-flex items-center gap-2 bg-[#257342] hover:bg-[#1e6136] text-white px-6 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <span>Discover Chai</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. "BEST SELLING TEAS" CAROUSEL (Matching PDF Page 6)     */}
      {/* ======================================================== */}
      <section className="py-16 bg-white border-y border-[#ece6d9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1b3b27] uppercase">
                BEST SELLING TEAS
              </h2>
              <div className="w-16 h-0.5 bg-[#c5a059] mt-2" />
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/shop"
                className="text-xs font-bold text-[#257342] hover:text-[#1e6136] uppercase tracking-wider mr-4"
              >
                View All Teas →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Flagship Assam Black Tea (500g) */}
            <div className="bg-[#fdfaf5] border border-[#e8dece] rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#ece3d3] flex items-center justify-center p-3">
                  <span className="absolute top-2 left-2 bg-[#257342] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    FLAGSHIP
                  </span>
                  <img
                    src="/images/tea_nest_front.jpg"
                    alt="Assam Black Tea 500g"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex text-[#c5a059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                    Assam Black Tea (500g)
                  </h3>
                  <p className="text-xs text-[#738278]">
                    Rich • Refreshing • Aromatic Stand-up Pouch
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eee5d6] mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-serif text-[#1b3b27]">₹450.00</span>
                  <span className="text-xs text-[#8f9e93] line-through">MRP ₹499.00</span>
                </div>

                <button
                  onClick={() => handleWhatsAppOrder(primaryProduct)}
                  className="w-full flex items-center justify-center gap-2 bg-[#257342] hover:bg-[#1e6136] text-white py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Card 2: Premium CTC Kadak Chai */}
            <div className="bg-[#fdfaf5] border border-[#e8dece] rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#ece3d3] flex items-center justify-center p-3">
                  <span className="absolute top-2 left-2 bg-[#c5a059] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    BESTSELLER
                  </span>
                  <img
                    src="/images/tea_nest_back.jpg"
                    alt="Premium CTC Kadak Chai"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex text-[#c5a059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                    Premium CTC Kadak Chai
                  </h3>
                  <p className="text-xs text-[#738278]">Granular brisk Assam leaf for morning milk tea</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eee5d6] mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-serif text-[#1b3b27]">₹495.00</span>
                  <span className="text-xs text-[#8f9e93]">MRP (500g)</span>
                </div>

                <button
                  onClick={() => handleWhatsAppOrder(primaryProduct)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1b3b27] hover:bg-[#254631] text-white py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Card 3: Ginger & Cardamom Masala Chai */}
            <div className="bg-[#fdfaf5] border border-[#e8dece] rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#ece3d3] flex items-center justify-center p-3">
                  <span className="absolute top-2 left-2 bg-[#927238] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    SPICED
                  </span>
                  <img
                    src="/images/tea_nest_front.jpg"
                    alt="Tea Nest Ginger Masala CTC Chai"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex text-[#c5a059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                    Tea Nest Ginger Masala Chai
                  </h3>
                  <p className="text-xs text-[#738278]">Authentic Indian Spiced Tea with Real Ginger</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eee5d6] mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-serif text-[#1b3b27]">₹475.00</span>
                  <span className="text-xs text-[#8f9e93]">MRP (500g)</span>
                </div>

                <button
                  onClick={() => handleWhatsAppOrder(primaryProduct)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1b3b27] hover:bg-[#254631] text-white py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Card 4: Single-Garden Orthodox Whole Leaf */}
            <div className="bg-[#fdfaf5] border border-[#e8dece] rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#ece3d3] flex items-center justify-center p-3">
                  <span className="absolute top-2 left-2 bg-[#257342] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ORTHODOX
                  </span>
                  <img
                    src="/images/tea_nest_back.jpg"
                    alt="Tea Nest Orthodox Whole Leaf"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex text-[#c5a059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                    Tea Nest Orthodox Reserve
                  </h3>
                  <p className="text-xs text-[#738278]">Whole leaf Assam black tea with golden tips</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eee5d6] mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-serif text-[#1b3b27]">₹550.00</span>
                  <span className="text-xs text-[#8f9e93]">MRP (500g)</span>
                </div>

                <button
                  onClick={() => handleWhatsAppOrder(primaryProduct)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1b3b27] hover:bg-[#254631] text-white py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. "WHY CHOOSE TEA NEST?" HERITAGE PILLARS (PDF p. 12-13) */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#f9f6f0] border-b border-[#ece4d5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1b3b27] uppercase">
            WHY CHOOSE TEA NEST?
          </h2>
          <p className="text-sm text-[#66776b] max-w-xl mx-auto mt-2">
            Wide collection of the world's finest Assam teas - Pure & Fresh - in varied & exotic packaging.
          </p>
          <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mt-3 mb-14" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Pillar 1: Heritage */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e8decd] flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-full bg-[#f4f7f4] flex items-center justify-center border border-[#c5a059]/40 text-[#1b3b27]">
                <Clock className="w-10 h-10 text-[#c5a059]" />
              </div>
              <p className="text-xs font-mono font-semibold tracking-widest text-[#c5a059] uppercase">
                ESTD. 2026 • BORN IN ASSAM
              </p>
              <h3 className="font-serif text-2xl font-bold text-[#1b3b27]">Heritage</h3>
              <p className="text-xs text-[#6e7d72] leading-relaxed">
                Single-estate provenance rooted in Naharkatia, Dibrugarh. We harvest from historic gardens bathed in rich morning river mist and sunshine.
              </p>
            </div>

            {/* Pillar 2: Passion */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e8decd] flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-full bg-[#f4f7f4] flex items-center justify-center border border-[#c5a059]/40 text-[#1b3b27]">
                <Flame className="w-10 h-10 text-[#257342]" />
              </div>
              <p className="text-xs font-mono font-semibold tracking-widest text-[#c5a059] uppercase">
                ARTISANAL CTC & ORTHODOX
              </p>
              <h3 className="font-serif text-2xl font-bold text-[#1b3b27]">Passion</h3>
              <p className="text-xs text-[#6e7d72] leading-relaxed">
                Managed by seasoned master tea tasters and blenders who calibrate fermentation, withering, and drying to capture pure aroma and golden liquor.
              </p>
            </div>

            {/* Pillar 3: Purity */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e8decd] flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-full bg-[#f4f7f4] flex items-center justify-center border border-[#c5a059]/40 text-[#1b3b27]">
                <Leaf className="w-10 h-10 text-[#257342]" />
              </div>
              <p className="text-xs font-mono font-semibold tracking-widest text-[#c5a059] uppercase">
                100% PURE TESTED QUALITY
              </p>
              <h3 className="font-serif text-2xl font-bold text-[#1b3b27]">Purity</h3>
              <p className="text-xs text-[#6e7d72] leading-relaxed">
                Pure Indian Teas certified and compliant with FSSAI standards. Zero artificial coloring, zero fillers, sealed immediately to lock in natural freshness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. "TEA GIFTS FOR EVERY CELEBRATION" (Matching PDF p. 8-9) */}
      {/* ======================================================== */}
      <section className="py-16 bg-white border-b border-[#ece6d9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1b3b27] uppercase">
            TEA GIFTS FOR EVERY CELEBRATION
          </h2>
          <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mt-3 mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Gift 1: Chai Trail */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-4 space-y-3 hover:shadow-lg transition-all">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border border-[#ede4d7] flex items-center justify-center p-4">
                <img
                  src="/images/tea_nest_front.jpg"
                  alt="Tea Nest Chai Trail Gift"
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#1b3b27]">
                Tea Nest Heritage Tasting Box
              </h4>
              <p className="text-[11px] text-[#738278]">Assam Estate Blends (500g Stand-up Pouch)</p>
              <p className="font-serif font-bold text-[#c5a059] text-sm">MRP ₹629.00</p>
            </div>

            {/* Gift 2: Instant Premix Box */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-4 space-y-3 hover:shadow-lg transition-all">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border border-[#ede4d7] flex items-center justify-center p-4">
                <img
                  src="/images/tea_nest_back.jpg"
                  alt="Tea Nest Estate Gift Pouch"
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#1b3b27]">
                Tea Nest Naharkatia Estate Pouch
              </h4>
              <p className="text-[11px] text-[#738278]">Pure Single-Origin • Freshness Zip Lock</p>
              <p className="font-serif font-bold text-[#c5a059] text-sm">MRP ₹450.00</p>
            </div>

            {/* Gift 3: Chamomile & Rose Tin */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-4 space-y-3 hover:shadow-lg transition-all">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border border-[#ede4d7] flex items-center justify-center p-4">
                <img
                  src="/images/tea_nest_front.jpg"
                  alt="Tea Nest Connoisseur Pouch"
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#1b3b27]">
                Tea Nest Connoisseur Selection
              </h4>
              <p className="text-[11px] text-[#738278]">First Flush Orthodox Reserve (500g)</p>
              <p className="font-serif font-bold text-[#c5a059] text-sm">MRP ₹695.00</p>
            </div>

            {/* Gift 4: Red Wine Tea Tin */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-4 space-y-3 hover:shadow-lg transition-all">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border border-[#ede4d7] flex items-center justify-center p-4">
                <img
                  src="/images/tea_nest_back.jpg"
                  alt="Tea Nest Royal Festive Hamper"
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#1b3b27]">
                Tea Nest Royal Festive Hamper
              </h4>
              <p className="text-[11px] text-[#738278]">Golden Liquor Tea with Brewing Infuser</p>
              <p className="font-serif font-bold text-[#c5a059] text-sm">MRP ₹850.00</p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              to="/shop?tag=gifts"
              className="inline-block bg-[#257342] hover:bg-[#1e6136] text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              View More Gift Collections
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. "LET CUSTOMERS SPEAK FOR US" (Matching PDF Page 4)     */}
      {/* ======================================================== */}
      <section className="py-16 bg-[#f7f4ed] border-b border-[#ece4d5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1b3b27] uppercase">
            LET CUSTOMERS SPEAK FOR US
          </h2>

          <div className="flex items-center justify-center gap-2">
            <div className="flex text-[#c5a059]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="text-xs font-bold text-[#66776b]">from 600+ verified reviews</span>
          </div>

          <div className="relative bg-white border border-[#e8ded0] p-8 sm:p-10 rounded-2xl shadow-sm min-h-[200px] flex flex-col justify-center">
            <div className="flex justify-center text-[#c5a059] mb-3">
              {[...Array(reviews[currentReviewIndex].rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>

            <h3 className="font-serif font-bold text-lg text-[#1b3b27] mb-2">
              "{reviews[currentReviewIndex].title}"
            </h3>

            <p className="text-sm text-[#4d5c52] italic leading-relaxed max-w-2xl mx-auto">
              "{reviews[currentReviewIndex].text}"
            </p>

            <div className="mt-6 pt-4 border-t border-[#f0e8dc]">
              <p className="font-bold text-xs uppercase tracking-wider text-[#1b3b27]">
                {reviews[currentReviewIndex].author}
              </p>
              <p className="text-[11px] text-[#8e9c91]">{reviews[currentReviewIndex].location}</p>
            </div>

            {/* Arrows */}
            <button
              onClick={() =>
                setCurrentReviewIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#8e9c91] hover:text-[#1b3b27] transition-colors"
              aria-label="Previous Review"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#8e9c91] hover:text-[#1b3b27] transition-colors"
              aria-label="Next Review"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. "NEWSPAPER COVERAGE" (Matching PDF Page 11)            */}
      {/* ======================================================== */}
      <section className="py-16 bg-white border-b border-[#ece6d9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1b3b27] uppercase">
            NEWSPAPER COVERAGE
          </h2>
          <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mt-3 mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Press 1 */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-5 hover:shadow-lg transition-all space-y-4">
              <div className="h-44 bg-[#f0eade] rounded-lg overflow-hidden border border-[#e0d6c5] flex flex-col justify-between p-4">
                <span className="font-serif font-extrabold text-[#257342] text-sm tracking-wider">
                  The Hindu BusinessLine
                </span>
                <p className="font-serif font-bold text-sm text-[#1b3b27] leading-snug">
                  "Tea Nest eyes expansion in Northeast general trade and national direct-to-consumer commerce"
                </p>
                <span className="text-[10px] text-[#738278]">Published in National Business Daily</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#1b3b27]">
                Tea Nest eyes expansion in Northeast and National D2C trade
              </h3>
            </div>

            {/* Press 2 */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-5 hover:shadow-lg transition-all space-y-4">
              <div className="h-44 bg-[#1b3b27] text-white rounded-lg overflow-hidden border border-[#234731] flex flex-col justify-between p-4">
                <span className="font-serif font-bold text-[#c5a059] text-xs uppercase tracking-wider">
                  SPECIAL FEATURE
                </span>
                <p className="font-serif font-bold text-sm text-[#f5f2e9] leading-snug">
                  "Media coverage of Tea Nest at International Tea Day celebrations"
                </p>
                <span className="text-[10px] text-[#b8cfbf]">Annual Tea Industry Conclave</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#1b3b27]">
                Media coverage of Tea Nest at International Tea Day
              </h3>
            </div>

            {/* Press 3 */}
            <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-5 hover:shadow-lg transition-all space-y-4">
              <div className="h-44 bg-[#f0eade] rounded-lg overflow-hidden border border-[#e0d6c5] flex flex-col justify-between p-4">
                <span className="font-serif font-extrabold text-[#121513] text-sm tracking-wider">
                  The Telegraph
                </span>
                <p className="font-serif font-bold text-sm text-[#1b3b27] leading-snug">
                  "A Tribute by Tea Nest Celebrates Assam's Historic Single-Estate Heritage Gardens"
                </p>
                <span className="text-[10px] text-[#738278]">Eastern India Edition</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#1b3b27]">
                A Calendar by Tea Nest Celebrates Assam's Iconic Gardens
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. "BLOG — ALL ABOUT TEAS" (Matching PDF Page 5)          */}
      {/* ======================================================== */}
      <section id="tea-blog" className="py-16 bg-[#f9f6f0] border-b border-[#ece4d5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#c5a059] mb-1">
              Tea Culture & Masterclasses
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1b3b27] uppercase">
              BLOG - ALL ABOUT TEAS
            </h2>
            <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mt-3 mb-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {((state.blogs && state.blogs.length > 0)
              ? state.blogs.filter(b => b.isPublished).slice(0, 3)
              : []
            ).map((blog) => (
              <div
                key={blog.id}
                className="bg-white border border-[#e8ded0] rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <Link to={`/blog/${blog.slug}`} className="aspect-[16/10] bg-[#fdfaf5] overflow-hidden flex items-center justify-center border-b border-[#e8ded0] block">
                  <img
                    src={getBlogCoverImageUrl(blog.coverImage)}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#c5a059] uppercase tracking-wider">
                        {blog.category}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {blog.readTime}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#1b3b27] leading-snug group-hover:text-[#257342] transition-colors">
                      <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h3>
                    <p className="text-xs text-[#6e7d72] line-clamp-2 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </div>
                  <Link
                    to={`/blog/${blog.slug}`}
                    className="text-xs font-bold text-[#257342] hover:text-[#1e6136] inline-flex items-center gap-1 uppercase tracking-wider pt-2"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1b3b27] hover:bg-[#142e1e] text-[#f5f2e9] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              <span>Explore All Tea Stories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 10. NEWSLETTER & SOCIAL COMMUNITY (Matching PDF Page 2)    */}
      {/* ======================================================== */}
      <section className="py-16 bg-[#163020] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              SUBSCRIBE TO GET 9% DISCOUNT ON YOUR FIRST ORDER
            </h2>
            <p className="text-xs text-[#a9c7b2]">
              Join our connoisseur circle for seasonal flush alerts, private tasting invitations, and exclusive estate reserve lots.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="Email Address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 bg-white text-xs text-[#121513] placeholder-[#7d8c80] px-4 py-3.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
            />
            <button
              type="submit"
              className="bg-[#2e8b4e] hover:bg-[#257342] text-white px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              SUBSCRIBE
            </button>
          </form>

          {newsletterSuccess && (
            <p className="text-xs text-[#4ade80] font-medium animate-bounce">
              ✓ Thank you for subscribing! Your 9% discount coupon code is: TEANEST9
            </p>
          )}

          <p className="text-[10px] text-[#86a68f] italic">*Offer valid only for new customers</p>

          <div className="pt-6 border-t border-[#234a31] space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-[#c5a059]">
              FOLLOW US ON
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-bold">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#1e442c] hover:bg-[#c5a059] flex items-center justify-center transition-colors"
              >
                f
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#1e442c] hover:bg-[#c5a059] flex items-center justify-center transition-colors"
              >
                𝕏
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#1e442c] hover:bg-[#c5a059] flex items-center justify-center transition-colors"
              >
                ▶
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#1e442c] hover:bg-[#c5a059] flex items-center justify-center transition-colors"
              >
                📷
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#1e442c] hover:bg-[#c5a059] flex items-center justify-center transition-colors"
              >
                in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Order Intent Confirmation Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121814] border border-[#c5a059]/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#257342]/20 border border-[#4ade80]/40 flex items-center justify-center mx-auto text-[#4ade80]">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-2xl font-bold text-[#f5f2e9]">
                WhatsApp Order Created!
              </h3>
              <p className="text-xs text-[#9fb3a4]">
                Your unique order reference has been reserved in our system.
              </p>
              <div className="inline-block bg-[#1b2b20] border border-[#c5a059]/40 rounded-lg px-4 py-1.5 font-mono text-base font-bold text-[#c5a059] mt-2">
                {orderSuccessModal.orderNumber}
              </div>
            </div>

            <div className="bg-[#18241c] p-4 rounded-xl text-xs space-y-2 text-[#d1dfd4]">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-[#fde047]">WHATSAPP_PENDING</span>
              </div>
              <div className="flex justify-between">
                <span>Product:</span>
                <span>Assam Black Tea (500g)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payable:</span>
                <span className="font-bold text-white">₹450 (Incl. 5% GST)</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="text-[#4ade80]">FREE Pan-India</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={orderSuccessModal.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-black font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp to Confirm</span>
              </a>

              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-2.5 text-xs text-[#9fb3a4] hover:text-white transition-colors"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setDeliveryModalOpen(true);
        }}
      />

      {/* Delivery Address Modal */}
      <DeliveryAddressModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        product={orderProduct || primaryProduct}
        quantity={1}
        onOrderPlaced={(result) => {
          setOrderSuccessModal({
            orderNumber: result.order.orderNumber,
            whatsappUrl: result.whatsappUrl,
          });
        }}
      />
    </div>
  );
};
