-- Photo posts in club feeds. Images are stored in the existing public
-- `listing-images` bucket under club-posts/. A post may now be photo-only,
-- so the body can be empty as long as an image is attached.
-- Run this in the Supabase SQL Editor.

alter table public.club_posts
  add column image_url text;

alter table public.club_posts
  drop constraint club_posts_body_check,
  add constraint club_posts_body_check check (
    char_length(body) <= 2000
    and (char_length(body) > 0 or image_url is not null)
  );
