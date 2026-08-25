"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiCalendar, FiClock } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { BookingStatus, CustomerBooking } from "@/types/booking";

const statusStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-secondary/10 text-secondary",
  EXPIRED: "bg-gray-100 text-gray-400",
};

export default function BookingHistoryPage() {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
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

    apiFetch<CustomerBooking[]>("/bookings/mine", accessToken)
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load bookings"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiClock className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Booking History</h1>
          <p className="text-sm text-gray-600">
            Your court bookings, past and upcoming.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}

        {!error && !isLoading && bookings.length === 0 && (
          <p className="text-sm text-gray-500">
            You haven&apos;t made any bookings yet. Your court bookings will
            show up here.
          </p>
        )}

        {!error && !isLoading && bookings.length > 0 && (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/bookings/confirmation?bookingId=${booking.id}`}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-secondary">
                      {booking.courtName}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5" />
                        {booking.bookingDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock className="h-3.5 w-3.5" />
                        {formatHour(booking.startHour)} –{" "}
                        {formatHour(booking.endHour)}
                      </span>
                    </p>
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {booking.referenceNumber}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusStyles[booking.status],
                      )}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-secondary">
                      ₱{booking.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
