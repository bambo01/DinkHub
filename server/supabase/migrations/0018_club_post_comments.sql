-- Comments on club feed posts. Run this in the Supabase SQL Editor.

create table public.club_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.club_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint club_post_comments_body_check check (char_length(body) between 1 and 500)
);

create index club_post_comments_post_idx on public.club_post_comments (post_id, created_at);

-- Backend-only access via the service role, same as the other club tables.
alter table public.club_post_comments enable row level security;
