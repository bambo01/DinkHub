import { FiCheck, FiClock, FiUsers } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import type { Court } from "@/types/court";
import type { Activity } from "@/types/openPlay";

interface PricingPlan {
  name: string;
  price: number | null;
  unit: string;
  icon: typeof FiClock;
  description: string;
  features: string[];
  href: string;
  cta: string;
}

export async function Pricing() {
  let courtPrice: number | null = null;
  let openPlayPrice: number | null = null;

  try {
    const courts = await apiFetch<Court[]>("/courts", null);
    const prices = courts
      .filter((court) => court.status === "ACTIVE")
      .map((court) => court.pricePerHour);
    if (prices.length > 0) courtPrice = Math.min(...prices);
  } catch {
    // Leave courtPrice null — the card falls back to a no-price state
    // rather than breaking the whole homepage.
  }

  try {
    const activities = await apiFetch<Activity[]>("/open-play?status=ACTIVE", null);
    const prices = activities.map((activity) => activity.pricePerSlot);
    if (prices.length > 0) openPlayPrice = Math.min(...prices);
  } catch {
    // Leave openPlayPrice null — same fallback as above.
  }

  const plans: PricingPlan[] = [
    {
      name: "Court Booking",
      price: courtPrice,
      unit: "/hour",
      icon: FiClock,
      description: "Reserve a court for you and your group.",
      features: [
        "Book any available court",
        "Choose your preferred time slot",
        "Instant booking confirmation",
      ],
      href: "/courts",
      cta: "Book a Court",
    },
    {
      name: "Open Play",
      price: openPlayPrice,
      unit: "/session",
      icon: FiUsers,
      description: "Drop in and play with the community.",
      features: [
        "Join any scheduled Open Play session",
        "Meet and play with other members",
        "All skill levels welcome",
      ],
      href: "/open-play",
      cta: "Join Open Play",
    },
  ];

  return (
    <section className="bg-secondary/5 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-2 text-gray-600">
            No hidden fees. Pay only for the time you play.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
                  <plan.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold text-secondary">
                  {plan.name}
                </h3>
              </div>

              <p className="mt-3 text-sm text-gray-600">{plan.description}</p>

              <div className="mt-4">
                {plan.price !== null ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Starts at
                    </p>
                    <p>
                      <span className="text-4xl font-bold text-secondary">
                        ₱{plan.price}
                      </span>
                      <span className="text-gray-500">{plan.unit}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Pricing varies — check availability
                  </p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <LinkButton href={plan.href} variant="primary" className="mt-6 w-full">
                {plan.cta}
              </LinkButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
