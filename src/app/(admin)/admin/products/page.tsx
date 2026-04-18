'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ArrowRight, Package } from 'lucide-react';
import { getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { productsCol } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');

  const load = async () => {
    const snap = await getDocs(query(productsCol, orderBy('createdAt', 'desc')));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (product: Product) => {
    await updateDoc(doc(db, 'products', product.id), { isActive: !product.isActive });
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    toast.success(`${product.name} ${!product.isActive ? 'published' : 'hidden'}`);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'products', product.id));
    setProducts(ps => ps.filter(p => p.id !== product.id));
    toast.success('Product deleted');
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.categoryId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && p.isActive) || (filter === 'draft' && !p.isActive) || (filter === 'featured' && p.isFeatured) || (filter === 'new' && p.isNew);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-light text-admin-text">Products</h1>
          <p className="text-admin-muted text-sm mt-1">{products.length} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-admin-surface border border-admin-border pl-10 pr-4 py-2.5 text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-gold/50 rounded-lg" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','active','draft','featured','new'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${filter === f ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-admin-surface rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Package size={40} className="text-admin-muted mx-auto mb-4" />
          <p className="text-admin-text font-display text-xl font-light mb-2">No products found</p>
          <Link href="/admin/products/new" className="btn-primary bg-gold text-black text-xs py-2.5 mt-4">Add First Product</Link>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Product','Category','Price','Stock','Status','Flags','Actions'].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50">
              {filtered.map(product => {
                const totalStock = Object.values(product.inventory || {}).reduce((s, v) => s + (v as number), 0);
                return (
                  <tr key={product.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <div className="relative w-12 h-16 overflow-hidden bg-admin-bg shrink-0">
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-16 bg-admin-bg border border-admin-border flex items-center justify-center shrink-0">
                            <Package size={16} className="text-admin-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-admin-text font-medium truncate max-w-[180px]">{product.name}</p>
                          <p className="text-[11px] text-admin-muted font-mono">{product.id.slice(0,8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-admin-muted text-xs">{product.categoryId}</td>
                    <td className="py-3.5 pr-4 text-admin-text">
                      {formatPrice(product.price)}
                      {product.comparePrice && <p className="text-[10px] text-admin-muted line-through">{formatPrice(product.comparePrice)}</p>}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-medium ${totalStock < 5 ? 'text-red-400' : totalStock < 15 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full ${product.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {product.isActive ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {product.isNew        && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">New</span>}
                        {product.isFeatured   && <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">Featured</span>}
                        {product.isBestSeller && <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">Bestseller</span>}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleActive(product)}
                          className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition-colors" title={product.isActive ? 'Hide' : 'Publish'}>
                          {product.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <Link href={`/admin/products/${product.id}`}
                          className="p-1.5 rounded-lg text-admin-muted hover:text-gold hover:bg-white/5 transition-colors" title="Edit">
                          <Edit size={15} />
                        </Link>
                        <button onClick={() => handleDelete(product)}
                          className="p-1.5 rounded-lg text-admin-muted hover:text-red-400 hover:bg-white/5 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                        <Link href={`/shop/${product.slug}`} target="_blank"
                          className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition-colors" title="View">
                          <ArrowRight size={15} />
                        </Link>
                      </div>
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
