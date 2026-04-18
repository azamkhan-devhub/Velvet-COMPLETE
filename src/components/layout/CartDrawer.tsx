'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, itemCount, coupon, discount } = useCartStore();
  const sub = subtotal();
  const shipping = sub >= 5000 ? 0 : 450;
  const total = sub - discount + shipping;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart} />
      <aside className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-400 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} />
            <span className="font-display text-xl font-light">Your Bag</span>
            {itemCount() > 0 && <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">{itemCount()}</span>}
          </div>
          <button onClick={closeCart} className="p-1 hover:text-gold transition-colors"><X size={20} /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <ShoppingBag size={48} className="text-border" />
              <div>
                <p className="font-display text-2xl font-light mb-2">Your bag is empty</p>
                <p className="text-sm text-muted">Discover our latest pieces.</p>
              </div>
              <button onClick={closeCart} className="btn-outline">Continue Shopping</button>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map(item => (
                <li key={item.sku} className="flex gap-4 pb-5 border-b border-border last:border-0">
                  <Link href={`/shop/${item.product.slug}`} onClick={closeCart}
                    className="relative w-24 h-32 shrink-0 overflow-hidden bg-cream">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="96px" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.product.slug}`} onClick={closeCart}
                      className="font-display text-base font-light hover:text-gold transition-colors line-clamp-2">
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex gap-3 text-[11px] text-muted">
                      <span>Size: {item.size}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-border/50" style={{ background: item.colorHex }} />
                        {item.color}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button onClick={() => updateQty(item.sku, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors"><Minus size={12} /></button>
                        <span className="w-8 h-8 flex items-center justify-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.sku, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeItem(item.sku)} className="text-[11px] tracking-wider text-muted hover:text-red-500 transition-colors uppercase">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-6 space-y-4">
            {coupon && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2">
                <Tag size={12} /> Coupon <strong>{coupon.code}</strong> applied — {formatPrice(discount)} off
              </div>
            )}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(sub)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between font-medium pt-2 border-t border-border text-base">
                <span>Total</span><span className="font-display text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn-primary w-full">
              Checkout <ArrowRight size={15} />
            </Link>
            <Link href="/cart" onClick={closeCart} className="block text-center text-[11px] tracking-wider uppercase text-muted hover:text-black transition-colors py-1">
              View Full Bag
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
