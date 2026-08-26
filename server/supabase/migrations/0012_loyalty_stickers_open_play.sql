-- Open Play bookings now award loyalty stickers too (previously only court
-- bookings did), so loyalty_stickers.booking_id can no longer be a required
-- FK to court_bookings alone — it needs to point at whichever booking type
-- actually earned the sticker.

alter table public.loyalty_stickers
  alter column booking_id drop not null;

alter table public.loyalty_stickers
  add column open_play_booking_id uuid references public.open_play_bookings (id) on delete cascade;

alter table public.loyalty_stickers
  add constraint loyalty_stickers_one_booking_ref check (
    (booking_id is not null) <> (open_play_booking_id is not null)
  );
