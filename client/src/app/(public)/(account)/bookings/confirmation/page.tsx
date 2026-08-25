"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import type { CustomerBooking } from "@/types/booking";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 5;

function IconPanel({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: typeof FiCheckCircle;
  tone: "primary" | "amber" | "gray";
  title: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    primary: "bg-primary/15 text-primary",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
  }[tone];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 text-center">
      <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-secondary">{title}</h1>
      <div className="mt-2 text-sm text-gray-600">{children}</div>
    </section>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  // Reflects what PayMongo's redirect claimed — informational only. The
  // actual confirmation always comes from re-fetching the booking below,
  // never from this query param: a redirect to this page can be reached
  // without ever having paid.
  const paymentOutcome = searchParams.get("status");
  const { accessToken } = useAuth();

  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (!accessToken || !bookingId) return;
    let cancelled = false;

    apiFetch<CustomerBooking>(`/bookings/${bookingId}`, accessToken)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load booking");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, bookingId, pollAttempt]);

  // While PayMongo says the payment succeeded but the webhook hasn't landed
  // yet, poll the real booking status a few times before giving up.
  useEffect(() => {
    if (!booking || booking.status !== "PENDING_PAYMENT") return;
    if (paymentOutcome !== "success") return;
    if (pollAttempt >= MAX_POLL_ATTEMPTS) return;

    const timer = setTimeout(() => setPollAttempt((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [booking, paymentOutcome, pollAttempt]);

  if (!bookingId) {
    return (
      <IconPanel icon={FiCheckCircle} tone="primary" title="Booking Confirmation">
        You don&apos;t have a booking to confirm right now. Once you book a
        court or Open Play session, its confirmation will show up here.
      </IconPanel>
    );
  }

  if (error) {
    return (
      <IconPanel icon={FiXCircle} tone="amber" title="Couldn't load your booking">
        {error}
      </IconPanel>
    );
  }

  if (!booking) {
    return (
      <IconPanel icon={FiClock} tone="gray" title="Loading…">
        Fetching your booking details.
      </IconPanel>
    );
  }

  const timeRange = `${formatHour(booking.startHour)} – ${formatHour(booking.endHour)}`;
  const dateLabel = new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );

  if (booking.status === "CONFIRMED") {
    return (
      <IconPanel icon={FiCheckCircle} tone="primary" title="Booking Confirmed!">
        <p>
          {booking.courtName} — {dateLabel}, {timeRange} — ₱
          {booking.totalAmount.toFixed(2)} paid.
        </p>

        <div className="mx-auto mt-6 w-fit rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reference
          </p>
          <p className="mt-1 text-lg font-bold text-secondary">
            {booking.referenceNumber}
          </p>
          <div className="mt-4 flex justify-center">
            <QRCodeSVG value={booking.referenceNumber} size={180} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Show this at check-in</p>
        </div>

        <LinkButton href="/courts" variant="outline" className="mt-6">
          Book Another Court
        </LinkButton>
      </IconPanel>
    );
  }

  if (paymentOutcome === "cancelled") {
    return (
      <IconPanel icon={FiXCircle} tone="gray" title="Payment Cancelled">
        <p>No charge was made. Your reserved time wasn&apos;t paid for.</p>
        <LinkButton href="/courts" variant="outline" className="mt-4">
          Browse Courts
        </LinkButton>
      </IconPanel>
    );
  }

  if (booking.status === "PENDING_PAYMENT" && pollAttempt >= MAX_POLL_ATTEMPTS) {
    return (
      <IconPanel icon={FiAlertTriangle} tone="amber" title="Still confirming…">
        <p>
          This is taking longer than expected. Your booking ({booking.courtName},{" "}
          {dateLabel}, {timeRange}) is still pending — refresh in a moment,
          or contact us if this persists.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPollAttempt(0)}
          className="mt-4"
        >
          Check Again
        </Button>
      </IconPanel>
    );
  }

  if (booking.status === "PENDING_PAYMENT") {
    return (
      <IconPanel icon={FiClock} tone="gray" title="Confirming your payment…">
        {booking.courtName} — {dateLabel}, {timeRange}
      </IconPanel>
    );
  }

  const statusTitles: Record<string, string> = {
    CANCELLED: "Booking Cancelled",
    COMPLETED: "Booking Completed",
    EXPIRED: "Booking Expired",
  };

  return (
    <IconPanel
      icon={FiXCircle}
      tone="gray"
      title={statusTitles[booking.status] ?? `Booking ${booking.status}`}
    >
      <p>
        {booking.courtName} — {dateLabel}, {timeRange}
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">
        {booking.referenceNumber}
      </p>
      <LinkButton href="/courts" variant="outline" className="mt-4">
        Browse Courts
      </LinkButton>
    </IconPanel>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
