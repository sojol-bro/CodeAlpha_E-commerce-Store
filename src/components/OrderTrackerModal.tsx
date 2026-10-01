import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

interface StoredOrderRef {
  orderNumber: string;
  total: number | string;
  date: string;
  status: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
}) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const [orderQuery, setOrderQuery] = useState(initialOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Return dossier state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('Sizing discrepancy');
  const [returnNote, setReturnNote] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Load recent orders from localStorage and user account
  useEffect(() => {
    const localSaved: StoredOrderRef[] = JSON.parse(localStorage.getItem('mio_recent_orders') || '[]');
    setUserOrders(localSaved);

    if (user?.id) {
      fetch(`/api/orders/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.orders && data.orders.length > 0) {
            setUserOrders(prev => {
              const combined = [...data.orders, ...prev];
              const unique = Array.from(new Map(combined.map(o => [o.order_number || o.orderNumber, o])).values());
              return unique;
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // If initialOrderNumber was passed, look it up automatically
  useEffect(() => {
    if (initialOrderNumber) {
      setOrderQuery(initialOrderNumber);
      handleLookup(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleLookup = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setSearchError('');
    setOrder(null);
    setShowReturnForm(false);
    setReturnSuccessMsg('');

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setSearchError(data.error || `No acquisition found matching "${q}". Please verify your order or tracking number.`);
      }
    } catch {
      setSearchError('Network error connecting to atelier order registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsSubmittingReturn(true);
    try {
      const res = await fetch('/api/orders/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason: returnReason,
          customerNote: returnNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReturnSuccessMsg('Return request successfully logged in Supabase. Our VIP concierge will contact you with an insured label.');
        setShowReturnForm(false);
        setReturnNote('');
      } else {
        setSearchError(data.error || 'Failed to file return.');
      }
    } catch {
      setSearchError('Failed to communicate with returns registry.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden my-8 text-left animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#EAE6F4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2A2141] text-[#9B8EC7] flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#2A2141]/50 font-mono">
                Atelier White Glove Fulfillment
              </span>
              <h3 className="font-serif text-2xl font-normal text-[#2A2141]">
                Track Acquisition
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#2A2141]/60 hover:text-[#2A2141] hover:bg-[#F9F8FC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Search Box */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/60 font-medium mb-1.5">
              Enter Order Reference, Tracking ID, or UUID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-[#9B8EC7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderQuery}
                  onChange={e => setOrderQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup(orderQuery)}
                  placeholder="e.g. MIO-2026-575044 or MIO-EXP-523610"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-[#EAE6F4] rounded-xl outline-none focus:border-[#9B8EC7] font-mono text-[#2A2141]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookup(orderQuery)}
                disabled={isLoading || !orderQuery.trim()}
                className="px-6 py-2.5 bg-[#2A2141] text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#3D315B] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? 'Querying...' : 'Trace'}
              </button>
            </div>
          </div>

          {/* Quick Select from Recent Orders if Available */}
          {userOrders.length > 0 && !order && (
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6F4]">
              <span className="text-[10px] uppercase tracking-wider text-[#2A2141]/60 font-semibold block mb-2">
                Your Recent Acquisitions
              </span>
              <div className="space-y-1.5">
                {userOrders.slice(0, 3).map((item, idx) => {
                  const num = item.order_number || item.orderNumber;
                  const amt = item.total_amount || item.total;
                  const status = item.status || 'confirmed';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOrderQuery(num);
                        handleLookup(num);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F9F8FC] border border-transparent hover:border-[#EAE6F4] transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-[#9B8EC7]" />
                        <div>
                          <p className="font-mono text-xs font-medium text-[#2A2141] group-hover:text-[#9B8EC7]">
                            {num}
                          </p>
                          <p className="text-[10px] text-[#2A2141]/50">
                            {item.recipient_name || 'Client Acquisition'} · ${Number(amt).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-[#F1EEF9] text-[#2A2141] px-2 py-0.5 rounded-full font-semibold">
                          {status}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#2A2141]/40 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seeded Sample Hint for New Visitors */}
          {userOrders.length === 0 && !order && (
            <div className="bg-[#F1EEF9]/60 p-3.5 rounded-2xl border border-[#EAE6F4] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2A2141]/70">
                <ShieldCheck className="w-4 h-4 text-[#9B8EC7] shrink-0" />
                <span>Sample luxury acquisition in database:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderQuery('MIO-2026-575044');
                  handleLookup('MIO-2026-575044');
                }}
                className="font-mono text-xs text-[#9B8EC7] font-semibold hover:underline bg-white px-2.5 py-1 rounded-lg border border-[#EAE6F4] cursor-pointer"
              >
                Trace MIO-2026-575044
              </button>
            </div>
          )}

          {searchError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-[#D95D39] text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {returnSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{returnSuccessMsg}</span>
            </div>
          )}

          {/* Display Order Details if Found */}
          {order && (
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-[#EAE6F4] shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAE6F4]">
                  <div>
                    <span className="text-[10px] text-[#2A2141]/60 uppercase tracking-widest font-mono">
                      Acquisition Reference
                    </span>
                    <h4 className="font-serif text-lg font-medium text-[#2A2141]">
                      {order.order_number}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F1EEF9] text-[#2A2141]">
                      {order.status}
                    </span>
                    <p className="text-[10px] text-[#2A2141]/50 font-mono mt-0.5">
                      {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>

                {/* Visual Step Progress */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-[#2A2141]">Confirmed</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shadow-xs ${
                      order.status !== 'pending' ? 'bg-emerald-600 text-white' : 'bg-[#9B8EC7] text-white'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-[#2A2141]">Packaging</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shadow-xs ${
                      order.status === 'shipped' || order.status === 'delivered'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#EAE6F4] text-[#2A2141]/40'
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-[#2A2141]">In Transit</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shadow-xs ${
                      order.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-[#EAE6F4] text-[#2A2141]/40'
                    }`}>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-[#2A2141]">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Shipment Tracking details */}
              {order.shipment && (
                <div className="bg-[#F1EEF9] p-4 rounded-2xl border border-[#EAE6F4] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-[#9B8EC7]" />
                    <div>
                      <p className="font-medium text-[#2A2141]">
                        Carrier: {order.shipment.carrier || 'MIO White Glove Express'}
                      </p>
                      <p className="text-[#2A2141]/70 font-mono text-[11px]">
                        Tracking ID: <span className="font-semibold text-[#2A2141]">{order.shipment.tracking_number}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white px-2.5 py-1 rounded-md font-mono text-[#2A2141] font-semibold uppercase border border-[#EAE6F4]">
                    {order.shipment.status || 'Active'}
                  </span>
                </div>
              )}

              {/* Delivery Destination */}
              {order.recipient_name && (
                <div className="bg-white p-4 rounded-2xl border border-[#EAE6F4] text-xs">
                  <span className="text-[10px] text-[#2A2141]/50 uppercase tracking-widest font-mono block mb-1">
                    White Glove Destination
                  </span>
                  <p className="font-medium text-[#2A2141]">{order.recipient_name}</p>
                  <p className="text-[#2A2141]/70">{order.city}{order.country ? `, ${order.country}` : ''}</p>
                </div>
              )}

              {/* Ordered Silhouettes */}
              <div className="bg-white p-5 rounded-2xl border border-[#EAE6F4] text-xs space-y-3">
                <h5 className="font-serif text-sm font-medium text-[#2A2141] pb-2 border-b border-[#EAE6F4]">
                  Acquired Silhouettes
                </h5>

                <div className="space-y-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-medium text-[#2A2141]">{item.product_name}</p>
                        <p className="text-[11px] text-[#2A2141]/60 font-mono">
                          {item.size || 'One Size'} · {item.color || 'Standard'} · Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="font-mono font-medium text-[#2A2141]">
                        ${Number(item.total_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#EAE6F4] flex justify-between font-serif text-sm font-medium text-[#2A2141]">
                  <span>Total Amount Paid</span>
                  <span className="font-mono font-bold">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Return dossier action */}
              <div className="pt-2">
                {!showReturnForm ? (
                  <button
                    type="button"
                    onClick={() => setShowReturnForm(true)}
                    className="inline-flex items-center gap-2 text-xs text-[#2A2141]/70 hover:text-[#D95D39] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Concierge Return or Exchange</span>
                  </button>
                ) : (
                  <form onSubmit={handleFileReturn} className="bg-white p-4 rounded-2xl border border-[#EAE6F4] space-y-3 text-xs">
                    <div className="flex items-center justify-between font-serif text-sm font-medium text-[#2A2141]">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#9B8EC7]" />
                        Concierge Return Dossier
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReturnForm(false)}
                        className="text-[#2A2141]/40 hover:text-[#2A2141] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#2A2141]/70 mb-1">
                        Reason for return *
                      </label>
                      <select
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        className="w-full p-2 bg-[#F9F8FC] border border-[#EAE6F4] rounded-lg outline-none"
                      >
                        <option value="Sizing discrepancy">Sizing discrepancy</option>
                        <option value="Aesthetic reconsideration">Aesthetic reconsideration</option>
                        <option value="Defect or patina variance">Defect or patina variance</option>
                        <option value="Gift exchange">Gift exchange</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#2A2141]/70 mb-1">
                        Additional remarks
                      </label>
                      <textarea
                        rows={2}
                        value={returnNote}
                        onChange={e => setReturnNote(e.target.value)}
                        placeholder="Provide details for our atelier intake specialists..."
                        className="w-full p-2 bg-[#F9F8FC] border border-[#EAE6F4] rounded-lg outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReturn}
                      className="bg-[#2A2141] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#3D315B] transition-colors cursor-pointer"
                    >
                      {isSubmittingReturn ? 'Submitting Dossier...' : 'Submit Return to Supabase'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
