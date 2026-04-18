import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCollections } from '@/lib/firebase/firestore';

export const metadata: Metadata = {
  title: 'Collections — Curated Luxury Ready-to-Wear',
  description: 'Explore VELVET collections — each a thoughtfully curated world of silhouettes, fabrics and colour stories.',
};

// Fallback static data if Firestore empty
const STATIC_COLLECTIONS = [
  { id:'1', slug:'summer-luxe',  name:'Summer Luxe',    description:'Sun-drenched silhouettes in silk, linen and satin for the season ahead.', image:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', productCount:24, isActive:true, createdAt:new Date() },
  { id:'2', slug:'essentials',   name:'The Essentials', description:'Timeless wardrobe foundations crafted for longevity, not seasons.', image:'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80', productCount:18, isActive:true, createdAt:new Date() },
  { id:'3', slug:'evening-edit', name:'Evening Edit',   description:'Considered pieces for moments that demand a little more.', image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', productCount:12, isActive:true, createdAt:new Date() },
];

export default async function CollectionsPage() {
  let collections = await getCollections();
  if (collections.length === 0) collections = STATIC_COLLECTIONS as any;

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="px-5 md:px-10 pt-14 pb-12 border-b border-border">
        <span className="section-eyebrow">Curated worlds</span>
        <h1 className="section-title">Collections</h1>
        <p className="mt-4 text-muted max-w-lg text-sm leading-relaxed">
          Each VELVET collection is a world unto itself — a cohesive edit of silhouettes, fabrics and colour stories.
        </p>
      </div>

      <div className="px-5 md:px-10 py-14 space-y-6">
        {collections.map((col, i) => (
          <Link key={col.id} href={`/collections/${col.slug}`}
            className={`group grid md:grid-cols-2 border border-border overflow-hidden hover:border-black transition-all duration-500 ${i%2===1?'md:[direction:rtl]':''}`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-cream md:[direction:ltr]">
              <Image src={col.image} alt={col.name} fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 50vw"/>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"/>
            </div>
            <div className="flex flex-col justify-center px-8 md:px-14 py-10 md:py-0 bg-white md:[direction:ltr]">
              <p className="text-[10px] tracking-[0.25em] uppercase text-muted mb-3">{col.productCount} Pieces</p>
              <h2 className="font-display text-4xl md:text-5xl font-light">{col.name}</h2>
              <div className="w-10 h-px bg-gold my-5"/>
              <p className="text-muted text-sm leading-relaxed max-w-sm">{col.description}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-medium group-hover:text-gold transition-colors duration-300">
                Explore Collection
                <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-300"/>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mx-5 md:mx-10 mb-14 bg-black text-white px-8 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-light">Can&apos;t choose?</h2>
          <p className="mt-2 text-white/60 text-sm">Browse our complete edit of all pieces.</p>
        </div>
        <Link href="/shop" className="btn-primary bg-gold text-black hover:bg-gold-light shrink-0">
          Shop All Pieces <ArrowRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
