import React from 'react';
import { Heart, Star, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart?: (variantId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
}) => {
  const primaryImage =
    product.images?.find(i => i.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop';

  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(product.base_price));

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-[#EAE6F4] hover:border-[#9B8EC7] transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden relative">
      {/* Image Viewport */}
      <div className="relative aspect-[4/5] bg-[#F3F1FA] overflow-hidden">
        <img
          src={primaryImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-[#D95D39] text-white shadow-md scale-110'
              : 'bg-white/80 backdrop-blur-sm text-[#2A2141] hover:text-[#D95D39] hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Badge if low */}
        {totalStock > 0 && totalStock <= 8 && (
          <div className="absolute top-3 left-3 bg-[#2A2141]/80 backdrop-blur-sm text-[#F9F8FC] text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono">
            Limited Atelier: {totalStock} left
          </div>
        )}

        {/* Quick Action Overlay Buttons */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="flex-1 bg-[#2A2141]/90 hover:bg-[#2A2141] text-[#F9F8FC] py-2 rounded-xl text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-1.5 backdrop-blur-sm shadow-md transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#9B8EC7]" />
            Inspect
          </button>

          {onQuickAddToCart && product.variants && product.variants.length > 0 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onQuickAddToCart(product.variants[0].id);
              }}
              className="bg-[#9B8EC7] hover:bg-[#8576B3] text-[#FFFFFF] px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
              title="Add signature piece to shopping bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-grow justify-between text-left">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#2A2141]/60 uppercase tracking-widest mb-1">
            <span>{product.brand || 'MIO Atelier'}</span>
            <span>{product.category_name}</span>
          </div>

          <h3
            onClick={() => onSelectProduct(product)}
            className="font-serif text-base font-normal text-[#2A2141] group-hover:text-[#9B8EC7] transition-colors line-clamp-1 cursor-pointer"
          >
            {product.title}
          </h3>

          <p className="mt-1 text-xs text-[#2A2141]/70 line-clamp-2 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EAE6F4] flex items-center justify-between">
          <div>
            <div className="font-serif text-lg font-medium text-[#2A2141]">
              {priceFormatted}
            </div>
            {product.variants && product.variants.length > 1 && (
              <span className="text-[10px] text-[#2A2141]/50">
                {product.variants.length} options available
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-[#2A2141]">
            <Star className="w-3.5 h-3.5 fill-[#9B8EC7] text-[#9B8EC7]" />
            <span>{product.rating_avg || 5.0}</span>
            <span className="text-[#2A2141]/40 text-[10px]">
              ({product.rating_count || 1})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
