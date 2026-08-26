"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { BookingList } from "@/components/bookings/BookingList";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import { courtBookingToDisplay, openPlayBookingToDisplay, type DisplayBooking } from "@/lib/booking-display";
import { isUpcomingBooking, type CustomerBooking } from "@/types/booking";
import { isUpcomingOpenPlayBooking, type CustomerOpenPlayBooking } from "@/types/openPlay";

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

// The list of "not yet done" bookings — shown when this page is reached
// without a specific bookingId (i.e. from the "Bookings" nav item, not a
// PayMongo redirect or a click-through from History).
function UpcomingBookingsView() {
  const { accessToken } = useAuth();
  const [courtBookings, setCourtBookings] = useState<CustomerBooking[]>([]);
  const [openPlayBookings, setOpenPlayBookings] = useState<CustomerOpenPlayBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      apiFetch<CustomerBooking[]>("/bookings/mine", accessToken),
      apiFetch<CustomerOpenPlayBooking[]>("/open-play/bookings/mine", accessToken),
    ])
      .then(([court, openPlay]) => {
        setCourtBookings(court);
        setOpenPlayBookings(openPlay);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load bookings"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const upcomingBookings: DisplayBooking[] = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const upcoming = [
      ...courtBookings.filter((b) => isUpcomingBooking(b, todayKey)).map(courtBookingToDisplay),
      ...openPlayBookings
        .filter((b) => isUpcomingOpenPlayBooking(b, todayKey))
        .map(openPlayBookingToDisplay),
    ];
    return upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
  }, [courtBookings, openPlayBookings]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiCalendar className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Bookings</h1>
          <p className="text-sm text-gray-600">
            Bookings that aren&apos;t done yet — pending payment or upcoming.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}

        {!error && !isLoading && upcomingBookings.length === 0 && (
          <p className="text-sm text-gray-500">
            You don&apos;t have any upcoming bookings. Once you book a court,
            it&apos;ll show up here until it&apos;s played.
          </p>
        )}

        {!error && !isLoading && upcomingBookings.length > 0 && (
          <BookingList bookings={upcomingBookings} />
        )}
      </div>
    </section>
  );
}

function SingleBookingView({
  bookingId,
  paymentOutcome,
}: {
  bookingId: string;
  // Reflects what PayMongo's redirect claimed — informational only. The
  // actual confirmation always comes from re-fetching the booking below,
  // never from this query param: a redirect to this page can be reached
  // without ever having paid.
  paymentOutcome: string | null;
}) {
  const { accessToken } = useAuth();

  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
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
            <QRCodeSVG
              value={`${window.location.origin}/verify/${booking.referenceNumber}`}
              size={180}
            />
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

function SingleOpenPlayBookingView({
  bookingId,
  paymentOutcome,
}: {
  bookingId: string;
  // Same caveat as SingleBookingView: informational only, never the source
  // of truth for whether the booking actually confirmed.
  paymentOutcome: string | null;
}) {
  const { accessToken } = useAuth();

  const [booking, setBooking] = useState<CustomerOpenPlayBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    apiFetch<CustomerOpenPlayBooking>(`/open-play/bookings/${bookingId}`, accessToken)
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

  useEffect(() => {
    if (!booking || booking.status !== "PENDING_PAYMENT") return;
    if (paymentOutcome !== "success") return;
    if (pollAttempt >= MAX_POLL_ATTEMPTS) return;

    const timer = setTimeout(() => setPollAttempt((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [booking, paymentOutcome, pollAttempt]);

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
  const dateLabel = new Date(`${booking.eventDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (booking.status === "CONFIRMED") {
    return (
      <IconPanel icon={FiCheckCircle} tone="primary" title="You're In!">
        <p>
          {booking.activityTitle} — {dateLabel}, {timeRange} — ₱
          {booking.amount.toFixed(2)} paid.
        </p>

        <div className="mx-auto mt-6 w-fit rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reference
          </p>
          <p className="mt-1 text-lg font-bold text-secondary">
            {booking.referenceNumber}
          </p>
          <div className="mt-4 flex justify-center">
            <QRCodeSVG
              value={`${window.location.origin}/verify/${booking.referenceNumber}`}
              size={180}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500">Show this at check-in</p>
        </div>

        <LinkButton href="/open-play" variant="outline" className="mt-6">
          Browse Open Play
        </LinkButton>
      </IconPanel>
    );
  }

  if (paymentOutcome === "cancelled") {
    return (
      <IconPanel icon={FiXCircle} tone="gray" title="Payment Cancelled">
        <p>No charge was made. Your reserved spot wasn&apos;t paid for.</p>
        <LinkButton href="/open-play" variant="outline" className="mt-4">
          Browse Open Play
        </LinkButton>
      </IconPanel>
    );
  }

  if (booking.status === "PENDING_PAYMENT" && pollAttempt >= MAX_POLL_ATTEMPTS) {
    return (
      <IconPanel icon={FiAlertTriangle} tone="amber" title="Still confirming…">
        <p>
          This is taking longer than expected. Your booking ({booking.activityTitle},{" "}
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
        {booking.activityTitle} — {dateLabel}, {timeRange}
      </IconPanel>
    );
  }

  return (
    <IconPanel icon={FiXCircle} tone="gray" title="Booking Cancelled">
      <p>
        {booking.activityTitle} — {dateLabel}, {timeRange}
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">
        {booking.referenceNumber}
      </p>
      <LinkButton href="/open-play" variant="outline" className="mt-4">
        Browse Open Play
      </LinkButton>
    </IconPanel>
  );
}

function ConfirmationRouter() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const openPlayBookingId = searchParams.get("openPlayBookingId");
  const paymentOutcome = searchParams.get("status");

  if (openPlayBookingId) {
    return (
      <SingleOpenPlayBookingView bookingId={openPlayBookingId} paymentOutcome={paymentOutcome} />
    );
  }

  if (!bookingId) {
    return <UpcomingBookingsView />;
  }

  return <SingleBookingView bookingId={bookingId} paymentOutcome={paymentOutcome} />;
}

export default function BookingConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationRouter />
    </Suspense>
  );
}
