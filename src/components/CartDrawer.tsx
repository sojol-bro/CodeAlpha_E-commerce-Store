import React, { useState } from 'react';
import {
  X,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onProceedToCheckout: (appliedCouponCode?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          description: data.coupon.description,
        });
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid promotion code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Error validating promotion code');
    } finally {
      setCouponLoading(false);
    }
  };

  const shippingFee = subtotal >= 250 || items.length === 0 ? 0 : 15.0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#2A2141]/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#F9F8FC] shadow-2xl flex flex-col h-full border-l border-[#EAE6F4]">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#EAE6F4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#9B8EC7]" />
            <h3 className="font-serif text-xl font-normal text-[#2A2141]">
              Shopping Bag
            </h3>
            <span className="text-xs bg-[#F1EEF9] text-[#2A2141] font-semibold px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#2A2141]/60 hover:text-[#2A2141] hover:bg-[#F9F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#F1EEF9] px-6 py-2.5 text-xs text-[#2A2141] border-b border-[#EAE6F4]">
          {subtotal >= 250 ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Complimentary White Glove Delivery unlocked!</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Complimentary Delivery Progress</span>
                <span className="font-mono font-medium">${(250 - subtotal).toFixed(2)} remaining</span>
              </div>
              <div className="w-full bg-[#EAE6F4] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#9B8EC7] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / 250) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#2A2141]/60">
              <div className="w-16 h-16 rounded-full bg-[#F1EEF9] flex items-center justify-center mb-4 text-[#9B8EC7]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-serif text-lg text-[#2A2141] mb-1">Your bag is awaiting curation</p>
              <p className="text-xs max-w-xs mb-6">Explore our atelier catalog to acquire handcrafted jewelry, bespoke tailoring, and artisanal leather.</p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#2A2141] text-[#F9F8FC] px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-[#3D315B] transition-colors"
              >
                Browse Atelier
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="flex gap-4 p-3 bg-white rounded-2xl border border-[#EAE6F4] shadow-xs relative"
              >
                <div className="w-20 h-24 rounded-xl bg-[#F3F1FA] overflow-hidden flex-shrink-0 border border-[#EAE6F4]">
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop'}
                    alt={item.product_title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between flex-grow text-left">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#2A2141]/50">
                      {item.product_brand || 'MIO Atelier'}
                    </span>
                    <h4 className="font-serif text-sm font-medium text-[#2A2141] line-clamp-1">
                      {item.product_title}
                    </h4>
                    <p className="text-[11px] text-[#2A2141]/70">
                      {item.size || 'One Size'} · {item.color || 'Standard'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-[#F9F8FC] border border-[#EAE6F4] rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-[#2A2141] hover:bg-[#EAE6F4]"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-mono font-medium text-[#2A2141]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-[#2A2141] hover:bg-[#EAE6F4]"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-serif text-sm font-medium text-[#2A2141]">
                      ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute top-2 right-2 p-1 text-[#2A2141]/30 hover:text-[#D95D39] transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Coupon Code & Summary Section */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#EAE6F4] space-y-4">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="w-3.5 h-3.5 text-[#9B8EC7] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Privilege Code (MIO15)"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7] uppercase font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="px-4 py-2 bg-[#2A2141] text-white rounded-xl text-xs font-medium hover:bg-[#3D315B] transition-colors"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-[#D95D39] flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3 h-3" /> {couponError}
                </p>
              )}

              {appliedCoupon && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                  <span>Code <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.description})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="text-emerald-900 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Financial Ledger */}
            <div className="space-y-1.5 text-xs text-[#2A2141]/80 pt-2 border-t border-[#EAE6F4]">
              <div className="flex justify-between">
                <span>Atelier Subtotal</span>
                <span className="font-mono font-medium text-[#2A2141]">${subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Privilege Deduction ({appliedCoupon.code})</span>
                  <span className="font-mono font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>White Glove Shipping</span>
                <span className="font-mono font-medium text-[#2A2141]">
                  {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between text-base font-serif font-medium text-[#2A2141] pt-2 border-t border-[#EAE6F4]">
                <span>Estimated Acquisition</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={() => onProceedToCheckout(appliedCoupon?.code)}
              className="w-full bg-[#2A2141] hover:bg-[#3D315B] text-[#F9F8FC] py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-md group cursor-pointer"
            >
              <span>Proceed to Pay (Acquisition)</span>
              <ArrowRight className="w-4 h-4 text-[#9B8EC7] group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#2A2141]/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9B8EC7]" />
              <span>Encrypted Supabase PostgreSQL Transaction</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
