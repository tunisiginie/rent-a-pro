# Rent a Pro

A two-sided marketplace: customers describe a problem, find a verified expert, book a
paid consultation, and connect by call / video / email. The platform takes a fee from
both sides (Fiverr-style) via Stripe Connect.

## Stack
- **Next.js 16** (App Router, Server Actions) + React 19
- **Supabase** — Auth, Postgres (RLS), Storage
- **Stripe Connect** (Express) — marketplace payments
- **shadcn/ui** + Tailwind v4
- Deploy on **Vercel**

## Getting started

1. `npm install`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
3. Create a Stripe account, enable **Connect**, and grab test API keys.
4. `cp .env.local.example .env.local` and fill in the values.
5. `npm run dev` → http://localhost:3000
6. For payment webhooks locally:
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`
7. Make yourself an admin: in Supabase, set `profiles.is_admin = true` for your row.

## Flow
- **Become an expert** → build profile (photo + intro video, services, availability) →
  connect Stripe → admin approves → you appear in search.
- **Customer** → search/browse → expert profile → "What is your problem?" → pay →
  expert accepts and shares how they'll connect → after the call, leave a review.

## Roadmap (phase 2)
AI smart search (voice + media → recommendation) · 1.5-min exclusive response window →
auto-ping nearby experts · faster-response = higher payout % · forced post-consult
feedback · in-app video + messaging.
