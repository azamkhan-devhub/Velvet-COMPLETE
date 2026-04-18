'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package, Filter } from 'lucide-react';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserOrders } from '@/lib/firebase/firestore';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Orders',  value: 'all' },
  { label: 'Processing',  value: 'processing' },
  { label: 'Shipped',     value: 'shipped' },
  { label: 'Delivered',   value: 'delivered' },
  { label: 'Cancelled',   value: 'cancelled' },
  { label: 'Returns',     value: 'return_requested' },
];

function OrdersList() {
  const { user } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (user) getUserOrders(user.uid).then(o => { setOrders(o); setLoading(false); });
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16 page-enter">
      <div className="mb-8">
        <Link href="/account" className="text-[11px] text-muted hover:text-black transition-colors tracking-wider uppercase mb-4 block">← My Account</Link>
        <h1 className="font-display text-4xl font-light">My Orders</h1>
        <p className="text-muted text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`text-[11px] tracking-wider uppercase px-4 py-2 border transition-colors ${filter === f.value ? 'bg-black text-white border-black' : 'border-border hover:border-black'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-border p-16 text-center">
          <Package size={48} className="text-border mx-auto mb-4" />
          <p className="font-display text-2xl font-light mb-2">No orders found</p>
          <p className="text-sm text-muted mb-6">
            {filter === 'all' ? "You haven't placed any orders yet." : `No ${ORDER_STATUS_LABELS[filter]?.toLowerCase()} orders.`}
          </p>
          <Link href="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <Link key={order.id} href={`/account/orders/${order.id}`}
              className="block border border-border hover:border-black transition-all duration-200 overflow-hidden">
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-border gap-3 bg-cream/40">
                <div className="flex items-center gap-6 flex-wrap text-sm">
                  <div><p className="text-[10px] text-muted uppercase tracking-wider">Order</p><p className="font-medium">#{order.orderNumber}</p></div>
                  <div><p className="text-[10px] text-muted uppercase tracking-wider">Date</p><p>{formatDate(order.createdAt as any)}</p></div>
                  <div><p className="text-[10px] text-muted uppercase tracking-wider">Total</p><p className="font-display text-lg">{formatPrice(order.total)}</p></div>
                  <div><p className="text-[10px] text-muted uppercase tracking-wider">Payment</p>
                    <p className="capitalize">{order.payment.method.replace('_',' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] tracking-wider uppercase px-3 py-1.5 ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <ArrowRight size={15} className="text-muted" />
                </div>
              </div>

              {/* Items preview */}
              <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
                {order.items.slice(0,4).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative w-14 h-18 overflow-hidden bg-cream shrink-0">
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-display font-light line-clamp-1">{item.productName}</p>
                      <p className="text-[11px] text-muted">{item.size} · {item.color} · Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 4 && (
                  <span className="text-sm text-muted">+{order.items.length - 4} more</span>
                )}
              </div>

              {/* Tracking if available */}
              {order.trackingNumber && (
                <div className="px-5 py-3 border-t border-border bg-blue-50 flex items-center gap-2 text-xs text-blue-700">
                  <Package size={12} /> Tracking: <strong>{order.trackingNumber}</strong>
                  {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1" onClick={e => e.stopPropagation()}>Track shipment →</a>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <AuthGuard><OrdersList /></AuthGuard>;
}
