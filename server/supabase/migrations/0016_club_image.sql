-- Profile image for clubs, uploaded by an admin from the Manage Club page.
-- Stored in the existing public `listing-images` bucket under club-avatars/.
-- Run this in the Supabase SQL Editor.

alter table public.clubs
  add column image_url text;
