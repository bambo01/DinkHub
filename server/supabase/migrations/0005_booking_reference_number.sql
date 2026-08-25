-- Human-friendly booking reference number (e.g. DH-7K9XQ2), shown to
-- customers and used for check-in lookups / the QR code.
-- Run this in the Supabase SQL Editor.

alter table public.court_bookings
  add column reference_number text unique;

-- Backfill any bookings created before this column existed, using the same
-- DH-XXXXXX shape the application generates for new bookings.
update public.court_bookings
set reference_number = 'DH-' || upper(substr(md5(random()::text || id::text), 1, 6))
where reference_number is null;

alter table public.court_bookings
  alter column reference_number set not null;
