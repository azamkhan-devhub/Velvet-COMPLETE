'use client';
import { useState } from 'react';
import { Heart, ShoppingBag, Ruler } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ProductActions({ product }: { product: Product }) {
  const uniqueSizes  = [...new Set(product.variants?.map(v => v.size) || [])];
  const uniqueColors = [...new Map(product.variants?.map(v => [v.color, v])).values()];

  const [selSize,    setSelSize]    = useState('');
  const [selColor,   setSelColor]   = useState(uniqueColors[0]?.color || '');
  const [sizeGuide,  setSizeGuide]  = useState(false);

  const addItem                        = useCartStore(s => s.addItem);
  const { toggle, has }               = useWishlistStore();
  const wishlisted                     = has(product.id);

  // Find the specific variant for selected size + color
  const selectedVariant = product.variants?.find(v => v.size === selSize && v.color === selColor);
  const currentColor    = uniqueColors.find(v => v.color === selColor);
  const availSizes      = uniqueColors.find(v => v.color === selColor)
    ? product.variants?.filter(v => v.color === selColor).map(v => v.size)
    : uniqueSizes;

  const finalPrice = product.price + (selectedVariant?.priceAdjustment || 0);
  const stockForVariant = selectedVariant ? (product.inventory?.[selectedVariant.sku] ?? selectedVariant.stock ?? 0) : null;

  const handleAdd = () => {
    if (!selSize) { toast.error('Please select a size', { icon:'📏' }); return; }
    if (!selectedVariant) { toast.error('Please select a valid combination'); return; }
    if (stockForVariant !== null && stockForVariant < 1) { toast.error('This variant is out of stock'); return; }
    addItem(product, selectedVariant.id, selSize, selColor, currentColor?.colorHex||'#000', selectedVariant.sku, finalPrice);
    toast.success(`${product.name} added to your bag!`);
  };

  const handleWishlist = () => {
    toggle(product.id);
    toast(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wishlisted ? '💔' : '❤️' });
  };

  return (
    <div className="space-y-6">
      {/* Color selector */}
      {uniqueColors.length > 0 && (
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase font-medium mb-3">
            Colour — <span className="text-muted font-normal">{selColor}</span>
          </p>
          <div className="flex gap-3">
            {uniqueColors.map(v => (
              <button key={v.color} onClick={() => { setSelColor(v.color); setSelSize(''); }}
                title={v.color}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${selColor===v.color?'border-black scale-110 shadow-md':'border-border/50 hover:border-black/50 hover:scale-105'}`}
                style={{ background: v.colorHex }}
                aria-pressed={selColor===v.color}/>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {uniqueSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-[0.18em] uppercase font-medium">
              Size {selSize && <span className="text-muted font-normal">— {selSize}</span>}
            </p>
            <button onClick={() => setSizeGuide(!sizeGuide)}
              className="flex items-center gap-1.5 text-[10px] tracking-wider text-muted hover:text-black transition-colors uppercase">
              <Ruler size={11}/> Size Guide
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {uniqueSizes.map(size => {
              const v = product.variants?.find(v => v.size===size && v.color===selColor);
              const stock = v ? (product.inventory?.[v.sku] ?? v.stock ?? 0) : 0;
              const oos = selColor ? stock < 1 : false;
              return (
                <button key={size}
                  onClick={() => !oos && setSelSize(size)}
                  disabled={oos}
                  className={`text-[11px] tracking-wider border px-4 py-2.5 transition-all ${oos?'border-border text-muted cursor-not-allowed opacity-40 line-through':selSize===size?'bg-black text-white border-black':'border-border hover:border-black'}`}
                  aria-pressed={selSize===size}
                  aria-label={`Size ${size}${oos?' — out of stock':''}`}>
                  {size}
                </button>
              );
            })}
          </div>

          {/* Size guide */}
          {sizeGuide && (
            <div className="mt-4 border border-border p-4 bg-cream text-xs">
              <p className="font-medium mb-3 text-[11px] tracking-wider uppercase">Size Guide (cm)</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Size','Bust','Waist','Hips'].map(h => <th key={h} className="text-left pb-2 text-muted font-normal tracking-wider pr-4">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[['XS','80–84','62–66','88–92'],['S','84–88','66–70','92–96'],['M','88–93','70–75','96–101'],['L','93–98','75–80','101–106'],['XL','98–104','80–86','106–112'],['XXL','104–110','86–92','112–118']].map(([s,b,w,h]) => (
                    <tr key={s} className={selSize===s ? 'bg-gold/10' : ''}>
                      <td className="py-2 font-medium pr-4">{s}</td>
                      <td className="py-2 text-muted pr-4">{b}</td>
                      <td className="py-2 text-muted pr-4">{w}</td>
                      <td className="py-2 text-muted">{h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Price change for variant */}
      {selectedVariant?.priceAdjustment !== 0 && selectedVariant?.priceAdjustment && (
        <p className="text-sm text-muted">
          Price for selected size: <span className="text-black font-medium">{formatPrice(finalPrice)}</span>
        </p>
      )}

      {/* Low stock warning */}
      {stockForVariant !== null && stockForVariant > 0 && stockForVariant <= 5 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
          ⚡ Only {stockForVariant} left in this size — order soon
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 pt-1">
        <button onClick={handleAdd}
          className="btn-primary w-full py-4 text-[12px] tracking-[0.2em]">
          <ShoppingBag size={16}/>
          {selSize ? 'Add to Bag' : uniqueSizes.length > 0 ? 'Select a Size' : 'Add to Bag'}
        </button>
        <button onClick={handleWishlist}
          className={`btn-outline w-full py-4 text-[12px] tracking-[0.2em] gap-2 ${wishlisted?'bg-black text-white':''}`}>
          <Heart size={16} className={wishlisted?'fill-white':''}/>
          {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
        </button>
      </div>
    </div>
  );
}
