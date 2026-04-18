import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error:'Unauthorized' },{ status:401 });
    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ error:'No code provided' },{ status:400 });

    const snap = await adminDb.collection('coupons')
      .where('code','==',code.toUpperCase().trim())
      .where('isActive','==',true)
      .limit(1).get();

    if (snap.empty) return NextResponse.json({ error:'Invalid coupon code' },{ status:404 });

    const coupon = { id:snap.docs[0].id, ...snap.docs[0].data() } as any;
    const now = new Date();
    const validFrom  = coupon.validFrom?.toDate?.() || new Date(coupon.validFrom);
    const validUntil = coupon.validUntil?.toDate?.() || new Date(coupon.validUntil);

    if (now < validFrom)  return NextResponse.json({ error:'Coupon is not yet active' },{ status:400 });
    if (now > validUntil) return NextResponse.json({ error:'Coupon has expired' },{ status:400 });
    if (coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ error:'Coupon usage limit reached' },{ status:400 });
    if (subtotal < coupon.minOrderAmount) return NextResponse.json({ error:`Minimum order amount is PKR ${coupon.minOrderAmount.toLocaleString()}` },{ status:400 });

    let discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    discount = Math.min(discount, subtotal);

    return NextResponse.json({ coupon, discount: Math.round(discount) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
