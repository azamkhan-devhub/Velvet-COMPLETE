'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { Product } from '@/types';
import { formatPrice, getDiscount } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props { product: Product; priority?: boolean; }

export function ProductCard({ product, priority }: Props) {
  const [hovered, setHovered]     = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const { toggle, has }           = useWishlistStore();
  const addItem                   = useCartStore(s => s.addItem);
  const wishlisted                = has(product.id);
  const discount                  = getDiscount(product.price, product.comparePrice);

  const firstVariant  = product.variants?.[0];
  const availSizes    = [...new Set(product.variants?.map(v => v.size) || [])];
  const defaultColor  = firstVariant?.color || '';
  const defaultHex    = firstVariant?.colorHex || '#000';
  const colors        = product.variants ? [...new Map(product.variants.map(v => [v.color, v])).values()] : [];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedSize && availSizes.length > 0) { toast.error('Please select a size'); return; }
    const size = selectedSize || availSizes[0] || 'One Size';
    const variant = product.variants?.find(v => v.size === size) || firstVariant;
    if (!variant) return;
    addItem(product, variant.id, size, variant.color, variant.colorHex, variant.sku, product.price + (variant.priceAdjustment || 0));
    toast.success(`${product.name} added to bag`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product.id);
    toast(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wishlisted ? '💔' : '❤️' });
  };

  return (
    <article className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setSelectedSize(''); }}>
      <Link href={`/shop/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-cream">
        <Image src={product.images[0]} alt={product.name} fill priority={priority}
          className={`object-cover transition-all duration-700 ${hovered && product.images[1] ? 'opacity-0' : 'opacity-100'} group-hover:scale-105`}
          sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
        {product.images[1] && (
          <Image src={product.images[1]} alt={product.name + ' alt'} fill
            className={`object-cover transition-all duration-700 group-hover:scale-105 ${hovered ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNew        && <span className="badge-new">New</span>}
          {discount > 0         && <span className="badge-sale">−{discount}%</span>}
          {product.isBestSeller && !product.isNew && <span className="badge bg-white/90 text-black border border-border">Bestseller</span>}
        </div>
        {/* Wishlist */}
        <button onClick={handleWishlist}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-all duration-200 hover:bg-white ${hovered ? 'opacity-100' : 'opacity-0 -translate-y-1'}`}>
          <Heart size={14} className={wishlisted ? 'fill-red-400 text-red-400' : 'text-black'} />
        </button>
        {/* Quick add */}
        <div className={`absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm px-3 py-3 transition-all duration-300 ${hovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          {availSizes.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {availSizes.map(s => (
                <button key={s} onClick={e => { e.preventDefault(); setSelectedSize(s === selectedSize ? '' : s); }}
                  className={`text-[10px] tracking-wider border px-2 py-1 transition-colors ${selectedSize === s ? 'bg-black text-white border-black' : 'border-border hover:border-black'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <button onClick={handleAdd}
            className="w-full bg-black text-white text-[10px] tracking-[0.15em] uppercase py-2.5 hover:bg-gold hover:text-black transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={12} />{selectedSize || availSizes.length === 0 ? 'Add to Bag' : 'Select Size'}
          </button>
        </div>
      </Link>

      <div className="pt-3.5 space-y-1">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted">{product.categoryId}</p>
        <Link href={`/shop/${product.slug}`} className="font-display text-base font-light hover:text-gold transition-colors line-clamp-1">{product.name}</Link>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className={i < Math.floor(product.ratings?.avg || 0) ? 'fill-gold text-gold' : 'fill-border text-border'} />
            ))}
          </div>
          <span className="text-[10px] text-muted">({product.ratings?.count || 0})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{formatPrice(product.price)}</span>
          {product.comparePrice && <span className="text-xs text-muted line-through">{formatPrice(product.comparePrice)}</span>}
        </div>
        {colors.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {colors.map(v => (
              <span key={v.color} title={v.color}
                className="w-3.5 h-3.5 rounded-full border border-border/50 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: v.colorHex }} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
