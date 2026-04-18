'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowRight, Package } from 'lucide-react';
import { getDocs, query, orderBy, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Order } from '@/types';
import { formatPrice, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUS_TABS = ['all','pending','confirmed','processing','shipped','delivered','cancelled','return_requested'];

export default function AdminOrdersPage() {
  const params  = useSearchParams();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading,setLoading]  = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(params.get('status') || 'all');

  useEffect(() => {
    getDocs(query(collection(db,'orders'), orderBy('createdAt','desc')))
      .then(snap => { setOrders(snap.docs.map(d=>({id:d.id,...d.data()} as Order))); setLoading(false); });
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      o.userName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'all' || o.status === status;
    return matchSearch && matchStatus;
  });

  const counts = STATUS_TABS.reduce((acc, s) => ({
    ...acc, [s]: s === 'all' ? orders.length : orders.filter(o=>o.status===s).length,
  }), {} as Record<string,number>);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-light text-admin-text">Orders</h1>
        <p className="text-admin-muted text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${status === s ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
            {s === 'all' ? 'All' : ORDER_STATUS_LABELS[s]}
            {counts[s] > 0 && <span className="ml-1.5 opacity-70">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order # or customer…"
          className="w-full bg-admin-surface border border-admin-border pl-10 pr-4 py-2.5 text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-gold/50 rounded-lg" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="h-16 bg-admin-surface rounded-xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Package size={40} className="text-admin-muted mx-auto mb-4" />
          <p className="text-admin-text font-display text-xl font-light">No orders found</p>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Order #','Customer','Date','Items','Total','Payment','Status',''].map(h=>(
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order=>(
                <tr key={order.id} className="admin-table-row">
                  <td className="py-3.5 pr-4 font-mono text-xs text-gold">#{order.orderNumber}</td>
                  <td className="py-3.5 pr-4">
                    <p className="text-admin-text font-medium">{order.userName}</p>
                    <p className="text-[11px] text-admin-muted">{order.userEmail}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-admin-muted text-xs">{formatDateTime(order.createdAt as any)}</td>
                  <td className="py-3.5 pr-4 text-admin-muted">{order.items?.length || 0}</td>
                  <td className="py-3.5 pr-4 text-admin-text font-medium">{formatPrice(order.total)}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      order.payment?.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                      order.payment?.status === 'refunded' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{order.payment?.status || 'unknown'}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="text-admin-muted hover:text-gold transition-colors">
                      <ArrowRight size={14}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
