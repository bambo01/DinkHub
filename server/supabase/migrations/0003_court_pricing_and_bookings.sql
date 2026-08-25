-- Hourly pricing on courts, and the real court_bookings table.
-- Run this in the Supabase SQL Editor.

alter table public.courts
  add column price_per_hour numeric(10, 2) not null default 500;

create type booking_status as enum (
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'EXPIRED'
);

-- Needed for the exclusion constraint below (range overlap checks).
create extension if not exists btree_gist;

create table public.court_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  court_id uuid not null references public.courts (id) on delete cascade,
  booking_date date not null,
  -- Hours are stored exclusive-end, same convention as court_blocked_slots
  -- (e.g. start_hour=8, end_hour=10 books 8:00-10:00, i.e. hours 8 and 9).
  start_hour smallint not null,
  end_hour smallint not null,
  total_amount numeric(10, 2) not null,
  status booking_status not null default 'PENDING_PAYMENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint court_bookings_hours_check check (
    start_hour >= 0
    and end_hour <= 24
    and start_hour < end_hour
  ),
  -- The actual double-booking guard: no two PENDING_PAYMENT/CONFIRMED
  -- bookings for the same court+date can have overlapping hour ranges.
  -- This is enforced by Postgres itself, not just application code, so a
  -- race between two concurrent requests can't both succeed.
  exclude using gist (
    court_id with =,
    booking_date with =,
    int4range(start_hour, end_hour, '[)') with &&
  ) where (status in ('PENDING_PAYMENT', 'CONFIRMED'))
);

alter table public.court_bookings enable row level security;

-- The backend uses the service role key, which bypasses RLS. This policy
-- only governs direct client access (e.g. a future Supabase client SDK call).
create policy "Users can view their own bookings"
  on public.court_bookings for select
  using (auth.uid() = user_id);

create index court_bookings_court_date_idx
  on public.court_bookings (court_id, booking_date);

create index court_bookings_user_idx
  on public.court_bookings (user_id);
