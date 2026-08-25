import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import { generateReferenceNumber } from "../utils/reference-number.js";
import { getActivityById } from "./open-play.service.js";

export type OpenPlayBookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

export interface OpenPlayBooking {
  id: string;
  activityId: string;
  userId: string;
  referenceNumber: string;
  amount: number;
  slots: number;
  guestNames: string[];
  status: OpenPlayBookingStatus;
  createdAt: string;
}

interface OpenPlayBookingRow {
  id: string;
  activity_id: string;
  user_id: string;
  reference_number: string;
  // PostgREST returns `numeric` columns as strings to avoid precision loss.
  amount: string;
  slots: number;
  guest_names: string[];
  status: OpenPlayBookingStatus;
  created_at: string;
}

const BOOKING_COLUMNS =
  "id, activity_id, user_id, reference_number, amount, slots, guest_names, status, created_at";

function mapBooking(row: OpenPlayBookingRow): OpenPlayBooking {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    referenceNumber: row.reference_number,
    amount: Number(row.amount),
    slots: row.slots,
    guestNames: row.guest_names ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function joinActivity(
  userId: string,
  activityId: string,
  guestNames: string[] = [],
): Promise<OpenPlayBooking> {
  const activity = await getActivityById(activityId);

  if (activity.status !== "ACTIVE") {
    throw new AppError("This session is no longer available", 422);
  }

  // Local date/hour, not toISOString() — that converts to UTC first, which
  // silently checks against the wrong calendar day/hour for any local time
  // that crosses a UTC day boundary (e.g. before 8am in UTC+8).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (
    activity.eventDate < today ||
    (activity.eventDate === today && activity.startHour <= now.getHours())
  ) {
    throw new AppError("This session has already started or passed", 422);
  }

  // 1 slot for the joining user plus one per named guest.
  const slots = 1 + guestNames.length;

  if (activity.spotsLeft < slots) {
    throw new AppError(
      activity.spotsLeft <= 0
        ? "This session is full"
        : `Only ${activity.spotsLeft} spot${activity.spotsLeft === 1 ? "" : "s"} left`,
      409,
    );
  }

  const amount = Math.round(activity.pricePerSlot * slots * 100) / 100;

  // Collision on the reference number itself is vanishingly unlikely (32^6
  // combinations) but retried a few times with a fresh code rather than
  // trusted to never happen.
  const MAX_REFERENCE_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_REFERENCE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("open_play_bookings")
      .insert({
        activity_id: activityId,
        user_id: userId,
        reference_number: generateReferenceNumber("OP"),
        amount,
        slots,
        guest_names: guestNames,
      })
      .select(BOOKING_COLUMNS)
      .single();

    if (!error) return mapBooking(data);

    // Unique violation on the partial (activity_id, user_id) index — the
    // real guard against joining the same session twice, since the
    // spotsLeft check above only catches it most of the time, not under a
    // concurrent double-submit.
    if (error.code === "23505" && error.message.includes("one_active_per_user")) {
      throw new AppError("You already joined this session", 409);
    }

    // Unique violation on reference_number — retry with a new code.
    if (error.code === "23505" && attempt < MAX_REFERENCE_ATTEMPTS) continue;

    throw new AppError("Failed to join session", 500);
  }

  throw new AppError("Failed to join session", 500);
}

export async function getBookingById(id: string): Promise<OpenPlayBooking> {
  const { data, error } = await supabase
    .from("open_play_bookings")
    .select(BOOKING_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError("Booking not found", 404);
  }

  return mapBooking(data);
}

export async function getMyBookingForActivity(
  userId: string,
  activityId: string,
): Promise<OpenPlayBooking | null> {
  const { data, error } = await supabase
    .from("open_play_bookings")
    .select(BOOKING_COLUMNS)
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .neq("status", "CANCELLED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load your booking", 500);
  }

  return data ? mapBooking(data) : null;
}

export async function markBookingConfirmed(id: string): Promise<void> {
  // Only flips PENDING_PAYMENT -> CONFIRMED — the WHERE clause makes this an
  // idempotency guard too, so a duplicate webhook delivery that reconciles
  // the same booking twice can't apply the transition more than once.
  await supabase
    .from("open_play_bookings")
    .update({ status: "CONFIRMED" })
    .eq("id", id)
    .eq("status", "PENDING_PAYMENT");
}

export interface Participant {
  id: string;
  name: string;
  // null for guests (they have no account) and for hosts who haven't
  // uploaded a profile photo.
  avatarUrl: string | null;
}

export interface AdminOpenPlayBooking extends OpenPlayBooking {
  customerName: string | null;
  customerEmail: string;
}

interface AdminOpenPlayBookingRow extends OpenPlayBookingRow {
  users: { full_name: string | null; email: string } | null;
}

function mapAdminBooking(row: AdminOpenPlayBookingRow): AdminOpenPlayBooking {
  return {
    ...mapBooking(row),
    customerName: row.users?.full_name ?? null,
    customerEmail: row.users?.email ?? "",
  };
}

export async function listBookingsForActivity(
  activityId: string,
): Promise<AdminOpenPlayBooking[]> {
  const { data, error } = await supabase
    .from("open_play_bookings")
    .select(`${BOOKING_COLUMNS}, users(full_name, email)`)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Failed to load bookings", 500);
  }

  return ((data ?? []) as unknown as AdminOpenPlayBookingRow[]).map(mapAdminBooking);
}

interface ParticipantRow {
  id: string;
  user_id: string;
  guest_names: string[];
  users: { full_name: string | null; avatar_url: string | null } | null;
}

// One entry per actual player, not per booking — a party of 3 (the booker
// plus 2 guests) shows as 3 avatars, matching confirmedCount which is also
// slot-based.
export async function listConfirmedParticipants(activityId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("open_play_bookings")
    .select("id, user_id, guest_names, users(full_name, avatar_url)")
    .eq("activity_id", activityId)
    .eq("status", "CONFIRMED")
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError("Failed to load participants", 500);
  }

  const participants: Participant[] = [];
  for (const row of (data ?? []) as unknown as ParticipantRow[]) {
    participants.push({
      id: row.user_id,
      name: row.users?.full_name ?? "Player",
      avatarUrl: row.users?.avatar_url ?? null,
    });
    // Guests have no account, so there's nothing to link an avatar to.
    (row.guest_names ?? []).forEach((name, index) => {
      participants.push({ id: `${row.id}-guest-${index}`, name, avatarUrl: null });
    });
  }
  return participants;
}
