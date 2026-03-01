# AJ Hair ZA

A full-featured e-commerce platform for AJ Hair ZA, built with Next.js 15 App Router and Firebase.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Database:** Firebase Firestore (Admin SDK)
- **Auth:** Clerk v6
- **Storage:** Firebase Storage
- **AI Search:** OpenAI GPT-3.5 Turbo (text) + GPT-4o-mini Vision (image)
- **Email:** Nodemailer
- **UI:** Tailwind CSS + shadcn/ui
- **Payments:** Simulated (Card, EFT, Cash on Delivery, PayPal)

## Features

- **Guest browsing** — browse products and add to cart without an account
- **Customer accounts** — profile, order history, wishlist
- **AI text search** — natural language product search powered by OpenAI
- **Image search** — upload a photo to find similar wigs using GPT-4o Vision
- **Admin dashboard** — product CRUD, order management, 3 report types
- **Reports** — Financial (revenue, cost, profit), Product (best-selling, most-viewed), Customer (top buyers, province breakdown)
- **Similar products** — "Similar Wigs You Might Like" using same hair type
- **Product attribute pills** — hair type, length, color, density displayed on product cards
- **Order status flow** — pending → completed
- **View tracking** — Firestore view counter incremented on each product page visit

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=
SITE_NAME=
COMPANY_NAME=
```

## Developer

Built by [Sonwabise Gcolotela](https://sonwabisegcolotela.info)
