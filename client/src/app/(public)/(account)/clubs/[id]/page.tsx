"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { ClubChat } from "@/components/clubs/ClubChat";
import { ClubFeed } from "@/components/clubs/ClubFeed";
import { ClubSchedule } from "@/components/clubs/ClubSchedule";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Club, ClubAuthor } from "@/types/club";

type Tab = "feed" | "schedule" | "chat";

const tabs: { id: Tab; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "schedule", label: "Schedule" },
  { id: "chat", label: "Chat" },
];

// Brand-colored ring around circular avatars.
const ringClass =
  "rounded-full bg-primary p-0.5";

function Circle({ author, size }: { author: ClubAuthor; size: string }) {
  const name = author.fullName ?? "Member";
  return (
    <span className={ringClass}>
      <span className="block rounded-full bg-white p-0.5">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt={name}
            className={cn("rounded-full object-cover", size)}
          />
        ) : (
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/20 font-semibold text-secondary",
              size,
            )}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
    </span>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-secondary">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("feed");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<Club>(`/clubs/${id}`, accessToken)
      .then((loaded) => {
        setClub(loaded);
        const canAccess = loaded.isMember || user?.role === "ADMIN";
        if (!canAccess) return;
        return apiFetch<ClubAuthor[]>(`/clubs/${id}/members`, accessToken).then(setMembers);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load club"))
      .finally(() => setIsLoading(false));
  }, [id, accessToken, user?.role]);

  async function toggleMembership() {
    if (!club) return;
    setIsPending(true);
    setError(null);
    try {
      await apiFetch(`/clubs/${id}/join`, accessToken, {
        method: club.isMember ? "DELETE" : "POST",
      });
      const delta = club.isMember ? -1 : 1;
      setClub({ ...club, isMember: !club.isMember, memberCount: club.memberCount + delta });
      if (!club.isMember) {
        apiFetch<ClubAuthor[]>(`/clubs/${id}/members`, accessToken).then(setMembers).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  if (isLoading) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-sm text-gray-500">Loading club…</p>;
  }

  if (!club) {
    return (
      <p className="mx-auto max-w-5xl px-4 py-12 text-sm text-red-600">
        {error ?? "Club not found"}
      </p>
    );
  }

  // Admins can read and moderate any club without joining it.
  const canAccess = club.isMember || user?.role === "ADMIN";
  const clubAuthor: ClubAuthor = { id: club.id, fullName: club.name, avatarUrl: club.imageUrl };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-secondary"
        >
          <FiArrowLeft className="h-4 w-4" /> All clubs
        </Link>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Profile card */}
          <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="flex justify-center">
              <Circle author={clubAuthor} size="h-24 w-24 text-3xl" />
            </div>
            <h1 className="mt-4 text-xl font-bold uppercase tracking-wide">{club.name}</h1>
            {club.visibility === "PRIVATE" && (
              <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-500">
                <FiLock className="h-3 w-3" /> Private club
              </p>
            )}
            {club.description && (
              <p className="mt-2 text-sm text-gray-500">{club.description}</p>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-gray-100 py-4">
              <Stat value={club.memberCount} label="Members" />
              <Stat value={club.postCount} label="Posts" />
              <Stat value={club.sessionCount} label="Plays" />
            </div>

            {user?.role !== "ADMIN" || club.isMember ? (
              <button
                type="button"
                onClick={toggleMembership}
                disabled={isPending}
                className={cn(
                  "mt-5 w-full rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50",
                  club.isMember
                    ? "border border-gray-200 text-secondary hover:bg-secondary/10"
                    : "bg-primary text-secondary hover:opacity-90",
                )}
              >
                {club.isMember ? "Joined" : "Join"}
              </button>
            ) : null}

            {canAccess && members.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Members
                </p>
                <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <Circle author={member} size="h-9 w-9 text-sm" />
                      <span className="min-w-0 truncate text-sm text-secondary">
                        {member.fullName ?? "Member"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Main column */}
          <main className="min-w-0">
            {!canAccess ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-sm text-gray-600">
                  Join this club to see its feed, schedule and chat.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-8 border-b border-gray-100">
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "-mb-px border-b-2 px-2 py-3 text-xs font-semibold uppercase tracking-widest",
                        tab === item.id
                          ? "border-primary text-secondary"
                          : "border-transparent text-gray-500 hover:text-gray-600",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  {tab === "feed" && (
                    <ClubFeed
                      clubId={club.id}
                      onPostCountChange={(delta) =>
                        setClub((c) => (c ? { ...c, postCount: c.postCount + delta } : c))
                      }
                    />
                  )}
                  {tab === "schedule" && <ClubSchedule clubId={club.id} />}
                  {tab === "chat" && <ClubChat clubId={club.id} />}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
