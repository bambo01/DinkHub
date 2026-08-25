import { supabase } from "../config/supabase.js";
import { paymongo } from "../config/paymongo.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { getBookingById, markBookingConfirmed } from "./bookings.service.js";
import { getCourtById } from "./courts.service.js";
import { getUserById } from "./users.service.js";
import { sendBookingConfirmationEmail } from "./email.service.js";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymongoCheckoutSessionId: string;
  createdAt: string;
}

interface PaymentRow {
  id: string;
  booking_id: string;
  // PostgREST returns `numeric` columns as strings to avoid precision loss.
  amount: string;
  status: PaymentStatus;
  paymongo_checkout_session_id: string;
  created_at: string;
}

const PAYMENT_COLUMNS = "id, booking_id, amount, status, paymongo_checkout_session_id, created_at";

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    amount: Number(row.amount),
    status: row.status,
    paymongoCheckoutSessionId: row.paymongo_checkout_session_id,
    createdAt: row.created_at,
  };
}

export interface AdminPayment extends Payment {
  bookingReferenceNumber: string;
  courtName: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  customerName: string | null;
  customerEmail: string;
}

interface AdminPaymentRow extends PaymentRow {
  court_bookings: {
    reference_number: string;
    booking_date: string;
    start_hour: number;
    end_hour: number;
    courts: { name: string } | null;
    users: { full_name: string | null; email: string } | null;
  } | null;
}

function mapAdminPayment(row: AdminPaymentRow): AdminPayment {
  return {
    ...mapPayment(row),
    bookingReferenceNumber: row.court_bookings?.reference_number ?? "",
    courtName: row.court_bookings?.courts?.name ?? "Unknown court",
    bookingDate: row.court_bookings?.booking_date ?? "",
    startHour: row.court_bookings?.start_hour ?? 0,
    endHour: row.court_bookings?.end_hour ?? 0,
    customerName: row.court_bookings?.users?.full_name ?? null,
    customerEmail: row.court_bookings?.users?.email ?? "",
  };
}

export async function listPayments(): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      `${PAYMENT_COLUMNS}, court_bookings(reference_number, booking_date, start_hour, end_hour, courts(name), users(full_name, email))`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Failed to load payments", 500);
  }

  return ((data ?? []) as unknown as AdminPaymentRow[]).map(mapAdminPayment);
}

interface PaymongoCheckoutSessionResponse {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      // payment_intent is itself a full JSON:API resource, not a flat
      // object — its status lives at payment_intent.attributes.status.
      payment_intent?: { attributes?: { status?: string } };
    };
  };
}

export async function createCheckoutSession(
  userId: string,
  bookingId: string,
): Promise<{ checkoutUrl: string; paymentId: string }> {
  const booking = await getBookingById(bookingId);

  if (booking.userId !== userId) {
    // Don't leak that a booking with this id exists for someone else.
    throw new AppError("Booking not found", 404);
  }

  if (booking.status !== "PENDING_PAYMENT") {
    throw new AppError("This booking is not awaiting payment", 422);
  }

  const court = await getCourtById(booking.courtId);
  const amountCentavos = Math.round(booking.totalAmount * 100);

  let response: PaymongoCheckoutSessionResponse;
  try {
    const result = await paymongo.post<PaymongoCheckoutSessionResponse>(
      "/checkout_sessions",
      {
        data: {
          attributes: {
            line_items: [
              {
                name: `${court.name} booking`,
                description: `${booking.bookingDate}, ${booking.startHour}:00–${booking.endHour}:00`,
                amount: amountCentavos,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "paymaya"],
            description: `DinkHub court booking – ${court.name}`,
            success_url: `${env.FRONTEND_URL}/bookings/confirmation?bookingId=${booking.id}&status=success`,
            cancel_url: `${env.FRONTEND_URL}/bookings/confirmation?bookingId=${booking.id}&status=cancelled`,
            send_email_receipt: false,
            show_line_items: true,
            metadata: { bookingId: booking.id },
          },
        },
      },
    );
    response = result.data;
  } catch (err) {
    console.error("PayMongo checkout session creation failed:", err);
    throw new AppError("Failed to start payment. Please try again.", 502);
  }

  const checkoutSessionId = response.data.id;
  const checkoutUrl = response.data.attributes.checkout_url;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      booking_id: booking.id,
      amount: booking.totalAmount,
      paymongo_checkout_session_id: checkoutSessionId,
    })
    .select(PAYMENT_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError("Failed to record payment", 500);
  }

  return { checkoutUrl, paymentId: mapPayment(data).id };
}

// Called from the webhook after signature verification confirms a
// `checkout_session.payment.paid` event genuinely came from PayMongo. The
// event payload only identifies *which* session to look at — the actual
// paid/not-paid decision always comes from this fresh authoritative fetch,
// not from trusting fields nested in the webhook body.
export async function reconcileCheckoutSession(
  checkoutSessionId: string,
): Promise<void> {
  const { data: paymentRow } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("paymongo_checkout_session_id", checkoutSessionId)
    .single();

  if (!paymentRow) return;
  const payment = mapPayment(paymentRow);

  // Already handled by a previous delivery of this same event — no-op.
  if (payment.status !== "PENDING") return;

  let sessionStatus: string | undefined;
  try {
    const result = await paymongo.get<PaymongoCheckoutSessionResponse>(
      `/checkout_sessions/${checkoutSessionId}`,
    );
    sessionStatus = result.data.data.attributes.payment_intent?.attributes?.status;
  } catch (err) {
    console.error("Failed to re-fetch PayMongo checkout session:", err);
    return;
  }

  if (sessionStatus !== "succeeded") return;

  // Conditional update on status = 'PENDING' — the actual idempotency
  // guard, so a concurrent duplicate delivery processing this at the same
  // moment can't apply the transition twice.
  const { data: updated } = await supabase
    .from("payments")
    .update({ status: "PAID" })
    .eq("id", payment.id)
    .eq("status", "PENDING")
    .select("id")
    .single();

  if (!updated) return;

  await markBookingConfirmed(payment.bookingId);

  // Best-effort — a failure here shouldn't undo the confirmation that just
  // succeeded above. sendBookingConfirmationEmail already catches and logs
  // its own errors internally.
  const confirmedBooking = await getBookingById(payment.bookingId);
  const [court, customer] = await Promise.all([
    getCourtById(confirmedBooking.courtId),
    getUserById(confirmedBooking.userId),
  ]);
  await sendBookingConfirmationEmail(
    confirmedBooking,
    court,
    customer.email,
    customer.fullName,
  );
}
