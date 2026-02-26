# AJ Hair ZA - Project Requirements

## Project Overview
- **Project Name**: AJ Hair ZA
- **Type**: E-commerce wig store (university project)
- **Location**: South Africa

## Tech Stack
- Next.js 15 with App Router
- shadcn/ui components
- Clerk for authentication
- Firebase Firestore for database
- Gemini API for AI features

## User Roles
1. **Guest** - Browse products, use AI search
2. **Customer** - All guest features + add to cart, checkout, order history
3. **Admin** - All features + dashboard, product management, reports

## Features

### Phase 1: Core E-commerce (Completed)
- [x] Product browsing
- [x] Cart functionality (instant UI updates with localStorage)
- [x] Checkout with order saving to Firestore
- [x] Admin dashboard pages (/admin, /admin/products, /admin/orders, /admin/reports)

### Phase 2: Product Management
- [ ] Product CRUD (create, read, update, delete)
- [ ] Upload products to Firestore

### Phase 3: AI Features
- [ ] AI product search (text-based)
- [ ] Image search (upload wig image, find similar products)

### Phase 4: Reports & Analytics
- [ ] Financial reports (revenue, orders)
- [ ] Product reports (best sellers, inventory)
- [ ] Customer reports

### Phase 5: Deployment
- [ ] Deploy to Vercel

## Environment Variables Required
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Firebase (Admin)
FIREBASE_PROJECT_ID=inf4027-e-commerce
FIREBASE_LOCATION=southafrica1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@inf4027-e-commerce.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<private-key>

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini API
GEMINI_API_KEY=
```

## Firestore Collections
- `products` - Product catalog
- `carts` - User shopping carts
- `orders` - Customer orders
- `users` - User profiles
- `adminProfiles` - Admin user data
- `inventory` - Stock levels
- `searchLogs` - AI search history
- `analytics` - Usage analytics

## Firebase Security Rules
See `/firebase-rules/firestore.rules`

## API Routes
- `GET /api/cart/[cartId]` - Get cart
- `POST /api/cart/add` - Add to cart
- `DELETE /api/cart/[cartId]/remove` - Remove from cart
- `PUT /api/cart/[cartId]/update` - Update cart item quantity
- `POST /api/ai-search` - AI product search
- `POST /api/ai-search/image` - Image search

## Known Issues
- Cart: UI doesn't update instantly when adding/removing items (needs fix)
- Cart: Minus button needs testing

## Commands
```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run start  # Start production server
```
