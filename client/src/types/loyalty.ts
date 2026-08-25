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
