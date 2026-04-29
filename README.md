# GolfDraw — Golf Score Lottery Platform

A full-stack subscription-based lottery platform built with **Next.js 14**, **Supabase**, **Stripe**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Stripe](https://stripe.com) account (test mode)

---

### 2. Clone & Install

```bash
cd golf-lottery-app
npm install
```

---

### 3. Environment Setup

Copy the example env file:
```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Supabase (get these from your Supabase project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (get from Stripe Dashboard > Developers > API Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** If you don't configure Stripe, the app runs in **mock mode** — subscriptions are activated locally without real payments.

---

### 4. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created, go to **SQL Editor**
3. Copy and paste the entire contents of `schema.sql`
4. Click **Run**

This will:
- Create all tables (profiles, subscriptions, charities, scores, draws, draw_entries, winnings)
- Set up Row Level Security (RLS) policies
- Create triggers for auto-profile creation and timestamp updates
- Seed 5 sample charities
- Create the proof uploads storage bucket

---

### 5. Create Admin User

1. Sign up on the app at `/signup` using email `admin@golfdraw.com`
2. The trigger automatically assigns the `admin` role
3. Or manually set a user as admin in Supabase:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

---

### 6. Stripe Setup (Optional — Skip for Mock Mode)

1. Go to Stripe Dashboard → Products → Create two products:
   - **Monthly Plan**: £9.99/month recurring
   - **Yearly Plan**: £99.99/year recurring
2. Copy the **Price IDs** into your `.env.local`
3. For webhooks (local testing):
   ```bash
   npm install -g stripe
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
golf-lottery-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── scores/page.tsx
│   │   ├── draws/page.tsx
│   │   ├── charity/page.tsx
│   │   ├── winnings/page.tsx
│   │   └── subscription/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── draws/page.tsx
│   │   ├── charities/page.tsx
│   │   └── winners/page.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── stripe/checkout/route.ts
│   │   ├── stripe/webhook/route.ts
│   │   └── draws/run/route.ts
│   ├── layout.tsx
│   ├── page.tsx          ← Landing page
│   └── globals.css
├── components/
│   ├── ui/               ← Button, Card, Input, Badge, Modal
│   ├── dashboard/        ← Sidebar
│   └── admin/            ← AdminSidebar
├── lib/
│   ├── supabase/         ← client.ts, server.ts
│   ├── stripe.ts
│   └── utils.ts
├── types/index.ts
├── middleware.ts
├── schema.sql            ← Full database schema
└── .env.example
```

---

## 🎯 Features

| Feature | Description |
|---|---|
| 🔐 Auth | Supabase Auth (email/password) with protected routes |
| 💳 Subscriptions | Monthly (£9.99) and Yearly (£99.99) via Stripe |
| ⛳ Score Tracking | Last 5 scores per user, auto-replace oldest |
| 🎰 Monthly Draws | Admin-run draws with 5-number lottery system |
| 💰 Prize Distribution | 40% Jackpot / 35% 4-match / 25% 3-match |
| 🔄 Rollover | Jackpot rolls over if no winner |
| ❤️ Charity | Users choose charity + % (min 10%) |
| 🏆 Winnings | Proof upload → Admin verify → Mark paid |
| 👤 User Dashboard | Scores, draws, winnings, subscription |
| 🛡️ Admin Dashboard | Users, draws, charities, winner verification |

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## 🔑 Default Credentials (Mock/Dev)

- **Admin**: Sign up with `admin@golfdraw.com`
- **User**: Sign up with any other email

---

## 📝 Notes

- In **mock mode** (no Stripe keys), clicking "Get started" on subscription page activates it locally
- Lottery numbers are derived from users' score values (mod 49 + 1) as seed, padded randomly
- The draw API is idempotent — running twice on same draw won't create duplicates
