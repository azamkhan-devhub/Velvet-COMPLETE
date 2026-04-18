import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Truck, RotateCcw, Shield } from 'lucide-react';
import { getProductBySlug, getProductReviews, getProducts } from '@/lib/firebase/firestore';
import { where, limit } from 'firebase/firestore';
import { formatPrice, getDiscount, formatDate } from '@/lib/utils';
import { ProductGallery } from './ProductGallery';
import { ProductActions } from './ProductActions';
import { ProductCard } from '@/components/product/ProductCard';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title:'Product Not Found' };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title:`${product.name} | VELVET`,
      description: product.description,
      images:[{ url:product.images[0], width:800, height:1067, alt:product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [reviews, relatedProducts] = await Promise.all([
    getProductReviews(product.id),
    getProducts([where('categoryId','==',product.categoryId), where('isActive','==',true), limit(4)]),
  ]);

  const related  = relatedProducts.filter(p => p.id !== product.id).slice(0,4);
  const discount = getDiscount(product.price, product.comparePrice);

  return (
    <article className="max-w-[1440px] mx-auto">
      {/* Breadcrumb */}
      <nav className="px-5 md:px-10 py-4 text-[11px] text-muted tracking-wider" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-black transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li><Link href="/shop" className="hover:text-black transition-colors">Shop</Link></li>
          <li className="text-border">/</li>
          <li><Link href={`/shop?category=${product.categoryId}`} className="hover:text-black transition-colors">{product.categoryId}</Link></li>
          <li className="text-border">/</li>
          <li className="text-black truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      {/* Main layout */}
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Info */}
        <div className="px-6 md:px-10 lg:px-14 py-8 lg:py-12 lg:sticky lg:top-[68px] lg:self-start">
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            {product.isNew        && <span className="badge-new">New Arrival</span>}
            {product.isBestSeller && <span className="badge bg-sand text-black border border-border">Bestseller</span>}
            {discount > 0         && <span className="badge-sale">{discount}% Off</span>}
          </div>

          <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">{product.categoryId}</p>
          <h1 className="font-display text-3xl md:text-4xl font-light leading-tight">{product.name}</h1>

          {/* Rating summary */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex gap-0.5">
              {Array.from({length:5}).map((_,i) => (
                <Star key={i} size={14} className={i < Math.floor(product.ratings?.avg||0) ? 'fill-gold text-gold' : 'fill-border text-border'}/>
              ))}
            </div>
            <span className="text-sm text-muted">{product.ratings?.avg || 0} ({product.ratings?.count || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mt-5">
            <span className="font-display text-3xl font-light">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-lg text-muted line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>

          <p className="mt-5 text-sm text-muted leading-relaxed">{product.description}</p>

          <div className="w-10 h-px bg-gold my-7" />

          {/* Add to cart, wishlist */}
          <ProductActions product={product} />

          {/* Details accordion */}
          <details className="border-t border-border mt-8 pt-5 group">
            <summary className="flex items-center justify-between cursor-pointer text-[11px] tracking-[0.18em] uppercase font-medium list-none">
              Product Details
              <span className="text-muted group-open:rotate-180 transition-transform duration-200">▾</span>
            </summary>
            <ul className="mt-4 space-y-2">
              {product.details?.map((d,i) => (
                <li key={i} className="text-sm text-muted flex gap-3">
                  <span className="text-gold shrink-0">—</span>{d}
                </li>
              ))}
            </ul>
          </details>

          {/* Shipping */}
          <div className="mt-6 border-t border-border pt-5 space-y-3">
            {[
              { Icon:Truck,     text:'Free shipping on orders over PKR 5,000' },
              { Icon:RotateCcw, text:'Free returns within 30 days' },
              { Icon:Shield,    text:'100% authentic — quality guaranteed' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted">
                <Icon size={15} className="text-gold shrink-0"/>{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="px-5 md:px-10 py-14 border-t border-border" aria-labelledby="reviews-heading">
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="section-eyebrow">What our clients say</span>
                <h2 id="reviews-heading" className="section-title text-3xl">Reviews ({reviews.length})</h2>
              </div>
              <div className="text-center">
                <p className="font-display text-5xl font-light text-gold">{product.ratings?.avg}</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {Array.from({length:5}).map((_,i) => (
                    <Star key={i} size={13} className={i<Math.floor(product.ratings?.avg||0)?'fill-gold text-gold':'fill-border text-border'}/>
                  ))}
                </div>
                <p className="text-xs text-muted">{product.ratings?.count} reviews</p>
              </div>
            </div>
            <div className="space-y-6">
              {reviews.slice(0,6).map(r => (
                <div key={r.id} className="border-b border-border pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({length:5}).map((_,i) => (
                          <Star key={i} size={12} className={i<r.rating?'fill-gold text-gold':'fill-border text-border'}/>
                        ))}
                      </div>
                      <h3 className="font-medium text-sm">{r.title}</h3>
                      <p className="text-sm text-muted mt-1">{r.comment}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{r.userName}</p>
                      <p className="text-xs text-muted">{formatDate(r.createdAt as any)}</p>
                      {r.isVerified && <span className="text-[9px] tracking-wider uppercase text-green-600 mt-1 block">Verified Purchase</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section className="px-5 md:px-10 py-16 border-t border-border" aria-labelledby="related-heading">
          <div className="mb-10">
            <span className="section-eyebrow">You may also like</span>
            <h2 id="related-heading" className="section-title">Related Pieces</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {related.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        </section>
      )}
    </article>
  );
}
