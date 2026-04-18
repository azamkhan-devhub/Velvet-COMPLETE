import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCollections, getProducts } from '@/lib/firebase/firestore';
import { where } from 'firebase/firestore';
import { ProductCard } from '@/components/product/ProductCard';

const STATIC_COLLECTIONS = [
  { id:'1', slug:'summer-luxe',  name:'Summer Luxe',    description:'Sun-drenched silhouettes in silk, linen and satin for the season ahead.', image:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', productCount:24, isActive:true, createdAt:new Date() },
  { id:'2', slug:'essentials',   name:'The Essentials', description:'Timeless wardrobe foundations crafted for longevity, not seasons.', image:'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80', productCount:18, isActive:true, createdAt:new Date() },
  { id:'3', slug:'evening-edit', name:'Evening Edit',   description:'Considered pieces for moments that demand a little more.', image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', productCount:12, isActive:true, createdAt:new Date() },
];

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let collections = await getCollections();
  if (!collections.length) collections = STATIC_COLLECTIONS as any;
  const col = collections.find(c => c.slug === params.slug);
  if (!col) return { title:'Collection Not Found' };
  return { title:`${col.name} Collection`, description:col.description };
}

export default async function CollectionPage({ params }: Props) {
  let allCollections = await getCollections();
  if (!allCollections.length) allCollections = STATIC_COLLECTIONS as any;

  const col = allCollections.find(c => c.slug === params.slug);
  if (!col) notFound();

  const products = await getProducts([where('collection','==',params.slug), where('isActive','==',true)]);
  const others   = allCollections.filter(c => c.slug !== params.slug);

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[380px] max-h-[560px] overflow-hidden bg-black">
        <Image src={col.image} alt={col.name} fill priority className="object-cover opacity-60" sizes="100vw"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
        <div className="relative h-full flex flex-col justify-end px-6 md:px-14 pb-12">
          <nav className="text-[10px] tracking-wider text-white/50 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/collections" className="hover:text-white/80">Collections</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{col.name}</span>
          </nav>
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold-light mb-3">{col.productCount} Pieces</p>
          <h1 className="font-display text-5xl md:text-7xl font-light text-white">{col.name}</h1>
          <p className="mt-4 text-white/70 text-base max-w-md">{col.description}</p>
        </div>
      </div>

      {/* Products */}
      <section className="px-5 md:px-10 py-14">
        {products.length > 0 ? (
          <>
            <p className="text-sm text-muted mb-8">{products.length} pieces</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6">
              {products.map((p,i) => <ProductCard key={p.id} product={p} priority={i<4}/>)}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <p className="font-display text-3xl font-light mb-4">Coming Soon</p>
            <p className="text-muted text-sm mb-8">This collection drops very soon. Join our inner circle to get first access.</p>
            <Link href="/shop" className="btn-outline">Browse All Pieces</Link>
          </div>
        )}
      </section>

      {/* Other collections */}
      {others.length > 0 && (
        <section className="border-t border-border px-5 md:px-10 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-light">Other Collections</h2>
            <Link href="/collections" className="btn-ghost group text-sm">
              All Collections <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map(other => (
              <Link key={other.id} href={`/collections/${other.slug}`}
                className="group relative aspect-[4/3] overflow-hidden bg-cream">
                <Image src={other.image} alt={other.name} fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                <div className="absolute bottom-0 p-5">
                  <h3 className="font-display text-xl font-light text-white">{other.name}</h3>
                  <span className="text-white/70 text-[11px] tracking-wider flex items-center gap-1.5 mt-1 group-hover:text-gold transition-colors">
                    Explore <ArrowRight size={11}/>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
