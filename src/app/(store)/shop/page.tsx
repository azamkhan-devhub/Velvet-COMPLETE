import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShopClient } from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop All — Luxury Ready-to-Wear',
  description: 'Browse our complete collection of luxury ready-to-wear. Filter by category, size and price to find your perfect piece.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16">
        <div className="h-10 w-48 skeleton mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="aspect-[3/4] skeleton" />
          ))}
        </div>
      </div>
    }>
      <ShopClient />
    </Suspense>
  );
}
