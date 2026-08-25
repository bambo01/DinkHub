-- Cover images for courts and Open Play activities, shown on public pages
-- instead of the generic icon. Run this in the Supabase SQL Editor.

alter table public.courts
  add column image_url text;

alter table public.open_play_activities
  add column image_url text;

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Uploads go through the backend's service-role key, which bypasses RLS, so
-- only a public-read policy is needed here.
create policy "Listing images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-images');
