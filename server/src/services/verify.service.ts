import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

// Reference numbers are minted with a fixed prefix per booking type (see
// reference-number.ts callers) — "DH-" for a court booking, "OP-" for an
// Open Play reservation — so the prefix alone is enough to know which table
// to look in, without needing the type encoded separately in the QR code.
export type VerifyResult =
  | {
      type: "COURT";
      referenceNumber: string;
      status: string;
      customerName: string | null;
      courtName: string;
      bookingDate: string;
      startHour: number;
      endHour: number;
      totalAmount: number;
    }
  | {
      type: "OPEN_PLAY";
      referenceNumber: string;
      status: string;
      customerName: string | null;
      activityTitle: string;
      eventDate: string;
      startHour: number;
      endHour: number;
      slots: number;
      guestNames: string[];
      amount: number;
    };

interface CourtBookingVerifyRow {
  reference_number: string;
  status: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  total_amount: string;
  courts: { name: string } | null;
  users: { full_name: string | null } | null;
}

interface OpenPlayBookingVerifyRow {
  reference_number: string;
  status: string;
  slots: number;
  guest_names: string[];
  amount: string;
  users: { full_name: string | null } | null;
  open_play_activities: {
    title: string;
    event_date: string;
    start_hour: number;
    end_hour: number;
  } | null;
}

async function getCourtBookingByReference(referenceNumber: string): Promise<VerifyResult> {
  const { data, error } = await supabase
    .from("court_bookings")
    .select(
      "reference_number, status, booking_date, start_hour, end_hour, total_amount, courts(name), users(full_name)",
    )
    .eq("reference_number", referenceNumber)
    .single();

  if (error || !data) {
    throw new AppError("Booking not found", 404);
  }

  const row = data as unknown as CourtBookingVerifyRow;
  return {
    type: "COURT",
    referenceNumber: row.reference_number,
    status: row.status,
    customerName: row.users?.full_name ?? null,
    courtName: row.courts?.name ?? "Unknown court",
    bookingDate: row.booking_date,
    startHour: row.start_hour,
    endHour: row.end_hour,
    totalAmount: Number(row.total_amount),
  };
}

async function getOpenPlayBookingByReference(referenceNumber: string): Promise<VerifyResult> {
  const { data, error } = await supabase
    .from("open_play_bookings")
    .select(
      "reference_number, status, slots, guest_names, amount, users(full_name), open_play_activities(title, event_date, start_hour, end_hour)",
    )
    .eq("reference_number", referenceNumber)
    .single();

  if (error || !data) {
    throw new AppError("Booking not found", 404);
  }

  const row = data as unknown as OpenPlayBookingVerifyRow;
  return {
    type: "OPEN_PLAY",
    referenceNumber: row.reference_number,
    status: row.status,
    customerName: row.users?.full_name ?? null,
    activityTitle: row.open_play_activities?.title ?? "Open Play",
    eventDate: row.open_play_activities?.event_date ?? "",
    startHour: row.open_play_activities?.start_hour ?? 0,
    endHour: row.open_play_activities?.end_hour ?? 0,
    slots: row.slots,
    guestNames: row.guest_names ?? [],
    amount: Number(row.amount),
  };
}

export async function getByReference(referenceNumber: string): Promise<VerifyResult> {
  if (referenceNumber.startsWith("DH-")) {
    return getCourtBookingByReference(referenceNumber);
  }
  if (referenceNumber.startsWith("OP-")) {
    return getOpenPlayBookingByReference(referenceNumber);
  }
  throw new AppError("Booking not found", 404);
}
