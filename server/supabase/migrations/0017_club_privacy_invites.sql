-- Private clubs and invitations. A PRIVATE club is hidden from everyone but
-- its members and admins, and can only be joined through an invite (a
-- shareable link, or a link emailed to a specific address).
-- Run this in the Supabase SQL Editor.

create type club_visibility as enum ('PUBLIC', 'PRIVATE');

alter table public.clubs
  add column visibility club_visibility not null default 'PUBLIC';

create table public.club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  token text not null unique,
  -- Set for email invites: only the account with this address can accept.
  email text,
  created_by uuid references public.users (id) on delete set null,
  -- Null max_uses = unlimited (a shareable link); email invites use 1.
  max_uses integer,
  uses integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint club_invites_max_uses_check check (max_uses is null or max_uses > 0)
);

create index club_invites_club_idx on public.club_invites (club_id);

-- Backend-only access via the service role, same as the other club tables.
alter table public.club_invites enable row level security;
