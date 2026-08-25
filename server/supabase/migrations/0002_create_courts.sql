-- Courts + per-date schedule overrides.
-- Run this in the Supabase SQL Editor.

create type court_type as enum ('INDOOR', 'OUTDOOR');
create type court_status as enum ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type court_type not null,
  location text not null,
  description text,
  status court_status not null default 'ACTIVE',
  -- Default weekly operating hours (24h, e.g. 8 = 8:00, 19 = 19:00). Editable
  -- per court — these are what the court is open every day unless a
  -- court_blocked_slots row narrows a specific date.
  default_open_hour smallint not null default 8,
  default_close_hour smallint not null default 19,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courts_hours_check check (
    default_open_hour >= 0
    and default_close_hour <= 24
    and default_open_hour < default_close_hour
  )
);

alter table public.courts enable row level security;

-- The backend uses the service role key, which bypasses RLS. This policy
-- only governs direct client access (e.g. a future Supabase client SDK call).
create policy "Anyone can view courts"
  on public.courts for select
  using (true);

-- A blocked range on a specific date — e.g. Court 3 closes 10:00-12:00 on
-- 2026-09-01 for maintenance, while every other date still follows the
-- court's default_open_hour/default_close_hour above.
create table public.court_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts (id) on delete cascade,
  blocked_date date not null,
  start_hour smallint not null,
  end_hour smallint not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint court_blocked_slots_hours_check check (
    start_hour >= 0
    and end_hour <= 24
    and start_hour < end_hour
  )
);

alter table public.court_blocked_slots enable row level security;

create policy "Anyone can view blocked slots"
  on public.court_blocked_slots for select
  using (true);

create index court_blocked_slots_court_date_idx
  on public.court_blocked_slots (court_id, blocked_date);
