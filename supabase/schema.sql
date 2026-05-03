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

-- ============================================================================
-- Live Jukebox
--
-- - song_queue:     one row per track ever requested. Votes increment as more
--                   devices add the same track. Worker forwards the top row to
--                   Spotify only when the current track is ~6s from finishing,
--                   so guests can still bump tracks up the queue right up to
--                   that moment.
-- - song_votes:     enforces "one vote per device per track" via PK.
-- - spotify_account: singleton (id = 1) holding the user's refresh token after
--                   the one-time admin OAuth bootstrap.
-- - now_playing:    singleton (id = 1) snapshot the worker writes every loop;
--                   the website subscribes via Realtime so the UI stays live.
--
-- RLS stays disabled — only the server (service key) and the home worker
-- read/write these tables.
-- ============================================================================

create table if not exists public.song_queue (
  id              uuid primary key default gen_random_uuid(),
  track_id        text not null,
  track_uri       text not null,
  track_name      text not null,
  artist          text not null,
  album_image     text,
  duration_ms     integer not null check (duration_ms > 0),
  votes           integer not null default 1 check (votes > 0),
  status          text not null default 'queued'
    check (status in ('queued','enqueued_spotify','now_playing','played','skipped','removed')),
  first_added_at  timestamptz not null default now(),
  last_voted_at   timestamptz not null default now(),
  enqueued_at     timestamptz,
  played_at       timestamptz
);

-- Only one "active" row per Spotify track at a time. Played / skipped / removed
-- rows can coexist as history, but new requests upsert against the active row.
create unique index if not exists song_queue_track_active_key
  on public.song_queue (track_id)
  where status in ('queued','enqueued_spotify','now_playing');

create index if not exists song_queue_status_idx
  on public.song_queue (status);

create index if not exists song_queue_priority_idx
  on public.song_queue (votes desc, first_added_at asc)
  where status = 'queued';

alter table public.song_queue enable row level security;

create table if not exists public.song_votes (
  queue_id    uuid not null references public.song_queue(id) on delete cascade,
  device_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (queue_id, device_id)
);

create index if not exists song_votes_device_idx
  on public.song_votes (device_id, created_at desc);

alter table public.song_votes enable row level security;

create table if not exists public.spotify_account (
  id             smallint primary key default 1 check (id = 1),
  refresh_token  text not null,
  scope          text not null,
  updated_at     timestamptz not null default now()
);

alter table public.spotify_account enable row level security;

create table if not exists public.now_playing (
  id             smallint primary key default 1 check (id = 1),
  queue_id       uuid references public.song_queue(id) on delete set null,
  track_uri      text,
  track_id       text,
  track_name     text,
  artist         text,
  album_image    text,
  progress_ms    integer not null default 0,
  duration_ms    integer not null default 0,
  device_name    text,
  is_playing     boolean not null default false,
  updated_at     timestamptz not null default now()
);

-- Seed the singleton row so the worker can simply UPDATE it.
insert into public.now_playing (id) values (1)
  on conflict (id) do nothing;

alter table public.now_playing enable row level security;
