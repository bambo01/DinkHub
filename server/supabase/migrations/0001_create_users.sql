-- Core users table, mirroring auth.users with app-level role data.
-- Run this in the Supabase SQL Editor before seeding the superadmin account.

create type user_role as enum ('CUSTOMER', 'ADMIN');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- The backend uses the service role key, which bypasses RLS. These policies
-- only govern direct client access (e.g. a future Supabase client SDK call).
create policy "Users can view their own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own row"
  on public.users for update
  using (auth.uid() = id);
