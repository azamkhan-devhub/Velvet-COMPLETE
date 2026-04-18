import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, Timestamp,
  QueryConstraint, addDoc, increment, serverTimestamp, DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './client';
import { Product, Order, AppUser, Review, Coupon, Collection, ReturnRequest } from '@/types';

// ── Collection refs ──────────────────────────────────────────────────
export const usersCol     = collection(db, 'users');
export const productsCol  = collection(db, 'products');
export const ordersCol    = collection(db, 'orders');
export const reviewsCol   = collection(db, 'reviews');
export const couponsCol   = collection(db, 'coupons');
export const collectionsCol = collection(db, 'collections');
export const categoriesCol  = collection(db, 'categories');
export const returnsCol     = collection(db, 'returns');

// ── Helpers ──────────────────────────────────────────────────────────
const snap2 = <T>(snap: DocumentSnapshot): T | null =>
  snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;

// ── Users ────────────────────────────────────────────────────────────
export async function getUser(uid: string) {
  const snap = await getDoc(doc(usersCol, uid));
  return snap2<AppUser>(snap);
}

export async function upsertUser(uid: string, data: Partial<AppUser>) {
  await setDoc(doc(usersCol, uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Products ─────────────────────────────────────────────────────────
export async function getProducts(constraints: QueryConstraint[] = []) {
  const q = query(productsCol, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getProductBySlug(slug: string) {
  const q = query(productsCol, where('slug', '==', slug), where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Product);
}

export async function getProductById(id: string) {
  const snap = await getDoc(doc(productsCol, id));
  return snap2<Product>(snap);
}

export async function createProduct(data: Omit<Product, 'id'>) {
  const ref = await addDoc(productsCol, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await updateDoc(doc(productsCol, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(productsCol, id));
}

// ── Orders ───────────────────────────────────────────────────────────
export async function createOrder(data: Omit<Order, 'id'>) {
  const ref = await addDoc(ordersCol, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  // Update user stats
  await updateDoc(doc(usersCol, data.userId), {
    totalOrders: increment(1),
    totalSpent:  increment(data.total),
  });
  return ref.id;
}

export async function getOrder(id: string) {
  const snap = await getDoc(doc(ordersCol, id));
  return snap2<Order>(snap);
}

export async function getUserOrders(userId: string) {
  const q = query(ordersCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(orderId: string, status: Order['status'], message: string) {
  const orderRef = doc(ordersCol, orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error('Order not found');
  const existing = snap.data() as Order;
  await updateDoc(orderRef, {
    status,
    timeline: [...(existing.timeline || []), { status, message, timestamp: Timestamp.now() }],
    updatedAt: serverTimestamp(),
  });
}

// ── Reviews ──────────────────────────────────────────────────────────
export async function getProductReviews(productId: string) {
  const q = query(reviewsCol, where('productId', '==', productId), where('isApproved', '==', true), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

export async function addReview(data: Omit<Review, 'id'>) {
  const ref = await addDoc(reviewsCol, { ...data, createdAt: serverTimestamp() });
  // Recalculate product rating
  const allReviews = await getProductReviews(data.productId);
  const allWithNew = [...allReviews, { ...data, id: ref.id }];
  const avg = allWithNew.reduce((s, r) => s + r.rating, 0) / allWithNew.length;
  await updateDoc(doc(productsCol, data.productId), {
    'ratings.avg': Math.round(avg * 10) / 10,
    'ratings.count': allWithNew.length,
  });
  return ref.id;
}

// ── Coupons ──────────────────────────────────────────────────────────
export async function validateCoupon(code: string, orderAmount: number): Promise<Coupon | null> {
  const q = query(couponsCol, where('code', '==', code.toUpperCase()), where('isActive', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
  const now = new Date();
  const validFrom = coupon.validFrom instanceof Timestamp ? coupon.validFrom.toDate() : new Date(coupon.validFrom);
  const validUntil = coupon.validUntil instanceof Timestamp ? coupon.validUntil.toDate() : new Date(coupon.validUntil);
  if (now < validFrom || now > validUntil) return null;
  if (coupon.usedCount >= coupon.usageLimit) return null;
  if (orderAmount < coupon.minOrderAmount) return null;
  return coupon;
}

export function calcDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === 'percentage') {
    const disc = (subtotal * coupon.discountValue) / 100;
    return coupon.maxDiscountAmount ? Math.min(disc, coupon.maxDiscountAmount) : disc;
  }
  return Math.min(coupon.discountValue, subtotal);
}

// ── Collections ───────────────────────────────────────────────────────
export async function getCollections() {
  const q = query(collectionsCol, where('isActive', '==', true), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
}

// ── Returns ───────────────────────────────────────────────────────────
export async function createReturn(data: Omit<ReturnRequest, 'id'>) {
  const ref = await addDoc(returnsCol, { ...data, createdAt: serverTimestamp() });
  await updateOrderStatus(data.orderId, 'return_requested', 'Return request submitted by customer');
  return ref.id;
}
