'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Coupon } from '@/types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  coupon: Coupon | null;
  discount: number;
  addItem: (product: Product, variantId: string, size: string, color: string, colorHex: string, sku: string, price: number) => void;
  removeItem: (sku: string) => void;
  updateQty: (sku: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (coupon: Coupon, discount: number) => void;
  removeCoupon: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

interface WishlistStore {
  productIds: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [], isOpen: false, coupon: null, discount: 0,
      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product, variantId, size, color, colorHex, sku, price) => {
        const existing = get().items.find(i => i.sku === sku);
        if (existing) {
          set({ items: get().items.map(i => i.sku === sku ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...get().items, { productId: product.id, product, variantId, size, color, colorHex, sku, quantity: 1, price }] });
        }
        set({ isOpen: true });
      },
      removeItem: (sku) => set({ items: get().items.filter(i => i.sku !== sku) }),
      updateQty: (sku, qty) => {
        if (qty <= 0) { get().removeItem(sku); return; }
        set({ items: get().items.map(i => i.sku === sku ? { ...i, quantity: qty } : i) });
      },
      clearCart: () => set({ items: [], coupon: null, discount: 0 }),
      applyCoupon: (coupon, discount) => set({ coupon, discount }),
      removeCoupon: () => set({ coupon: null, discount: 0 }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'velvet-cart-v2' }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) => {
        const has = get().productIds.includes(id);
        set({ productIds: has ? get().productIds.filter(x => x !== id) : [...get().productIds, id] });
      },
      has: (id) => get().productIds.includes(id),
    }),
    { name: 'velvet-wishlist-v2' }
  )
);
