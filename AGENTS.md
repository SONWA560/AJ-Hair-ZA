# AJ Hair ZA - Development Guide

## Running the App

### Development Mode

```bash
npm run dev
```

Note: Development mode has a Turbopack URL parsing bug in Next.js 15.6.0-canary.60

### Production Mode (Recommended)

```bash
npm run build && npm run start
```

This avoids the Turbopack bug and provides better performance.

### Build Command

```bash
npm run build
```

Uses webpack bundler (configured in package.json)

---

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - React components
- `/lib` - Utility functions and API clients
- `/scripts` - Data seeding and management scripts

---

## Key Features Implemented

### Phase 1: Core E-commerce ✅

- Product catalog with Firestore
- Shopping cart (localStorage + Firestore)
- User authentication (Clerk)
- Checkout flow

### Phase 2: Product Management ❌

- Product CRUD operations
- Upload products to Firestore
- Admin product management

### Phase 3: AI Features ✅

- AI-powered search
- Image-based product search
- Uses OpenAI API (configured in .env.local)

### Phase 4: Reports & Analytics ❌

- Financial reports (revenue, orders)
- Product reports (best sellers, inventory)
- Customer reports

### Phase 5: Deployment ❌

- Deploy to Vercel

---

## Known Issues

### Cart UI

- Cart doesn't update instantly when adding/removing items (needs improvement)

### Checkout

- Stock doesn't decrease when orders are placed
- No confirmation emails sent after purchase

---

## Planned Features

### Feature: Automatic Stock Decrease

**Priority:** High

When a customer completes a payment, the system should automatically decrease the product inventory in Firestore.

**Implementation:**

- Modify `lib/actions.ts` - Update `completeOrder()` function
- Decrease `quantity` for each product in the order
- Set `inStock: false` when quantity reaches 0

**Files to modify:**

- `lib/actions.ts`

---

### Feature: Order Confirmation Emails

**Priority:** Medium

Send confirmation emails to customers after successful payment.

**Options:**

1. **Resend** (Recommended) - Modern, developer-friendly API
2. **SendGrid** - Popular with good free tier
3. **Firebase Cloud Functions + Nodemailer** - More control, uses your own SMTP

**Implementation approach:**

1. Set up email service provider (Resend/SendGrid)
2. Add API key to `.env.local`
3. Create Firebase Cloud Function to trigger on order creation
4. Send confirmation email with order details

**Future files:**

- Firebase Cloud Functions (separate project or local functions)
- Email templates

---

## Scripts

```bash
# Seed database with sample products
npm run seed:data

# Set up admin functionality
npm run seed:admin

# Run both seed scripts
npm run seed:all
```

---

## Environment Variables

Required in `.env.local`:

- `OPENAI_API_KEY` - For AI search features
- Firebase configuration (already set)
- Clerk keys (already set)

---

## Dependencies

- Next.js 15.6.0-canary.60
- Firebase (Firestore, Auth, Admin)
- Clerk (Authentication)
- OpenAI (AI features)
