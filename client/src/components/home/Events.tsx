import Link from "next/link";
import { FiArrowRight, FiCalendar, FiMapPin } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";

interface Event {
  title: string;
  date: string;
  location: string;
  description: string;
}

const events: Event[] = [
  {
    title: "Weekend Open Play Tournament",
    date: "Aug 30, 2026",
    location: "Main Hall",
    description:
      "A friendly doubles tournament open to all skill levels. Prizes for the top three teams.",
  },
  {
    title: "Beginner's Pickleball Clinic",
    date: "Sep 6, 2026",
    location: "Garden Wing",
    description:
      "New to pickleball? Learn the basics, rules, and scoring in this hands-on clinic.",
  },
];

export function Events() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-secondary">
            Upcoming Events
          </h2>
          <p className="mt-2 text-gray-600">
            Tournaments, clinics, and community meetups at DinkHub.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LinkButton href="/events" icon={FiArrowRight} variant="outline">
            See More Events
          </LinkButton>
          <Link
            href="/events/past"
            className="text-sm font-medium text-secondary underline-offset-2 hover:text-primary hover:underline"
          >
            View Past Events
          </Link>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {events.map((event) => (
          <div
            key={event.title}
            className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-secondary to-secondary/70">
              <FiCalendar className="h-12 w-12 text-primary/80" />
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-primary">
                {event.date}
              </p>
              <h3 className="mt-1 font-semibold text-secondary">
                {event.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <FiMapPin className="h-3.5 w-3.5" />
                {event.location}
              </p>
              <p className="mt-3 text-sm text-gray-600">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
