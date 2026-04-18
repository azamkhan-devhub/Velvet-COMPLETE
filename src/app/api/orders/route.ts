import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { generateOrderNumber } from '@/lib/utils/index';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error:'Unauthorized' },{ status:401 });
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { items, shippingAddress, payment, subtotal, discount, shippingCost, tax, total, currency, couponCode } = body;

    if (!items?.length) return NextResponse.json({ error:'No items' },{ status:400 });

    const orderNumber = generateOrderNumber();
    const orderRef = adminDb.collection('orders').doc();

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.data() || {};

    const orderData = {
      id: orderRef.id,
      orderNumber,
      userId:    decoded.uid,
      userEmail: decoded.email || '',
      userName:  userData.displayName || decoded.name || 'Customer',
      items,
      subtotal,
      discount:     discount || 0,
      shippingCost: shippingCost || 0,
      tax:          tax || 0,
      total,
      currency:     currency || 'PKR',
      status: 'pending',
      payment: { ...payment, status: payment.method === 'cod' ? 'unpaid' : 'unpaid' },
      shippingAddress,
      couponCode: couponCode || null,
      timeline: [{ status:'pending', message:'Order placed successfully', timestamp: new Date() }],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderData);

    // Update user stats
    await adminDb.collection('users').doc(decoded.uid).update({
      totalOrders: FieldValue.increment(1),
      totalSpent:  FieldValue.increment(total),
    });

    // Update coupon usage
    if (couponCode) {
      const couponSnap = await adminDb.collection('coupons').where('code','==',couponCode).limit(1).get();
      if (!couponSnap.empty) {
        await couponSnap.docs[0].ref.update({ usedCount: FieldValue.increment(1) });
      }
    }

    // Update inventory
    for (const item of items) {
      const prodRef = adminDb.collection('products').doc(item.productId);
      const prodSnap = await prodRef.get();
      if (prodSnap.exists) {
        const inv = prodSnap.data()?.inventory || {};
        const current = inv[item.sku] || 0;
        await prodRef.update({ [`inventory.${item.sku}`]: Math.max(0, current - item.quantity) });
      }
    }

    return NextResponse.json({ orderId: orderRef.id, orderNumber }, { status:201 });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status:500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error:'Unauthorized' },{ status:401 });
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDb.collection('orders')
      .where('userId','==',decoded.uid)
      .orderBy('createdAt','desc')
      .get();

    const orders = snap.docs.map(d => ({ id:d.id,...d.data() }));
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
