'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutGrid, Package } from 'lucide-react';
import { getDocs, query, where, orderBy } from 'firebase/firestore';
import { productsCol } from '@/lib/firebase/firestore';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

const CATEGORIES = ['All','Dresses','Tops','Bottoms','Outerwear','Accessories'];
const SIZES      = ['XS','S','M','L','XL','XXL'];
const SORT_OPTS  = [
  { label:'Newest',         value:'newest' },
  { label:'Price: Low–High',value:'price-asc' },
  { label:'Price: High–Low',value:'price-desc' },
  { label:'Best Sellers',   value:'bestsellers' },
  { label:'Top Rated',      value:'rating' },
];
const PRICE_RANGES = [
  { label:'Under PKR 15,000',   min:0,     max:15000 },
  { label:'PKR 15,000–30,000',  min:15000, max:30000 },
  { label:'PKR 30,000–60,000',  min:30000, max:60000 },
  { label:'PKR 60,000+',        min:60000, max:999999 },
];

export function ShopClient() {
  const params = useSearchParams();
  const filterParam   = params.get('filter')   || '';
  const categoryParam = params.get('category') || '';

  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState(categoryParam || 'All');
  const [selSizes,  setSelSizes]  = useState<string[]>([]);
  const [priceIdx,  setPriceIdx]  = useState<number|null>(null);
  const [sortBy,    setSortBy]    = useState('newest');
  const [filtersOpen,setFilters]  = useState(false);
  const [cols,      setCols]      = useState<2|3>(3);

  // Load from Firestore
  useEffect(() => {
    setLoading(true);
    const constraints: any[] = [where('isActive','==',true)];
    if (filterParam === 'new')         constraints.push(where('isNew','==',true));
    if (filterParam === 'featured')    constraints.push(where('isFeatured','==',true));
    if (filterParam === 'bestsellers') constraints.push(where('isBestSeller','==',true));
    if (categoryParam && categoryParam !== 'All') constraints.push(where('categoryId','==',categoryParam));

    getDocs(query(productsCol, ...constraints, orderBy('createdAt','desc')))
      .then(snap => {
        setProducts(snap.docs.map(d => ({ id:d.id, ...d.data() } as Product)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterParam, categoryParam]);

  const toggleSize = (s: string) =>
    setSelSizes(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'All')    list = list.filter(p => p.categoryId === category);
    if (selSizes.length > 0)   list = list.filter(p => p.variants?.some(v => selSizes.includes(v.size)));
    if (priceIdx !== null) {
      const { min, max } = PRICE_RANGES[priceIdx];
      list = list.filter(p => p.price >= min && p.price <= max);
    }
    switch (sortBy) {
      case 'price-asc':   list.sort((a,b) => a.price - b.price);             break;
      case 'price-desc':  list.sort((a,b) => b.price - a.price);             break;
      case 'bestsellers': list.sort((a,b) => +b.isBestSeller - +a.isBestSeller); break;
      case 'rating':      list.sort((a,b) => (b.ratings?.avg||0) - (a.ratings?.avg||0)); break;
    }
    return list;
  }, [products, category, selSizes, priceIdx, sortBy]);

  const hasFilters = category !== 'All' || selSizes.length > 0 || priceIdx !== null;

  const clearFilters = () => { setCategory('All'); setSelSizes([]); setPriceIdx(null); };

  const FilterPanel = () => (
    <div className="space-y-7">
      {hasFilters && (
        <button onClick={clearFilters} className="text-[10px] tracking-wider text-muted hover:text-black transition-colors uppercase w-full text-left">
          Clear all filters
        </button>
      )}
      {/* Category */}
      <div>
        <h3 className="text-[10px] tracking-[0.18em] uppercase text-muted mb-3 font-medium">Category</h3>
        <ul className="space-y-1.5">
          {CATEGORIES.map(cat => (
            <li key={cat}>
              <button onClick={() => setCategory(cat)}
                className={`text-sm w-full text-left py-1 transition-colors flex items-center justify-between ${category===cat?'text-black font-medium':'text-muted hover:text-black'}`}>
                {cat}
                {category===cat && <span className="text-gold text-xs">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Size */}
      <div>
        <h3 className="text-[10px] tracking-[0.18em] uppercase text-muted mb-3 font-medium">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`text-xs border px-3 py-1.5 transition-colors ${selSizes.includes(s)?'bg-black text-white border-black':'border-border hover:border-black'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {/* Price */}
      <div>
        <h3 className="text-[10px] tracking-[0.18em] uppercase text-muted mb-3 font-medium">Price</h3>
        <ul className="space-y-2">
          {PRICE_RANGES.map((r, i) => (
            <li key={r.label}>
              <button onClick={() => setPriceIdx(priceIdx===i ? null : i)}
                className={`text-sm transition-colors ${priceIdx===i?'text-black font-medium':'text-muted hover:text-black'}`}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="px-5 md:px-10 pt-10 pb-8 border-b border-border">
        <span className="section-eyebrow">Discover</span>
        <h1 className="font-display text-4xl md:text-5xl font-light">
          {filterParam==='new' ? 'New Arrivals' : filterParam==='bestsellers' ? 'Bestsellers' : filterParam==='featured' ? 'Featured Pieces' : 'Shop All'}
        </h1>
        <p className="mt-2 text-sm text-muted">{loading ? 'Loading…' : `${filtered.length} pieces`}</p>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-border px-6 py-8 sticky top-[68px] self-start h-[calc(100vh-68px)] overflow-y-auto">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium mb-6">Filters</h2>
          <FilterPanel />
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-border sticky top-[68px] bg-white/95 backdrop-blur-sm z-10">
            {/* Mobile filter */}
            <button onClick={() => setFilters(true)}
              className="lg:hidden flex items-center gap-2 text-[11px] tracking-wider uppercase border border-border px-4 py-2 hover:border-black transition-colors">
              <SlidersHorizontal size={13} /> Filters{hasFilters ? ` (on)` : ''}
            </button>

            {/* Active filter chips — desktop */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {category !== 'All' && (
                <span className="flex items-center gap-1.5 text-[10px] border border-black px-2.5 py-1">
                  {category}
                  <button onClick={() => setCategory('All')}><X size={10}/></button>
                </span>
              )}
              {selSizes.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-[10px] border border-black px-2.5 py-1">
                  {s} <button onClick={() => toggleSize(s)}><X size={10}/></button>
                </span>
              ))}
              {priceIdx !== null && (
                <span className="flex items-center gap-1.5 text-[10px] border border-black px-2.5 py-1">
                  {PRICE_RANGES[priceIdx].label}
                  <button onClick={() => setPriceIdx(null)}><X size={10}/></button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Grid cols */}
              <div className="hidden md:flex items-center border border-border">
                <button onClick={() => setCols(3)} className={`p-2 transition-colors ${cols===3?'bg-black text-white':'hover:bg-cream'}`}><Grid3X3 size={14}/></button>
                <button onClick={() => setCols(2)} className={`p-2 transition-colors ${cols===2?'bg-black text-white':'hover:bg-cream'}`}><LayoutGrid size={14}/></button>
              </div>
              {/* Sort */}
              <div className="relative">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent border border-border px-4 pr-8 py-2 text-[11px] tracking-wider uppercase cursor-pointer focus:outline-none focus:border-black">
                  {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"/>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className={`px-5 md:px-8 py-8 grid gap-x-4 gap-y-12 md:gap-x-6 ${cols===3?'grid-cols-2 lg:grid-cols-3':'grid-cols-2'}`}>
            {loading ? (
              Array.from({length:6}).map((_,i) => <div key={i} className="aspect-[3/4] skeleton"/>)
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-24">
                <Package size={48} className="text-border mx-auto mb-4"/>
                <p className="font-display text-2xl font-light mb-3">No pieces found</p>
                <p className="text-sm text-muted mb-6">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
              </div>
            ) : (
              filtered.map((p,i) => <ProductCard key={p.id} product={p} priority={i<3}/>)
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setFilters(false)}/>
          <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">Filters</h2>
              <button onClick={() => setFilters(false)}><X size={20}/></button>
            </div>
            <FilterPanel />
            <button onClick={() => setFilters(false)} className="btn-primary w-full mt-6">
              View {filtered.length} Pieces
            </button>
          </div>
        </>
      )}
    </div>
  );
}
