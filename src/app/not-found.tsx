import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5 py-20">
      <p className="font-display text-[8rem] md:text-[12rem] font-light leading-none text-sand select-none">404</p>
      <h1 className="font-display text-3xl md:text-4xl font-light -mt-6 mb-4">Page not found</h1>
      <p className="text-muted text-sm max-w-sm mb-10">The page you&apos;re looking for seems to have wandered off. Let us guide you back.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">Return Home <ArrowRight size={14}/></Link>
        <Link href="/shop" className="btn-outline">Shop All Pieces</Link>
      </div>
    </div>
  );
}
