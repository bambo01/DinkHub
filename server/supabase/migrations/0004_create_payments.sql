-- Payments — one row per PayMongo checkout attempt for a booking.
-- Run this in the Supabase SQL Editor.

create type payment_status as enum (
  'PENDING',
  'PAID',
  'FAILED',
  'EXPIRED',
  'REFUNDED'
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.court_bookings (id) on delete cascade,
  amount numeric(10, 2) not null,
  status payment_status not null default 'PENDING',
  paymongo_checkout_session_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- The backend uses the service role key, which bypasses RLS. This policy
-- only governs direct client access (e.g. a future Supabase client SDK call).
create policy "Users can view payments for their own bookings"
  on public.payments for select
  using (
    exists (
      select 1 from public.court_bookings
      where court_bookings.id = payments.booking_id
      and court_bookings.user_id = auth.uid()
    )
  );

create index payments_booking_idx on public.payments (booking_id);
