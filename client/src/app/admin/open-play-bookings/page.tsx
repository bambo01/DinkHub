"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { Activity, ActivityStatus } from "@/types/openPlay";

const statusStyles: Record<ActivityStatus, string> = {
  ACTIVE: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOpenPlayBookingsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
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

    apiFetch<Activity[]>("/open-play", accessToken)
      .then(setActivities)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load events"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-secondary">Open Play Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">
          {activities.length} event{activities.length === 1 ? "" : "s"} — view who&apos;s
          booked into each one.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading events…</p>
        )}

        {!error && !isLoading && activities.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            No Open Play events yet — create one from the Open Play page.
          </p>
        )}

        {!error && !isLoading && activities.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Courts</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Confirmed</th>
                  <th className="px-4 py-3 font-medium">Spots Left</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    onClick={() => router.push(`/admin/open-play-bookings/${activity.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-secondary">
                      {activity.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {activity.courts.map((court) => court.name).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{activity.eventDate}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatHour(activity.startHour)} – {formatHour(activity.endHour)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {activity.confirmedCount}/{activity.capacity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{activity.spotsLeft}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusStyles[activity.status],
                        )}
                      >
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-secondary hover:underline">
                        View
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
