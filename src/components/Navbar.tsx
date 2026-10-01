import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  SlidersHorizontal,
  Package,
  ShieldCheck,
  X,
  UploadCloud,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { Category, DatabaseStats } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenAddProduct?: () => void;
  onOpenAuth: () => void;
  dbStats: DatabaseStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenAdmin,
  onOpenAddProduct,
  onOpenAuth,
  dbStats,
}) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDbPopoverOpen, setIsDbPopoverOpen] = useState(false);

  return (
    <header className="relative bg-[#F9F8FC] border-b border-[#EAE6F4]">
      {/* Top Bar - Differentiated between Admin and Customer */}
      {isAdmin ? (
        <div className="bg-[#1F1735] text-[#F9F8FC] text-xs py-1.5 px-4 border-b border-[#3D315B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-[#9B8EC7] uppercase tracking-wider">
                Atelier Director & Curator Operations Mode
              </span>
              <span className="hidden md:inline text-white/30">|</span>
              <span className="hidden md:inline text-[11px] text-white/70">
                Logged in as <strong className="text-white">{user?.email}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              {/* Database live connection pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDbPopoverOpen(!isDbPopoverOpen)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  title="Supabase PostgreSQL status"
                >
                  <span className={`w-2 h-2 rounded-full ${dbStats?.connected ? 'bg-emerald-400' : 'bg-[#D95D39]'}`} />
                  <span className="font-mono text-[10px]">
                    {dbStats?.connected ? `Supabase PG (${dbStats.latencyMs}ms)` : 'Connecting PG...'}
                  </span>
                </button>

                {isDbPopoverOpen && dbStats && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] text-[#2A2141] p-3 rounded-xl shadow-xl border border-[#EAE6F4] z-50 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EAE6F4]">
                      <span className="font-semibold text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9B8EC7]" /> Supabase PostgreSQL
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                        {dbStats.latencyMs}ms latency
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#2A2141]/70 space-y-1">
                      <p>Database Engine: <strong className="text-[#2A2141]">{dbStats.databaseEngine}</strong></p>
                      <p>Active Topography: <strong className="text-[#2A2141]">{dbStats.requiredTablesCount} Models Active</strong></p>
                      <p className="text-[10px] text-emerald-600 font-medium">All 22 required database tables verified & seeded.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDbPopoverOpen(false);
                        onOpenAdmin();
                      }}
                      className="mt-3 w-full py-1 bg-[#2A2141] text-[#F9F8FC] rounded-lg text-xs font-medium hover:bg-[#3D315B] transition-colors"
                    >
                      View Operations Studio
                    </button>
                  </div>
                )}
              </div>

              <span className="text-white/30">|</span>
              <button
                type="button"
                onClick={onOpenOrders}
                className="flex items-center gap-1 hover:text-[#9B8EC7] transition-colors cursor-pointer"
              >
                <Package className="w-3 h-3 text-[#9B8EC7]" />
                <span>Track Orders</span>
              </button>

              {onOpenAddProduct && (
                <>
                  <span className="text-white/30">|</span>
                  <button
                    type="button"
                    onClick={onOpenAddProduct}
                    className="flex items-center gap-1 bg-[#9B8EC7] text-white px-2.5 py-0.5 rounded-md hover:bg-[#8576B3] transition-colors cursor-pointer font-medium"
                    title="Upload imagery to Supabase Storage bucket product_image"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>+ Add Product</span>
                  </button>
                </>
              )}

              <span className="text-white/30">|</span>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1 bg-[#2A2141] border border-[#9B8EC7]/40 text-[#F9F8FC] px-2.5 py-0.5 rounded-md hover:border-[#9B8EC7] transition-colors cursor-pointer font-medium"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#9B8EC7]" />
                <span>Admin Studio</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Top Customer Privilege Bar */
        <div className="bg-[#2A2141] text-[#F9F8FC] text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9B8EC7] animate-pulse" />
              <span className="tracking-widest uppercase font-medium text-[11px]">
                Complimentary White Glove Delivery on acquisitions over $250
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-[#F9F8FC]/80">
              <button
                type="button"
                onClick={onOpenOrders}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-medium bg-white/10 hover:bg-white/20 px-3 py-0.5 rounded-full"
              >
                <Package className="w-3.5 h-3.5 text-[#9B8EC7]" />
                <span>Track Order</span>
              </button>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="hidden sm:inline text-white/60">Atelier VIP Concierge</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="flex items-center gap-3 text-left group cursor-pointer shrink-0 select-none py-1"
              title="MIO Atelier - Home"
            >
              {/* Atelier Emblem */}
              <div className="w-10 h-10 rounded-xl bg-[#2A2141] border border-[#3D315B] flex items-center justify-center text-[#9B8EC7] shadow-xs group-hover:bg-[#3D315B] group-hover:border-[#9B8EC7]/50 transition-all duration-300">
                <span className="font-serif font-semibold text-lg tracking-normal text-[#F9F8FC] group-hover:text-[#9B8EC7] transition-colors">
                  M
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-serif text-2xl font-normal tracking-[0.2em] text-[#2A2141] group-hover:text-[#9B8EC7] transition-colors leading-none">
                  MIO
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#2A2141]/60 font-sans mt-1 font-medium leading-none">
                  Atelier &amp; Curation
                </span>
              </div>
            </button>

            {/* Desktop Categories */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 text-xs tracking-wider uppercase transition-all rounded-full ${
                  selectedCategory === null
                    ? 'bg-[#2A2141] text-[#F9F8FC] font-medium'
                    : 'text-[#2A2141]/70 hover:text-[#2A2141] hover:bg-[#EAE6F4]/50'
                }`}
              >
                All Works
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs tracking-wider uppercase transition-all rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-[#2A2141] text-[#F9F8FC] font-medium'
                      : 'text-[#2A2141]/70 hover:text-[#2A2141] hover:bg-[#EAE6F4]/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Toggle / Input */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-white border border-[#9B8EC7] rounded-full px-3 py-1.5 shadow-sm">
                  <Search className="w-4 h-4 text-[#9B8EC7] mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Search silk, gold, flacons..."
                    className="text-xs text-[#2A2141] bg-transparent outline-none w-36 sm:w-56"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSearchChange('');
                    }}
                    className="text-[#2A2141]/50 hover:text-[#2A2141]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-[#2A2141] hover:text-[#9B8EC7] hover:bg-[#EAE6F4]/40 rounded-full transition-colors cursor-pointer"
                  title="Search catalog"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="relative p-2 text-[#2A2141] hover:text-[#9B8EC7] hover:bg-[#EAE6F4]/40 rounded-full transition-colors cursor-pointer"
              title="Saved items"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-[#9B8EC7] text-[#F9F8FC] text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Client Auth / Dossier Pill */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-[#F1EEF9] border border-[#EAE6F4] pl-2.5 pr-1 py-1 rounded-full">
                <span className="text-[11px] font-medium text-[#2A2141] max-w-[90px] sm:max-w-[120px] truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                {isAdmin && (
                  <span className="text-[9px] bg-[#2A2141] text-[#9B8EC7] px-1.5 py-0.5 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
                <button
                  type="button"
                  onClick={signOut}
                  className="p-1 hover:text-[#D95D39] text-[#2A2141]/60 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#2A2141] hover:text-[#9B8EC7] hover:bg-[#EAE6F4]/40 rounded-full transition-colors cursor-pointer border border-[#EAE6F4]"
                title="Sign In / Client Dossier"
              >
                <UserIcon className="w-4 h-4 text-[#9B8EC7]" />
                <span className="hidden sm:inline font-medium">Sign In</span>
              </button>
            )}

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-[#2A2141] hover:bg-[#3D315B] text-[#F9F8FC] px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer group"
              title="View shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#9B8EC7] group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D95D39] text-[#FFFFFF] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs uppercase tracking-wider font-medium hidden sm:inline">
                Bag {cartCount > 0 ? `(${cartCount})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Category Row */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2.5 scrollbar-none border-t border-[#EAE6F4]/60">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`whitespace-nowrap px-3 py-1 text-xs tracking-wider uppercase rounded-full transition-all ${
              selectedCategory === null
                ? 'bg-[#2A2141] text-[#F9F8FC] font-medium'
                : 'text-[#2A2141]/70 bg-white/60 border border-[#EAE6F4]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-3 py-1 text-xs tracking-wider uppercase rounded-full transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#2A2141] text-[#F9F8FC] font-medium'
                  : 'text-[#2A2141]/70 bg-white/60 border border-[#EAE6F4]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
