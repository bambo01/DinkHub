"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { AdminBooking, BookingStatus } from "@/types/booking";

const statusStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-secondary/10 text-secondary",
  EXPIRED: "bg-gray-100 text-gray-400",
};

const statusOptions: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
];

export default function AdminCourtBookingsPage() {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
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

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    const query = params.toString() ? `?${params.toString()}` : "";

    apiFetch<AdminBooking[]>(`/bookings${query}`, accessToken)
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load bookings"))
      .finally(() => setIsLoading(false));
  }, [accessToken, status, date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Court Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          {(status || date) && (
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setDate("");
              }}
              className="text-xs font-medium text-gray-500 hover:text-secondary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading bookings…</p>
        )}

        {!error && !isLoading && bookings.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No bookings found.</p>
        )}

        {!error && !isLoading && bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Court</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {booking.referenceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-secondary">
                        {booking.customerName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{booking.courtName}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.bookingDate}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatHour(booking.startHour)} – {formatHour(booking.endHour)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ₱{booking.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusStyles[booking.status],
                        )}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
