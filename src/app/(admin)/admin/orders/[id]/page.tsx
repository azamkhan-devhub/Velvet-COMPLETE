'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, MapPin, CreditCard, Save, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_FLOW: OrderStatus[] = ['pending','confirmed','processing','shipped','delivered'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order,    setOrder]    = useState<Order | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [tracking, setTracking] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [notes,    setNotes]    = useState('');
  const [refundAmt,setRefundAmt]= useState('');

  useEffect(() => {
    getDoc(doc(db,'orders',id as string)).then(snap => {
      if (snap.exists()) {
        const o = { id:snap.id,...snap.data() } as Order;
        setOrder(o); setNewStatus(o.status);
        setTracking(o.trackingNumber || ''); setTrackUrl(o.trackingUrl || '');
        setNotes(o.notes || '');
      }
      setLoading(false);
    });
  }, [id]);

  const save = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const timeline = [...(order.timeline || [])];
      if (newStatus !== order.status) {
        timeline.push({ status: newStatus, message: notes || `Status updated to ${ORDER_STATUS_LABELS[newStatus]}`, timestamp: Timestamp.now() });
      }
      await updateDoc(doc(db,'orders',order.id), {
        status: newStatus,
        trackingNumber: tracking || null,
        trackingUrl: trackUrl || null,
        notes,
        timeline,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'shipped' && tracking ? { shippedAt: serverTimestamp() } : {}),
        ...(newStatus === 'delivered' ? { deliveredAt: serverTimestamp(), 'payment.status':'paid' } : {}),
      });
      setOrder({ ...order, status:newStatus, trackingNumber:tracking, timeline });
      toast.success('Order updated!');
    } catch { toast.error('Failed to update order'); }
    finally { setSaving(false); }
  };

  const markPaid = async () => {
    if (!order) return;
    await updateDoc(doc(db,'orders',order.id), { 'payment.status':'paid', updatedAt:serverTimestamp() });
    setOrder({ ...order, payment:{ ...order.payment, status:'paid' } });
    toast.success('Marked as paid');
  };

  const processRefund = async () => {
    if (!order || !refundAmt) return;
    const amt = parseFloat(refundAmt);
    await updateDoc(doc(db,'orders',order.id), {
      'payment.status': amt >= order.total ? 'refunded' : 'partially_refunded',
      refundAmount: amt, updatedAt: serverTimestamp(),
    });
    toast.success(`Refund of ${formatPrice(amt)} processed`);
  };

  if (loading) return <div className="p-10 flex items-center justify-center min-h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/></div>;
  if (!order)  return <div className="p-10 text-admin-muted">Order not found.</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-text/30 transition-colors">
            <ArrowLeft size={16}/>
          </Link>
          <div>
            <h1 className="text-xl font-display font-light text-admin-text">Order #{order.orderNumber}</h1>
            <p className="text-admin-muted text-sm">{formatDateTime(order.createdAt as any)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] tracking-wider uppercase px-3 py-1.5 ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <button onClick={save} disabled={saving}
            className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5">
            <Save size={13}/>{saving ? ' Saving…' : ' Save Changes'}
          </button>
        </div>
      </div>

      {/* Status progress bar */}
      <div className="admin-card">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-admin-border" />
          {STATUS_FLOW.map((s, i) => {
            const isDone    = STATUS_FLOW.indexOf(order.status) >= i;
            const isCurrent = order.status === s;
            return (
              <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone ? 'bg-gold border-gold' : 'bg-admin-bg border-admin-border'
                }`}>
                  {isDone ? <CheckCircle size={18} className="text-black" /> : <span className="text-[11px] text-admin-muted">{i+1}</span>}
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${isCurrent ? 'text-gold font-medium' : 'text-admin-muted'}`}>
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left */}
        <div className="space-y-5">
          {/* Items */}
          <div className="admin-card">
            <h2 className="text-admin-text font-medium mb-4 flex items-center gap-2"><Package size={15}/> Items ({order.items?.length})</h2>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-admin-border last:border-0">
                  <div className="relative w-14 h-20 overflow-hidden bg-admin-bg shrink-0">
                    <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="56px"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-admin-text font-medium">{item.productName}</p>
                    <p className="text-xs text-admin-muted">{item.size} · {item.color} · SKU: {item.sku}</p>
                    <p className="text-xs text-admin-muted">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    <p className="text-admin-text font-medium mt-1">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-admin-border space-y-1.5 text-sm">
              <div className="flex justify-between text-admin-muted"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-admin-muted"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
              <div className="flex justify-between text-admin-text font-medium text-base pt-2 border-t border-admin-border">
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update status + tracking */}
          <div className="admin-card space-y-4">
            <h2 className="text-admin-text font-medium">Update Order</h2>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as OrderStatus)} className="admin-input">
                {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Tracking Number</label>
              <input value={tracking} onChange={e => setTracking(e.target.value)} className="admin-input" placeholder="TRK123456789" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Tracking URL</label>
              <input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} className="admin-input" placeholder="https://track.courier.com/..." />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Internal Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="admin-input resize-none" placeholder="Notes visible to admin only…" />
            </div>
          </div>

          {/* Refund */}
          <div className="admin-card space-y-4">
            <h2 className="text-admin-text font-medium flex items-center gap-2"><CreditCard size={15}/> Payment & Refund</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text capitalize">{order.payment?.method?.replace('_',' ')}</p>
                <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[order.payment?.status]}`}>
                  {order.payment?.status}
                </span>
              </div>
              {order.payment?.status !== 'paid' && (
                <button onClick={markPaid} className="text-xs border border-green-500/30 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/10 transition-colors">
                  Mark Paid
                </button>
              )}
            </div>
            {order.payment?.transactionId && <p className="text-xs text-admin-muted font-mono">TXN: {order.payment.transactionId}</p>}
            <div className="border-t border-admin-border pt-4">
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Process Refund (PKR)</label>
              <div className="flex gap-2">
                <input value={refundAmt} onChange={e => setRefundAmt(e.target.value)} type="number" className="admin-input flex-1" placeholder={String(order.total)} />
                <button onClick={processRefund} className="text-xs px-4 border border-admin-border text-admin-muted hover:text-red-400 hover:border-red-400/30 rounded-lg transition-colors">Refund</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="admin-card">
            <h2 className="text-admin-text font-medium mb-3">Customer</h2>
            <p className="text-admin-text font-medium">{order.userName}</p>
            <p className="text-sm text-admin-muted">{order.userEmail}</p>
            <Link href={`/admin/customers?search=${order.userEmail}`}
              className="text-[11px] text-gold hover:text-gold-light mt-2 block">View customer profile →</Link>
          </div>

          {/* Shipping address */}
          <div className="admin-card">
            <h2 className="text-admin-text font-medium mb-3 flex items-center gap-2"><MapPin size={14}/> Delivery Address</h2>
            <address className="text-sm text-admin-muted not-italic space-y-0.5">
              <p className="text-admin-text font-medium">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
              <p>{order.shippingAddress?.address}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.province}</p>
              <p>{order.shippingAddress?.country}</p>
              <p className="mt-1">{order.shippingAddress?.phone}</p>
            </address>
          </div>

          {/* Timeline */}
          <div className="admin-card">
            <h2 className="text-admin-text font-medium mb-4">Timeline</h2>
            <ol className="relative border-l border-admin-border ml-3 space-y-4">
              {order.timeline?.map((t, i) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-2.5 w-5 h-5 rounded-full bg-admin-surface border-2 border-gold" />
                  <p className="text-sm text-admin-text font-medium">{ORDER_STATUS_LABELS[t.status]}</p>
                  <p className="text-xs text-admin-muted">{t.message}</p>
                  <p className="text-[10px] text-admin-muted mt-0.5">{formatDateTime(t.timestamp as any)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
