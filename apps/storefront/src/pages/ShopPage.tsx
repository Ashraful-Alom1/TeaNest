import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import { useTeaNestStore, formatCurrency } from '@tea-nest/shared';
import { AuthModal } from '../components/AuthModal';
import { DeliveryAddressModal } from '../components/DeliveryAddressModal';
import { Product } from '@tea-nest/types';

interface ShopProductCardProps {
  product: Product;
  isSingleProductMode: boolean;
  onAction: (product: Product) => void;
}

const ShopProductCard: React.FC<ShopProductCardProps> = ({
  product,
  isSingleProductMode,
  onAction,
}) => {
  const frontUrl = product.thumbnail?.secureUrl || '/images/tea_nest_front.jpg';

  return (
    <div className="bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Image Container - Seamless fit with warm cream background */}
      <div className="relative bg-[#f5f2eb] flex items-center justify-center overflow-hidden aspect-[4/5]">
        <Link
          to={`/product/${product.slug}`}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          <img
            src={frontUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Top Origin Badge */}
        <span className="absolute top-3 left-3 bg-[#1b3b27]/90 text-[#e8dbb5] border border-[#c5a059]/30 text-xs px-2.5 py-1 rounded-full font-semibold shadow-md backdrop-blur-xs pointer-events-none">
          {product.weight}{product.unit} Pouch
        </span>
      </div>

      {/* Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gold-600 uppercase tracking-widest">
            {product.categoryName || 'Black Tea'}
          </div>
          <Link
            to={`/product/${product.slug}`}
            className="font-serif text-xl font-bold text-charcoal-950 hover:text-forest-700 transition-colors block"
          >
            {product.name}
          </Link>
          <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold price-font text-forest-800 tabular-nums tracking-tight">
                {formatCurrency(product.sellingPrice, false)}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-xs text-charcoal-400 line-through price-font">
                  {formatCurrency(product.mrp, false)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-charcoal-500">Incl. of 5% GST</span>
          </div>

          <button
            onClick={() => onAction(product)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-gold-300 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow"
          >
            {isSingleProductMode ? (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Order Now</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add To Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShopPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  const publishedProducts = state.products.filter((p) => p.isPublished && p.isActive);
  const isSingleProductMode = publishedProducts.length === 1;

  const handleAction = (product: Product) => {
    if (isSingleProductMode) {
      setSelectedProduct(product);
      if (!state.currentCustomer) {
        setAuthModalOpen(true);
        return;
      }
      setDeliveryModalOpen(true);
    } else {
      store.addToCart(product, 1);
      setAddedNotification(`Added ${product.name} to cart!`);
      setTimeout(() => setAddedNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-forest-700">
            Artisanal Tea Catalog
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-charcoal-950">
            Our Pure Assam Collections
          </h1>
          <p className="text-charcoal-700 text-sm sm:text-base">
            Whole leaf orthodox and premium CTC teas packed fresh at origin in Dibrugarh, Assam.
          </p>
        </div>

        {addedNotification && (
          <div className="mb-6 p-4 bg-forest-900 text-gold-300 rounded-xl flex items-center justify-between border border-gold-500/30">
            <span className="text-sm font-medium">{addedNotification}</span>
            <Link to="/cart" className="text-xs uppercase font-bold underline hover:text-white">
              View Cart →
            </Link>
          </div>
        )}

        {/* Product Grid */}
        <div
          className={`grid gap-8 ${
            publishedProducts.length === 1
              ? 'max-w-md mx-auto'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {publishedProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              isSingleProductMode={isSingleProductMode}
              onAction={handleAction}
            />
          ))}
        </div>

        {publishedProducts.length === 0 && (
          <div className="text-center py-16 max-w-md mx-auto space-y-3">
            <p className="font-serif text-2xl font-bold text-charcoal-800">No Teas Currently Available</p>
            <p className="text-xs text-charcoal-600">
              Our artisanal batches are being updated by the estate manager. Please check back shortly.
            </p>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          if (selectedProduct) {
            setDeliveryModalOpen(true);
          }
        }}
      />

      <DeliveryAddressModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        product={selectedProduct}
        quantity={1}
        onOrderPlaced={(result) => {
          window.open(result.whatsappUrl, '_blank');
        }}
      />
    </div>
  );
};
