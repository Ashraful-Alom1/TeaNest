import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  Leaf,
  Award,
  CheckCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  ShieldCheck,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { useTeaNestStore, SEED_PRODUCT } from '@tea-nest/shared';
import { AuthModal } from '../components/AuthModal';
import { DeliveryAddressModal } from '../components/DeliveryAddressModal';
import { Product, getBlogCoverImageUrl } from '@tea-nest/types';

interface BestSellerCardProps {
  badge: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  price: string;
  mrp: string;
  onOrder: () => void;
  onAddToCart?: () => void;
  image?: string;
  slug?: string;
}

const BestSellerCard: React.FC<BestSellerCardProps> = ({
  badge,
  badgeBg,
  title,
  subtitle,
  price,
  mrp,
  onOrder,
  onAddToCart,
  image = '/images/tea_nest_front.jpg',
  slug = 'assam-black-tea',
}) => {
  const productUrl = `/product/${slug}`;

  return (
    <div className="bg-[#fdfaf5] border border-[#e8dece] rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
      <div className="space-y-3">
        {/* Clickable Image -> Redirects directly to Product Detail Page */}
        <Link
          to={productUrl}
          className="relative block w-full aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#ece3d3] p-3 cursor-pointer group/img"
        >
          <span className={`absolute top-2 left-2 ${badgeBg} text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 shadow-sm pointer-events-none`}>
            {badge}
          </span>

          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
          />
        </Link>

        <div className="space-y-1">
          <div className="flex text-[#c5a059]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <Link
            to={productUrl}
            className="font-serif font-bold text-base text-[#1b3b27] group-hover:text-[#c5a059] transition-colors block"
          >
            {title}
          </Link>
          <p className="text-xs text-[#738278]">{subtitle}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-[#eee5d6] mt-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold price-font text-[#1b3b27] tabular-nums tracking-tight">{price}</span>
          <span className="text-xs text-[#6e7d72] font-semibold price-font">{mrp}</span>
        </div>

        {/* Action Buttons: BUY NOW & ADD TO CART (Matching 2nd Reference Image) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOrder}
            className="w-full flex items-center justify-center gap-1.5 bg-[#1b3b27] hover:bg-[#257342] text-white py-2.5 px-2 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>BUY NOW</span>
          </button>

          <button
            onClick={onAddToCart}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-[#f5eedc] text-[#1b3b27] border border-[#1b3b27]/30 hover:border-[#1b3b27] py-2.5 px-2 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#1b3b27]" />
            <span className="whitespace-nowrap">ADD TO CART</span>
          </button>
        </div>

        {/* View Details Link (Matching 2nd Reference Image) */}
        <div className="text-center pt-1">
          <Link
            to={productUrl}
            className="inline-flex items-center justify-center gap-1.5 text-xs text-[#526458] hover:text-[#1b3b27] font-medium transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const GiftCard: React.FC<{
  title: string;
  subtitle: string;
  price: string;
  image?: string;
  slug?: string;
}> = ({
  title,
  subtitle,
  price,
  image = '/images/tea_nest_front.jpg',
  slug = 'assam-black-tea',
}) => {
  const productUrl = `/product/${slug}`;

  return (
    <div className="bg-[#fcfaf7] border border-[#e8dece] rounded-xl p-4 space-y-3 hover:shadow-lg transition-all group">
      <Link
        to={productUrl}
        className="relative block aspect-square bg-white rounded-lg overflow-hidden border border-[#ede4d7] p-3 cursor-pointer group-hover:shadow-sm"
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <Link
        to={productUrl}
        className="font-serif font-bold text-sm text-[#1b3b27] group-hover:text-[#c5a059] transition-colors block"
      >
        {title}
      </Link>
      <p className="text-[11px] text-[#738278]">{subtitle}</p>
      <p className="price-font font-bold text-[#c5a059] text-base tabular-nums">{price}</p>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderNumber: string;
    whatsappUrl: string;
  } | null>(null);
  const [cartToast, setCartToast] = useState<{ show: boolean; title: string } | null>(null);

  const handleAddToCart = (product: Product = primaryProduct) => {
    const target = product || primaryProduct;
    store.addToCart(target, 1);
    setCartToast({ show: true, title: target.name });
    setTimeout(() => setCartToast(null), 3500);
  };

  // Hero Slider State (Infinite Seamless Loop)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Review Carousel State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const primaryProduct =
    state.products.find((p) => p.isPublished && p.isActive && p.isFeatured) ||
    state.products.find((p) => p.isPublished && p.isActive) ||
    state.products[0] ||
    SEED_PRODUCT;

  const heroSlides = [
    {
      id: 1,
      tag: 'BORN IN ASSAM • LOVED EVERYWHERE',
      preTitle: 'FROM THE',
      title: 'Tea Gardens of',
      titleHighlight: 'Naharkatia',
      postTitle: 'TO YOUR DOORSTEP',
      subheading: '100% Pure Single-Estate Assam CTC Black Tea • Rich, Malty & Freshly Packed at Source',
      image: '/images/tea_estate_hero_clean.jpg',
      ctaText: 'ORDER NOW',
      secondaryText: 'Explore Tea Details',
      badge: 'Single-Estate Harvest',
      trust1: '100% Single-Estate Naharkatia',
      trust2: 'Handpicked Clonal Leaves',
    },
    {
      id: 2,
      tag: 'GOLDEN DAWN HARVEST • SEED TO SIP',
      preTitle: 'AWAKEN TO',
      title: 'The Golden Sunrise of',
      titleHighlight: 'Upper Assam',
      postTitle: 'FRESH FIRST FLUSH',
      subheading: 'Tender Morning Dew Buds Hand-Plucked at First Light • Brisk Amber Cups with Intoxicating Malty Aroma',
      image: '/images/tea_estate_dawn.jpg',
      ctaText: 'ORDER NOW',
      secondaryText: 'Discover The Harvest',
      badge: 'Dawn Clonal Vintage',
      trust1: 'Dawn Dew Plucking',
      trust2: '100% Pure Chemical-Free',
    },
    {
      id: 3,
      tag: 'HIMALAYAN FOOTHILLS • NATURAL ELEVATION',
      preTitle: 'NURTURED IN',
      title: 'Mist-Shrouded Slopes of',
      titleHighlight: 'High Terroir',
      postTitle: 'HIGH-BRISK ROYAL CHAI',
      subheading: 'Steep Velvety Amber Cups with Deep Golden Rims & An Unmistakable Caramel Malt Sweetness',
      image: '/images/tea_estate_hills_golden.jpg',
      ctaText: 'ORDER NOW',
      secondaryText: 'View Tasting Notes',
      badge: 'High Elevation Terroir',
      trust1: 'High-Brisk Amber Liquor',
      trust2: 'Full-Bodied Golden Rim',
    },
    {
      id: 4,
      tag: 'ORGANIC PURITY • TRADITIONAL CRAFT',
      preTitle: 'HERITAGE OF',
      title: 'Lush Emerald Valleys of',
      titleHighlight: 'Brahmaputra',
      postTitle: 'MASTER BLENDER RESERVE',
      subheading: 'Crafted from Selected First & Second Flush Bush Clones for the Ultimate Kadak Morning Cup',
      image: '/images/tea_estate_valley_morning.jpg',
      ctaText: 'ORDER NOW',
      secondaryText: 'Shop All Blends',
      badge: 'Estate Master Batch',
      trust1: 'Traditional Artisanal CTC',
      trust2: 'Uncompromised Kadak Flavour',
    },
    {
      id: 5,
      tag: 'PREMIUM AROMA-LOCK PACKAGING • FRESH DELIVERED',
      preTitle: 'SEALED IN',
      title: 'Multi-Layer Foil for',
      titleHighlight: 'Peak Freshness',
      postTitle: 'LUXURY TEA EXPERIENCE',
      subheading: 'Zip-Sealed at the Plantation to Lock In Volatile Essential Oils & Farm-Fresh Fragrance',
      image: '/images/tea_estate_golden_crest.jpg',
      ctaText: 'ORDER NOW',
      secondaryText: 'Explore Collection',
      badge: 'Aroma-Lock Guarantee',
      trust1: 'Zip-Lock Oxygen Barrier',
      trust2: 'Fast Express Doorstep Delivery',
    },
  ];

  // Extended array with cloned boundary slides for seamless infinite loop (no rewind)
  const extendedSlides = [
    { ...heroSlides[heroSlides.length - 1], id: 'clone-prev' },
    ...heroSlides,
    { ...heroSlides[0], id: 'clone-next' },
  ];

  const handleTransitionEnd = () => {
    if (currentSlideIndex === extendedSlides.length - 1) {
      // Reached the clone of Slide 1 -> silently snap to real Slide 1 without animation
      setIsTransitioning(false);
      setCurrentSlideIndex(1);
    } else if (currentSlideIndex === 0) {
      // Reached the clone of Slide 5 -> silently snap to real Slide 5 without animation
      setIsTransitioning(false);
      setCurrentSlideIndex(heroSlides.length);
    }
  };

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentSlideIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentSlideIndex((prev) => prev - 1);
  };

  const goToSlide = (slideIdx: number) => {
    setIsTransitioning(true);
    setCurrentSlideIndex(slideIdx + 1);
  };

  // Active indicator dot index (0 to 4)
  const activeDotIndex =
    currentSlideIndex === 0
      ? heroSlides.length - 1
      : currentSlideIndex === extendedSlides.length - 1
      ? 0
      : currentSlideIndex - 1;

  // Preload all hero slide images into browser cache so transitions are instantaneous
  useEffect(() => {
    heroSlides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, [heroSlides]);

  // Auto-advance hero slides smoothly every 4 seconds in an infinite loop
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlideIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlideIndex]);

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };

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
      {/* 1. HERO SLIDER CAROUSEL (ZERO BLINK • SMOOTH LUXURY CROSSFADE) */}
      {/* ======================================================== */}
      <section
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full min-h-[660px] sm:min-h-[680px] md:min-h-0 md:h-[620px] lg:h-[680px] xl:h-[720px] overflow-hidden bg-[#0d1711] select-none"
      >
        {/* Full-bleed Sliding Track: The COMPLETE slide (Background + Transparent overlay + Text + Products) glides sequentially in an infinite loop */}
        <div
          className={`flex w-full h-full ${
            isTransitioning ? 'transition-transform duration-700 ease-out' : ''
          }`}
          style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((slide) => (
            <div
              key={slide.id}
              className="relative w-full h-full shrink-0 min-h-[660px] sm:min-h-[680px] md:min-h-0 md:h-[620px] lg:h-[680px] xl:h-[720px] overflow-hidden"
            >
              {/* 100% Realistic Estate Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
              />

              {/* Transparent Dark Gradient Overlays (Vivid Scenery + High Legibility) */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 md:to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 md:h-44 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />

              {/* Slide Content: Text Left, Product Trio Right */}
              <div className="absolute inset-0 w-full h-full flex items-center z-20 pointer-events-none pt-8 sm:pt-10 md:pt-0 pb-6 md:pb-0">
                <div className="max-w-7xl mx-auto w-full px-5 sm:px-10 lg:px-16 pointer-events-auto">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-12 items-end">
                    
                    {/* Left Column: Brand Typography & CTAs (Clean, NO EXTRA BORDER) */}
                    <div className="md:col-span-6 lg:col-span-7 pb-3 md:pb-16 min-h-[360px] sm:min-h-[420px] md:min-h-0 flex flex-col justify-end">
                      <div className="space-y-2 sm:space-y-3.5 lg:space-y-4 text-left text-white">
                        {/* Luxury Tagline Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[#fcd34d] text-[10px] sm:text-xs font-bold tracking-widest uppercase shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#fbbf24] shrink-0" />
                          <span>{slide.tag}</span>
                        </div>

                        {/* Eyebrow / Pre-title */}
                        <p className="font-sans font-extrabold tracking-[0.24em] text-white/95 text-[11px] sm:text-sm lg:text-base uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                          {slide.preTitle}
                        </p>

                        {/* Editorial Serif Headline */}
                        <h1 className="font-editorial font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-[1.06] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
                          {slide.title}<br />
                          <span className="text-[#f5eedc] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">{slide.titleHighlight}</span>
                        </h1>

                        {/* Post-title uppercase */}
                        <p className="font-sans font-extrabold tracking-[0.22em] text-white/95 text-xs sm:text-base lg:text-xl uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] pt-0.5">
                          {slide.postTitle}
                        </p>

                        {/* Subtitle / Tasting Notes */}
                        <p className="text-[#f1f5f9] text-xs sm:text-sm lg:text-base font-normal leading-relaxed max-w-lg drop-shadow-md line-clamp-2 sm:line-clamp-none">
                          {slide.subheading}
                        </p>

                        {/* Price & In-Stock pill */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5">
                          <span className="text-2xl sm:text-3xl font-extrabold price-font text-white tabular-nums tracking-tight drop-shadow-md">
                            ₹450
                          </span>
                          <span className="text-xs sm:text-sm text-[#cbd5e1] line-through drop-shadow-sm price-font font-medium">
                            MRP ₹499
                          </span>
                          <span className="bg-[#257342] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-md">
                            Save 10%
                          </span>
                          <span className="text-xs text-[#86efac] flex items-center gap-1.5 font-semibold drop-shadow-md">
                            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shrink-0" />
                            In Stock ({primaryProduct?.stockQuantity ?? 100} units)
                          </span>
                        </div>

                        {/* Primary CTA Buttons (Clean, borderless frosted styling) */}
                        <div className="flex flex-row items-center gap-2.5 sm:gap-3 pt-1 w-full sm:w-auto">
                          <button
                            onClick={() => handleWhatsAppOrder(primaryProduct)}
                            className="flex items-center justify-center gap-2 bg-[#257342] hover:bg-[#1e6136] text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-lg font-bold tracking-wider text-xs sm:text-sm transition-all shadow-xl hover:scale-105 active:scale-95 flex-1 sm:flex-initial cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d1fae5]" />
                            <span>{slide.ctaText}</span>
                          </button>

                          <Link
                            to="/product/assam-black-tea"
                            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-lg font-semibold tracking-wider text-xs sm:text-sm transition-all backdrop-blur-md hover:scale-105 active:scale-95 flex-1 sm:flex-initial shadow-lg"
                          >
                            <span>{slide.secondaryText}</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                        </div>

                        {/* Trust badges */}
                        <div className="hidden sm:flex items-center gap-6 pt-1 text-[11px] text-[#e2e8f0] font-medium drop-shadow-sm">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#fbbf24] shrink-0" /> {slide.trust1}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Leaf className="w-4 h-4 text-[#4ade80] shrink-0" /> {slide.trust2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Standing Product Lineup on the bottom shelf */}
                    <div className="md:col-span-6 lg:col-span-5 flex items-end justify-center md:justify-end relative pb-1 md:pb-4 pointer-events-auto">
                      <Link
                        to="/product/assam-black-tea"
                        className="group relative flex flex-col items-center justify-end cursor-pointer transition-transform duration-500 hover:scale-[1.03] active:scale-98"
                        title="Shop Tea Nest Premium Tea Collection"
                      >
                        <img
                          src="/images/tea_nest_trio_standing_clean.png"
                          alt="Tea Nest Premium Tea Trio Collection - Assam Black Tea, Green Tea & Darjeeling Tea"
                          className="max-h-[220px] sm:max-h-[300px] md:max-h-[400px] lg:max-h-[470px] xl:max-h-[510px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] relative z-10"
                        />
                        {/* Soft Realistic Contact Shadow resting on the floor shelf */}
                        <div className="w-[92%] h-5 bg-black/45 blur-md rounded-full mx-auto -mt-2.5 pointer-events-none" />
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Slider Side Controls (Strictly hidden on mobile, only on sm and above) */}
        <button
          onClick={prevSlide}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/45 hover:bg-[#c5a059] active:bg-[#c5a059] text-white items-center justify-center transition-all border border-white/20 hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-xs"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/45 hover:bg-[#c5a059] active:bg-[#c5a059] text-white items-center justify-center transition-all border border-white/20 hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-xs"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators & Mobile Controls Pill */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 sm:left-10 sm:translate-x-0 lg:left-16 z-30 flex items-center space-x-2 bg-black/45 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none px-3.5 py-1.5 sm:px-0 sm:py-0 rounded-full border border-white/20 sm:border-none shadow-lg">
          {/* Mobile Prev Button */}
          <button
            onClick={prevSlide}
            className="sm:hidden p-1 text-white/90 hover:text-[#c5a059] active:text-[#c5a059] transition-colors"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Indicator Dots */}
          <div className="flex items-center space-x-1.5 px-1">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="p-1 focus:outline-none cursor-pointer"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span
                  className={`block h-2 transition-all rounded-full ${
                    activeDotIndex === idx ? 'w-7 bg-[#c5a059]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Mobile Next Button */}
          <button
            onClick={nextSlide}
            className="sm:hidden p-1 text-white/90 hover:text-[#c5a059] active:text-[#c5a059] transition-colors"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Tile 1: Black Teas */}
            <Link
              to="/product/assam-black-tea"
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors">
                <img
                  src="/images/tea_nest_front.jpg"
                  alt="Black Teas"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                Black Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">126 products</p>
            </Link>

            {/* Tile 2: Green Teas */}
            <Link
              to="/shop?category=green-tea"
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#f4f7f4] flex items-center justify-center">
                <Leaf className="w-12 h-12 sm:w-16 sm:h-16 text-[#257342] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                Green Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">42 products</p>
            </Link>

            {/* Tile 3: White Teas */}
            <Link
              to="/shop?category=white-tea"
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#fdfaf5] flex items-center justify-center">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-[#c5a059] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
                White Teas
              </h3>
              <p className="text-xs text-[#708075] mt-1">10 products</p>
            </Link>

            {/* Tile 4: Oolong Teas */}
            <Link
              to="/shop?category=oolong-tea"
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#c5a059]/30"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 border-[#1b3b27]/20 group-hover:border-[#c5a059] transition-colors bg-[#f5f2eb] flex items-center justify-center">
                <Award className="w-12 h-12 sm:w-16 sm:h-16 text-[#927238] group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1b3b27] group-hover:text-[#c5a059] transition-colors">
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
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#17281d] via-[#1f3a28] to-[#254631] text-white p-6 sm:p-8 min-h-[300px]">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Left: Dedicated Text Content - Strictly Contained */}
                <div className="sm:col-span-7 space-y-3 z-10">
                  <div className="inline-block bg-[#c5a059] text-[#121513] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    FLAT 30% OFF
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-widest text-[#d8e8dc] uppercase">
                    TEA OF THE MONTH
                  </h3>
                  <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                    A SIP OF WELLNESS, EVERY DAY.
                  </h2>
                  <p className="text-xs text-[#b8cfbf] leading-relaxed">
                    Single-estate rare clonal Assam leaves, handpicked at dawn and packaged directly at Naharkatia by Fortunate Ventures.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/product/assam-black-tea"
                      className="inline-flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08b47] text-[#121513] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
                    >
                      <span>Explore Offer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Right: Dedicated Image Showcase (No Text Overlap) */}
                <div className="sm:col-span-5 flex items-center justify-center p-2">
                  <div className="relative w-full max-w-[180px] sm:max-w-[210px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                    <img
                      src="/images/tea_nest_front.jpg"
                      alt="Tea Nest Assam Black Tea 500g Front View"
                      className="w-full h-full object-cover object-center drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner 2: Premix & Chai Blends */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#2a2217] via-[#382d1c] to-[#473b28] text-white p-6 sm:p-8 min-h-[300px]">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-7 space-y-3 z-10">
                  <div className="inline-block bg-[#257342] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    ESTATE BLENDS
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-widest text-[#ead9bf] uppercase">
                    AUTHENTIC KADAK CHAI
                  </h3>
                  <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                    PURE FLAVOR. READY IN SECONDS.
                  </h2>
                  <p className="text-xs text-[#d6c7af] leading-relaxed">
                    Hand-crushed elaichi, ginger, and robust CTC tea leaves for an authentic Indian chai experience.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/shop?category=chai"
                      className="inline-flex items-center gap-2 bg-[#257342] hover:bg-[#1e6136] text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
                    >
                      <span>Discover Chai</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="sm:col-span-5 flex items-center justify-center p-2">
                  <div className="relative w-full max-w-[180px] sm:max-w-[210px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                    <img
                      src="/images/tea_nest_front.jpg"
                      alt="Tea Nest Kadak Chai Front View"
                      className="w-full h-full object-cover object-center drop-shadow-xl"
                    />
                  </div>
                </div>
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
            {(() => {
              const p1 = state.products.find((p) => p.slug === 'assam-black-tea') || state.products[0] || primaryProduct;
              const p2 = state.products.find((p) => p.slug === 'premium-ctc-kadak-chai') || state.products[1] || primaryProduct;
              const p3 = state.products.find((p) => p.slug === 'ginger-masala-chai') || state.products[2] || primaryProduct;
              const p4 = state.products.find((p) => p.slug === 'orthodox-reserve') || state.products[3] || primaryProduct;

              return (
                <>
                  <BestSellerCard
                    badge="FLAGSHIP"
                    badgeBg="bg-[#257342]"
                    title={p1.name}
                    subtitle="Rich • Refreshing • Aromatic Stand-up Pouch"
                    price={`₹${p1.sellingPrice}.00`}
                    mrp={`MRP ₹${p1.mrp}.00`}
                    slug={p1.slug}
                    onOrder={() => handleWhatsAppOrder(p1)}
                    onAddToCart={() => handleAddToCart(p1)}
                  />
                  <BestSellerCard
                    badge="BESTSELLER"
                    badgeBg="bg-[#c5a059]"
                    title={p2.name}
                    subtitle="Granular brisk Assam leaf for morning milk tea"
                    price={`₹${p2.sellingPrice}.00`}
                    mrp={`MRP ₹${p2.mrp}.00`}
                    slug={p2.slug}
                    onOrder={() => handleWhatsAppOrder(p2)}
                    onAddToCart={() => handleAddToCart(p2)}
                  />
                  <BestSellerCard
                    badge="SPICED"
                    badgeBg="bg-[#927238]"
                    title={p3.name}
                    subtitle="Authentic Indian Spiced Tea with Real Ginger"
                    price={`₹${p3.sellingPrice}.00`}
                    mrp={`MRP ₹${p3.mrp}.00`}
                    slug={p3.slug}
                    onOrder={() => handleWhatsAppOrder(p3)}
                    onAddToCart={() => handleAddToCart(p3)}
                  />
                  <BestSellerCard
                    badge="ORTHODOX"
                    badgeBg="bg-[#257342]"
                    title={p4.name}
                    subtitle="Whole leaf Assam black tea with golden tips"
                    price={`₹${p4.sellingPrice}.00`}
                    mrp={`MRP ₹${p4.mrp}.00`}
                    slug={p4.slug}
                    onOrder={() => handleWhatsAppOrder(p4)}
                    onAddToCart={() => handleAddToCart(p4)}
                  />
                </>
              );
            })()}
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
            <GiftCard
              title="Tea Nest Heritage Tasting Box"
              subtitle="Assam Estate Blends (500g Stand-up Pouch)"
              price="MRP ₹629.00"
            />
            <GiftCard
              title="Tea Nest Naharkatia Estate Pouch"
              subtitle="Pure Single-Origin • Freshness Zip Lock"
              price="MRP ₹450.00"
            />
            <GiftCard
              title="Tea Nest Connoisseur Selection"
              subtitle="First Flush Orthodox Reserve (500g)"
              price="MRP ₹695.00"
            />
            <GiftCard
              title="Tea Nest Royal Festive Hamper"
              subtitle="Golden Liquor Tea with Brewing Infuser"
              price="MRP ₹850.00"
            />
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

          <div className="relative bg-white border border-[#e8ded0] px-7 py-8 sm:px-14 sm:py-10 rounded-2xl shadow-sm min-h-[220px] flex flex-col justify-center">
            <div className="flex justify-center text-[#c5a059] mb-3">
              {[...Array(reviews[currentReviewIndex].rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>

            <h3 className="font-serif font-bold text-base sm:text-lg text-[#1b3b27] mb-2 px-2 sm:px-0">
              "{reviews[currentReviewIndex].title}"
            </h3>

            <p className="text-xs sm:text-sm text-[#4d5c52] italic leading-relaxed max-w-2xl mx-auto px-1 sm:px-0">
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
              className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full text-[#8e9c91] hover:text-[#1b3b27] bg-white/90 sm:bg-transparent shadow-xs sm:shadow-none border border-[#e8ded0]/80 sm:border-0 transition-colors"
              aria-label="Previous Review"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)}
              className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full text-[#8e9c91] hover:text-[#1b3b27] bg-white/90 sm:bg-transparent shadow-xs sm:shadow-none border border-[#e8ded0]/80 sm:border-0 transition-colors"
              aria-label="Next Review"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
                <Link to={`/blog/${blog.slug}`} className="aspect-[16/10] bg-[#fdfaf5] overflow-hidden flex items-center justify-center border-b border-[#e8ded0]">
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
            <div className="flex items-center justify-center gap-3.5">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Tea Nest on Facebook"
                title="Facebook"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e442c] hover:bg-[#c5a059] text-[#e3ded2] hover:text-[#0c1811] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Tea Nest on X"
                title="X (formerly Twitter)"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e442c] hover:bg-[#c5a059] text-[#e3ded2] hover:text-[#0c1811] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Tea Nest on YouTube"
                title="YouTube"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e442c] hover:bg-[#c5a059] text-[#e3ded2] hover:text-[#0c1811] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Tea Nest on Instagram"
                title="Instagram"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e442c] hover:bg-[#c5a059] text-[#e3ded2] hover:text-[#0c1811] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Tea Nest on LinkedIn"
                title="LinkedIn"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e442c] hover:bg-[#c5a059] text-[#e3ded2] hover:text-[#0c1811] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
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
                <span className="font-bold price-font text-white">₹450 (Incl. 5% GST)</span>
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

      {/* Add To Cart Toast Notification */}
      {cartToast && cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1b3b27] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#c5a059]/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#c5a059] shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Added to Cart!</p>
            <p className="text-[#d0e0d5] text-[11px] truncate max-w-[200px]">{cartToast.title}</p>
          </div>
          <Link
            to="/cart"
            className="ml-2 bg-[#c5a059] hover:bg-[#b59049] text-[#121513] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
};
