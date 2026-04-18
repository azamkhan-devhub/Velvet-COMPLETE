'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, AlertTriangle, Edit, Package } from 'lucide-react';
import { getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { productsCol } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Product } from '@/types';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [editing,  setEditing]  = useState<{productId:string;sku:string;stock:number}|null>(null);

  useEffect(() => {
    getDocs(query(productsCol, orderBy('createdAt','desc')))
      .then(snap => { setProducts(snap.docs.map(d=>({id:d.id,...d.data()}as Product))); setLoading(false); });
  }, []);

  const saveStock = async () => {
    if (!editing) return;
    const product = products.find(p => p.id === editing.productId);
    if (!product) return;
    const newInventory = { ...product.inventory, [editing.sku]: editing.stock };
    await updateDoc(doc(db,'products',editing.productId), { inventory: newInventory });
    setProducts(ps => ps.map(p => p.id === editing.productId ? { ...p, inventory: newInventory } : p));
    toast.success('Stock updated');
    setEditing(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)  return { label:'Out of Stock', cls:'text-red-400 bg-red-500/10' };
    if (stock < 5)   return { label:'Critical',     cls:'text-red-400 bg-red-500/10' };
    if (stock < 15)  return { label:'Low Stock',    cls:'text-yellow-400 bg-yellow-500/10' };
    return { label:'In Stock', cls:'text-green-400 bg-green-500/10' };
  };

  // Flatten all variants for display
  const rows = products.flatMap(p =>
    (p.variants || []).map(v => ({
      product: p,
      variant: v,
      stock: p.inventory?.[v.sku] ?? v.stock ?? 0,
    }))
  ).filter(r => {
    const matchSearch = r.product.name.toLowerCase().includes(search.toLowerCase()) || r.variant.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'low'  && r.stock > 0  && r.stock < 15) ||
      (filter === 'out'  && r.stock === 0) ||
      (filter === 'ok'   && r.stock >= 15);
    return matchSearch && matchFilter;
  });

  const summary = {
    total:   rows.length,
    out:     rows.filter(r => r.stock === 0).length,
    low:     rows.filter(r => r.stock > 0 && r.stock < 15).length,
    ok:      rows.filter(r => r.stock >= 15).length,
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-light text-admin-text">Inventory</h1>
        <p className="text-admin-muted text-sm mt-1">Manage stock levels across all variants</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total SKUs',    value:summary.total, cls:'text-admin-text' },
          { label:'In Stock',      value:summary.ok,    cls:'text-green-400' },
          { label:'Low Stock',     value:summary.low,   cls:'text-yellow-400' },
          { label:'Out of Stock',  value:summary.out,   cls:'text-red-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="admin-card">
            <p className={`text-3xl font-display font-light ${cls}`}>{value}</p>
            <p className="text-xs text-admin-muted uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or SKU…"
            className="w-full bg-admin-surface border border-admin-border pl-10 pr-4 py-2.5 text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-gold/50 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[{v:'all',l:'All'},{v:'ok',l:'In Stock'},{v:'low',l:'Low Stock'},{v:'out',l:'Out of Stock'}].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${filter === f.v ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-admin-surface rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Product','SKU','Size','Colour','Stock','Status','Update'].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, variant, stock }, i) => {
                const status = getStockStatus(stock);
                const isEditing = editing?.productId === product.id && editing?.sku === variant.sku;
                return (
                  <tr key={`${product.id}-${variant.sku}-${i}`} className="admin-table-row">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <div className="relative w-8 h-10 overflow-hidden bg-admin-bg shrink-0">
                            <Image src={product.images[0]} alt="" fill className="object-cover" sizes="32px" />
                          </div>
                        )}
                        <span className="text-admin-text text-xs max-w-[160px] truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-admin-muted">{variant.sku || '—'}</td>
                    <td className="py-3 pr-4 text-admin-muted text-xs">{variant.size}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 text-xs text-admin-muted">
                        <span className="w-3 h-3 rounded-full border border-admin-border" style={{ background: variant.colorHex }} />
                        {variant.color}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {isEditing ? (
                        <input type="number" value={editing.stock} min={0}
                          onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })}
                          className="w-20 bg-admin-bg border border-gold/50 px-2 py-1 text-sm text-admin-text rounded focus:outline-none" />
                      ) : (
                        <span className={`font-medium ${stock < 5 ? 'text-red-400' : stock < 15 ? 'text-yellow-400' : 'text-admin-text'}`}>
                          {stock}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={saveStock} className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-2 py-1 rounded">Save</button>
                          <button onClick={() => setEditing(null)} className="text-xs text-admin-muted hover:text-admin-text border border-admin-border px-2 py-1 rounded">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing({ productId:product.id, sku:variant.sku, stock })}
                          className="p-1.5 rounded text-admin-muted hover:text-gold hover:bg-white/5 transition-colors">
                          <Edit size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
