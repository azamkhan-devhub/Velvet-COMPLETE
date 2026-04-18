import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error:`Webhook signature failed: ${err.message}` },{ status:400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await adminDb.collection('orders').doc(orderId).update({
          'payment.status': 'paid',
          'payment.transactionId': pi.id,
          'payment.paidAt': new Date(),
          status: 'confirmed',
          timeline: FieldValue.arrayUnion({
            status: 'confirmed',
            message: 'Payment received via Stripe',
            timestamp: new Date(),
          }),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await adminDb.collection('orders').doc(orderId).update({
          'payment.status': 'unpaid',
          status: 'cancelled',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const orderId = charge.metadata?.orderId;
      if (orderId) {
        await adminDb.collection('orders').doc(orderId).update({
          'payment.status': 'refunded',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
