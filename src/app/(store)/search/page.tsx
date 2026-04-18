'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { getDocs, query, where, orderBy } from 'firebase/firestore';
import { productsCol } from '@/lib/firebase/firestore';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

function SearchResults() {
  const params  = useSearchParams();
  const q       = params.get('q') || '';
  const [results,  setResults]  = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true); setSearched(true);
    // Client-side search across product names and tags
    getDocs(query(productsCol, where('isActive','==',true), orderBy('name')))
      .then(snap => {
        const all = snap.docs.map(d => ({ id:d.id,...d.data() } as Product));
        const qLower = q.toLowerCase();
        const matched = all.filter(p =>
          p.name.toLowerCase().includes(qLower) ||
          p.description?.toLowerCase().includes(qLower) ||
          p.categoryId?.toLowerCase().includes(qLower) ||
          p.tags?.some(t => t.toLowerCase().includes(qLower)) ||
          p.collection?.toLowerCase().includes(qLower)
        );
        setResults(matched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-12">
      <div className="mb-10">
        <span className="section-eyebrow">Search results</span>
        <h1 className="font-display text-4xl font-light">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : 'Search'}
        </h1>
        {searched && !loading && (
          <p className="text-muted text-sm mt-2">{results.length} {results.length===1?'piece':'pieces'} found</p>
        )}
      </div>

      {!q ? (
        <div className="text-center py-24">
          <Search size={48} className="text-border mx-auto mb-6"/>
          <p className="font-display text-2xl font-light mb-2">Search our collection</p>
          <p className="text-muted text-sm">Use the search bar above to find pieces, collections and fabrics</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] skeleton"/>)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24">
          <Search size={48} className="text-border mx-auto mb-6"/>
          <p className="font-display text-2xl font-light mb-2">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-muted text-sm mb-8">Try a different term or browse all pieces</p>
          <a href="/shop" className="btn-outline">Browse All</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6">
          {results.map((p,i) => <ProductCard key={p.id} product={p} priority={i<4}/>)}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-[1440px] mx-auto px-5 py-16"><div className="h-10 w-48 skeleton mb-8"/><div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i=><div key={i} className="aspect-[3/4] skeleton"/>)}</div></div>}>
      <SearchResults/>
    </Suspense>
  );
}
