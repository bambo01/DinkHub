"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import {
  skillLevelLabel,
  type Activity,
  type AdminOpenPlayBooking,
  type OpenPlayBookingStatus,
} from "@/types/openPlay";

const bookingStatusStyles: Record<OpenPlayBookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOpenPlayBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [bookings, setBookings] = useState<AdminOpenPlayBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!accessToken || !id) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      apiFetch<Activity>(`/open-play/${id}`, accessToken),
      apiFetch<AdminOpenPlayBooking[]>(`/open-play/${id}/bookings`, accessToken),
    ])
      .then(([activityData, bookingsData]) => {
        setActivity(activityData);
        setBookings(bookingsData);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load event"))
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/open-play-bookings")}
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Open Play Bookings
      </button>

      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && activity && (
        <>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-secondary">{activity.title}</h1>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-secondary">
                {skillLevelLabel(activity.skillLevel)}
              </span>
            </div>

            {activity.description && (
              <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2 text-secondary">
                <FiMapPin className="h-4 w-4 text-gray-400" />
                {activity.courts.map((court) => court.name).join(", ")}
              </p>
              <p className="flex items-center gap-2 text-secondary">
                <FiCalendar className="h-4 w-4 text-gray-400" />
                {activity.eventDate}
              </p>
              <p className="flex items-center gap-2 text-secondary">
                <FiClock className="h-4 w-4 text-gray-400" />
                {formatHour(activity.startHour)} – {formatHour(activity.endHour)}
              </p>
              <p className="flex items-center gap-2 text-secondary">
                <FiUsers className="h-4 w-4 text-gray-400" />
                {activity.confirmedCount}/{activity.capacity} confirmed &middot;{" "}
                {activity.spotsLeft} spots left
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-600">Price per slot</span>
              <span className="text-lg font-bold text-secondary">
                ₱{activity.pricePerSlot.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-secondary">
                {bookings.length} booking{bookings.length === 1 ? "" : "s"}
              </h2>
            </div>

            {bookings.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                No one has booked into this event yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Guests</th>
                      <th className="px-4 py-3 font-medium">Slots</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Booked</th>
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
                        <td className="px-4 py-3 text-gray-600">
                          {booking.guestNames.length === 0 ? (
                            "—"
                          ) : (
                            <span title={booking.guestNames.join(", ")}>
                              {booking.guestNames.join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{booking.slots}</td>
                        <td className="px-4 py-3 text-gray-600">
                          ₱{booking.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(booking.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              bookingStatusStyles[booking.status],
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
        </>
      )}
    </div>
  );
}
