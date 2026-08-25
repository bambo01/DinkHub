import QRCode from "qrcode";
import { resend } from "../config/resend.js";
import { env } from "../config/env.js";
import { formatHour } from "../utils/format-hour.js";
import type { Booking } from "./bookings.service.js";
import type { Court } from "./courts.service.js";

export async function sendBookingConfirmationEmail(
  booking: Booking,
  court: Court,
  toEmail: string,
  toName: string | null,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(
      `Email not configured (RESEND_API_KEY/EMAIL_FROM unset) — skipping confirmation email for booking ${booking.referenceNumber}`,
    );
    return;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(booking.referenceNumber, {
      width: 240,
      margin: 1,
    });
    const qrBase64 = qrDataUrl.split(",")[1] ?? "";

    const greetingName = toName ?? "there";
    const timeRange = `${formatHour(booking.startHour)} – ${formatHour(booking.endHour)}`;

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #062e40;">
        <h1 style="font-size: 20px;">Booking Confirmed!</h1>
        <p>Hi ${greetingName},</p>
        <p>Your court booking is confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #667;">Reference</td><td style="padding: 4px 0; font-weight: bold;">${booking.referenceNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Court</td><td style="padding: 4px 0;">${court.name}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Location</td><td style="padding: 4px 0;">${court.location}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Date</td><td style="padding: 4px 0;">${booking.bookingDate}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Time</td><td style="padding: 4px 0;">${timeRange}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Amount Paid</td><td style="padding: 4px 0;">₱${booking.totalAmount.toFixed(2)}</td></tr>
        </table>
        <p>Show this QR code at check-in:</p>
        <img src="cid:booking-qr" alt="Booking QR code" width="200" height="200" />
        <p style="margin-top: 24px; color: #999; font-size: 12px;">DinkHub</p>
      </div>
    `;

    await resend.post("/emails", {
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `Booking Confirmed — ${booking.referenceNumber}`,
      html,
      attachments: [
        {
          filename: "booking-qr.png",
          content: qrBase64,
          content_id: "booking-qr",
        },
      ],
    });
  } catch (err) {
    // Email delivery is best-effort — the booking is already confirmed
    // regardless of whether this succeeds, so a failure here is logged, not
    // thrown back up to affect the payment/booking transition.
    console.error(
      `Failed to send confirmation email for booking ${booking.referenceNumber}:`,
      err,
    );
  }
}
