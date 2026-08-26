"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGift,
  FiLogIn,
  FiMapPin,
  FiUserPlus,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { PaymentTestNotice } from "@/components/ui/PaymentTestNotice";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { courtTypeLabel, type Court } from "@/types/court";
import type { Booking } from "@/types/booking";
import type { LoyaltyStatus } from "@/types/loyalty";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, accessToken, isLoading: authLoading } = useAuth();

  const courtId = searchParams.get("courtId") ?? "";
  const date = searchParams.get("date") ?? "";
  // start/end come from the court booking widgets as an inclusive hour range
  // (e.g. start=10, end=11 means the 10:00 and 11:00 slots) — the API's
  // endHour is exclusive, so it gets +1'd right before the POST below.
  const start = Number(searchParams.get("start"));
  const end = Number(searchParams.get("end"));

  const isValidSelection =
    Boolean(courtId) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end >= start;

  const [court, setCourt] = useState<Court | null>(null);
  const [isLoadingCourt, setIsLoadingCourt] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [useReward, setUseReward] = useState(false);

  // setIsLoadingCourt/setLoadError run synchronously before the fetch kicks
  // off, which react-hooks/set-state-in-effect flags on principle — but the
  // loading state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isValidSelection) {
      setIsLoadingCourt(false);
      return;
    }

    setIsLoadingCourt(true);
    setLoadError(null);

    apiFetch<Court>(`/courts/${courtId}`, null)
      .then(setCourt)
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load court"),
      )
      .finally(() => setIsLoadingCourt(false));
  }, [courtId, isValidSelection]);

  useEffect(() => {
    if (!accessToken) {
      setLoyaltyStatus(null);
      return;
    }
    apiFetch<LoyaltyStatus>("/loyalty/me", accessToken)
      .then(setLoyaltyStatus)
      .catch(() => setLoyaltyStatus(null));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const durationHours = isValidSelection ? end - start + 1 : 0;
  const availableReward = loyaltyStatus?.availableRewards[0] ?? null;
  const canUseReward = durationHours === 1 && Boolean(availableReward);
  const isRewardApplied = canUseReward && useReward;
  const totalAmount = isRewardApplied ? 0 : court ? court.pricePerHour * durationHours : 0;
  const loginRedirect = `/checkout?${searchParams.toString()}`;

  async function startPayment(bookingId: string) {
    if (!accessToken) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string; paymentId: string }>(
        "/payments/create-checkout",
        accessToken,
        { method: "POST", body: JSON.stringify({ bookingId }) },
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to start payment");
      setIsSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!accessToken || !court) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await apiFetch<Booking>("/bookings", accessToken, {
        method: "POST",
        body: JSON.stringify({
          courtId: court.id,
          bookingDate: date,
          startHour: start,
          endHour: end + 1,
          ...(isRewardApplied && availableReward ? { rewardId: availableReward.id } : {}),
        }),
      });

      // A reward-backed booking comes back already CONFIRMED — there's no
      // payment to start, so skip straight to the confirmation page.
      if (created.status === "CONFIRMED") {
        router.push(`/bookings/confirmation?bookingId=${created.id}`);
        return;
      }

      setBooking(created);
      await startPayment(created.id);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to create booking");
      setIsSubmitting(false);
    }
  }

  if (!isValidSelection) {
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-gray-600">
          No booking selected. Head back to a court and pick a time first.
        </p>
        <LinkButton href="/courts" icon={FiArrowLeft} variant="outline" className="mt-4">
          Browse Courts
        </LinkButton>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={court ? `/courts/${court.id}` : "/courts"}
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Court
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-secondary">Checkout</h1>

      {isLoadingCourt && (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      )}
      {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

      {!isLoadingCourt && !loadError && court && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-secondary">{court.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <FiMapPin className="h-4 w-4" />
            {courtTypeLabel(court.type)} &middot; {court.location}
          </p>

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-6 text-sm">
            <p className="flex items-center gap-2 text-secondary">
              <FiCalendar className="h-4 w-4 text-gray-400" />
              {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="flex items-center gap-2 text-secondary">
              <FiClock className="h-4 w-4 text-gray-400" />
              {formatHour(start)} – {formatHour(end + 1)} ({durationHours} hr
              {durationHours > 1 ? "s" : ""})
            </p>
          </div>

          {canUseReward && (
            <label className="mt-6 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-secondary">
              <input
                type="checkbox"
                checked={useReward}
                onChange={(event) => setUseReward(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <FiGift className="h-4 w-4 text-primary" />
              Use my free hour reward
            </label>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-sm text-gray-600">
              ₱{court.pricePerHour.toFixed(2)} &times; {durationHours} hr
              {durationHours > 1 ? "s" : ""}
            </span>
            {isRewardApplied ? (
              <span className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  ₱{(court.pricePerHour * durationHours).toFixed(2)}
                </span>
                <span className="text-lg font-bold text-primary">FREE</span>
              </span>
            ) : (
              <span className="text-lg font-bold text-secondary">
                ₱{totalAmount.toFixed(2)}
              </span>
            )}
          </div>

          {booking && submitError ? (
            <div className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
              <p className="flex items-center gap-1.5 font-semibold">
                <FiAlertTriangle className="h-4 w-4" />
                Booking reserved — payment didn&apos;t start
              </p>
              <p className="mt-1">
                Your time slot is held (reference: {booking.id}), but we
                couldn&apos;t start the payment: {submitError}
              </p>
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting}
                onClick={() => startPayment(booking.id)}
                className="mt-3 w-full"
              >
                {isSubmitting ? "Retrying…" : "Retry Payment"}
              </Button>
            </div>
          ) : booking ? (
            <div className="mt-6 rounded-md bg-primary/15 p-4 text-center text-sm text-secondary">
              <p className="flex items-center justify-center gap-1.5 font-semibold">
                <FiCheckCircle className="h-4 w-4" />
                Redirecting you to payment…
              </p>
            </div>
          ) : !authLoading && !user ? (
            <div className="mt-6 rounded-md bg-secondary/5 p-4 text-center">
              <p className="text-sm text-secondary">
                You need to be logged in to complete this booking.
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
          ) : (
            <>
              {submitError && (
                <p className="mt-4 text-sm text-red-600">{submitError}</p>
              )}
              {!isRewardApplied && <PaymentTestNotice />}
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting || authLoading}
                onClick={handleConfirm}
                className="mt-6 w-full"
              >
                {isSubmitting
                  ? "Booking…"
                  : isRewardApplied
                    ? "Redeem Free Hour"
                    : "Confirm Booking"}
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
