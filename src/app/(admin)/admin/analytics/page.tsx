// 'use client';
// import { useEffect, useState } from 'react';
// import { getDocs, query, orderBy, collection, where, Timestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/client';
// import { Order, Product } from '@/types';
// import { formatPrice } from '@/lib/utils';
// import {
//   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, BarChart, Bar, Legend,
// } from 'recharts';

// const GOLD = '#c9a96e';
// const COLORS = ['#c9a96e','#e8c98a','#8a8278','#3a3a3a','#e8ddd0'];

// export default function AdminAnalyticsPage() {
//   const [orders,   setOrders]   = useState<Order[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [period,   setPeriod]   = useState<'7d'|'30d'|'90d'>('30d');
//   const [loading,  setLoading]  = useState(true);

//   useEffect(() => {
//     Promise.all([
//       getDocs(query(collection(db,'orders'), orderBy('createdAt','desc'))),
//       getDocs(collection(db,'products')),
//     ]).then(([oSnap,pSnap]) => {
//       setOrders(oSnap.docs.map(d=>({id:d.id,...d.data()}as Order)));
//       setProducts(pSnap.docs.map(d=>({id:d.id,...d.data()}as Product)));
//       setLoading(false);
//     });
//   }, []);

//   const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

//   const revenueData = Array.from({length:days},(_, i) => {
//     const d = new Date(); d.setDate(d.getDate()-(days-1-i));
//     const dateStr = d.toISOString().slice(0,10);
//     const dayOrders = orders.filter(o => {
//       const od = (o.createdAt as any)?.toDate?.()?.toISOString().slice(0,10);
//       return od === dateStr;
//     });
//     return {
//       date: days <= 7
//         ? d.toLocaleDateString('en',{weekday:'short'})
//         : d.toLocaleDateString('en',{month:'short',day:'numeric'}),
//       revenue: dayOrders.filter(o=>o.payment?.status==='paid').reduce((s,o)=>s+o.total,0),
//       orders:  dayOrders.length,
//     };
//   });

//   // Category breakdown
//   const catMap: Record<string,number> = {};
//   orders.forEach(o => o.items?.forEach(item => {
//     const prod = products.find(p=>p.id===item.productId);
//     const cat = prod?.categoryId || 'Other';
//     catMap[cat] = (catMap[cat]||0) + item.subtotal;
//   }));
//   const categoryData = Object.entries(catMap).map(([name,value])=>({name,value}));

//   // Payment methods
//   const payMap: Record<string,number> = {};
//   orders.forEach(o => { payMap[o.payment?.method||'unknown'] = (payMap[o.payment?.method||'unknown']||0)+1; });
//   const paymentData = Object.entries(payMap).map(([name,value])=>({name:name.replace('_',' '),value}));

//   // Top products
//   const prodMap: Record<string,{name:string;revenue:number;qty:number}> = {};
//   orders.forEach(o => o.items?.forEach(item => {
//     if (!prodMap[item.productId]) prodMap[item.productId] = {name:item.productName,revenue:0,qty:0};
//     prodMap[item.productId].revenue += item.subtotal;
//     prodMap[item.productId].qty     += item.quantity;
//   }));
//   const topProducts = Object.values(prodMap).sort((a,b)=>b.revenue-a.revenue).slice(0,5);

//   const totalRevenue   = orders.filter(o=>o.payment?.status==='paid').reduce((s,o)=>s+o.total,0);
//   const avgOrderValue  = orders.length ? totalRevenue/orders.length : 0;
//   const convRate       = 68.4; // placeholder

//   if (loading) return <div className="p-10 flex items-center justify-center min-h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/></div>;

//   return (
//     <div className="p-6 md:p-10 space-y-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-display font-light text-admin-text">Analytics</h1>
//           <p className="text-admin-muted text-sm mt-1">Store performance overview</p>
//         </div>
//         <div className="flex gap-2">
//           {(['7d','30d','90d'] as const).map(p => (
//             <button key={p} onClick={() => setPeriod(p)}
//               className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${period===p ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
//               {p}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* KPI cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {[
//           { label:'Total Revenue',     value:formatPrice(totalRevenue),         sub:'All time' },
//           { label:'Total Orders',      value:orders.length,                     sub:'All time' },
//           { label:'Avg. Order Value',  value:formatPrice(avgOrderValue),        sub:'Per order' },
//           { label:'Conversion Rate',   value:`${convRate}%`,                   sub:'Visitors → buyers' },
//         ].map(({ label, value, sub }) => (
//           <div key={label} className="admin-card">
//             <p className="text-2xl font-display font-light text-gold">{value}</p>
//             <p className="text-sm text-admin-text font-medium mt-1">{label}</p>
//             <p className="text-xs text-admin-muted">{sub}</p>
//           </div>
//         ))}
//       </div>

//       {/* Revenue over time */}
//       <div className="admin-card">
//         <h2 className="text-admin-text font-medium mb-5">Revenue & Orders Over Time</h2>
//         <ResponsiveContainer width="100%" height={280}>
//           <AreaChart data={revenueData}>
//             <defs>
//               <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%"  stopColor={GOLD} stopOpacity={0.3}/>
//                 <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
//             <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
//             <YAxis yAxisId="left" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₨${(v/1000).toFixed(0)}k`} />
//             <YAxis yAxisId="right" orientation="right" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
//             <Tooltip contentStyle={{background:'#1a1d27',border:'1px solid #2a2d3a',borderRadius:'8px',color:'#e2e8f0'}}
//               formatter={(v:any,name:string)=>[name==='revenue'?formatPrice(v):v, name==='revenue'?'Revenue':'Orders']} />
//             <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#ag1)" />
//             <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#8a8278" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>

//       <div className="grid lg:grid-cols-2 gap-6">
//         {/* Revenue by category */}
//         <div className="admin-card">
//           <h2 className="text-admin-text font-medium mb-5">Revenue by Category</h2>
//           {categoryData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={220}>
//               <PieChart>
//                 <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
//                   dataKey="value" nameKey="name" paddingAngle={3}>
//                   {categoryData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
//                 </Pie>
//                 <Tooltip contentStyle={{background:'#1a1d27',border:'1px solid #2a2d3a',borderRadius:'8px',color:'#e2e8f0'}}
//                   formatter={(v:any)=>[formatPrice(v),'Revenue']} />
//                 <Legend formatter={(v) => <span style={{color:'#64748b',fontSize:'11px'}}>{v}</span>} />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : <p className="text-admin-muted text-sm text-center py-12">No order data yet</p>}
//         </div>

//         {/* Payment methods */}
//         <div className="admin-card">
//           <h2 className="text-admin-text font-medium mb-5">Payment Methods</h2>
//           {paymentData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={220}>
//               <BarChart data={paymentData} layout="vertical">
//                 <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
//                 <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
//                 <YAxis type="category" dataKey="name" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} width={80} />
//                 <Tooltip contentStyle={{background:'#1a1d27',border:'1px solid #2a2d3a',borderRadius:'8px',color:'#e2e8f0'}} />
//                 <Bar dataKey="value" fill={GOLD} radius={[0,4,4,0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           ) : <p className="text-admin-muted text-sm text-center py-12">No order data yet</p>}
//         </div>
//       </div>

//       {/* Top products */}
//       <div className="admin-card">
//         <h2 className="text-admin-text font-medium mb-5">Top Products by Revenue</h2>
//         {topProducts.length === 0 ? (
//           <p className="text-admin-muted text-sm text-center py-8">No sales data yet</p>
//         ) : (
//           <div className="space-y-3">
//             {topProducts.map((p,i) => (
//               <div key={p.name} className="flex items-center gap-4">
//                 <span className="text-2xl font-display font-light text-admin-muted/40 w-6 shrink-0">{i+1}</span>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between mb-1">
//                     <p className="text-sm text-admin-text truncate">{p.name}</p>
//                     <p className="text-sm text-gold font-medium ml-4 shrink-0">{formatPrice(p.revenue)}</p>
//                   </div>
//                   <div className="h-1 bg-admin-bg rounded-full overflow-hidden">
//                     <div className="h-full bg-gold/60 rounded-full" style={{ width:`${(p.revenue/topProducts[0].revenue)*100}%` }} />
//                   </div>
//                   <p className="text-[10px] text-admin-muted mt-0.5">{p.qty} units sold</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import {
  getDocs,
  query,
  orderBy,
  collection,
  where,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/client';
import { Order, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

/* ✅ FIX: added proper typing for React Hook Form */
type Variant = {
  id?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  sku?: string;
  stock?: number;
  priceAdjustment?: number;
};

type FormValues = {
  tags: Variant[];
};

const GOLD = '#c9a96e';
const COLORS = ['#c9a96e', '#e8c98a', '#8a8278', '#3a3a3a', '#e8ddd0'];

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'products')),
    ]).then(([oSnap, pSnap]) => {
      setOrders(oSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setProducts(
        pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
      );
      setLoading(false);
    });
  }, []);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const revenueData = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().slice(0, 10);

    const dayOrders = orders.filter((o) => {
      const od = (o.createdAt as any)?.toDate?.()?.toISOString().slice(0, 10);
      return od === dateStr;
    });

    return {
      date:
        days <= 7
          ? d.toLocaleDateString('en', { weekday: 'short' })
          : d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: dayOrders
        .filter((o) => o.payment?.status === 'paid')
        .reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  // Category breakdown
  const catMap: Record<string, number> = {};
  orders.forEach((o) =>
    o.items?.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.categoryId || 'Other';
      catMap[cat] = (catMap[cat] || 0) + item.subtotal;
    })
  );

  const categoryData = Object.entries(catMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Payment methods
  const payMap: Record<string, number> = {};
  orders.forEach((o) => {
    const method = o.payment?.method || 'unknown';
    payMap[method] = (payMap[method] || 0) + 1;
  });

  const paymentData = Object.entries(payMap).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  // Top products
  const prodMap: Record<
    string,
    { name: string; revenue: number; qty: number }
  > = {};

  orders.forEach((o) =>
    o.items?.forEach((item) => {
      if (!prodMap[item.productId]) {
        prodMap[item.productId] = {
          name: item.productName,
          revenue: 0,
          qty: 0,
        };
      }
      prodMap[item.productId].revenue += item.subtotal;
      prodMap[item.productId].qty += item.quantity;
    })
  );

  const topProducts = Object.values(prodMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalRevenue = orders
    .filter((o) => o.payment?.status === 'paid')
    .reduce((s, o) => s + o.total, 0);

  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const convRate = 68.4;

  if (loading)
    return (
      <div className="p-10 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-light text-admin-text">
            Analytics
          </h1>
          <p className="text-admin-muted text-sm mt-1">
            Store performance overview
          </p>
        </div>

        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${
                period === p
                  ? 'bg-gold text-black border-gold'
                  : 'border-admin-border text-admin-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatPrice(totalRevenue),
            sub: 'All time',
          },
          { label: 'Total Orders', value: orders.length, sub: 'All time' },
          {
            label: 'Avg. Order Value',
            value: formatPrice(avgOrderValue),
            sub: 'Per order',
          },
          {
            label: 'Conversion Rate',
            value: `${convRate}%`,
            sub: 'Visitors → buyers',
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className="admin-card">
            <p className="text-2xl font-display font-light text-gold">
              {value}
            </p>
            <p className="text-sm text-admin-text font-medium mt-1">
              {label}
            </p>
            <p className="text-xs text-admin-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="admin-card">
        <h2 className="text-admin-text font-medium mb-5">
          Revenue & Orders Over Time
        </h2>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area dataKey="revenue" stroke={GOLD} fill={GOLD} />
            <Area dataKey="orders" stroke="#8a8278" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category + Payment */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h2>Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" outerRadius={80}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h2>Payment Methods</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paymentData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={GOLD} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="admin-card">
        <h2>Top Products</h2>

        <div className="space-y-3 mt-4">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex justify-between">
              <span>
                {i + 1}. {p.name}
              </span>
              <span className="text-gold">
                {formatPrice(p.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
