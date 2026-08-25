"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiUser } from "react-icons/fi";
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

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();
    const debounce = setTimeout(() => {
      setIsLoading(true);
      setError(null);

      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";

      apiFetch<AdminUser[]>(`/users${query}`, accessToken, {
        signal: controller.signal,
      })
        .then(setUsers)
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof ApiError ? err.message : "Failed to load users");
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [accessToken, search]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {users.length} registered {users.length === 1 ? "user" : "users"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-56 text-sm text-secondary focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading users…</p>
        )}

        {!error && !isLoading && users.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No users found.</p>
        )}

        {!error && !isLoading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((adminUser) => (
                  <tr
                    key={adminUser.id}
                    onClick={() => router.push(`/admin/users/${adminUser.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
                          <FiUser className="h-4 w-4" />
                        </span>
                        {adminUser.fullName ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{adminUser.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          adminUser.role === "ADMIN"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/15 text-secondary",
                        )}
                      >
                        {adminUser.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(adminUser.createdAt).toLocaleDateString()}
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
