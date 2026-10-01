import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Package,
} from 'lucide-react';
import { CartItem, ShippingMethod, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartId: string;
  items: CartItem[];
  subtotal: number;
  initialCouponCode?: string;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartId,
  items,
  subtotal,
  initialCouponCode = '',
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const { user, profile, savedAddress, saveShippingAddress } = useAuth();

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmed'>('shipping');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Form Fields - dynamically initialize or pre-fill from user profile / saved database address
  const [recipientName, setRecipientName] = useState(
    savedAddress?.recipient_name || profile?.full_name || user?.user_metadata?.full_name || 'Lady Sophia Kensington'
  );
  const [phone, setPhone] = useState(
    savedAddress?.phone || profile?.phone || '+1 (555) 019-2831'
  );
  const [addressLine1, setAddressLine1] = useState(
    savedAddress?.address_line1 || '750 Evergreen Atelier Way'
  );
  const [addressLine2, setAddressLine2] = useState(
    savedAddress?.address_line2 || 'Suite 18B'
  );
  const [city, setCity] = useState(savedAddress?.city || 'New York');
  const [state, setState] = useState(savedAddress?.district || 'NY');
  const [postalCode, setPostalCode] = useState(savedAddress?.postal_code || '10021');
  const [country, setCountry] = useState(savedAddress?.country || 'United States');

  // Pre-fill automatically if savedAddress or profile loads subsequently
  useEffect(() => {
    if (savedAddress) {
      if (savedAddress.recipient_name) setRecipientName(savedAddress.recipient_name);
      if (savedAddress.phone) setPhone(savedAddress.phone);
      if (savedAddress.address_line1) setAddressLine1(savedAddress.address_line1);
      if (savedAddress.address_line2) setAddressLine2(savedAddress.address_line2);
      if (savedAddress.city) setCity(savedAddress.city);
      if (savedAddress.district) setState(savedAddress.district);
      if (savedAddress.postal_code) setPostalCode(savedAddress.postal_code);
      if (savedAddress.country) setCountry(savedAddress.country);
    } else if (profile?.full_name) {
      setRecipientName(profile.full_name);
    }
  }, [savedAddress, profile]);

  // Payment simulated fields
  const [paymentMethod, setPaymentMethod] = useState('MIO Vault Card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 8892');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('389');

  // Load shipping methods
  useEffect(() => {
    fetch('/api/shipping-methods')
      .then(res => res.json())
      .then(data => {
        if (data.methods && data.methods.length > 0) {
          setShippingMethods(data.methods);
          setSelectedMethodId(data.methods[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedMethod = shippingMethods.find(m => m.id === selectedMethodId);
  const rawShippingFee = selectedMethod ? Number(selectedMethod.price) : 15.0;
  const shippingFee = subtotal >= 250 ? 0 : rawShippingFee;

  // Coupon discount calculation
  const isCouponApplied = !!initialCouponCode;
  const discountAmount = initialCouponCode === 'MIO15' ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleConfirmOrder = async () => {
    if (!recipientName || !addressLine1 || !city || !postalCode) {
      setErrorMessage('Please provide complete recipient and street address information.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartId,
          userId: user?.id || null,
          shippingAddress: {
            recipientName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
          },
          shippingMethodId: selectedMethodId,
          paymentMethod,
          couponCode: initialCouponCode,
        }),
      });

      if (res.status === 401) {
        await supabase.auth.signOut();
        setErrorMessage('Your session has expired. Please authenticate your dossier again to proceed.');
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.redirectUrl) {
        // Save to local storage recent acquisitions to persist across redirect
        try {
          const stored = JSON.parse(localStorage.getItem('mio_recent_orders') || '[]');
          const updated = [
            {
              orderNumber: 'pending',
              order_number: 'pending',
              total: grandTotal,
              total_amount: grandTotal,
              date: new Date().toISOString(),
              status: 'pending',
              recipient_name: recipientName,
            },
            ...stored
          ].slice(0, 5);
          localStorage.setItem('mio_recent_orders', JSON.stringify(updated));
        } catch {
          // Ignore
        }
        
        window.location.href = data.redirectUrl;
      } else {
        setErrorMessage(data.error || 'Acquisition authorization failed. Please try again.');
      }
    } catch {
      setErrorMessage('Failed to connect to MIO order processing server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#EAE6F4] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#2A2141]/50 font-mono">
              MIO Bespoke Acquisition
            </span>
            <h3 className="font-serif text-2xl font-normal text-[#2A2141]">
              {step === 'confirmed' ? 'Acquisition Confirmed' : 'Checkout & White Glove Dispatch'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#2A2141]/60 hover:text-[#2A2141] hover:bg-[#F9F8FC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress Indicator */}
        {step !== 'confirmed' && (
          <div className="bg-[#F1EEF9] px-6 py-2.5 flex items-center justify-between text-xs border-b border-[#EAE6F4]">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 'shipping' ? 'bg-[#2A2141] text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                1
              </span>
              <span className={`font-medium ${step === 'shipping' ? 'text-[#2A2141]' : 'text-[#2A2141]/60'}`}>
                Client & Destination
              </span>
            </div>

            <span className="text-[#2A2141]/30">———</span>

            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 'payment' ? 'bg-[#2A2141] text-white' : 'bg-[#EAE6F4] text-[#2A2141]/60'
                }`}
              >
                2
              </span>
              <span className={`font-medium ${step === 'payment' ? 'text-[#2A2141]' : 'text-[#2A2141]/60'}`}>
                Vault Authorization
              </span>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-[#D95D39] text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Shipping Details */}
          {step === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-base text-[#2A2141] mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#9B8EC7]" />
                  Destination & Client Dossier
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Private Telephone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Suite / Floor / Apartment
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7]"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method Options */}
              <div className="pt-4 border-t border-[#EAE6F4]">
                <h4 className="font-serif text-base text-[#2A2141] mb-3">
                  Select Delivery Courier Tier
                </h4>

                <div className="space-y-2">
                  {shippingMethods.map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedMethodId === m.id
                          ? 'border-[#9B8EC7] bg-[#F1EEF9]'
                          : 'border-[#EAE6F4] bg-white hover:border-[#9B8EC7]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          checked={selectedMethodId === m.id}
                          onChange={() => setSelectedMethodId(m.id)}
                          className="accent-[#2A2141]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#2A2141]">{m.name}</p>
                          <p className="text-[11px] text-[#2A2141]/70">{m.description}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-sm font-medium text-[#2A2141]">
                          {subtotal >= 250 ? (
                            <span className="text-emerald-700 font-sans text-xs">Complimentary</span>
                          ) : (
                            `$${Number(m.price).toFixed(2)}`
                          )}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="bg-[#2A2141] hover:bg-[#3D315B] text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-all shadow-md"
                >
                  <span>Continue to Vault Payment</span>
                  <ArrowRight className="w-4 h-4 text-[#9B8EC7]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment & Order Confirmation */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-base text-[#2A2141] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#9B8EC7]" />
                  MIO Vault Settlement
                </h4>

                <div className="bg-white p-5 rounded-2xl border border-[#EAE6F4] shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F4]">
                    <div className="flex items-center gap-2 text-[#2A2141] font-medium">
                      <Lock className="w-4 h-4 text-[#9B8EC7]" />
                      <span>256-Bit Encrypted Vault Protocol</span>
                    </div>
                    <span className="text-[10px] bg-[#F1EEF9] text-[#2A2141] px-2 py-0.5 rounded font-mono">
                      TEST SIMULATION
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                      Encrypted Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full p-2.5 bg-[#F9F8FC] border border-[#EAE6F4] rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        value={cardExp}
                        onChange={e => setCardExp(e.target.value)}
                        className="w-full p-2.5 bg-[#F9F8FC] border border-[#EAE6F4] rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                        Security Vault CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        className="w-full p-2.5 bg-[#F9F8FC] border border-[#EAE6F4] rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Recap */}
              <div className="bg-[#F1EEF9] p-5 rounded-2xl border border-[#EAE6F4] text-xs space-y-2">
                <h5 className="font-serif text-sm font-medium text-[#2A2141]">
                  Acquisition Statement ({items.length} silhouettes)
                </h5>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[#2A2141]/70">
                    <span>Atelier Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>

                  {isCouponApplied && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Privilege Code ({initialCouponCode})</span>
                      <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#2A2141]/70">
                    <span>{selectedMethod?.name || 'Shipping Method'}</span>
                    <span className="font-mono">
                      {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-serif font-medium text-[#2A2141] pt-2 border-t border-[#EAE6F4]">
                    <span>Settlement Amount</span>
                    <span className="font-mono">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="text-xs text-[#2A2141]/70 hover:text-[#2A2141] underline"
                >
                  ← Edit Destination
                </button>

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting}
                  className="bg-[#2A2141] hover:bg-[#3D315B] text-white px-8 py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#9B8EC7]" />
                  <span>{isSubmitting ? 'Recording in Supabase...' : `Authorize $${grandTotal.toFixed(2)}`}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmed View */}
          {step === 'confirmed' && confirmedOrder && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="font-serif text-2xl text-[#2A2141]">
                Acquisition Finalized
              </h4>

              <p className="text-xs text-[#2A2141]/70 max-w-md mx-auto leading-relaxed">
                Your order has been recorded into the live Supabase PostgreSQL database. Your pieces are now entering our white glove atelier packaging process.
              </p>

              <div className="bg-white p-5 rounded-2xl border border-[#EAE6F4] max-w-md mx-auto text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#2A2141]/60">Order Number:</span>
                  <strong className="text-[#2A2141]">{confirmedOrder.order_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2A2141]/60">Settlement Total:</span>
                  <span className="text-emerald-700 font-bold">${Number(confirmedOrder.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2A2141]/60">Fulfillment Status:</span>
                  <span className="text-[#9B8EC7] font-semibold uppercase">{confirmedOrder.status}</span>
                </div>
                {confirmedOrder.shipment?.tracking_number && (
                  <div className="flex justify-between pt-1 border-t border-[#EAE6F4]">
                    <span className="text-[#2A2141]/60">Tracking Courier:</span>
                    <span className="text-[#2A2141] font-bold">{confirmedOrder.shipment.tracking_number}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#2A2141] text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-[#3D315B] transition-colors"
                >
                  Return to Atelier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
