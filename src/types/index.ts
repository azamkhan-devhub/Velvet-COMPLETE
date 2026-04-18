import { Timestamp } from 'firebase/firestore';

// ── User ─────────────────────────────────────────────────────────────
export type UserRole = 'buyer' | 'admin' | 'seller';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  addresses: Address[];
  wishlist: string[];          // product IDs
  createdAt: Timestamp | Date;
  lastLoginAt: Timestamp | Date;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
}

export interface Address {
  id: string;
  label: string;               // 'Home', 'Office', etc.
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

// ── Product ──────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  price: number;
  comparePrice?: number;
  categoryId: string;
  collection: string;
  tags: string[];
  images: string[];            // Cloudinary URLs
  variants: Variant[];
  inventory: Record<string, number>; // sku → stock
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  ratings: { avg: number; count: number };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  stock: number;
  priceAdjustment: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  productCount: number;
  createdAt: Timestamp | Date;
}

// ── Order ────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';

export type PaymentMethod = 'stripe' | 'jazzcash' | 'easypaisa' | 'cod' | 'paypal';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
export type Currency = 'PKR' | 'USD' | 'GBP' | 'AED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  variantId: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  message: string;
  timestamp: Timestamp | Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: Currency;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: Timestamp | Date;
  };
  shippingAddress: ShippingAddress;
  timeline: OrderTimeline[];
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  returnReason?: string;
  refundAmount?: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ── Review ───────────────────────────────────────────────────────────
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Timestamp | Date;
}

// ── Coupon ───────────────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Timestamp | Date;
  validUntil: Timestamp | Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

// ── Cart ─────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  product: Product;
  variantId: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  quantity: number;
  price: number;
}

// ── Analytics ────────────────────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  pendingOrders: number;
  lowStockProducts: number;
  returnRequests: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

// ── Return ────────────────────────────────────────────────────────────
export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  reason: string;
  description: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmount: number;
  createdAt: Timestamp | Date;
  resolvedAt?: Timestamp | Date;
  adminNotes?: string;
}
