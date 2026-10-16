"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiLock, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { Club } from "@/types/club";

export default function ClubsPage() {
  const { accessToken } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<Club[]>("/clubs", accessToken)
      .then(setClubs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load clubs"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  async function toggleMembership(club: Club) {
    if (
      club.isMember &&
      club.visibility === "PRIVATE" &&
      !window.confirm("This club is private — you will need a new invitation to rejoin. Leave anyway?")
    ) {
      return;
    }

    setPendingId(club.id);
    setError(null);
    try {
      await apiFetch(`/clubs/${club.id}/join`, accessToken, {
        method: club.isMember ? "DELETE" : "POST",
      });
      setClubs((current) =>
        current.map((c) =>
          c.id === club.id
            ? { ...c, isMember: !c.isMember, memberCount: c.memberCount + (c.isMember ? -1 : 1) }
            : c,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiUsers className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-secondary">Clubs</h1>
          <p className="mt-1 text-gray-600">
            Join a club to see the feed, sign up for plays, and chat with the group.
          </p>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="mt-10 text-sm text-gray-500">Loading clubs…</p>}
      {!isLoading && clubs.length === 0 && !error && (
        <p className="mt-10 text-sm text-gray-500">No clubs yet — check back soon.</p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <div key={club.id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              {club.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-semibold text-secondary">
                  {club.name.charAt(0).toUpperCase()}
                </span>
              )}
              <h3 className="font-semibold text-secondary">{club.name}</h3>
              {club.visibility === "PRIVATE" && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  <FiLock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
            {club.description && (
              <p className="mt-1 line-clamp-3 text-sm text-gray-600">{club.description}</p>
            )}
            <p className="mt-3 text-sm text-gray-500">
              {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
            </p>

            <div className="mt-4 flex gap-2">
              {club.isMember ? (
                <>
                  <Link
                    href={`/clubs/${club.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-secondary hover:opacity-90"
                  >
                    Open
                  </Link>
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    disabled={pendingId === club.id}
                    onClick={() => toggleMembership(club)}
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full px-3 py-1.5 text-xs"
                  disabled={pendingId === club.id}
                  onClick={() => toggleMembership(club)}
                >
                  Join Club
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
