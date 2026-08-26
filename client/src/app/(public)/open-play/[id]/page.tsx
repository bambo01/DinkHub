"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLogIn,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { PaymentTestNotice } from "@/components/ui/PaymentTestNotice";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import {
  skillLevelLabel,
  type Activity,
  type OpenPlayBooking,
  type Participant,
} from "@/types/openPlay";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 5;

function ParticipantAvatars({
  participants,
  confirmedCount,
}: {
  participants: Participant[];
  confirmedCount: number;
}) {
  if (confirmedCount === 0) {
    return (
      <p className="text-sm text-gray-500">No one has joined yet — be the first!</p>
    );
  }

  const shown = participants.slice(0, 10);
  const extra = confirmedCount - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((participant) =>
        participant.avatarUrl ? (
          // Avatar URLs come from Supabase Storage's public bucket — a
          // plain <img> avoids needing that domain allow-listed for
          // next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={participant.id}
            src={participant.avatarUrl}
            alt={participant.name}
            title={participant.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span
            key={participant.id}
            title={participant.name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-secondary"
          >
            {participant.name.charAt(0).toUpperCase()}
          </span>
        ),
      )}
      {extra > 0 && (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
          +{extra}
        </span>
      )}
    </div>
  );
}

function OpenPlayDetailContent({ activityId }: { activityId: string }) {
  const searchParams = useSearchParams();
  const paymentOutcome = searchParams.get("status");
  const { user, accessToken, isLoading: authLoading } = useAuth();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [myBooking, setMyBooking] = useState<OpenPlayBooking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  const [isJoining, setIsJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [guestNames, setGuestNames] = useState<string[]>([]);

  // setIsLoading/setLoadError run synchronously before the fetch kicks off,
  // which react-hooks/set-state-in-effect flags on principle — but the
  // loading state genuinely needs to reset before each fetch starts. This
  // also re-runs on pollAttempt so spotsLeft/confirmedCount stay fresh while
  // waiting for a payment to confirm.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      apiFetch<Activity>(`/open-play/${activityId}`, null),
      apiFetch<Participant[]>(`/open-play/${activityId}/participants`, null),
    ])
      .then(([activityData, participantsData]) => {
        setActivity(activityData);
        setParticipants(participantsData);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load this session"),
      )
      .finally(() => setIsLoading(false));
  }, [activityId, pollAttempt]);

  useEffect(() => {
    if (!accessToken) {
      setMyBooking(null);
      return;
    }

    setIsLoadingBooking(true);

    apiFetch<OpenPlayBooking | null>(`/open-play/${activityId}/my-booking`, accessToken)
      .then(setMyBooking)
      .catch(() => setMyBooking(null))
      .finally(() => setIsLoadingBooking(false));
  }, [accessToken, activityId, pollAttempt]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // While PayMongo says the payment succeeded but the webhook hasn't landed
  // yet, poll the real booking status (and activity, for a fresh
  // spotsLeft/confirmedCount) a few times before giving up.
  useEffect(() => {
    if (myBooking?.status !== "PENDING_PAYMENT") return;
    if (paymentOutcome !== "success") return;
    if (pollAttempt >= MAX_POLL_ATTEMPTS) return;

    const timer = setTimeout(() => setPollAttempt((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [myBooking, paymentOutcome, pollAttempt]);

  async function startPayment(bookingId: string) {
    if (!accessToken) return;
    setIsJoining(true);
    setActionError(null);

    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string; paymentId: string }>(
        "/payments/create-open-play-checkout",
        accessToken,
        { method: "POST", body: JSON.stringify({ openPlayBookingId: bookingId }) },
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to start payment");
      setIsJoining(false);
    }
  }

  function updateGuestName(index: number, name: string) {
    setGuestNames((prev) => prev.map((existing, i) => (i === index ? name : existing)));
  }

  function removeGuest(index: number) {
    setGuestNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleJoin() {
    if (!accessToken) return;
    setIsJoining(true);
    setActionError(null);

    const cleanedGuestNames = guestNames.map((name) => name.trim()).filter(Boolean);

    try {
      const booking = await apiFetch<OpenPlayBooking>(
        `/open-play/${activityId}/join`,
        accessToken,
        { method: "POST", body: JSON.stringify({ guestNames: cleanedGuestNames }) },
      );
      setMyBooking(booking);
      await startPayment(booking.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to join session");
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-sm text-gray-500">Loading…</p>;
  }

  if (loadError || !activity) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-red-600">{loadError ?? "Session not found"}</p>
        <LinkButton href="/open-play" icon={FiArrowLeft} variant="outline" className="mt-4">
          Back to Open Play
        </LinkButton>
      </section>
    );
  }

  const dateLabel = new Date(`${activity.eventDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeRange = `${formatHour(activity.startHour)} – ${formatHour(activity.endHour)}`;
  const loginRedirect = `/open-play/${activityId}`;
  const isFull = activity.spotsLeft <= 0;
  const isJoinable = activity.status === "ACTIVE" && !isFull;
  const stillConfirming =
    myBooking?.status === "PENDING_PAYMENT" &&
    paymentOutcome === "success" &&
    pollAttempt >= MAX_POLL_ATTEMPTS;
  const totalSlots = 1 + guestNames.length;
  const totalAmount = activity.pricePerSlot * totalSlots;
  const canAddGuest = totalSlots < activity.spotsLeft;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/open-play"
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Open Play
      </Link>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {activity.imageUrl && (
          // Uploaded images are served from Supabase Storage's public
          // bucket — a plain <img> avoids needing that domain allow-listed
          // for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="h-48 w-full object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-secondary">{activity.title}</h1>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-secondary">
              {skillLevelLabel(activity.skillLevel)}
            </span>
          </div>

          {activity.description && (
            <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
          )}

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-6 text-sm">
            <p className="flex items-center gap-2 text-secondary">
              <FiMapPin className="h-4 w-4 text-gray-400" />
              {activity.courts.map((court) => court.name).join(", ")}
            </p>
            <p className="flex items-center gap-2 text-secondary">
              <FiCalendar className="h-4 w-4 text-gray-400" />
              {dateLabel}
            </p>
            <p className="flex items-center gap-2 text-secondary">
              <FiClock className="h-4 w-4 text-gray-400" />
              {timeRange}
            </p>
            <p className="flex items-center gap-2 text-secondary">
              <FiUsers className="h-4 w-4 text-gray-400" />
              {activity.spotsLeft} of {activity.capacity} spots left
            </p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-sm font-semibold text-secondary">
              {activity.confirmedCount} player{activity.confirmedCount === 1 ? "" : "s"} confirmed
            </p>
            <div className="mt-3">
              <ParticipantAvatars
                participants={participants}
                confirmedCount={activity.confirmedCount}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-sm text-gray-600">Price per slot</span>
            <span className="text-lg font-bold text-secondary">
              ₱{activity.pricePerSlot.toFixed(2)}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            {myBooking?.status === "CONFIRMED" ? (
              <div className="rounded-md bg-primary/15 p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-secondary">
                  <FiCheckCircle className="h-4 w-4" />
                  You&apos;re in!
                </p>
                {myBooking.slots > 1 && (
                  <p className="mt-1 text-xs text-secondary">
                    {myBooking.slots} players — you + {myBooking.guestNames.join(", ")}
                  </p>
                )}
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Reference
                </p>
                <p className="text-lg font-bold text-secondary">{myBooking.referenceNumber}</p>
                <div className="mt-3 flex justify-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${myBooking.referenceNumber}`}
                    size={160}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Show this at check-in</p>
              </div>
            ) : stillConfirming ? (
              <div className="rounded-md bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-800">
                  This is taking longer than expected. Your reservation is still
                  pending — check again in a moment.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPollAttempt(0)}
                  className="mt-3 w-full"
                >
                  Check Again
                </Button>
              </div>
            ) : myBooking?.status === "PENDING_PAYMENT" && paymentOutcome === "success" ? (
              <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-600">
                Confirming your payment…
              </div>
            ) : myBooking?.status === "PENDING_PAYMENT" ? (
              <div className="rounded-md bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-800">
                  {paymentOutcome === "cancelled"
                    ? "Payment was cancelled. Your spot is still reserved — finish paying to confirm it."
                    : "Your spot is reserved but not yet paid."}
                </p>
                {myBooking.slots > 1 && (
                  <p className="mt-1 text-xs text-amber-700">
                    {myBooking.slots} players — you + {myBooking.guestNames.join(", ")} — ₱
                    {myBooking.amount.toFixed(2)} total
                  </p>
                )}
                {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                <PaymentTestNotice />
                <Button
                  type="button"
                  variant="primary"
                  disabled={isJoining}
                  onClick={() => startPayment(myBooking.id)}
                  className="mt-3 w-full"
                >
                  {isJoining ? "Redirecting…" : "Complete Payment"}
                </Button>
              </div>
            ) : !authLoading && !user ? (
              <div className="rounded-md bg-secondary/5 p-4 text-center">
                <p className="text-sm text-secondary">
                  You need to be logged in to join this session.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <LinkButton
                    href={`/login?redirect=${encodeURIComponent(loginRedirect)}`}
                    icon={FiLogIn}
                    variant="primary"
                  >
                    Login
                  </LinkButton>
                  <LinkButton
                    href={`/register?redirect=${encodeURIComponent(loginRedirect)}`}
                    icon={FiUserPlus}
                    variant="outline"
                  >
                    Register
                  </LinkButton>
                </div>
              </div>
            ) : !isJoinable ? (
              <div className="rounded-md bg-gray-100 p-4 text-center text-sm text-gray-500">
                {activity.status !== "ACTIVE"
                  ? "This session is no longer available."
                  : "This session is full."}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium text-secondary">
                    Bringing guests? <span className="font-normal text-gray-400">(optional)</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Each guest just needs a name — no account required — and adds one
                    slot to your booking.
                  </p>
                  <div className="mt-2 space-y-2">
                    {guestNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(event) => updateGuestName(index, event.target.value)}
                          placeholder="Guest name"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeGuest(index)}
                          aria-label="Remove guest"
                          className="text-gray-400 hover:text-red-600"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestNames((prev) => [...prev, ""])}
                    disabled={!canAddGuest}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    Add a guest
                  </button>
                  {!canAddGuest && (
                    <p className="mt-1 text-xs text-gray-400">
                      Only {activity.spotsLeft} spot{activity.spotsLeft === 1 ? "" : "s"} left.
                    </p>
                  )}
                </div>

                {totalSlots > 1 && (
                  <div className="mb-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                    <span className="text-gray-600">
                      ₱{activity.pricePerSlot.toFixed(2)} &times; {totalSlots} players
                    </span>
                    <span className="font-semibold text-secondary">
                      ₱{totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
                <PaymentTestNotice />
                <Button
                  type="button"
                  variant="primary"
                  disabled={isJoining || authLoading || isLoadingBooking}
                  onClick={handleJoin}
                  className="mt-4 w-full"
                >
                  {isJoining ? "Joining…" : `Join & Pay ₱${totalAmount.toFixed(2)}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OpenPlayDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <Suspense>
      <OpenPlayDetailContent activityId={id} />
    </Suspense>
  );
}
