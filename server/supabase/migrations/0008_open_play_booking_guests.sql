-- Let a customer bring guests when joining an Open Play session — each guest
-- is just a name (no account), and adds a slot + its price to the booking.
-- Run this in the Supabase SQL Editor.

alter table public.open_play_bookings
  add column slots smallint not null default 1,
  add column guest_names text[] not null default '{}';

alter table public.open_play_bookings
  add constraint open_play_bookings_slots_check check (slots >= 1);
