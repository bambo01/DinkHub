import { FiArrowRight, FiMapPin } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import { courtTypeLabel, type Court } from "@/types/court";

export async function Courts() {
  let courts: Court[] = [];

  try {
    const allCourts = await apiFetch<Court[]>("/courts", null);
    courts = allCourts.filter((court) => court.status === "ACTIVE").slice(0, 4);
  } catch {
    // If the API is briefly unavailable, just render an empty preview
    // instead of breaking the whole homepage.
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-secondary">Our Courts</h2>
          <p className="mt-2 text-gray-600">
            Premium indoor and outdoor pickleball courts, ready to book.
          </p>
        </div>
        <LinkButton href="/courts" icon={FiArrowRight} variant="outline">
          View All Courts
        </LinkButton>
      </div>

      {courts.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">
          Courts are being set up — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courts.map((court) => (
            <div
              key={court.id}
              className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
            >
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-secondary to-secondary/70">
                <GiTennisCourt className="h-14 w-14 text-primary/80" />
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
  );
}
