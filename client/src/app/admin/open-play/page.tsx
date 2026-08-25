"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import { skillLevelLabel, type Activity, type ActivityStatus } from "@/types/openPlay";

const statusStyles: Record<ActivityStatus, string> = {
  ACTIVE: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOpenPlayPage() {
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
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load activities"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Open Play</h1>
          <p className="mt-1 text-sm text-gray-600">
            {activities.length} activit{activities.length === 1 ? "y" : "ies"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/open-play/new")}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90"
        >
          <FiPlus className="h-4 w-4" />
          Add Activity
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading activities…</p>
        )}

        {!error && !isLoading && activities.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            No Open Play activities yet. Add your first one to get started.
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
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Price/Slot</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    onClick={() => router.push(`/admin/open-play/${activity.id}`)}
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
                    <td className="px-4 py-3 text-gray-600">{activity.capacity}</td>
                    <td className="px-4 py-3 text-gray-600">
                      ₱{activity.pricePerSlot.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {skillLevelLabel(activity.skillLevel)}
                    </td>
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
