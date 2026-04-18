'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowRight, AlertCircle, RotateCcw, ArrowUp, ArrowDown
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Order, Product } from '@/types';
import { formatPrice, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  revenue: number; orders: number; customers: number; products: number;
  pending: number; lowStock: number; returns: number;
  revenueChange: number; ordersChange: number;
}

const CHART_COLORS = { gold: '#c9a96e', dark: '#1a1d27' };

export default function AdminDashboard() {
  const [stats,       setStats]       = useState<Stats>({ revenue:0, orders:0, customers:0, products:0, pending:0, lowStock:0, returns:0, revenueChange:0, ordersChange:0 });
  const [recentOrders,setRecentOrders]= useState<Order[]>([]);
  const [chartData,   setChartData]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all collections
        const [ordersSnap, usersSnap, productsSnap, returnsSnap] = await Promise.all([
          getDocs(query(collection(db,'orders'), orderBy('createdAt','desc'))),
          getDocs(collection(db,'users')),
          getDocs(collection(db,'products')),
          getDocs(query(collection(db,'returns'), where('status','==','pending'))),
        ]);

        const orders   = ordersSnap.docs.map(d => ({ id:d.id,...d.data() } as Order));
        const products = productsSnap.docs.map(d => ({ id:d.id,...d.data() } as Product));

        const totalRevenue = orders.filter(o => o.payment?.status === 'paid').reduce((s,o) => s+o.total,0);
        const pending      = orders.filter(o => o.status === 'pending').length;
        const lowStock     = products.filter(p => {
          const totalStock = Object.values(p.inventory || {}).reduce((s,v) => s+(v as number),0);
          return totalStock < 5;
        }).length;

        // Last 7 days revenue chart
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          return d.toISOString().slice(0,10);
        });
        const chartPoints = days.map(day => ({
          date: new Date(day).toLocaleDateString('en', { month:'short', day:'numeric' }),
          revenue: orders.filter(o => {
            const od = (o.createdAt as any)?.toDate?.() || new Date(o.createdAt as any);
            return od.toISOString().slice(0,10) === day && o.payment?.status === 'paid';
          }).reduce((s,o) => s+o.total,0),
          orders: orders.filter(o => {
            const od = (o.createdAt as any)?.toDate?.() || new Date(o.createdAt as any);
            return od.toISOString().slice(0,10) === day;
          }).length,
        }));

        setStats({
          revenue: totalRevenue, orders: orders.length,
          customers: usersSnap.size, products: products.length,
          pending, lowStock, returns: returnsSnap.size,
          revenueChange: 12.4, ordersChange: 8.1,
        });
        setRecentOrders(orders.slice(0,8));
        setChartData(chartPoints);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const StatCard = ({ label, value, icon: Icon, change, href, accent = false }: any) => (
    <Link href={href}
      className={`admin-card group hover:border-gold/30 transition-all duration-200 ${accent ? 'border-gold/30 bg-gold/5' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ? 'bg-gold/20' : 'bg-white/5'}`}>
          <Icon size={18} className={accent ? 'text-gold' : 'text-admin-muted'} />
        </div>
        {change !== undefined && (
          <span className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-light text-admin-text mb-1">{value}</p>
      <p className="text-xs text-admin-muted uppercase tracking-wider">{label}</p>
    </Link>
  );

  if (loading) return (
    <div className="p-6 md:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-28 bg-admin-surface border border-admin-border rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-light text-admin-text">Dashboard</h1>
          <p className="text-admin-muted text-sm mt-1">{new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <Link href="/admin/orders" className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5">
          View Orders <ArrowRight size={13} />
        </Link>
      </div>

      {/* Alerts */}
      {(stats.pending > 0 || stats.lowStock > 0 || stats.returns > 0) && (
        <div className="grid sm:grid-cols-3 gap-3">
          {stats.pending > 0 && (
            <Link href="/admin/orders?status=pending" className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 hover:border-yellow-500/40 transition-colors">
              <AlertCircle size={16} className="text-yellow-400 shrink-0" />
              <span className="text-yellow-400 text-sm"><strong>{stats.pending}</strong> pending orders</span>
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link href="/admin/inventory" className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 hover:border-red-500/40 transition-colors">
              <Package size={16} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm"><strong>{stats.lowStock}</strong> low stock items</span>
            </Link>
          )}
          {stats.returns > 0 && (
            <Link href="/admin/returns" className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 hover:border-orange-500/40 transition-colors">
              <RotateCcw size={16} className="text-orange-400 shrink-0" />
              <span className="text-orange-400 text-sm"><strong>{stats.returns}</strong> return requests</span>
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"  value={formatPrice(stats.revenue)}  icon={TrendingUp} change={stats.revenueChange}  href="/admin/analytics" accent />
        <StatCard label="Total Orders"   value={stats.orders}                icon={ShoppingBag} change={stats.ordersChange} href="/admin/orders" />
        <StatCard label="Customers"      value={stats.customers}             icon={Users}       href="/admin/customers" />
        <StatCard label="Products"       value={stats.products}              icon={Package}     href="/admin/products" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 admin-card">
          <h2 className="text-admin-text font-medium text-sm mb-5">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₨${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background:'#1a1d27', border:'1px solid #2a2d3a', borderRadius:'8px', color:'#e2e8f0' }}
                formatter={(v: any) => [formatPrice(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders chart */}
        <div className="admin-card">
          <h2 className="text-admin-text font-medium text-sm mb-5">Orders (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#1a1d27', border:'1px solid #2a2d3a', borderRadius:'8px', color:'#e2e8f0' }} />
              <Bar dataKey="orders" fill="#c9a96e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-admin-text font-medium">Recent Orders</h2>
          <Link href="/admin/orders" className="text-gold text-xs hover:text-gold-light transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Order','Customer','Date','Items','Total','Status',''].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="admin-table-row">
                  <td className="py-3 pr-4 font-mono text-xs text-gold">#{order.orderNumber}</td>
                  <td className="py-3 pr-4 text-admin-text">{order.userName}</td>
                  <td className="py-3 pr-4 text-admin-muted text-xs">{formatDateTime(order.createdAt as any)}</td>
                  <td className="py-3 pr-4 text-admin-muted">{order.items?.length || 0}</td>
                  <td className="py-3 pr-4 text-admin-text">{formatPrice(order.total)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-admin-muted hover:text-gold transition-colors">
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
