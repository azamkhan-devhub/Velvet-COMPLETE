'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Package, Heart, User, MapPin, CreditCard, Star, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserOrders } from '@/lib/firebase/firestore';
import { Order } from '@/types';
import { formatPrice, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import { useWishlistStore } from '@/lib/store';

function AccountDashboard() {
  const { user, appUser } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const wishCount = useWishlistStore(s => s.productIds.length);

  useEffect(() => {
    if (user) {
      getUserOrders(user.uid).then(o => { setOrders(o); setLoading(false); });
    }
  }, [user]);

  const recentOrders = orders.slice(0, 3);
  const pendingOrders = orders.filter(o => ['pending','confirmed','processing','shipped'].includes(o.status)).length;

  const stats = [
    { label: 'Total Orders',    value: appUser?.totalOrders || 0, icon: Package,    href: '/account/orders' },
    { label: 'Total Spent',     value: formatPrice(appUser?.totalSpent || 0), icon: CreditCard, href: '/account/orders' },
    { label: 'Wishlist Items',  value: wishCount,                icon: Heart,       href: '/wishlist' },
    { label: 'Active Orders',   value: pendingOrders,            icon: Clock,       href: '/account/orders' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="section-eyebrow">Your account</span>
          <h1 className="font-display text-4xl font-light">
            Hello, {appUser?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-muted text-sm mt-1">Member since {appUser?.createdAt ? formatDate(appUser.createdAt as any) : '—'}</p>
        </div>
        {user?.photoURL && (
          <Image src={user.photoURL} alt="Avatar" width={64} height={64} className="rounded-full border-2 border-border" />
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label:'My Orders',  href:'/account/orders',  icon:Package },
          { label:'My Profile', href:'/account/profile', icon:User },
          { label:'Wishlist',   href:'/wishlist',         icon:Heart },
          { label:'Addresses',  href:'/account/profile',  icon:MapPin },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-3 p-6 border border-border hover:border-black hover:bg-cream transition-all duration-200 text-center">
            <Icon size={22} />
            <span className="text-[11px] tracking-[0.15em] uppercase font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="border border-border p-5 hover:border-black transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className="text-muted" />
              <ArrowRight size={14} className="text-muted group-hover:text-gold transition-colors" />
            </div>
            <p className="font-display text-2xl font-light">{value}</p>
            <p className="text-[11px] tracking-wider text-muted mt-1 uppercase">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-light">Recent Orders</h2>
          <Link href="/account/orders" className="btn-ghost group text-sm">
            View All <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="border border-border p-10 text-center">
            <ShoppingBag size={40} className="text-border mx-auto mb-4" />
            <p className="font-display text-xl font-light mb-2">No orders yet</p>
            <p className="text-sm text-muted mb-5">Start shopping to see your orders here.</p>
            <Link href="/shop" className="btn-primary">Explore the Edit</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <Link key={order.id} href={`/account/orders/${order.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border hover:border-black transition-colors gap-3">
                <div className="flex items-center gap-4">
                  {/* Thumbnail grid */}
                  <div className="flex -space-x-2">
                    {order.items.slice(0,3).map((item, i) => (
                      <div key={i} className="relative w-12 h-16 border-2 border-white overflow-hidden bg-cream">
                        <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="48px" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-muted">{formatDate(order.createdAt as any)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-display text-lg">{formatPrice(order.total)}</span>
                  <ArrowRight size={14} className="text-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return <AuthGuard><AccountDashboard /></AuthGuard>;
}
