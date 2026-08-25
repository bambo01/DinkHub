"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiUser } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
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

    apiFetch<AdminUser>(`/users/${id}`, accessToken)
      .then(setUser)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load user"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && user && (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
                <FiUser className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-secondary">
                  {user.fullName ?? "Unnamed User"}
                </h1>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                    user.role === "ADMIN"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/15 text-secondary",
                  )}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-secondary">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  User ID
                </dt>
                <dd className="mt-1 break-all text-sm text-secondary">
                  {user.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Joined
                </dt>
                <dd className="mt-1 text-sm text-secondary">
                  {new Date(user.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
