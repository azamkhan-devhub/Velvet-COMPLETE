import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

// Static seed data — replaced by Firestore once Firebase is live
const FEATURED = [
  { id:'1', name:'Silk Drape Midi Dress', slug:'silk-drape-midi-dress', price:28500, comparePrice:35000, categoryId:'Dresses', images:['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], ratings:{ avg:4.9, count:128 }, isNew:true, isBestSeller:false, variants:[{id:'v1',size:'M',color:'Ivory',colorHex:'#f5f0e8',sku:'VLT-001-M-IV',stock:10,priceAdjustment:0}] },
  { id:'2', name:'Cashmere Oversized Blazer', slug:'cashmere-oversized-blazer', price:52000, comparePrice:undefined, categoryId:'Outerwear', images:['https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=800&q=80'], ratings:{ avg:4.8, count:94 }, isNew:false, isBestSeller:true, variants:[{id:'v2',size:'M',color:'Camel',colorHex:'#c9a96e',sku:'VLT-002-M-CM',stock:8,priceAdjustment:0}] },
  { id:'3', name:'Wide-Leg Linen Trousers', slug:'wide-leg-linen-trousers', price:18500, comparePrice:22000, categoryId:'Bottoms', images:['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'], ratings:{ avg:4.7, count:211 }, isNew:false, isBestSeller:true, variants:[{id:'v3',size:'M',color:'Sand',colorHex:'#e8ddd0',sku:'VLT-003-M-SD',stock:20,priceAdjustment:0}] },
  { id:'4', name:'Tailored Wool Coat', slug:'tailored-wool-coat', price:78000, comparePrice:undefined, categoryId:'Outerwear', images:['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80'], ratings:{ avg:5.0, count:38 }, isNew:false, isBestSeller:false, variants:[{id:'v4',size:'M',color:'Black',colorHex:'#0a0a0a',sku:'VLT-004-M-BK',stock:5,priceAdjustment:0}] },
];

const COLLECTIONS = [
  { slug:'summer-luxe',  name:'Summer Luxe',    desc:'Sun-drenched silhouettes in silk, linen and satin.', productCount:24, image:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80' },
  { slug:'essentials',   name:'The Essentials', desc:'Timeless wardrobe foundations crafted for longevity.', productCount:18, image:'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80' },
  { slug:'evening-edit', name:'Evening Edit',   desc:'Considered pieces for moments that demand more.',     productCount:12, image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80' },
];

const TESTIMONIALS = [
  { name:'Sana M.', loc:'Karachi',   text:'The silk dress is everything I hoped for — the quality is absolutely exceptional.', rating:5 },
  { name:'Aisha R.', loc:'Lahore',   text:'Finally a brand that understands luxury without compromise. VELVET is perfection.', rating:5 },
  { name:'Nadia K.', loc:'Islamabad',text:'World-class quality delivered in Pakistan. VELVET has changed how I shop.', rating:5 },
];

export const metadata: Metadata = {
  title: 'VELVET — Luxury Ready-to-Wear | Designer Clothing',
  description: 'Discover VELVET — curated luxury ready-to-wear. Premium silk dresses, cashmere blazers and linen essentials for the modern wardrobe.',
};

import { ProductCard } from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/utils';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[580px] max-h-[960px] overflow-hidden bg-black">
        <Image src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&q=85"
          alt="VELVET Summer Luxe Collection" fill priority className="object-cover opacity-70" sizes="100vw"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
        <div className="relative h-full flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
          <div className="max-w-xl">
            <p className="section-eyebrow text-gold-light animate-fade-up">New Collection — SS 2025</p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.02] animate-fade-up" style={{animationDelay:'0.1s'}}>
              Summer<br/><em>Luxe</em>
            </h1>
            <p className="mt-5 text-white/75 text-base md:text-lg font-light max-w-sm leading-relaxed animate-fade-up" style={{animationDelay:'0.2s'}}>
              Sun-drenched silhouettes in silk, linen and satin. Crafted for the season ahead.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 animate-fade-up" style={{animationDelay:'0.3s'}}>
              <Link href="/collections/summer-luxe" className="btn-primary bg-white text-black hover:bg-gold hover:text-black">
                Explore Collection <ArrowRight size={15}/>
              </Link>
              <Link href="/shop" className="btn-outline border-white text-white hover:bg-white hover:text-black">Shop All</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-black overflow-hidden py-4 border-t border-white/10">
        <div className="marquee-track">
          {Array.from({length:2}).map((_,ri) =>
            ['Luxury Ready-to-Wear','·','Crafted with Purpose','·','Timeless Silhouettes','·','Sustainably Sourced','·','Made to Last','·','Summer Luxe Now Available','·','Free Shipping on PKR 5,000+','·'].map((word,i) => (
              <span key={`${ri}-${i}`} className={`px-6 shrink-0 font-display font-light text-lg ${word==='·'?'text-gold':'text-white/80'}`}>{word}</span>
            ))
          )}
        </div>
      </div>

      {/* Collections */}
      <section className="py-20 md:py-28 px-5 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div><span className="section-eyebrow">Curated worlds</span><h2 className="section-title">Shop by Collection</h2></div>
          <Link href="/collections" className="btn-ghost group">All Collections <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {COLLECTIONS.map((col,i)=>(
            <Link key={col.slug} href={`/collections/${col.slug}`}
              className={`group relative overflow-hidden bg-cream ${i===0?'md:row-span-2':''}`}
              style={{ aspectRatio:i===0?'3/4':'4/3' }}>
              <Image src={col.image} alt={col.name} fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold-light/80 mb-2">{col.productCount} Pieces</p>
                <h3 className="font-display text-2xl md:text-3xl font-light text-white">{col.name}</h3>
                <p className="mt-2 text-sm text-white/70 max-w-xs hidden md:block">{col.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-white text-[11px] tracking-wider uppercase group-hover:gap-3 transition-all">
                  Shop Now <ArrowRight size={12}/>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 px-5 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div><span className="section-eyebrow">Editor&apos;s selection</span><h2 className="section-title">Featured Pieces</h2></div>
          <Link href="/shop?filter=featured" className="btn-ghost group">View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
          {FEATURED.map((p,i)=><ProductCard key={p.id} product={p as any} priority={i<2}/>)}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="grid md:grid-cols-2 min-h-[520px]">
        <div className="relative aspect-square md:aspect-auto overflow-hidden bg-cream">
          <Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85"
            alt="VELVET craftsmanship" fill className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"/>
        </div>
        <div className="bg-cream flex flex-col justify-center px-10 md:px-16 py-16">
          <span className="section-eyebrow">Our philosophy</span>
          <h2 className="font-display text-4xl md:text-5xl font-light leading-tight">Crafted for<br/><em>longevity</em>,<br/>not seasons.</h2>
          <div className="divider"/>
          <p className="text-muted text-base leading-relaxed max-w-sm">Every VELVET piece begins with exceptional fabric sourced from family-run mills in Italy, Scotland and Portugal. We believe in buying less, choosing well, and making it last.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-xs">
            {[['100%','Natural Fibres'],['2+ Year','Guarantee'],['1,000+','Happy Clients']].map(([n,l])=>(
              <div key={l}><p className="font-display text-2xl font-light text-gold">{n}</p><p className="text-[11px] text-muted tracking-wide leading-tight mt-1">{l}</p></div>
            ))}
          </div>
          <Link href="/about" className="btn-outline mt-10 self-start">Our Story <ArrowRight size={14}/></Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-black py-20 md:py-28 px-5 md:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <span className="section-eyebrow text-gold-light/60">Client stories</span>
            <h2 className="section-title text-white">Words from our <em>community</em></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {TESTIMONIALS.map((t,i)=>(
              <blockquote key={i} className="border border-white/10 p-8 hover:border-gold/40 transition-colors duration-300">
                <div className="flex gap-1 mb-5">
                  {Array.from({length:t.rating}).map((_,j)=><Star key={j} size={13} className="fill-gold text-gold"/>)}
                </div>
                <p className="font-display text-xl font-light text-white/90 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <footer className="mt-6"><p className="text-sm text-white/70">{t.name}</p><p className="text-[11px] text-white/30 tracking-wider">{t.loc}</p></footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* USP strip */}
      <section className="border-t border-b border-border py-10 px-5">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['Free Shipping','On orders over PKR 5,000'],['Easy Returns','30-day hassle-free returns'],['Secure Payment','Stripe, JazzCash & COD'],['Expert Care','Personal styling support']].map(([t,s])=>(
            <div key={t}><h3 className="font-display text-lg font-light">{t}</h3><p className="text-xs text-muted tracking-wide mt-1">{s}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
