import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Category } from '../types';

interface HeroBannerProps {
  categories: Category[];
  onSelectCategory: (id: string | null) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ categories, onSelectCategory }) => {
  return (
    <section className="relative overflow-hidden mb-12">
      {/* Editorial Hero Frame */}
      <div className="bg-gradient-to-br from-[#2A2141] via-[#352B52] to-[#221A36] text-[#F9F8FC] rounded-3xl p-8 sm:p-12 lg:p-16 relative shadow-xl overflow-hidden border border-[#9B8EC7]/20">
        {/* Subtle geometric luxury background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9B8EC7]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#D95D39]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#9B8EC7] text-xs uppercase tracking-[0.2em] font-medium mb-6 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            Autumn / Winter Edition 2026
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.15] text-[#F9F8FC] mb-6">
            Objects of <br />
            <span className="italic font-normal text-[#9B8EC7]">Permanent Elegance</span>
          </h1>

          <p className="text-sm sm:text-base text-[#F9F8FC]/80 leading-relaxed font-light mb-8 max-w-xl">
            A curated sanctuary of artisanal leather, solid 18k gold silhouettes, pure Inner Mongolian cashmere, and rare botanical parfums—engineered directly for the discerning collector.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-2 bg-[#9B8EC7] hover:bg-[#8875B7] text-[#2A2141] hover:text-[#FFFFFF] px-6 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-all shadow-md group cursor-pointer"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-xs text-white/60 tracking-wider">
              Protected by <strong className="text-white">MIO Vault™</strong>
            </div>
          </div>
        </div>

        {/* Feature Highlights Strip in Hero */}
        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#F9F8FC]/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#9B8EC7]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-white">White Glove Express</p>
              <p className="text-[11px] text-white/60">Complimentary over $250</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#9B8EC7]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-white">Provenance Authenticity</p>
              <p className="text-[11px] text-white/60">Verified Atelier serial numbers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#9B8EC7]">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-white">30-Day Atelier Return</p>
              <p className="text-[11px] text-white/60">Effortless concierge returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-white border border-[#EAE6F4] text-xs font-medium text-[#2A2141] hover:border-[#9B8EC7] transition-colors shadow-sm"
        >
          ✦ All Curated Works
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-white border border-[#EAE6F4] text-xs font-medium text-[#2A2141] hover:border-[#9B8EC7] transition-colors shadow-sm flex items-center gap-2"
          >
            <span>{cat.name}</span>
            {cat.product_count !== undefined && (
              <span className="text-[10px] text-[#2A2141]/50 bg-[#F9F8FC] px-1.5 py-0.5 rounded-full">
                {cat.product_count}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
