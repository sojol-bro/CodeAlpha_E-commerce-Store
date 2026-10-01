import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Filter,
  PackageCheck,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Category, Product, CartItem, DatabaseStats, Order } from './types';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { AdminStudioModal } from './components/AdminStudioModal';
import { AddProductModal } from './components/AddProductModal';
import { CheckoutRoute } from './components/CheckoutRoute';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, profile } = useAuth();

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Modals & Drawers State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'admin'>('signin');
  const [checkoutCouponCode, setCheckoutCouponCode] = useState<string>('');
  const [trackedOrderNumber, setTrackedOrderNumber] = useState<string>('');

  // Cart & Wishlist State
  const [cartId, setCartId] = useState<string>(() => localStorage.getItem('mio_cart_id') || '');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  // Database Topography Stats
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Load Initial Categories and Database Topography Stats
  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/admin/database-stats');
      const data = await res.json();
      setDbStats(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchDbStats();

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});

    // Handle SSLCommerz redirects
    const params = new URLSearchParams(window.location.search);
    if (params.get('order_success')) {
      const orderNo = params.get('order_success');
      setTrackedOrderNumber(orderNo || '');
      setIsOrderTrackerOpen(true);
      showToast(`Order ${orderNo} payment successful!`);
      // clear the url without refreshing
      window.history.replaceState(null, '', window.location.pathname);
    } else if (params.get('payment') === 'failed') {
      showToast('Payment failed. Please try again.');
      window.history.replaceState(null, '', window.location.pathname);
    } else if (params.get('payment') === 'cancelled') {
      showToast('Payment was cancelled.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // 2. Load Products whenever category or search or sort changes
  useEffect(() => {
    setIsLoadingProducts(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.append('categoryId', selectedCategory);
    if (searchQuery) params.append('search', searchQuery);
    params.append('sort', sortOption);
    params.append('limit', '30');

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, [selectedCategory, searchQuery, sortOption]);

  // 3. Load or Initialize Cart
  const refreshCart = async (targetCartId?: string) => {
    const idToUse = targetCartId || cartId;
    const url = idToUse ? `/api/cart?cartId=${idToUse}` : '/api/cart';
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.cart) {
        setCartId(data.cart.id);
        localStorage.setItem('mio_cart_id', data.cart.id);
      }
      setCartItems(data.items || []);
      setCartSubtotal(data.subtotal || 0);
    } catch {
      // Cart fetch failure handled gracefully
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  // 4. Load Wishlist
  const refreshWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      if (data.items) {
        setWishlistItems(data.items);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, []);

  // Cart Handlers
  const handleAddToCart = async (variantId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, variantId, quantity }),
      });
      const data = await res.json();
      if (data.cart) {
        setCartId(data.cart.id);
        localStorage.setItem('mio_cart_id', data.cart.id);
      }
      setCartItems(data.items || []);
      setCartSubtotal(data.subtotal || 0);
      showToast('Item secured in your luxury shopping bag');
    } catch {
      showToast('Could not add item to bag');
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, quantity: newQuantity }),
      });
      const data = await res.json();
      setCartItems(data.items || []);
      setCartSubtotal(data.subtotal || 0);
    } catch {
      showToast('Could not update quantity');
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId }),
      });
      const data = await res.json();
      setCartItems(data.items || []);
      setCartSubtotal(data.subtotal || 0);
      showToast('Item removed from shopping bag');
    } catch {
      showToast('Could not remove item');
    }
  };

  // Wishlist Handlers
  const handleToggleWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.items) {
        setWishlistItems(data.items);
        if (data.action === 'added') {
          showToast('Added to your private capsule wishlist');
        } else {
          showToast('Removed from wishlist');
        }
      }
    } catch {
      showToast('Wishlist action failed');
    }
  };

  const isWishlisted = (productId: string) => {
    return wishlistItems.some(item => (item.product_id || item.id) === productId);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F9F8FC] text-[#2A2141] font-sans antialiased flex flex-col selection:bg-[#9B8EC7] selection:text-[#FFFFFF]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2A2141] text-[#F9F8FC] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-medium border border-[#9B8EC7]/30">
          <CheckCircle className="w-4 h-4 text-[#9B8EC7]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Luxury Navigation */}
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={catId => setSelectedCategory(catId)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        wishlistCount={wishlistItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setIsOrderTrackerOpen(true)}
        onOpenAdmin={() => {
          if (user?.email === 'sojolislam576@gmail.com' || profile?.role === 'admin') {
            setIsAdminOpen(true);
          } else {
            setAuthInitialMode('admin');
            setAuthModalMessage('Direct admin portal credentials required for /admin access.');
            setIsAuthOpen(true);
          }
        }}
        onOpenAddProduct={() => {
          if (user?.email === 'sojolislam576@gmail.com' || profile?.role === 'admin') {
            setIsAddProductOpen(true);
          } else {
            setAuthInitialMode('admin');
            setAuthModalMessage('Atelier Director credentials required to add items to catalog.');
            setIsAuthOpen(true);
          }
        }}
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setAuthModalMessage(undefined);
          setIsAuthOpen(true);
        }}
        dbStats={dbStats}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 w-full">
        {/* Editorial Hero Banner */}
        <HeroBanner
          categories={categories}
          onSelectCategory={catId => setSelectedCategory(catId)}
        />

        {/* Catalog Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4 border-t border-[#EAE6F4]">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-light text-[#2A2141]">
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name || 'Curated Works'
                : 'Current Silhouettes'}
            </h2>
            <span className="text-xs font-mono text-[#2A2141]/50 bg-white px-2.5 py-1 rounded-full border border-[#EAE6F4]">
              {products.length} works
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sorting Dropdown */}
            <div className="relative flex items-center bg-white border border-[#EAE6F4] rounded-xl px-3 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#9B8EC7] mr-2" />
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as any)}
                className="text-xs text-[#2A2141] bg-transparent outline-none cursor-pointer pr-4"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Ascending</option>
                <option value="price-desc">Price: Descending</option>
                <option value="rating">Collector Rating</option>
              </select>
            </div>

            {/* Clear filter button if active */}
            {(selectedCategory || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="text-xs text-[#D95D39] hover:underline font-medium cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {isLoadingProducts ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-[#9B8EC7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-serif text-base text-[#2A2141]">Curating atelier silhouettes...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-[#EAE6F4] p-12">
            <p className="font-serif text-xl text-[#2A2141] mb-2">No matching silhouettes found</p>
            <p className="text-xs text-[#2A2141]/60 max-w-sm mx-auto mb-6">
              Refine your search term or select another category from the MIO permanent archives.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="bg-[#2A2141] text-[#F9F8FC] px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-[#3D315B]"
            >
              View Full Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={handleToggleWishlist}
                onSelectProduct={setSelectedProduct}
                onQuickAddToCart={(variantId) => handleAddToCart(variantId, 1)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? isWishlisted(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={appliedCouponCode => {
          setIsCartOpen(false);
          setCheckoutCouponCode(appliedCouponCode || '');
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutRoute
        isOpen={isCheckoutOpen}
        onInterceptAuthRequired={(msg) => {
          setIsCheckoutOpen(false);
          setAuthModalMessage(msg || 'Please authenticate with Google to proceed with checkout.');
          setAuthInitialMode('signin');
          setIsAuthOpen(true);
        }}
      >
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartId={cartId}
          items={cartItems}
          subtotal={cartSubtotal}
          initialCouponCode={checkoutCouponCode}
          onOrderSuccess={order => {
            refreshCart();
            fetchDbStats();
            setTrackedOrderNumber(order.order_number);
          }}
        />
      </CheckoutRoute>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
        message={authModalMessage}
        onAdminRedirect={() => {
          setIsAuthOpen(false);
          setIsAdminOpen(true);
          showToast('Administrative privileges recognized. Accessing Operations Studio.');
        }}
      />

      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        initialOrderNumber={trackedOrderNumber}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemoveItem={handleToggleWishlist}
        onSelectProduct={setSelectedProduct}
      />

      <AdminStudioModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        dbStats={dbStats}
        onRefreshDbStats={fetchDbStats}
        onOpenAddProduct={() => {
          setIsAdminOpen(false);
          setIsAddProductOpen(true);
        }}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories}
        onProductCreated={newProduct => {
          setProducts(prev => [newProduct, ...prev]);
          fetchDbStats();
          showToast(`"${newProduct.title}" created with Supabase image.`);
        }}
      />

      {/* Atelier Footer */}
      <footer className="bg-[#2A2141] text-[#F9F8FC] border-t border-[#3D315B] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3D315B] border border-[#9B8EC7]/30 flex items-center justify-center text-[#9B8EC7]">
                  <span className="font-serif font-semibold text-base text-[#F9F8FC]">M</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif tracking-[0.2em] text-xl font-normal text-[#F9F8FC] leading-none">
                    MIO
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.25em] text-[#F9F8FC]/60 font-sans mt-1 font-medium leading-none">
                    Atelier &amp; Curation
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#F9F8FC]/70 font-light leading-relaxed max-w-xs">
                Permanent silhouettes, pure materials, and bespoke craftsmanship. Delivered globally with white-glove provenance.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-[#9B8EC7]">
                <ShieldCheck className="w-4 h-4" />
                <span>Supabase PostgreSQL Architecture</span>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <p className="font-semibold text-white uppercase tracking-wider text-[11px]">
                Atelier Houses
              </p>
              <p className="text-white/70 hover:text-white cursor-pointer" onClick={() => setSelectedCategory(null)}>All Works</p>
              {categories.map(c => (
                <p
                  key={c.id}
                  className="text-white/70 hover:text-white cursor-pointer"
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </p>
              ))}
            </div>

            <div className="text-xs space-y-2">
              <p className="font-semibold text-white uppercase tracking-wider text-[11px]">
                Client Services
              </p>
              <p className="text-white/70 hover:text-white cursor-pointer" onClick={() => setIsOrderTrackerOpen(true)}>
                Track Order & Shipments
              </p>
              <p className="text-white/70 hover:text-white cursor-pointer" onClick={() => setIsWishlistOpen(true)}>
                Private Capsule Wishlist
              </p>
              <p className="text-white/70 hover:text-white cursor-pointer" onClick={() => setIsCartOpen(true)}>
                Shopping Bag Inspection
              </p>
              <p
                className="text-white/70 hover:text-white cursor-pointer"
                onClick={() => {
                  if (user?.email === 'sojolislam576@gmail.com' || profile?.role === 'admin') {
                    setIsAdminOpen(true);
                  } else {
                    setAuthInitialMode('admin');
                    setAuthModalMessage('Atelier Director credentials required to enter Operations Studio.');
                    setIsAuthOpen(true);
                  }
                }}
              >
                Curator &amp; Operations Studio
              </p>
            </div>

            <div className="text-xs space-y-3">
              <p className="font-semibold text-white uppercase tracking-wider text-[11px]">
                Topography & Architecture
              </p>
              <p className="text-white/70 font-mono text-[11px]">
                PostgreSQL Engine: Supabase Cloud
              </p>
              <p className="text-white/70 font-mono text-[11px]">
                Active Tables: 22 Models Verified
              </p>
              <button
                type="button"
                onClick={() => {
                  if (user?.email === 'sojolislam576@gmail.com' || profile?.role === 'admin') {
                    setIsAdminOpen(true);
                  } else {
                    setAuthInitialMode('admin');
                    setAuthModalMessage('Atelier Director credentials required to enter Operations Studio.');
                    setIsAuthOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-[#9B8EC7] text-[#2A2141] font-semibold px-4 py-2 rounded-xl text-xs hover:bg-white transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Open Operations Studio</span>
              </button>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50">
            <div>
              © 2026 MIO Atelier Inc. Handcrafted with bespoke precision.
            </div>
            <div className="flex items-center gap-4 mt-3 sm:mt-0 font-mono text-[10px]">
              <span>Background: #F9F8FC</span>
              <span>Typography: #2A2141</span>
              <span>Accents: #9B8EC7</span>
              <span>Alerts: #D95D39</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
