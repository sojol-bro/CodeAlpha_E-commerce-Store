import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onRemoveItem: (productId: string) => void;
  onSelectProduct: (product: any) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#2A2141]/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#F9F8FC] shadow-2xl flex flex-col h-full border-l border-[#EAE6F4] text-left">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#EAE6F4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#9B8EC7] fill-[#9B8EC7]" />
            <h3 className="font-serif text-xl font-normal text-[#2A2141]">
              Saved Silhouettes
            </h3>
            <span className="text-xs bg-[#F1EEF9] text-[#2A2141] font-semibold px-2 py-0.5 rounded-full">
              {items.length}
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

        {/* Wishlist Items List */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#2A2141]/60">
              <div className="w-16 h-16 rounded-full bg-[#F1EEF9] flex items-center justify-center mb-4 text-[#9B8EC7]">
                <Heart className="w-8 h-8" />
              </div>
              <p className="font-serif text-lg text-[#2A2141] mb-1">No curations saved yet</p>
              <p className="text-xs max-w-xs mb-6">
                Tap the heart on any atelier creation to assemble your private capsule collection.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#2A2141] text-[#F9F8FC] px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-[#3D315B] transition-colors"
              >
                Explore Atelier
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id || item.product_id}
                className="flex gap-4 p-3.5 bg-white rounded-2xl border border-[#EAE6F4] shadow-xs relative"
              >
                <div className="w-20 h-24 rounded-xl bg-[#F3F1FA] overflow-hidden flex-shrink-0 border border-[#EAE6F4]">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#2A2141]/50">
                      {item.brand || 'MIO Atelier'}
                    </span>
                    <h4 className="font-serif text-sm font-medium text-[#2A2141] line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="font-serif text-sm font-semibold text-[#2A2141] mt-1">
                      ${Number(item.base_price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProduct(item);
                      }}
                      className="flex-grow bg-[#2A2141] hover:bg-[#3D315B] text-white py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3 text-[#9B8EC7]" />
                      <span>Inspect & Acquire</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product_id || item.id)}
                      className="p-1.5 text-[#2A2141]/40 hover:text-[#D95D39] transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
