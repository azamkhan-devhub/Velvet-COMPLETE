# VELVET — Full-Stack E-Commerce Platform

A production-ready luxury clothing brand e-commerce platform built with **Next.js 14**, **Firebase**, and **TypeScript**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.local.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables — What You Need to Replace

Open `.env.local` and replace only these values:

### 1. Firebase (Required — takes ~5 minutes)
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project → Enable **Firestore**, **Authentication**, **Storage**
3. Go to Project Settings → Your apps → Add Web App
4. Copy the config values into `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```
5. Enable **Google sign-in** in Authentication → Sign-in methods
6. For Admin SDK: Project Settings → Service Accounts → Generate new private key
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Cloudinary (Optional — for image uploads)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Dashboard → Copy Cloud Name, API Key, API Secret
3. Create an upload preset named `velvet-products` (Settings → Upload → Upload presets)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
> **Note:** Images currently upload to Firebase Storage. Swap to Cloudinary in `src/app/(admin)/admin/products/[id]/page.tsx`

### 3. Stripe (For card payments)
1. Sign up at [stripe.com](https://stripe.com) → Developers → API Keys
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI or dashboard
```

### 4. NextAuth Secret (Required)
Generate a random secret:
```bash
openssl rand -base64 32
```
```
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 👤 Admin Account

The hardcoded admin account for testing:
- **Email:** `ayazhussain.cs@gmail.com`
- **Password:** `12345678`

This account is automatically assigned the `admin` role on first login. All other accounts default to the `buyer` role. Roles can be manually upgraded in Firebase Console → Firestore → users collection → set `role` field to `admin` or `seller`.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (store)/          # Buyer-facing storefront
│   │   ├── page.tsx      # Homepage
│   │   ├── shop/         # Product listing + PDP
│   │   ├── cart/         # Cart page
│   │   ├── checkout/     # Multi-step checkout + success
│   │   ├── account/      # Dashboard, orders, profile
│   │   ├── collections/  # Collection pages
│   │   ├── wishlist/     # Wishlist
│   │   └── search/       # Search results
│   ├── (admin)/admin/    # Admin panel (protected)
│   │   ├── page.tsx      # Dashboard with charts
│   │   ├── products/     # CRUD product management
│   │   ├── orders/       # Order management + status updates
│   │   ├── customers/    # Customer management
│   │   ├── inventory/    # Stock level management
│   │   ├── coupons/      # Discount code management
│   │   ├── returns/      # Return request management
│   │   ├── analytics/    # Revenue + order charts
│   │   └── settings/     # Store configuration
│   ├── auth/             # Login, register, forgot password
│   └── api/              # API routes
├── components/
│   ├── layout/           # Navbar, Footer, CartDrawer
│   ├── product/          # ProductCard
│   ├── admin/            # AdminSidebar, AdminGuard
│   └── ui/               # AuthGuard
├── lib/
│   ├── firebase/         # client.ts, admin.ts, firestore.ts
│   ├── hooks/            # useAuth.tsx
│   ├── store/            # Zustand (cart + wishlist)
│   └── utils/            # formatPrice, validators, schemas
└── types/                # Complete TypeScript types
```

---

## 🗄️ Firebase Setup

### Deploy security rules
```bash
npm install -g firebase-tools
firebase login
firebase init  # Select Firestore, Storage
firebase deploy --only firestore:rules,storage
```

### Deploy indexes
```bash
firebase deploy --only firestore:indexes
```

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables → paste all from .env.local
```

---

## ✅ Features Implemented

### Buyer (Storefront)
- 🔐 Email/password + Google OAuth authentication
- 🔑 Password reset via email
- 🏠 Editorial homepage with hero, marquee, collections, testimonials
- 🛍️ Product listing with filters (category, size, price) + sort
- 🔍 Full-text search across products
- 📦 Product detail with image zoom gallery, size guide, variant selector
- 🛒 Cart with quantity controls, coupon codes, live totals
- 💳 Multi-step checkout (Delivery → Payment → Review)
- 💰 Payment methods: Stripe, JazzCash, Easypaisa, COD
- ✅ Order confirmation with order number
- 👤 Account dashboard with stats + recent orders
- 📋 Order history with status filters
- 📍 Order detail with timeline, tracking, review form, return request
- 👤 Profile management with saved addresses
- ❤️ Wishlist with localStorage persistence

### Admin Panel
- 📊 Dashboard with live revenue/orders charts (Recharts)
- ⚠️ Alert banners for pending orders, low stock, return requests
- 📦 Products: full CRUD, image upload, variants, tags, publish/draft
- 🛒 Orders: status management, tracking numbers, payment status, refunds
- 👥 Customers: list, role management, activate/deactivate
- 📉 Inventory: stock level editor per SKU with low stock indicators
- 🏷️ Coupons: create percentage/fixed codes with usage limits + validity
- 🔄 Returns: review, approve/reject with admin notes
- 📈 Analytics: revenue charts, category breakdown, payment methods, top products
- ⚙️ Settings: store config, shipping rates, notifications

### Security
- Firestore security rules (role-based access control)
- Firebase Storage rules
- Server-side token verification in all API routes
- Route protection middleware
- Admin role enforced at component + API level

---

## 🔧 JazzCash/Easypaisa Integration

These payment methods use redirect-based flows. To complete integration:

1. Register as merchant at [jazzcash.com.pk](https://jazzcash.com.pk) or [easypaisa.com.pk](https://easypaisa.com.pk)
2. Fill in `JAZZCASH_*` and `EASYPAISA_*` env vars
3. The API routes at `/api/payments/jazzcash` are scaffolded — add your merchant logic

---

## 📧 Email Notifications (SendGrid)

To enable order confirmation emails:
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Add `SENDGRID_API_KEY` to `.env.local`
3. Implement in `/api/orders/route.ts` after order creation

---

*Built with ❤️ using Next.js 14 App Router, Firebase, TypeScript, Tailwind CSS*
