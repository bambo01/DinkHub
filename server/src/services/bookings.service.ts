import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import { generateReferenceNumber } from "../utils/reference-number.js";
import { getCourtById, listBlockedSlots } from "./courts.service.js";
import * as loyaltyService from "./loyalty.service.js";
import { getUserById } from "./users.service.js";
import { sendBookingConfirmationEmail } from "./email.service.js";
import type { CreateBookingInput } from "../validators/bookings.validator.js";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  referenceNumber: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
}

interface BookingRow {
  id: string;
  user_id: string;
  court_id: string;
  reference_number: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  // PostgREST returns `numeric` columns as strings to avoid precision loss.
  total_amount: string;
  status: BookingStatus;
  created_at: string;
}

const BOOKING_COLUMNS =
  "id, user_id, court_id, reference_number, booking_date, start_hour, end_hour, total_amount, status, created_at";

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    courtId: row.court_id,
    referenceNumber: row.reference_number,
    bookingDate: row.booking_date,
    startHour: row.start_hour,
    endHour: row.end_hour,
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface AdminBooking extends Booking {
  courtName: string;
  customerName: string | null;
  customerEmail: string;
}

interface AdminBookingRow extends BookingRow {
  courts: { name: string } | null;
  users: { full_name: string | null; email: string } | null;
}

function mapAdminBooking(row: AdminBookingRow): AdminBooking {
  return {
    ...mapBooking(row),
    courtName: row.courts?.name ?? "Unknown court",
    customerName: row.users?.full_name ?? null,
    customerEmail: row.users?.email ?? "",
  };
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) {
  return aStart < bEnd && bStart < aEnd;
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<Booking> {
  const court = await getCourtById(input.courtId);

  if (court.status !== "ACTIVE") {
    throw new AppError("This court is not currently available for booking", 422);
  }

  // Local date/hour, not toISOString() — that converts to UTC first, which
  // silently checks against the wrong calendar day/hour for any local time
  // that crosses a UTC day boundary (e.g. before 8am in UTC+8).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (input.bookingDate < today) {
    throw new AppError("Booking date can't be in the past", 422);
  }

  if (input.bookingDate === today && input.startHour <= now.getHours()) {
    throw new AppError("That time has already passed today", 422);
  }

  if (
    input.startHour < court.defaultOpenHour ||
    input.endHour > court.defaultCloseHour
  ) {
    throw new AppError(
      `This court is only open ${court.defaultOpenHour}:00–${court.defaultCloseHour}:00`,
      422,
    );
  }

  const blockedSlots = await listBlockedSlots(input.courtId, input.bookingDate);
  const hasBlockedOverlap = blockedSlots.some((slot) =>
    rangesOverlap(input.startHour, input.endHour, slot.startHour, slot.endHour),
  );
  if (hasBlockedOverlap) {
    throw new AppError(
      "That time range isn't available on the selected date",
      409,
    );
  }

  const durationHours = input.endHour - input.startHour;
  let totalAmount = Math.round(court.pricePerHour * durationHours * 100) / 100;

  const usingReward = Boolean(input.rewardId);
  if (usingReward) {
    if (durationHours !== 1) {
      throw new AppError("Free-hour rewards can only be used for a 1-hour booking", 422);
    }
    totalAmount = 0;
  }

  // Collision on the reference number itself is vanishingly unlikely (32^6
  // combinations) but retried a few times with a fresh code rather than
  // trusted to never happen.
  const MAX_REFERENCE_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_REFERENCE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("court_bookings")
      .insert({
        user_id: userId,
        court_id: input.courtId,
        reference_number: generateReferenceNumber("DH"),
        booking_date: input.bookingDate,
        start_hour: input.startHour,
        end_hour: input.endHour,
        total_amount: totalAmount,
        // A reward-backed booking skips payment entirely — it's confirmed
        // the moment the reward is actually claimed below.
        ...(usingReward ? { status: "CONFIRMED" } : {}),
      })
      .select(BOOKING_COLUMNS)
      .single();

    if (!error) {
      const booking = mapBooking(data);

      if (usingReward) {
        try {
          await loyaltyService.useRewardForBooking(userId, input.rewardId!, booking.id);
        } catch (err) {
          // The reward got claimed by something else between the request
          // arriving and now (e.g. a duplicate submit) — cancel the free
          // booking rather than let it stand unpaid with no reward behind
          // it.
          await supabase
            .from("court_bookings")
            .update({ status: "CANCELLED" })
            .eq("id", booking.id);
          throw err;
        }

        // A reward booking never goes through payments.service's
        // reconcile flow (there's no payment), so the confirmation
        // email — including the check-in QR code — has to be sent from
        // here instead. Best-effort: sendBookingConfirmationEmail
        // already catches and logs its own errors.
        const customer = await getUserById(userId);
        await sendBookingConfirmationEmail(booking, court, customer.email, customer.fullName);
      }

      return booking;
    }

    // Postgres exclusion-constraint violation — another booking already
    // holds an overlapping range for this court/date. This is the real
    // double-booking guard; the blocked-slot check above only catches
    // admin-side blocks, not a concurrent booking from another customer.
    if (error.code === "23P01") {
      throw new AppError(
        "That time was just booked by someone else. Please pick a different time.",
        409,
      );
    }

    // Unique violation on reference_number — retry with a new code.
    if (error.code === "23505" && attempt < MAX_REFERENCE_ATTEMPTS) continue;

    throw new AppError("Failed to create booking", 500);
  }

  throw new AppError("Failed to create booking", 500);
}

export interface BookedRange {
  startHour: number;
  endHour: number;
}

// Hours already held by a real booking (paid or awaiting payment) — this is
// what the public availability grid checks against, separate from admin
// blocked slots. PENDING_PAYMENT is included, not just CONFIRMED: the DB
// exclusion constraint already blocks a second booking from overlapping a
// pending one, so the grid needs to show it as taken too, or a customer
// could pick a slot the backend would then reject at checkout.
export async function getBookedRanges(
  courtId: string,
  date: string,
): Promise<BookedRange[]> {
  const { data, error } = await supabase
    .from("court_bookings")
    .select("start_hour, end_hour")
    .eq("court_id", courtId)
    .eq("booking_date", date)
    .in("status", ["PENDING_PAYMENT", "CONFIRMED"]);

  if (error) {
    throw new AppError("Failed to load booked hours", 500);
  }

  return (data ?? []).map((row) => ({
    startHour: row.start_hour,
    endHour: row.end_hour,
  }));
}

export async function getBookingById(id: string): Promise<Booking> {
  const { data, error } = await supabase
    .from("court_bookings")
    .select(BOOKING_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError("Booking not found", 404);
  }

  return mapBooking(data);
}

// Combines the ownership check into the query itself, and includes the
// court name for display — the plain getBookingById above stays lean for
// its internal callers (payment reconciliation, etc.) that don't need it.
export async function getCustomerBookingById(
  userId: string,
  id: string,
): Promise<CustomerBooking> {
  const { data, error } = await supabase
    .from("court_bookings")
    .select(`${BOOKING_COLUMNS}, courts(name)`)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  // Same 404 whether the booking doesn't exist or just isn't this user's —
  // don't leak that a booking with this id exists for someone else.
  if (error || !data) {
    throw new AppError("Booking not found", 404);
  }

  return mapCustomerBooking(data as unknown as CustomerBookingRow);
}

export interface CustomerBooking extends Booking {
  courtName: string;
}

interface CustomerBookingRow extends BookingRow {
  courts: { name: string } | null;
}

function mapCustomerBooking(row: CustomerBookingRow): CustomerBooking {
  return {
    ...mapBooking(row),
    courtName: row.courts?.name ?? "Unknown court",
  };
}

export async function listBookingsForUser(userId: string): Promise<CustomerBooking[]> {
  const { data, error } = await supabase
    .from("court_bookings")
    .select(`${BOOKING_COLUMNS}, courts(name)`)
    .eq("user_id", userId)
    .order("booking_date", { ascending: false })
    .order("start_hour", { ascending: false });

  if (error) {
    throw new AppError("Failed to load bookings", 500);
  }

  return ((data ?? []) as unknown as CustomerBookingRow[]).map(mapCustomerBooking);
}

export async function listBookings(filters?: {
  status?: BookingStatus;
  date?: string;
}): Promise<AdminBooking[]> {
  let query = supabase
    .from("court_bookings")
    .select(
      `${BOOKING_COLUMNS}, courts(name), users(full_name, email)`,
    )
    .order("booking_date", { ascending: false })
    .order("start_hour", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.date) query = query.eq("booking_date", filters.date);

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load bookings", 500);
  }

  return ((data ?? []) as unknown as AdminBookingRow[]).map(mapAdminBooking);
}

export async function markBookingConfirmed(id: string): Promise<void> {
  // Only flips PENDING_PAYMENT -> CONFIRMED — the WHERE clause makes this an
  // idempotency guard too, so a duplicate webhook delivery that reconciles
  // the same booking twice can't apply the transition more than once.
  await supabase
    .from("court_bookings")
    .update({ status: "CONFIRMED" })
    .eq("id", id)
    .eq("status", "PENDING_PAYMENT");
}
