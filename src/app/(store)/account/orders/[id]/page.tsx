'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, MapPin, CreditCard, RotateCcw, Star, CheckCircle, Clock, Truck, Home, X } from 'lucide-react';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrder, addReview, createReturn } from '@/lib/firebase/firestore';
import { Order, OrderItem } from '@/types';
import { formatPrice, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIMELINE_ICONS: Record<string, any> = {
  pending: Clock, confirmed: CheckCircle, processing: Package,
  shipped: Truck, delivered: Home, cancelled: X,
  return_requested: RotateCcw, returned: RotateCcw,
};

function ReviewModal({ item, orderId, userId, onClose }: { item: OrderItem; orderId: string; userId: string; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [title,  setTitle]  = useState('');
  const [comment,setComment]= useState('');
  const [loading,setLoading]= useState(false);

  const submit = async () => {
    if (!title || comment.length < 10) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await addReview({ productId: item.productId, userId, userName: '', orderId, rating, title, comment, isVerified: true, isApproved: true, helpfulCount: 0, createdAt: new Date() });
      toast.success('Review submitted! Thank you.');
      onClose();
    } catch { toast.error('Failed to submit review'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-black"><X size={18} /></button>
        <h3 className="font-display text-2xl font-light mb-1">Write a Review</h3>
        <p className="text-sm text-muted mb-5">{item.productName}</p>
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)}>
              <Star size={24} className={s <= rating ? 'fill-gold text-gold' : 'text-border fill-border'} />
            </button>
          ))}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Review title" className="input-field mb-3" />
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this piece…" rows={4} className="input-field mb-4 resize-none" />
        <button onClick={submit} disabled={loading} className="btn-primary w-full">{loading ? 'Submitting…' : 'Submit Review'}</button>
      </div>
    </div>
  );
}

function ReturnModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { user } = useAuth();
  const [reason, setReason]   = useState('');
  const [desc,   setDesc]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason || desc.length < 10) { toast.error('Please select a reason and describe the issue'); return; }
    setLoading(true);
    try {
      await createReturn({ orderId: order.id, userId: user!.uid, userEmail: user!.email!, items: order.items, reason, description: desc, status: 'pending', refundAmount: order.total, createdAt: new Date() });
      toast.success('Return request submitted. We\'ll contact you within 24 hours.');
      onClose();
    } catch { toast.error('Failed to submit return request'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-black"><X size={18} /></button>
        <h3 className="font-display text-2xl font-light mb-4">Request Return</h3>
        <select value={reason} onChange={e => setReason(e.target.value)} className="input-field mb-3">
          <option value="">Select reason…</option>
          {['Wrong size', 'Defective / damaged', 'Not as described', 'Changed my mind', 'Wrong item received', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Please describe the issue in detail…" rows={4} className="input-field mb-4 resize-none" />
        <p className="text-xs text-muted mb-4">Refund of {formatPrice(order.total)} will be processed within 5-7 business days after we receive the item.</p>
        <button onClick={submit} disabled={loading} className="btn-primary w-full">{loading ? 'Submitting…' : 'Submit Return Request'}</button>
      </div>
    </div>
  );
}

function OrderDetail() {
  const { user } = useAuth();
  const params = useParams();
  const [order, setOrder]           = useState<Order | null>(null);
  const [loading, setLoading]       = useState(true);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    getOrder(params.id as string).then(o => { setOrder(o); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
  if (!order || order.userId !== user?.uid) return <div className="p-10 text-center"><p className="text-muted">Order not found.</p></div>;

  const canReturn = order.status === 'delivered';
  const canReview = order.status === 'delivered';

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16 page-enter">
      {reviewItem && <ReviewModal item={reviewItem} orderId={order.id} userId={user!.uid} onClose={() => setReviewItem(null)} />}
      {showReturn && <ReturnModal order={order} onClose={() => setShowReturn(false)} />}

      <Link href="/account/orders" className="text-[11px] text-muted hover:text-black transition-colors tracking-wider uppercase mb-6 block">← My Orders</Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">Order #{order.orderNumber}</h1>
          <p className="text-muted text-sm mt-1">Placed {formatDateTime(order.createdAt as any)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] tracking-wider uppercase px-3 py-2 ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          {canReturn && (
            <button onClick={() => setShowReturn(true)} className="btn-outline text-sm gap-2">
              <RotateCcw size={14} /> Request Return
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        {/* Left */}
        <div className="space-y-6">
          {/* Items */}
          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border bg-cream/40">
              <h2 className="font-display text-xl font-light">Items Ordered</h2>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-4 p-5">
                  <Link href={`/shop/${item.productSlug}`} className="relative w-20 h-28 shrink-0 overflow-hidden bg-cream">
                    <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="80px" />
                  </Link>
                  <div className="flex-1">
                    <Link href={`/shop/${item.productSlug}`} className="font-display text-base font-light hover:text-gold transition-colors">{item.productName}</Link>
                    <p className="text-[11px] text-muted mt-1">{item.size} · {item.color} · Qty {item.quantity}</p>
                    <p className="text-sm font-medium mt-2">{formatPrice(item.subtotal)}</p>
                    {canReview && (
                      <button onClick={() => setReviewItem(item)} className="mt-2 flex items-center gap-1.5 text-[11px] text-gold hover:text-black transition-colors uppercase tracking-wider">
                        <Star size={11} /> Write Review
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Timeline */}
          <div className="border border-border p-5">
            <h2 className="font-display text-xl font-light mb-5">Order Timeline</h2>
            <ol className="relative border-l border-border ml-3 space-y-6">
              {order.timeline?.map((t, i) => {
                const Icon = TIMELINE_ICONS[t.status] || Clock;
                return (
                  <li key={i} className="ml-6">
                    <span className="absolute -left-3 w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center">
                      <Icon size={12} />
                    </span>
                    <p className="font-medium text-sm">{ORDER_STATUS_LABELS[t.status]}</p>
                    <p className="text-xs text-muted">{t.message}</p>
                    <p className="text-[10px] text-muted mt-0.5">{formatDateTime(t.timestamp as any)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Right: summary */}
        <div className="space-y-5">
          {/* Price summary */}
          <div className="border border-border p-5">
            <h2 className="font-display text-xl font-light mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
              {order.tax > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span>{formatPrice(order.tax)}</span></div>}
              <div className="flex justify-between font-medium text-base pt-3 border-t border-border">
                <span>Total</span><span className="font-display text-xl">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border border-border p-5">
            <h2 className="font-display text-lg font-light mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment</h2>
            <p className="text-sm capitalize">{order.payment.method.replace('_',' ')}</p>
            <p className={`text-[11px] tracking-wider uppercase mt-1 ${order.payment.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.payment.status}</p>
            {order.payment.transactionId && <p className="text-[11px] text-muted mt-1 font-mono">{order.payment.transactionId}</p>}
          </div>

          {/* Shipping address */}
          <div className="border border-border p-5">
            <h2 className="font-display text-lg font-light mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h2>
            <address className="text-sm text-muted not-italic space-y-0.5">
              <p className="font-medium text-black">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-1">{order.shippingAddress.phone}</p>
            </address>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-display text-lg font-light mb-2 flex items-center gap-2 text-blue-800"><Truck size={16} /> Tracking</h2>
              <p className="text-sm font-mono text-blue-700">{order.trackingNumber}</p>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline mt-2 block">
                  Track your shipment →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return <AuthGuard><OrderDetail /></AuthGuard>;
}
