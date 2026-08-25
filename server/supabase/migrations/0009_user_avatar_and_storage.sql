-- Profile avatars — a column to point at the uploaded image, plus the
-- storage bucket the backend uploads into. Run this in the Supabase SQL
-- Editor.

alter table public.users
  add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Uploads go through the backend's service-role key, which bypasses RLS, so
-- only a public-read policy is needed here — nothing writes to this bucket
-- directly from the client.
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');
