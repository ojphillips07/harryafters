-- =============================================================================
-- Harry Afters — Supabase schema.
-- Run this in the Supabase SQL editor, or via `supabase db execute`.
-- Safe to re-run: every CREATE uses `IF NOT EXISTS`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- registrations: people who registered interest before tickets went on sale.
-- Server inserts via the Service / service_role key (bypasses RLS).
-- ----------------------------------------------------------------------------
create table if not exists public.registrations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists registrations_email_lower_key
  on public.registrations (lower(email));

alter table public.registrations enable row level security;

-- ----------------------------------------------------------------------------
-- tickets: paid tickets, one row per Stripe Checkout Session.
-- `id` is the QR payload — keep it secret-ish; do not expose in URLs to public.
-- ----------------------------------------------------------------------------
create table if not exists public.tickets (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  name                  text not null,
  stripe_session_id     text not null,
  stripe_payment_intent text,
  amount_pence          integer not null check (amount_pence > 0),
  currency              text not null default 'gbp',
  status                text not null default 'paid'
    check (status in ('paid', 'refunded')),
  created_at            timestamptz not null default now(),
  used_at               timestamptz
);

create unique index if not exists tickets_stripe_session_id_key
  on public.tickets (stripe_session_id);

create index if not exists tickets_email_idx
  on public.tickets (lower(email));

alter table public.tickets enable row level security;

-- No policies — only the server using the service / secret key can read/write.
