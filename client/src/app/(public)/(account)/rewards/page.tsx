"use client";

import { LoyaltyCard } from "@/components/profile/LoyaltyCard";

export default function RewardsPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-secondary">Pickleball Rewards</h1>
      <p className="mt-1 text-sm text-gray-600">
        Your digital punch card — every confirmed court booking earns a
        stamp.
      </p>

      <div className="mt-6">
        <LoyaltyCard />
      </div>
    </section>
  );
}
