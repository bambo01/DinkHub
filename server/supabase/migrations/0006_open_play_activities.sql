-- Open Play activities — admin-scheduled drop-in sessions that can span one
-- or more courts at once. Customers reserve individual player slots rather
-- than the whole court. Run this in the Supabase SQL Editor.

create type open_play_skill_level as enum (
  'ALL_LEVELS',
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

create type open_play_status as enum ('ACTIVE', 'CANCELLED');

create table public.open_play_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_hour smallint not null,
  end_hour smallint not null,
  capacity smallint not null,
  price_per_slot numeric(10, 2) not null,
  skill_level open_play_skill_level not null default 'ALL_LEVELS',
  status open_play_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_play_hours_check check (
    start_hour >= 0
    and end_hour <= 24
    and start_hour < end_hour
  ),
  constraint open_play_capacity_check check (capacity > 0),
  constraint open_play_price_check check (price_per_slot >= 0)
);

alter table public.open_play_activities enable row level security;

-- The backend uses the service role key, which bypasses RLS. This policy
-- only governs direct client access (e.g. a future Supabase client SDK call).
create policy "Anyone can view open play activities"
  on public.open_play_activities for select
  using (true);

create index open_play_activities_date_idx
  on public.open_play_activities (event_date);

-- Which court(s) a given activity runs on — an activity can span multiple
-- courts at once (e.g. a large session using courts 1-3 simultaneously).
create table public.open_play_activity_courts (
  activity_id uuid not null references public.open_play_activities (id) on delete cascade,
  court_id uuid not null references public.courts (id) on delete restrict,
  primary key (activity_id, court_id)
);

alter table public.open_play_activity_courts enable row level security;

create policy "Anyone can view open play activity courts"
  on public.open_play_activity_courts for select
  using (true);

create index open_play_activity_courts_court_idx
  on public.open_play_activity_courts (court_id);

-- Links a blocked slot back to the Open Play activity that auto-created it,
-- so the backend can re-sync or release the block when the activity's
-- courts, date, time, or status change — without touching slots an admin
-- blocked manually (those keep a null value here).
alter table public.court_blocked_slots
  add column open_play_activity_id uuid references public.open_play_activities (id) on delete cascade;

create index court_blocked_slots_activity_idx
  on public.court_blocked_slots (open_play_activity_id);
