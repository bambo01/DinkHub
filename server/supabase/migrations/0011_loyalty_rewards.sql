-- Pickleball Rewards — a digital punch card. Every calendar day a customer
-- completes a CONFIRMED court booking earns 1 sticker (max one per day, no
-- matter how many hours or separate bookings that day). 8 stickers redeem
-- for one free 1-hour court booking. Run this in the Supabase SQL Editor.

create type loyalty_reward_status as enum ('AVAILABLE', 'USED');

create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status loyalty_reward_status not null default 'AVAILABLE',
  used_booking_id uuid references public.court_bookings (id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.loyalty_rewards enable row level security;

create policy "Users can view their own rewards"
  on public.loyalty_rewards for select
  using (user_id = auth.uid());

create index loyalty_rewards_user_idx on public.loyalty_rewards (user_id);

create table public.loyalty_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  earned_date date not null,
  booking_id uuid not null references public.court_bookings (id) on delete cascade,
  -- Set once this sticker has been spent redeeming a reward — null means
  -- still sitting on the card, unredeemed.
  redeemed_in_reward_id uuid references public.loyalty_rewards (id) on delete set null,
  created_at timestamptz not null default now(),
  -- The actual "1 sticker per day" rule — a second confirmed booking on a
  -- day that already earned one just no-ops against this constraint.
  unique (user_id, earned_date)
);

alter table public.loyalty_stickers enable row level security;

create policy "Users can view their own stickers"
  on public.loyalty_stickers for select
  using (user_id = auth.uid());

create index loyalty_stickers_user_idx on public.loyalty_stickers (user_id);
