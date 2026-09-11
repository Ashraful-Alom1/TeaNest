import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  ShoppingBag,
  Flame,
  Plus,
  Minus,
  ChevronLeft,
} from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { AuthModal } from '../components/AuthModal';
import { DeliveryAddressModal } from '../components/DeliveryAddressModal';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { state, store } = useTeaNestStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const product =
    state.products.find((p) => p.slug === slug) ||
    state.products.find((p) => p.isPublished && p.isActive) ||
    state.products[0];

  const isSingleProductMode = state.products.filter((p) => p.isPublished && p.isActive).length === 1;

  if (!product || (!product.isPublished && !product.isActive)) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="font-serif text-2xl font-bold text-charcoal-900">Tea Currently Unavailable</h2>
          <p className="text-xs text-charcoal-600">
            This tea selection is currently resting or hidden from our active catalog.
          </p>
          <Link
            to="/shop"
            className="inline-block px-5 py-2.5 bg-forest-800 text-gold-300 font-bold text-xs uppercase rounded-xl shadow hover:bg-forest-900 transition-all"
          >
            Back to All Teas
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : [
        {
          cloudinaryPublicId: 'front',
          secureUrl: '/images/tea_nest_front.jpg',
          altText: `${product.name} Front View`,
          width: 800,
          height: 1200,
          sortOrder: 1,
        },
        {
          cloudinaryPublicId: 'back',
          secureUrl: '/images/tea_nest_back.jpg',
          altText: `${product.name} Back Packaging & Details`,
          width: 800,
          height: 1200,
          sortOrder: 2,
        },
      ];

  const handleAction = () => {
    if (isSingleProductMode) {
      if (!state.currentCustomer) {
        setAuthModalOpen(true);
        return;
      }
      setDeliveryModalOpen(true);
    } else {
      store.addToCart(product, quantity);
      setSuccessNotice(`Added ${quantity} x ${product.name} to your cart!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-charcoal-500 hover:text-forest-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Teas</span>
          </Link>
        </div>

        {successNotice && (
          <div className="mb-6 p-4 bg-forest-900 text-gold-300 rounded-xl flex items-center justify-between border border-gold-500/30">
            <span className="text-sm font-medium">{successNotice}</span>
            <Link to="/cart" className="text-xs uppercase font-bold underline hover:text-white">
              View Cart →
            </Link>
          </div>
        )}

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#f5f2eb] rounded-2xl overflow-hidden border border-[#d4b896]/20 shadow-lg aspect-[4/5]">
              <img
                src={galleryImages[activeImageIdx]?.secureUrl}
                alt={galleryImages[activeImageIdx]?.altText || product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail Selectors */}
            <div className="flex gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all bg-[#f5f2eb] ${
                    activeImageIdx === idx
                      ? 'border-[#c5a059] shadow-md scale-105'
                      : 'border-[#e2d9cc] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.secureUrl}
                    alt={img.altText}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">
                {product.categoryName || 'Single Estate Assam Black Tea'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-charcoal-950">
                {product.name}
              </h1>
              <p className="font-serif italic text-gold-600 text-lg">
                Rich • Refreshing • Aromatic
              </p>
            </div>

            {/* Price section */}
            <div className="p-4 bg-white rounded-2xl border border-cream-300 space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-forest-800">
                  {formatCurrency(product.sellingPrice, false)}
                </span>
                {product.mrp > product.sellingPrice && (
                  <>
                    <span className="text-base text-charcoal-400 line-through">
                      {formatCurrency(product.mrp, false)}
                    </span>
                    <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded">
                      Save {Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-charcoal-500">
                <span>Inclusive of 5% GST (HSN: {product.hsnCode})</span>
                <span className="text-green-600 font-semibold">
                  In Stock ({product.stockQuantity} units)
                </span>
              </div>
            </div>

            <p className="text-charcoal-700 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Selector & Action Button */}
            <div className="space-y-4 pt-4 border-t border-cream-200">
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase font-semibold text-charcoal-600 tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-cream-300 rounded-lg bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-cream-100 text-charcoal-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-bold text-sm text-charcoal-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    className="p-2 hover:bg-cream-100 text-charcoal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-charcoal-500">
                  Total: {formatCurrency(product.sellingPrice * quantity, false)}
                </span>
              </div>

              <button
                onClick={handleAction}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-700 via-forest-800 to-forest-900 hover:from-emerald-600 hover:to-forest-800 text-gold-300 font-bold text-sm tracking-wider uppercase rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {isSingleProductMode ? (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    <span>ORDER ON WHATSAPP ({formatCurrency(product.sellingPrice * quantity, false)})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>ADD TO CART</span>
                  </>
                )}
              </button>
            </div>

            {/* Packaging & Origin Metadata (Exact labels from back of pouch) */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-cream-200 text-xs">
              <div className="p-3 bg-white rounded-xl border border-cream-300">
                <span className="text-charcoal-400 block uppercase font-semibold mb-1">Ingredients</span>
                <span className="font-medium text-charcoal-900">100% Pure Black Tea</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-cream-300">
                <span className="text-charcoal-400 block uppercase font-semibold mb-1">Net Weight</span>
                <span className="font-medium text-charcoal-900">{product.weight}{product.unit} (17.6 oz)</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-cream-300">
                <span className="text-charcoal-400 block uppercase font-semibold mb-1">Best Before</span>
                <span className="font-medium text-charcoal-900">24 Months From Packaging</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-cream-300">
                <span className="text-charcoal-400 block uppercase font-semibold mb-1">Packed & Marketed</span>
                <span className="font-medium text-charcoal-900">Fortunate Ventures, Dibrugarh, Assam</span>
              </div>
            </div>

            {/* Brewing Ritual mini-cards */}
            <div className="p-4 bg-forest-950 text-cream-100 rounded-2xl border border-gold-500/20 space-y-3">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>Brewing Ritual</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-charcoal-900 rounded-lg">
                  <div className="font-bold text-gold-300">95°C - 100°C</div>
                  <div className="text-[10px] text-cream-400 mt-0.5">Water Temp</div>
                </div>
                <div className="p-2 bg-charcoal-900 rounded-lg">
                  <div className="font-bold text-gold-300">3 - 5 Mins</div>
                  <div className="text-[10px] text-cream-400 mt-0.5">Steep Time</div>
                </div>
                <div className="p-2 bg-charcoal-900 rounded-lg">
                  <div className="font-bold text-gold-300">1 Tsp / Cup</div>
                  <div className="text-[10px] text-cream-400 mt-0.5">Quantity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setDeliveryModalOpen(true);
        }}
      />

      <DeliveryAddressModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        product={product}
        quantity={quantity}
        onOrderPlaced={(result) => {
          window.open(result.whatsappUrl, '_blank');
        }}
      />
    </div>
  );
};
