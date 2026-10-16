-- Likes on club feed posts. Run this in the Supabase SQL Editor.

create table public.club_post_likes (
  post_id uuid not null references public.club_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Backend-only access via the service role, same as the other club tables.
alter table public.club_post_likes enable row level security;
