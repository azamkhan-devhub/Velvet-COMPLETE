'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronRight, CreditCard, Smartphone, Truck, Lock, Tag, Loader } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPrice, addressSchema } from '@/lib/utils';
import { auth } from '@/lib/firebase/client';
import toast from 'react-hot-toast';
import { z } from 'zod';

type AddrData = z.infer<typeof addressSchema>;

const PAYMENT_METHODS = [
  { id:'stripe',    label:'Credit / Debit Card',    icon:CreditCard,  desc:'Visa, Mastercard, all major cards — powered by Stripe' },
  { id:'jazzcash',  label:'JazzCash',               icon:Smartphone,  desc:'Pay with your JazzCash mobile wallet' },
  { id:'easypaisa', label:'Easypaisa',              icon:Smartphone,  desc:'Pay with your Easypaisa mobile wallet' },
  { id:'cod',       label:'Cash on Delivery',       icon:Truck,       desc:'Pay in cash when your order arrives (PKR 150 fee)' },
];

const STEPS = ['Delivery','Payment','Review'];

export default function CheckoutPage() {
  const router    = useRouter();
  const { user, appUser } = useAuth();
  const { items, subtotal, discount, coupon, clearCart } = useCartStore();

  const [step,       setStep]       = useState(0);
  const [payment,    setPayment]    = useState('stripe');
  const [placing,    setPlacing]    = useState(false);
  const [couponInput,setCouponInput]= useState('');
  const [couponLoading,setCL]       = useState(false);

  const sub      = subtotal();
  const disc     = discount || 0;
  const codFee   = payment === 'cod' ? 150 : 0;
  const shipping  = sub - disc >= 5000 ? 0 : 450;
  const total    = sub - disc + shipping + codFee;

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<AddrData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: appUser?.displayName?.split(' ')[0] || '',
      lastName:  appUser?.displayName?.split(' ').slice(1).join(' ') || '',
      phone:     appUser?.phone || '',
      country:   'Pakistan',
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-light mb-4">Please sign in to checkout</p>
          <Link href="/auth/login?callbackUrl=/checkout" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-light mb-4">Your bag is empty</p>
          <Link href="/shop" className="btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCL(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch('/api/admin/coupons', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ code: couponInput, subtotal: sub }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      useCartStore.getState().applyCoupon(data.coupon, data.discount);
      toast.success(`${data.coupon.code} applied — ${formatPrice(data.discount)} off!`);
    } catch { toast.error('Failed to apply coupon'); }
    finally { setCL(false); }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const addr = getValues();
      const token = await auth.currentUser!.getIdToken();
      const orderItems = items.map(item => ({
        productId:    item.productId,
        productName:  item.product.name,
        productImage: item.product.images[0],
        productSlug:  item.product.slug,
        variantId:    item.variantId,
        size:         item.size,
        color:        item.color,
        colorHex:     item.colorHex,
        sku:          item.sku,
        price:        item.price,
        quantity:     item.quantity,
        subtotal:     item.price * item.quantity,
      }));

      const res = await fetch('/api/orders', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({
          items: orderItems, shippingAddress: addr,
          payment: { method: payment },
          subtotal: sub, discount: disc, shippingCost: shipping, tax: 0,
          total, currency:'PKR', couponCode: coupon?.code || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Order failed'); setPlacing(false); return; }

      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
    } catch (err: any) { toast.error(err.message || 'Order failed'); setPlacing(false); }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10">
      <div className="grid lg:grid-cols-[1fr_400px] gap-12 xl:gap-20">
        {/* LEFT */}
        <div>
          <Link href="/" className="font-display text-2xl font-semibold tracking-[0.22em] uppercase block mb-10">Velvet</Link>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase transition-colors ${i===step?'text-black font-medium':i<step?'text-gold cursor-pointer':'text-muted'}`}>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${i===step?'border-black bg-black text-white':i<step?'border-gold bg-gold text-black':'border-border text-muted'}`}>
                    {i<step?<Check size={10}/>:i+1}
                  </span>
                  {s}
                </button>
                {i<STEPS.length-1 && <ChevronRight size={12} className="text-border"/>}
              </div>
            ))}
          </div>

          {/* STEP 0 — Delivery */}
          {step===0 && (
            <div className="space-y-5 page-enter">
              <h2 className="font-display text-2xl font-light">Delivery Information</h2>
              <form onSubmit={handleSubmit(()=>setStep(1))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">First Name *</label>
                    <input {...register('firstName')} className={`input-field ${errors.firstName?'border-red-400':''}`} placeholder="Fatima" />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Last Name *</label>
                    <input {...register('lastName')} className={`input-field ${errors.lastName?'border-red-400':''}`} placeholder="Khan" />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Phone Number *</label>
                  <input {...register('phone')} className={`input-field ${errors.phone?'border-red-400':''}`} placeholder="+92 300 0000000" type="tel" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Street Address *</label>
                  <input {...register('address')} className={`input-field ${errors.address?'border-red-400':''}`} placeholder="House 12, Street 4, DHA Phase 6" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">City *</label>
                    <input {...register('city')} className={`input-field ${errors.city?'border-red-400':''}`} placeholder="Karachi" />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Province *</label>
                    <select {...register('province')} className={`input-field ${errors.province?'border-red-400':''}`}>
                      <option value="">Select…</option>
                      {['Sindh','Punjab','KPK','Balochistan','Islamabad (ICT)','AJK','GB'].map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Postal Code</label>
                    <input {...register('zip')} className="input-field" placeholder="75500" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Country</label>
                    <select {...register('country')} className="input-field">
                      {['Pakistan','United Kingdom','United States','UAE','Canada','Australia'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full mt-4 py-4">
                  Continue to Payment <ChevronRight size={15}/>
                </button>
              </form>
            </div>
          )}

          {/* STEP 1 — Payment */}
          {step===1 && (
            <div className="space-y-5 page-enter">
              <h2 className="font-display text-2xl font-light">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(method => (
                  <label key={method.id}
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${payment===method.id?'border-black bg-cream':'border-border hover:border-black/40'}`}>
                    <input type="radio" name="payment" value={method.id} checked={payment===method.id} onChange={()=>setPayment(method.id)} className="mt-0.5 accent-black"/>
                    <method.icon size={18} className={payment===method.id?'text-black':'text-muted'}/>
                    <div>
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-[11px] text-muted mt-0.5">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {payment==='stripe' && (
                <div className="border border-border p-5 space-y-4">
                  <p className="text-[10px] tracking-wider uppercase text-muted flex items-center gap-2"><Lock size={11}/> Secured by Stripe — test cards accepted in development</p>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Card Number</label>
                    <input className="input-field" placeholder="4242 4242 4242 4242" maxLength={19}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Expiry</label><input className="input-field" placeholder="MM / YY" maxLength={7}/></div>
                    <div><label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">CVC</label><input className="input-field" placeholder="123" maxLength={4} type="password"/></div>
                  </div>
                </div>
              )}
              {(payment==='jazzcash'||payment==='easypaisa') && (
                <div className="border border-border p-5 space-y-4">
                  <p className="text-[10px] tracking-wider uppercase text-muted">Enter your mobile wallet number</p>
                  <input className="input-field" placeholder="03XX XXXXXXX" type="tel"/>
                  <p className="text-xs text-muted">You will receive a payment confirmation SMS. Enter the PIN to complete payment.</p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={()=>setStep(0)} className="btn-outline flex-1 py-3.5">Back</button>
                <button onClick={()=>setStep(2)} className="btn-primary flex-1 py-3.5">Review Order <ChevronRight size={15}/></button>
              </div>
            </div>
          )}

          {/* STEP 2 — Review */}
          {step===2 && (
            <div className="space-y-5 page-enter">
              <h2 className="font-display text-2xl font-light">Review Your Order</h2>
              {/* Delivery summary */}
              <div className="border border-border p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-[10px] tracking-[0.18em] uppercase font-medium">Delivery</h3>
                  <button onClick={()=>setStep(0)} className="text-[10px] text-muted hover:text-black uppercase tracking-wider">Edit</button>
                </div>
                <div className="text-sm text-muted space-y-0.5">
                  <p className="text-black font-medium">{getValues('firstName')} {getValues('lastName')}</p>
                  <p>{getValues('address')}, {getValues('city')}, {getValues('province')}, {getValues('country')}</p>
                  <p>{getValues('phone')}</p>
                </div>
              </div>
              <div className="border border-border p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[10px] tracking-[0.18em] uppercase font-medium">Payment</h3>
                  <button onClick={()=>setStep(1)} className="text-[10px] text-muted hover:text-black uppercase tracking-wider">Edit</button>
                </div>
                <p className="text-sm">{PAYMENT_METHODS.find(m=>m.id===payment)?.label}</p>
              </div>
              {/* Items */}
              <div className="border border-border divide-y divide-border">
                {items.map(item=>(
                  <div key={item.sku} className="flex gap-4 p-4">
                    <div className="relative w-14 h-20 shrink-0 bg-cream overflow-hidden">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px"/>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-display font-light">{item.product.name}</p>
                      <p className="text-[11px] text-muted">{item.size} · {item.color}</p>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(item.price*item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={()=>setStep(1)} className="btn-outline flex-1 py-3.5">Back</button>
                <button onClick={placeOrder} disabled={placing}
                  className="btn-primary flex-1 py-3.5 disabled:opacity-70">
                  {placing ? <><Loader size={14} className="animate-spin"/>&nbsp;Placing…</> : `Place Order · ${formatPrice(total)}`}
                </button>
              </div>
              <p className="text-[10px] text-muted text-center flex items-center justify-center gap-1.5">
                <Lock size={10}/> 256-bit SSL encrypted checkout
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — Order Summary */}
        <aside className="lg:border-l lg:border-border lg:pl-12 lg:pt-24">
          <div className="sticky top-[88px]">
            <h2 className="font-display text-xl font-light mb-5">Order Summary</h2>
            <ul className="divide-y divide-border mb-5">
              {items.map(item=>(
                <li key={item.sku} className="flex gap-3 py-4 first:pt-0">
                  <div className="relative w-14 h-20 shrink-0 overflow-hidden bg-cream">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px"/>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] rounded-full flex items-center justify-center">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-light line-clamp-1">{item.product.name}</p>
                    <p className="text-[10px] text-muted">{item.size} · {item.color}</p>
                    <p className="text-sm mt-1">{formatPrice(item.price*item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
                <input value={couponInput} onChange={e=>setCouponInput(e.target.value)}
                  placeholder="Promo or gift code" className="input-field pl-9 py-2.5 text-xs uppercase"/>
              </div>
              <button onClick={applyCoupon} disabled={couponLoading}
                className="px-4 border border-black text-[11px] uppercase tracking-wider hover:bg-black hover:text-white transition-colors disabled:opacity-60">
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(sub)}</span></div>
              {disc>0 && <div className="flex justify-between text-green-600"><span>Discount ({coupon?.code})</span><span>−{formatPrice(disc)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className={shipping===0?'text-green-600':''}>{shipping===0?'Free':formatPrice(shipping)}</span></div>
              {codFee>0 && <div className="flex justify-between"><span className="text-muted">COD Fee</span><span>{formatPrice(codFee)}</span></div>}
              <div className="flex justify-between font-medium text-base pt-3 border-t border-border">
                <span>Total</span><span className="font-display text-xl">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
