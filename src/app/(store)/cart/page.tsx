'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Minus, X, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { auth } from '@/lib/firebase/client';
import { ProductCard } from '@/components/product/ProductCard';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, clearCart, coupon, discount, applyCoupon, removeCoupon } = useCartStore();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCL]        = useState(false);

  const sub      = subtotal();
  const disc     = discount || 0;
  const shipping  = sub - disc >= 5000 ? 0 : 450;
  const orderTotal = sub - disc + shipping;

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!user) { toast.error('Please sign in to use coupons'); return; }
    setCL(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch('/api/admin/coupons', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ code:couponInput, subtotal:sub }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      applyCoupon(data.coupon, data.discount);
      toast.success(`${data.coupon.code} applied — ${formatPrice(data.discount)} off!`);
      setCouponInput('');
    } catch { toast.error('Failed to apply coupon'); }
    finally { setCL(false); }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16">
      <div className="mb-10 border-b border-border pb-8">
        <span className="section-eyebrow">Review your selection</span>
        <h1 className="section-title flex items-center gap-4">
          Your Bag
          {items.length > 0 && <span className="text-xl text-muted font-body font-light">({items.length} {items.length===1?'item':'items'})</span>}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <ShoppingBag size={64} className="text-border"/>
          <div>
            <h2 className="font-display text-3xl font-light mb-3">Your bag is empty</h2>
            <p className="text-muted text-sm max-w-xs">Discover our latest pieces and curate your wardrobe.</p>
          </div>
          <Link href="/shop" className="btn-primary mt-2">Explore the Edit <ArrowRight size={15}/></Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          {/* Items */}
          <div>
            <ul className="divide-y divide-border">
              {items.map(item => (
                <li key={item.sku} className="flex gap-5 py-7 first:pt-0">
                  <Link href={`/shop/${item.product.slug}`}
                    className="relative w-28 h-36 md:w-32 md:h-44 shrink-0 overflow-hidden bg-cream img-zoom">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="128px"/>
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-1">{item.product.categoryId}</p>
                        <Link href={`/shop/${item.product.slug}`} className="font-display text-lg md:text-xl font-light hover:text-gold transition-colors">
                          {item.product.name}
                        </Link>
                        <div className="flex gap-4 mt-2 text-[11px] text-muted tracking-wide">
                          <span>Size: <strong className="text-black font-medium">{item.size}</strong></span>
                          <span className="flex items-center gap-1.5">
                            Colour: <strong className="text-black font-medium flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full border border-border/50" style={{ background:item.colorHex }}/>
                              {item.color}
                            </strong>
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium">{formatPrice(item.price)}</p>
                      </div>
                      <button onClick={() => removeItem(item.sku)} className="text-muted hover:text-red-500 transition-colors h-fit shrink-0 p-1">
                        <X size={16}/>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border">
                        <button onClick={() => updateQty(item.sku, item.quantity-1)} className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors"><Minus size={13}/></button>
                        <span className="w-9 h-9 flex items-center justify-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.sku, item.quantity+1)} className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors"><Plus size={13}/></button>
                      </div>
                      <p className="font-display text-xl font-light">{formatPrice(item.price*item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-border">
              <Link href="/shop" className="btn-outline flex-1 justify-center">Continue Shopping</Link>
              <button onClick={clearCart} className="text-[11px] tracking-wider uppercase text-muted hover:text-red-500 transition-colors px-4">Clear Bag</button>
            </div>
          </div>

          {/* Summary */}
          <aside>
            <div className="border border-border p-6 md:p-8 sticky top-[88px]">
              <h2 className="font-display text-2xl font-light mb-6">Order Summary</h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
                  <input value={couponInput} onChange={e => setCouponInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleCoupon()}
                    type="text" placeholder="Promo or gift code"
                    className="input-field pl-9 py-2.5 text-xs uppercase" disabled={!!coupon}/>
                </div>
                {coupon ? (
                  <button onClick={removeCoupon} className="px-4 border border-red-300 text-[11px] uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors">Remove</button>
                ) : (
                  <button onClick={handleCoupon} disabled={couponLoading}
                    className="px-4 border border-black text-[11px] uppercase tracking-wider hover:bg-black hover:text-white transition-colors disabled:opacity-60">
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                )}
              </div>
              {coupon && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mb-5 flex items-center gap-2">
                  <Tag size={11}/> <strong>{coupon.code}</strong> — {formatPrice(disc)} saved
                </div>
              )}

              {/* Totals */}
              <div className="space-y-3 border-t border-border pt-5">
                <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{formatPrice(sub)}</span></div>
                {disc>0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−{formatPrice(disc)}</span></div>}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className={shipping===0?'text-green-600':''}>{shipping===0?'Free':formatPrice(shipping)}</span>
                </div>
                {shipping>0 && <p className="text-[11px] text-muted bg-cream px-3 py-2">Add {formatPrice(5000-(sub-disc))} more for free shipping</p>}
              </div>
              <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-border">
                <span className="text-[11px] tracking-[0.18em] uppercase font-medium">Total</span>
                <span className="font-display text-2xl">{formatPrice(orderTotal)}</span>
              </div>
              <p className="text-[10px] text-muted mt-1 text-right">Inclusive of all applicable taxes</p>

              {user ? (
                <Link href="/checkout" className="btn-primary w-full mt-6">Proceed to Checkout <ArrowRight size={15}/></Link>
              ) : (
                <div className="mt-6 space-y-3">
                  <Link href="/auth/login?callbackUrl=/checkout" className="btn-primary w-full">Sign In to Checkout</Link>
                  <Link href="/auth/register" className="btn-outline w-full text-center">Create Account</Link>
                  <p className="text-[11px] text-muted text-center">or <Link href="/checkout" className="underline">continue as guest</Link></p>
                </div>
              )}

              {/* Payment icons */}
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                {['Visa','MC','JazzCash','Easypaisa','COD'].map(p=>(
                  <span key={p} className="text-[9px] tracking-wider border border-border px-2 py-1 text-muted">{p}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
