"use client";

import { useEffect, useMemo, useState } from "react";
import { FiClock } from "react-icons/fi";
import { BookingList } from "@/components/bookings/BookingList";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { toDateKey } from "@/lib/mock-courts";
import { isPastBooking, type CustomerBooking } from "@/types/booking";

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

  const pastBookings = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return bookings.filter((booking) => isPastBooking(booking, todayKey));
  }, [bookings]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiClock className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Booking History</h1>
          <p className="text-sm text-gray-600">Your previous bookings.</p>
        </div>
      </div>

      <div className="mt-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}

        {!error && !isLoading && pastBookings.length === 0 && (
          <p className="text-sm text-gray-500">
            You don&apos;t have any past bookings yet.
          </p>
        )}

        {!error && !isLoading && pastBookings.length > 0 && (
          <BookingList bookings={pastBookings} />
        )}
      </div>
    </section>
  );
}
