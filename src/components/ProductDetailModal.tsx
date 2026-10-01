import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Send,
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0]?.image_url || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
    if (product.images && product.images.length > 0) {
      setSelectedImage(product.images[0].image_url);
    }
    setQuantity(1);
    setAddedSuccess(false);

    // Fetch reviews
    fetch(`/api/products/${product.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(() => {});
  }, [product]);

  const currentPrice = selectedVariant?.price ?? product.base_price;
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(currentPrice));

  const stock = selectedVariant?.stock_quantity ?? 10;

  const handleAdd = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    try {
      await onAddToCart(selectedVariant.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          title: newReviewTitle || 'Collector Impression',
          comment: newReviewComment,
          userName: newReviewAuthor || 'Private Client',
        }),
      });
      const data = await res.json();
      if (data.review) {
        setReviews(prev => [data.review, ...prev]);
        setNewReviewComment('');
        setNewReviewTitle('');
        setReviewMessage('Your review has been verified and recorded into Supabase.');
        setTimeout(() => setReviewMessage(''), 4000);
      }
    } catch {
      setReviewMessage('Unable to record review at this moment.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2141]/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden my-8 max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-[#2A2141] shadow-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Half */}
        <div className="md:w-1/2 p-6 md:p-8 bg-[#FFFFFF] border-r border-[#EAE6F4] flex flex-col justify-between">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#F3F1FA] border border-[#EAE6F4] shadow-inner mb-4">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop'}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail selector */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImage === img.image_url
                        ? 'border-[#9B8EC7] shadow-sm scale-105'
                        : 'border-[#EAE6F4] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Luxury guarantees */}
          <div className="pt-4 border-t border-[#EAE6F4] grid grid-cols-3 gap-2 text-center text-[10px] text-[#2A2141]/70">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#9B8EC7]" />
              <span>Certified Solid</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-[#9B8EC7]" />
              <span>Express Insured</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-[#9B8EC7]" />
              <span>Complimentary Returns</span>
            </div>
          </div>
        </div>

        {/* Details & Acquisition Half */}
        <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#2A2141]/60 mb-1">
              <span>{product.brand || 'MIO Atelier'}</span>
              <span>{product.category_name}</span>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#2A2141] mb-2">
              {product.title}
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-2xl font-medium text-[#2A2141]">
                {priceFormatted}
              </span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#EAE6F4] text-xs">
                <Star className="w-3.5 h-3.5 fill-[#9B8EC7] text-[#9B8EC7]" />
                <span className="font-medium text-[#2A2141]">{product.rating_avg || 5.0}</span>
                <span className="text-[#2A2141]/40">({reviews.length || product.rating_count || 1})</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#2A2141]/80 leading-relaxed font-light mb-6">
              {product.description}
            </p>

            {/* Variant Selector: Size & Color */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 mb-6 pt-4 border-t border-[#EAE6F4]">
                <div>
                  <div className="flex justify-between text-xs font-medium text-[#2A2141] mb-2">
                    <span className="uppercase tracking-wider">Atelier Specification</span>
                    <span className="text-[#2A2141]/60 font-mono text-[11px]">
                      SKU: {selectedVariant?.sku || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-xl text-xs text-left border transition-all ${
                          selectedVariant?.id === v.id
                            ? 'border-[#9B8EC7] bg-[#F1EEF9] text-[#2A2141] shadow-xs'
                            : 'border-[#EAE6F4] bg-white text-[#2A2141]/70 hover:border-[#9B8EC7]/50'
                        }`}
                      >
                        <div className="font-medium">{v.size || 'One Size'}</div>
                        <div className="text-[11px] text-[#2A2141]/60">{v.color || 'Standard'}</div>
                        <div className="text-[10px] text-[#2A2141]/80 mt-1 font-mono">
                          ${Number(v.price).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Level Indicator */}
                <div className="flex items-center justify-between text-xs text-[#2A2141]/70 bg-white p-3 rounded-xl border border-[#EAE6F4]">
                  <span>Availability</span>
                  {stock > 0 ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      In Atelier Stock ({stock} available)
                    </span>
                  ) : (
                    <span className="text-[#D95D39] font-medium">Made to Order (In Production)</span>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs uppercase tracking-wider font-medium text-[#2A2141]">
                Quantity
              </span>
              <div className="flex items-center bg-white border border-[#EAE6F4] rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-[#2A2141] hover:bg-[#F9F8FC] transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-mono text-[#2A2141] font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(stock || 10, quantity + 1))}
                  className="px-3 py-1.5 text-[#2A2141] hover:bg-[#F9F8FC] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-8">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className={`flex-grow py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#2A2141] hover:bg-[#3D315B] text-[#F9F8FC]'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Shopping Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#9B8EC7]" />
                    {isAdding ? 'Securing Item...' : 'Add to Shopping Bag'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`p-3.5 rounded-full border transition-all ${
                  isWishlisted
                    ? 'bg-[#D95D39] text-white border-[#D95D39] shadow-md'
                    : 'bg-white border-[#EAE6F4] text-[#2A2141] hover:text-[#D95D39] hover:border-[#D95D39]'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Collector Reviews Section */}
            <div className="pt-6 border-t border-[#EAE6F4]">
              <h4 className="font-serif text-lg font-normal text-[#2A2141] mb-3">
                Collector Chronicles ({reviews.length})
              </h4>

              {/* Add review form */}
              <form onSubmit={handleReviewSubmit} className="bg-white p-4 rounded-2xl border border-[#EAE6F4] mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#2A2141]">
                  <span>Record an Atelier Impression</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            star <= newRating ? 'fill-[#9B8EC7] text-[#9B8EC7]' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Your Name / Title (e.g. Eleanor V.)"
                  value={newReviewAuthor}
                  onChange={e => setNewReviewAuthor(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#EAE6F4] outline-none focus:border-[#9B8EC7]"
                />

                <input
                  type="text"
                  placeholder="Summary headline"
                  value={newReviewTitle}
                  onChange={e => setNewReviewTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#EAE6F4] outline-none focus:border-[#9B8EC7]"
                />

                <textarea
                  rows={2}
                  placeholder="Share details on texture, patina, weight, or fit..."
                  value={newReviewComment}
                  onChange={e => setNewReviewComment(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#EAE6F4] outline-none focus:border-[#9B8EC7]"
                  required
                />

                <div className="flex items-center justify-between pt-1">
                  {reviewMessage && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {reviewMessage}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="ml-auto inline-flex items-center gap-1.5 bg-[#9B8EC7] text-[#2A2141] hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>

              {/* Review List */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#2A2141]/50 italic">
                    Be the debut connoisseur to record an impression for this silhouette.
                  </p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="p-3 bg-white rounded-xl border border-[#EAE6F4] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#2A2141]">{r.user_name || 'Verified Collector'}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (r.rating || 5) ? 'fill-[#9B8EC7] text-[#9B8EC7]' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="font-medium text-[#2A2141]">{r.title}</p>}
                      <p className="text-[#2A2141]/70 font-light mt-0.5">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
