import { FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import { skillLevelLabel, type Activity } from "@/types/openPlay";

// Session availability changes constantly (new activities, spots filling
// up) — always render fresh from the API instead of serving a stale
// build-time snapshot from Vercel's static cache.
export const dynamic = "force-dynamic";

export default async function OpenPlayPage() {
  let activities: Activity[] = [];

  try {
    const allActivities = await apiFetch<Activity[]>("/open-play?status=ACTIVE", null);
    const todayKey = toDateKey(new Date());
    activities = allActivities.filter((activity) => activity.eventDate >= todayKey);
  } catch {
    // Render the page with an empty state rather than crashing it.
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary/15 text-secondary">
          <FiUsers className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-secondary">Open Play</h1>
          <p className="mt-1 text-gray-600">
            Drop-in sessions — join the community and play by the slot, not
            the full court.
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">
          No Open Play sessions scheduled right now — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const dateLabel = new Date(`${activity.eventDate}T00:00:00`).toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" },
            );
            const isFull = activity.spotsLeft <= 0;

            return (
              <div
                key={activity.id}
                className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary to-secondary/70">
                  {activity.imageUrl ? (
                    // Uploaded images are served from Supabase Storage's
                    // public bucket — a plain <img> avoids needing that
                    // domain allow-listed for next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUsers className="h-12 w-12 text-primary/80" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-secondary">
                    {skillLevelLabel(activity.skillLevel)}
                  </span>
                  {isFull && (
                    <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                      Full
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-secondary">{activity.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <FiMapPin className="h-3.5 w-3.5" />
                    {activity.courts.map((court) => court.name).join(", ")}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <FiCalendar className="h-3.5 w-3.5" />
                    {dateLabel}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <FiClock className="h-3.5 w-3.5" />
                    {formatHour(activity.startHour)} – {formatHour(activity.endHour)}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {activity.confirmedCount}/{activity.capacity} joined
                    </span>
                    <span className="font-semibold text-secondary">
                      ₱{activity.pricePerSlot.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <LinkButton
                      href={`/open-play/${activity.id}`}
                      variant="primary"
                      className="w-full px-3 py-1.5 text-xs"
                    >
                      {isFull ? "View Session" : "Join Session"}
                    </LinkButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
