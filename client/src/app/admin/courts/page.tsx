"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { Court } from "@/types/court";

const statusStyles: Record<Court["status"], string> = {
  ACTIVE: "bg-primary/15 text-secondary",
  INACTIVE: "bg-gray-100 text-gray-500",
  MAINTENANCE: "bg-amber-100 text-amber-700",
};

export default function AdminCourtsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
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

    apiFetch<Court[]>("/courts", accessToken)
      .then(setCourts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load courts"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Courts</h1>
          <p className="mt-1 text-sm text-gray-600">
            {courts.length} court{courts.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/courts/new")}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90"
        >
          <FiPlus className="h-4 w-4" />
          Add Court
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading courts…</p>
        )}

        {!error && !isLoading && courts.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            No courts yet. Add your first one to get started.
          </p>
        )}

        {!error && !isLoading && courts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Price/hr</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courts.map((court) => (
                  <tr
                    key={court.id}
                    onClick={() => router.push(`/admin/courts/${court.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
                          <GiTennisCourt className="h-4 w-4" />
                        </span>
                        {court.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{court.type}</td>
                    <td className="px-4 py-3 text-gray-600">{court.location}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatHour(court.defaultOpenHour)} – {formatHour(court.defaultCloseHour)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ₱{court.pricePerHour.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusStyles[court.status],
                        )}
                      >
                        {court.status}
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
