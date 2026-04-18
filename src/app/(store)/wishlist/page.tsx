'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/lib/store';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductById } from '@/lib/firebase/firestore';
import { Product } from '@/types';

export default function WishlistPage() {
  const { productIds } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (productIds.length === 0) { setLoading(false); return; }
    Promise.all(productIds.map(id => getProductById(id)))
      .then(results => { setProducts(results.filter(Boolean) as Product[]); setLoading(false); });
  }, [productIds]);

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16">
      <div className="mb-10 border-b border-border pb-8">
        <span className="section-eyebrow">Your saves</span>
        <h1 className="section-title flex items-center gap-4">
          Wishlist
          {productIds.length > 0 && <span className="text-xl text-muted font-body font-light">({productIds.length})</span>}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] skeleton"/>)}
        </div>
      ) : productIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <Heart size={64} className="text-border"/>
          <div>
            <h2 className="font-display text-3xl font-light mb-3">Your wishlist is empty</h2>
            <p className="text-muted text-sm max-w-xs">Save pieces you love by clicking the heart on any product.</p>
          </div>
          <Link href="/shop" className="btn-primary mt-2">Explore the Edit <ArrowRight size={15}/></Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6">
            {products.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
          <div className="mt-12 text-center">
            <Link href="/shop" className="btn-outline">Continue Shopping <ArrowRight size={14}/></Link>
          </div>
        </>
      )}
    </div>
  );
}
