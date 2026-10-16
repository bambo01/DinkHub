"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { InvitePreview } from "@/types/club";

// Lives outside the (account) layout on purpose: that layout bounces
// logged-out visitors to "/", which would lose the invite. Here they get a
// log-in / sign-up prompt that returns them to this page afterwards.
export default function ClubInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !accessToken) return;

    apiFetch<InvitePreview>(`/clubs/invites/${token}`, accessToken)
      .then(setPreview)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Invalid invite"))
      .finally(() => setIsLoading(false));
  }, [token, accessToken, isAuthLoading]);

  async function handleAccept() {
    setIsAccepting(true);
    setError(null);
    try {
      const result = await apiFetch<{ clubId: string }>(
        `/clubs/invites/${token}/accept`,
        accessToken,
        { method: "POST" },
      );
      router.push(`/clubs/${result.clubId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to accept invite");
      setIsAccepting(false);
    }
  }

  const redirect = encodeURIComponent(`/clubs/invite/${token}`);

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiLock className="h-6 w-6" />
        </span>

        {(isAuthLoading || (user && isLoading)) && (
          <p className="mt-4 text-sm text-gray-500">Checking invitation…</p>
        )}

        {!isAuthLoading && !user && (
          <>
            <h1 className="mt-4 text-xl font-bold text-secondary">You&apos;re invited to a club</h1>
            <p className="mt-2 text-sm text-gray-600">
              Log in or create an account to accept this invitation.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/login?redirect=${redirect}`}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90"
              >
                Log in
              </Link>
              <Link
                href={`/register?redirect=${redirect}`}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary/10"
              >
                Create account
              </Link>
            </div>
          </>
        )}

        {user && !isLoading && error && !preview && (
          <>
            <h1 className="mt-4 text-xl font-bold text-secondary">Invitation unavailable</h1>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Link href="/clubs" className="mt-6 inline-block text-sm text-secondary underline">
              Browse clubs
            </Link>
          </>
        )}

        {user && preview && (
          <>
            {preview.clubImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.clubImageUrl}
                alt=""
                className="mx-auto mt-4 h-20 w-20 rounded-full object-cover"
              />
            ) : null}
            <h1 className="mt-4 text-xl font-bold text-secondary">{preview.clubName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Private club · {preview.memberCount} member{preview.memberCount === 1 ? "" : "s"}
            </p>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <Button className="mt-6 w-full" disabled={isAccepting} onClick={handleAccept}>
              {preview.alreadyMember
                ? "Open club"
                : isAccepting
                  ? "Joining…"
                  : "Accept invitation"}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
