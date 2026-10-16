-- Clubs — admin-created community groups. Members share a feed and
-- announcements, vote on scheduled play sessions, and chat live.
-- Run this in the Supabase SQL Editor.

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index club_members_user_idx on public.club_members (user_id);

create type club_post_kind as enum ('FEED', 'ANNOUNCEMENT');

create table public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  kind club_post_kind not null default 'FEED',
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  constraint club_posts_body_check check (char_length(body) between 1 and 2000)
);

create index club_posts_club_idx on public.club_posts (club_id, created_at desc);

-- A scheduled play the admin opens for sign-ups ("who's in?"). Members
-- answer IN/OUT; max_players is an optional cap on IN answers.
create type club_session_status as enum ('OPEN', 'CLOSED', 'CANCELLED');

create table public.club_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  description text,
  location text,
  play_date date not null,
  start_hour smallint not null,
  end_hour smallint not null,
  max_players smallint,
  status club_session_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  constraint club_sessions_hours_check check (
    start_hour >= 0 and end_hour <= 24 and start_hour < end_hour
  ),
  constraint club_sessions_max_players_check check (
    max_players is null or max_players > 0
  )
);

create index club_sessions_club_idx on public.club_sessions (club_id, play_date);

create type club_session_response as enum ('IN', 'OUT');

create table public.club_session_responses (
  session_id uuid not null references public.club_sessions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  response club_session_response not null,
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- Identity id (not uuid) so the chat client can poll with a simple
-- "everything after id N" cursor without timestamp-collision gaps.
create table public.club_messages (
  id bigint generated always as identity primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint club_messages_body_check check (char_length(body) between 1 and 1000)
);

create index club_messages_club_idx on public.club_messages (club_id, id);

-- The backend uses the service role key, which bypasses RLS, and enforces
-- club membership itself. With RLS on and no policies, direct client
-- (anon/authenticated) access to these tables is denied outright.
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;
alter table public.club_sessions enable row level security;
alter table public.club_session_responses enable row level security;
alter table public.club_messages enable row level security;
