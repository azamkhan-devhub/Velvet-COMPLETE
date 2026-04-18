import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300','400','500','600'], style: ['normal','italic'],
  variable: '--font-display', display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300','400','500'],
  variable: '--font-body', display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'VELVET — Luxury Ready-to-Wear', template: '%s | VELVET' },
  description: 'Discover VELVET — curated luxury ready-to-wear. Premium silk, cashmere and linen pieces for the modern wardrobe.',
  keywords: ['luxury clothing', 'designer fashion', 'ready-to-wear', 'silk dresses', 'cashmere', 'Pakistan fashion'],
  authors: [{ name: 'VELVET' }],
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://velvetstore.com',
    siteName: 'VELVET', title: 'VELVET — Luxury Ready-to-Wear',
    description: 'Curated luxury ready-to-wear for the modern wardrobe.',
  },
  twitter: { card: 'summary_large_image', title: 'VELVET', description: 'Luxury Ready-to-Wear' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#0a0a0a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-white text-black font-body antialiased">
        <AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background:'#0a0a0a', color:'#fafaf8', borderRadius:'2px', fontSize:'0.8rem', letterSpacing:'0.05em' },
              success: { iconTheme: { primary:'#c9a96e', secondary:'#0a0a0a' } },
              error:   { iconTheme: { primary:'#ef4444', secondary:'#fafaf8' } },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
