import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent({ searchParams }: { searchParams: { orderId?: string; orderNumber?: string } }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-5 py-16 text-center page-enter">
      <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mb-8">
        <CheckCircle size={36} className="text-green-500" />
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-light mb-3">Order Confirmed!</h1>
      <p className="text-muted text-base mb-2 max-w-md">
        Thank you for your purchase. Your order has been placed and we&apos;re preparing it for shipment.
      </p>
      {searchParams.orderNumber && (
        <div className="inline-block bg-cream px-6 py-3 my-4">
          <p className="text-[10px] tracking-wider uppercase text-muted mb-1">Order Number</p>
          <p className="font-mono text-lg font-medium">#{searchParams.orderNumber}</p>
        </div>
      )}
      <p className="text-sm text-muted mb-10 max-w-sm">
        You&apos;ll receive a confirmation email with your order details and tracking information once your order ships.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {searchParams.orderId && (
          <Link href={`/account/orders/${searchParams.orderId}`} className="btn-primary">
            <Package size={15} /> Track My Order
          </Link>
        )}
        <Link href="/shop" className="btn-outline">
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { orderId?: string; orderNumber?: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"/></div>}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
