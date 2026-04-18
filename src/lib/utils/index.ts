import { z } from 'zod';

export const formatPrice = (price: number, currency = 'PKR'): string =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(price);

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(' ');

export const slugify = (text: string): string =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const getDiscount = (price: number, comparePrice?: number): number =>
  comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

export const generateOrderNumber = (): string =>
  `VLT${Date.now().toString(36).toUpperCase()}`;

export const formatDate = (date: Date | { toDate: () => Date } | string): string => {
  const d = typeof date === 'string' ? new Date(date)
    : 'toDate' in date ? date.toDate()
    : date;
  return new Intl.DateTimeFormat('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

export const formatDateTime = (date: Date | { toDate: () => Date } | string): string => {
  const d = typeof date === 'string' ? new Date(date)
    : 'toDate' in date ? date.toDate()
    : date;
  return new Intl.DateTimeFormat('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  processing:       'Processing',
  shipped:          'Shipped',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
  return_requested: 'Return Requested',
  returned:         'Returned',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  confirmed:        'bg-blue-100 text-blue-800',
  processing:       'bg-purple-100 text-purple-800',
  shipped:          'bg-indigo-100 text-indigo-800',
  delivered:        'bg-green-100 text-green-800',
  cancelled:        'bg-red-100 text-red-800',
  return_requested: 'bg-orange-100 text-orange-800',
  returned:         'bg-gray-100 text-gray-800',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid:             'bg-red-100 text-red-700',
  paid:               'bg-green-100 text-green-700',
  refunded:           'bg-blue-100 text-blue-700',
  partially_refunded: 'bg-yellow-100 text-yellow-700',
};

// ── Zod Schemas ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
             .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
             .regex(/[0-9]/, 'Must contain at least one number'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export const addressSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  phone:     z.string().min(10, 'Enter valid phone number'),
  address:   z.string().min(5, 'Enter full address'),
  city:      z.string().min(1, 'Required'),
  province:  z.string().min(1, 'Required'),
  zip:       z.string().optional(),
  country:   z.string().min(1, 'Required'),
});

export const productSchema = z.object({
  name:         z.string().min(2, 'Required'),
  description:  z.string().min(10, 'Required'),
  price:        z.number().positive('Must be positive'),
  comparePrice: z.number().optional(),
  categoryId:   z.string().min(1, 'Required'),
  collection:   z.string().min(1, 'Required'),
  tags:         z.array(z.string()),
  isActive:     z.boolean(),
  isFeatured:   z.boolean(),
  isNew:        z.boolean(),
  isBestSeller: z.boolean(),
});

export const reviewSchema = z.object({
  rating:  z.number().min(1).max(5),
  title:   z.string().min(2, 'Required'),
  comment: z.string().min(10, 'Please write at least 10 characters'),
});
