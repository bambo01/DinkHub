import { Suspense } from "react";
import { FiMapPin } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { Availability } from "@/components/home/Availability";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import { courtTypeLabel, type Court } from "@/types/court";

// Court roster/status changes from the admin panel — always render fresh
// from the API instead of serving a stale build-time snapshot from
// Vercel's static cache.
export const dynamic = "force-dynamic";

export default async function CourtsPage() {
  let courts: Court[] = [];

  try {
    const allCourts = await apiFetch<Court[]>("/courts", null);
    courts = allCourts.filter((court) => court.status === "ACTIVE");
  } catch {
    // Render the page with an empty state rather than crashing it.
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <h1 className="text-3xl font-bold text-secondary">Our Courts</h1>
        <p className="mt-2 text-gray-600">
          Check what&apos;s open, then book the court that works for you.
        </p>
      </section>

      {courts.length > 0 && (
        <Suspense>
          <Availability courts={courts} />
        </Suspense>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20">
        {courts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Courts are being set up — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courts.map((court) => (
              <div
                key={court.id}
                className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary to-secondary/70">
                  {court.imageUrl ? (
                    // Uploaded images are served from Supabase Storage's
                    // public bucket — a plain <img> avoids needing that
                    // domain allow-listed for next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={court.imageUrl}
                      alt={court.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GiTennisCourt className="h-14 w-14 text-primary/80" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-secondary">
                    {courtTypeLabel(court.type)}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-secondary">{court.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <FiMapPin className="h-3.5 w-3.5" />
                    {court.location}
                  </p>
                  <div className="mt-4">
                    <LinkButton
                      href={`/courts/${court.id}`}
                      variant="primary"
                      className="w-full px-3 py-1.5 text-xs"
                    >
                      Book Now
                    </LinkButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
