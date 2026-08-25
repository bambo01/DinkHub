import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

// How many stickers (one per calendar play-day) redeem for one free hour.
export const STICKERS_PER_REWARD = 8;

export type RewardStatus = "AVAILABLE" | "USED";

export interface LoyaltyReward {
  id: string;
  status: RewardStatus;
  createdAt: string;
  usedAt: string | null;
}

export interface LoyaltyStatus {
  stickerCount: number;
  stickersPerReward: number;
  stickersRemaining: number;
  availableRewards: LoyaltyReward[];
}

function mapReward(row: {
  id: string;
  status: RewardStatus;
  created_at: string;
  used_at: string | null;
}): LoyaltyReward {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

// Called after a court booking is confirmed. Idempotent by design: the
// unique (user_id, earned_date) constraint means a second confirmed booking
// on a day that already earned a sticker just no-ops here — "1 sticker per
// day, no matter how many hours or separate bookings."
export async function awardStickerForBooking(
  userId: string,
  bookingDate: string,
  bookingId: string,
): Promise<void> {
  const { error } = await supabase
    .from("loyalty_stickers")
    .insert({ user_id: userId, earned_date: bookingDate, booking_id: bookingId });

  if (error && error.code !== "23505") {
    console.error("Failed to award loyalty sticker:", error);
  }
}

export async function getLoyaltyStatus(userId: string): Promise<LoyaltyStatus> {
  const { count, error: countError } = await supabase
    .from("loyalty_stickers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("redeemed_in_reward_id", null);

  if (countError) {
    throw new AppError("Failed to load rewards status", 500);
  }

  const { data: rewardsData, error: rewardsError } = await supabase
    .from("loyalty_rewards")
    .select("id, status, created_at, used_at")
    .eq("user_id", userId)
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: true });

  if (rewardsError) {
    throw new AppError("Failed to load rewards status", 500);
  }

  const stickerCount = count ?? 0;

  return {
    stickerCount,
    stickersPerReward: STICKERS_PER_REWARD,
    stickersRemaining: Math.max(STICKERS_PER_REWARD - stickerCount, 0),
    availableRewards: (rewardsData ?? []).map(mapReward),
  };
}

export async function redeemStickers(userId: string): Promise<LoyaltyReward> {
  const { data: stickers, error: stickersError } = await supabase
    .from("loyalty_stickers")
    .select("id")
    .eq("user_id", userId)
    .is("redeemed_in_reward_id", null)
    .order("earned_date", { ascending: true })
    .limit(STICKERS_PER_REWARD);

  if (stickersError) {
    throw new AppError("Failed to redeem stickers", 500);
  }

  if (!stickers || stickers.length < STICKERS_PER_REWARD) {
    throw new AppError(`You need ${STICKERS_PER_REWARD} stickers to redeem a reward`, 422);
  }

  const { data: reward, error: rewardError } = await supabase
    .from("loyalty_rewards")
    .insert({ user_id: userId })
    .select("id, status, created_at, used_at")
    .single();

  if (rewardError || !reward) {
    throw new AppError("Failed to redeem stickers", 500);
  }

  const stickerIds = stickers.map((sticker) => sticker.id as string);
  const { error: updateError } = await supabase
    .from("loyalty_stickers")
    .update({ redeemed_in_reward_id: reward.id })
    .in("id", stickerIds);

  if (updateError) {
    // Nothing was actually spent — undo the reward rather than leave a
    // free-floating one with no stickers backing it.
    await supabase.from("loyalty_rewards").delete().eq("id", reward.id);
    throw new AppError("Failed to redeem stickers", 500);
  }

  return mapReward(reward);
}

// Atomically claims an AVAILABLE reward for a specific booking — the
// conditional .eq("status", "AVAILABLE") is the real guard against a reward
// being spent twice (e.g. a duplicate form submit racing itself).
export async function useRewardForBooking(
  userId: string,
  rewardId: string,
  bookingId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .update({ status: "USED", used_booking_id: bookingId, used_at: new Date().toISOString() })
    .eq("id", rewardId)
    .eq("user_id", userId)
    .eq("status", "AVAILABLE")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new AppError("This reward is no longer available", 422);
  }
}
