import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white/80">
      <div className="border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-display text-3xl md:text-4xl font-light text-white">The inner circle.</h3>
            <p className="mt-2 text-sm text-white/50 max-w-xs">Early access to new drops and exclusive offers.</p>
          </div>
          <form className="flex w-full md:w-auto gap-0 max-w-sm">
            <input type="email" placeholder="Your email address"
              className="flex-1 md:w-72 bg-white/5 border border-white/15 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold font-body" />
            <button type="submit" className="px-6 py-3.5 bg-gold text-black text-[11px] tracking-[0.18em] uppercase font-medium hover:bg-gold-light transition-colors font-body whitespace-nowrap">Join</button>
          </form>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {[
          { title: 'Shop', links: [{ label:'New Arrivals', href:'/shop?filter=new' },{ label:'Best Sellers', href:'/shop?filter=bestsellers' },{ label:'Collections', href:'/collections' },{ label:'Dresses', href:'/shop?category=Dresses' },{ label:'Tops', href:'/shop?category=Tops' },{ label:'Outerwear', href:'/shop?category=Outerwear' }] },
          { title: 'Account', links: [{ label:'My Account', href:'/account' },{ label:'My Orders', href:'/account/orders' },{ label:'Wishlist', href:'/wishlist' },{ label:'Sign In', href:'/auth/login' }] },
          { title: 'Help', links: [{ label:'Contact Us', href:'/contact' },{ label:'Shipping & Returns', href:'/shipping' },{ label:'Size Guide', href:'/size-guide' },{ label:'FAQs', href:'/faqs' },{ label:'Track Order', href:'/account/orders' }] },
          { title: 'Company', links: [{ label:'About VELVET', href:'/about' },{ label:'Sustainability', href:'/sustainability' },{ label:'Privacy Policy', href:'/privacy' },{ label:'Terms & Conditions', href:'/terms' }] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-5 font-body">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map(l => (
                <li key={l.href}><Link href={l.href} className="text-sm text-white/65 hover:text-gold transition-colors font-body">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl text-white/90 tracking-[0.22em] uppercase">Velvet</span>
            <p className="text-[11px] text-white/30 font-body">© {new Date().getFullYear()} VELVET. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-5">
            {[{ Icon: Instagram, href:'https://instagram.com', label:'Instagram' },{ Icon: Facebook, href:'https://facebook.com', label:'Facebook' },{ Icon: Twitter, href:'https://twitter.com', label:'Twitter' }].map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-gold transition-colors" aria-label={label}><Icon size={17} /></a>
            ))}
            <div className="flex items-center gap-2 ml-2">
              {['Visa','MC','JazCash','Easypaisa','COD'].map(p => (
                <span key={p} className="text-[9px] tracking-wider border border-white/15 px-2 py-1 text-white/40 font-body">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
