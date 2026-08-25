"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiGift } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LoyaltyStatus } from "@/types/loyalty";

export function LoyaltyCard() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<LoyaltyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  function load() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    apiFetch<LoyaltyStatus>("/loyalty/me", accessToken)
      .then(setStatus)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load rewards"))
      .finally(() => setIsLoading(false));
  }

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(load, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleRedeem() {
    if (!accessToken) return;
    setIsRedeeming(true);
    setError(null);

    try {
      await apiFetch("/loyalty/redeem", accessToken, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to redeem");
    } finally {
      setIsRedeeming(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Loading rewards…</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!status) return null;

  const canRedeem = status.stickerCount >= status.stickersPerReward;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiGift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-secondary">Pickleball Rewards</h2>
          <p className="text-xs text-gray-500">
            Play {status.stickersPerReward} sessions to get one court booking FREE
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Minimum 1-hour session. 1 stamp per day.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {Array.from({ length: status.stickersPerReward }, (_, index) => {
          const filled = index < status.stickerCount;
          return (
            <span
              key={index}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2",
                filled
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-dashed border-gray-300 text-gray-300",
              )}
            >
              <FiCheck className="h-5 w-5" />
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-secondary">
        {canRedeem
          ? "Your card is full!"
          : `${status.stickersRemaining} more session${
              status.stickersRemaining === 1 ? "" : "s"
            } until your free hour.`}
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {canRedeem && (
        <Button
          type="button"
          variant="primary"
          disabled={isRedeeming}
          onClick={handleRedeem}
          className="mt-4 w-full"
        >
          {isRedeeming ? "Redeeming…" : "Redeem Free Hour"}
        </Button>
      )}

      {status.availableRewards.length > 0 && (
        <div className="mt-4 rounded-md bg-primary/10 p-3 text-sm text-secondary">
          You have {status.availableRewards.length} free hour
          {status.availableRewards.length === 1 ? "" : "s"} ready to use — apply it at
          checkout on any 1-hour court booking.
        </div>
      )}
    </div>
  );
}
