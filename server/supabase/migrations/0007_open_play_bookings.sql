-- Open Play bookings — a customer reserving one player slot in an activity,
-- and generalizing `payments` to cover this alongside court bookings.
-- Run this in the Supabase SQL Editor.

create type open_play_booking_status as enum (
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED'
);

create table public.open_play_bookings (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.open_play_activities (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  reference_number text not null unique,
  amount numeric(10, 2) not null,
  status open_play_booking_status not null default 'PENDING_PAYMENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.open_play_bookings enable row level security;

create policy "Users can view their own open play bookings"
  on public.open_play_bookings for select
  using (user_id = auth.uid());

create index open_play_bookings_activity_idx on public.open_play_bookings (activity_id);
create index open_play_bookings_user_idx on public.open_play_bookings (user_id);

-- Only one active (non-cancelled) reservation per user per activity — a
-- cancelled row doesn't block rejoining, since the partial index only
-- covers the other two statuses.
create unique index open_play_bookings_one_active_per_user
  on public.open_play_bookings (activity_id, user_id)
  where status <> 'CANCELLED';

-- Generalize payments to cover Open Play reservations too, alongside court
-- bookings — same table, same PayMongo checkout/webhook flow, just pointed
-- at whichever booking type actually paid.
alter table public.payments
  alter column booking_id drop not null,
  add column open_play_booking_id uuid references public.open_play_bookings (id) on delete cascade,
  add constraint payments_exactly_one_booking_check check (
    (booking_id is not null)::int + (open_play_booking_id is not null)::int = 1
  );

create index payments_open_play_booking_idx on public.payments (open_play_booking_id);

drop policy "Users can view payments for their own bookings" on public.payments;

create policy "Users can view payments for their own bookings"
  on public.payments for select
  using (
    exists (
      select 1 from public.court_bookings
      where court_bookings.id = payments.booking_id
      and court_bookings.user_id = auth.uid()
    )
    or exists (
      select 1 from public.open_play_bookings
      where open_play_bookings.id = payments.open_play_booking_id
      and open_play_bookings.user_id = auth.uid()
    )
  );
