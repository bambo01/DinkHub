import QRCode from "qrcode";
import { getGmailTransport } from "../config/gmail.js";
import { env } from "../config/env.js";
import { formatHour } from "../utils/format-hour.js";
import type { Booking } from "./bookings.service.js";
import type { Court } from "./courts.service.js";
import type { Activity } from "./open-play.service.js";
import type { OpenPlayBooking } from "./open-play-bookings.service.js";

// The QR code encodes a link to the public verify page, not the bare
// reference number — scanning it should take whoever's checking someone in
// straight to the booking details, not just a plain-text string.
function verifyUrl(referenceNumber: string): string {
  return `${env.FRONTEND_URL}/verify/${referenceNumber}`;
}

export async function sendBookingConfirmationEmail(
  booking: Booking,
  court: Court,
  toEmail: string,
  toName: string | null,
): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.log(
      `Email not configured (GMAIL_USER/GMAIL_APP_PASSWORD unset) — skipping confirmation email for booking ${booking.referenceNumber}`,
    );
    return;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl(booking.referenceNumber), {
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

    const gmailTransport = await getGmailTransport();
    await gmailTransport.sendMail({
      from: `DinkHub <${env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Confirmed — ${booking.referenceNumber}`,
      html,
      attachments: [
        {
          filename: "booking-qr.png",
          content: qrBase64,
          encoding: "base64",
          cid: "booking-qr",
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

export async function sendOpenPlayConfirmationEmail(
  booking: OpenPlayBooking,
  activity: Activity,
  toEmail: string,
  toName: string | null,
): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.log(
      `Email not configured (GMAIL_USER/GMAIL_APP_PASSWORD unset) — skipping confirmation email for open play booking ${booking.referenceNumber}`,
    );
    return;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl(booking.referenceNumber), {
      width: 240,
      margin: 1,
    });
    const qrBase64 = qrDataUrl.split(",")[1] ?? "";

    const greetingName = toName ?? "there";
    const timeRange = `${formatHour(activity.startHour)} – ${formatHour(activity.endHour)}`;
    const courtNames = activity.courts.map((court) => court.name).join(", ");
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
    const guestNames = booking.guestNames.map(escapeHtml).join(", ");

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #062e40;">
        <h1 style="font-size: 20px;">You're In!</h1>
        <p>Hi ${greetingName},</p>
        <p>Your spot for this Open Play session is confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #667;">Reference</td><td style="padding: 4px 0; font-weight: bold;">${booking.referenceNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Session</td><td style="padding: 4px 0;">${activity.title}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Court(s)</td><td style="padding: 4px 0;">${courtNames}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Date</td><td style="padding: 4px 0;">${activity.eventDate}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Time</td><td style="padding: 4px 0;">${timeRange}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Players</td><td style="padding: 4px 0;">${booking.slots}${guestNames ? ` (you + ${guestNames})` : ""}</td></tr>
          <tr><td style="padding: 4px 0; color: #667;">Amount Paid</td><td style="padding: 4px 0;">₱${booking.amount.toFixed(2)}</td></tr>
        </table>
        <p>Show this QR code at check-in:</p>
        <img src="cid:open-play-qr" alt="Open play QR code" width="200" height="200" />
        <p style="margin-top: 24px; color: #999; font-size: 12px;">DinkHub</p>
      </div>
    `;

    const gmailTransport = await getGmailTransport();
    await gmailTransport.sendMail({
      from: `DinkHub <${env.GMAIL_USER}>`,
      to: toEmail,
      subject: `You're In — ${booking.referenceNumber}`,
      html,
      attachments: [
        {
          filename: "open-play-qr.png",
          content: qrBase64,
          encoding: "base64",
          cid: "open-play-qr",
        },
      ],
    });
  } catch (err) {
    // Email delivery is best-effort — the reservation is already confirmed
    // regardless of whether this succeeds, so a failure here is logged, not
    // thrown back up to affect the payment/booking transition.
    console.error(
      `Failed to send confirmation email for open play booking ${booking.referenceNumber}:`,
      err,
    );
  }
}
