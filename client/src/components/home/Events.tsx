import { FiArrowRight, FiMapPin, FiUsers } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import type { Activity } from "@/types/openPlay";

export async function Events() {
  let activities: Activity[] = [];

  try {
    const allActivities = await apiFetch<Activity[]>("/open-play?status=ACTIVE", null);
    const todayKey = toDateKey(new Date());
    activities = allActivities.filter((activity) => activity.eventDate >= todayKey).slice(0, 2);
  } catch {
    // If the API is briefly unavailable, just render an empty preview
    // instead of breaking the whole homepage.
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-secondary">
            Upcoming Open Plays
          </h2>
          <p className="mt-2 text-gray-600">
            Drop-in sessions where you can join by the slot and play with the
            community.
          </p>
        </div>
        <LinkButton href="/open-play" icon={FiArrowRight} variant="outline">
          See All Open Plays
        </LinkButton>
      </div>

      {activities.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">
          No Open Play sessions scheduled right now — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary to-secondary/70">
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
              </div>

              <div className="p-5">
                <p className="text-sm font-semibold text-primary">
                  {new Date(`${activity.eventDate}T00:00:00`).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  &middot; {formatHour(activity.startHour)} – {formatHour(activity.endHour)}
                </p>
                <h3 className="mt-1 font-semibold text-secondary">
                  {activity.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <FiMapPin className="h-3.5 w-3.5" />
                  {activity.courts.map((court) => court.name).join(", ")}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {activity.confirmedCount}/{activity.capacity} joined
                  </span>
                  <LinkButton
                    href={`/open-play/${activity.id}`}
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                  >
                    Join Session
                  </LinkButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
