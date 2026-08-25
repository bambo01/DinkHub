import { FiCalendar, FiClock } from "react-icons/fi";

interface PastEvent {
  title: string;
  subtitle: string;
  date: string;
  time: string;
  description: string;
}

const pastEvents: PastEvent[] = [
  {
    title: "Summer Doubles Championship",
    subtitle: "Annual Tournament",
    date: "Jul 12, 2026",
    time: "8:00 AM – 4:00 PM",
    description:
      "32 teams competed for the summer title in a full day of bracket play at the Main Hall.",
  },
  {
    title: "Intro to Pickleball Workshop",
    subtitle: "Beginner Clinic",
    date: "Jun 21, 2026",
    time: "6:00 PM – 8:00 PM",
    description:
      "A hands-on session covering rules, scoring, and basic techniques for first-time players.",
  },
  {
    title: "DinkHub Community Mixer",
    subtitle: "Social Open Play",
    date: "May 30, 2026",
    time: "5:00 PM – 9:00 PM",
    description:
      "Members mixed and matched for casual games followed by food and drinks on the patio.",
  },
  {
    title: "Juniors Skills Camp",
    subtitle: "Youth Program",
    date: "May 9, 2026",
    time: "9:00 AM – 12:00 PM",
    description:
      "A weekend camp for young players to build footwork, dinking, and serving fundamentals.",
  },
  {
    title: "Mixed Doubles Ladder Finals",
    subtitle: "League Finals",
    date: "Apr 18, 2026",
    time: "1:00 PM – 5:00 PM",
    description:
      "The top four ranked pairs from the spring ladder faced off for the championship trophy.",
  },
  {
    title: "Pickleball 101 Open House",
    subtitle: "Community Event",
    date: "Mar 21, 2026",
    time: "10:00 AM – 2:00 PM",
    description:
      "Free court time, equipment demos, and quick lessons for anyone curious about the sport.",
  },
];

export default function PastEventsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary sm:text-4xl">
          Previous Events
        </h1>
        <p className="mt-2 text-gray-600">
          A look back at our past tournaments, clinics, and community
          meetups.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pastEvents.map((event) => (
          <div
            key={event.title}
            className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-secondary to-secondary/70">
              <FiCalendar className="h-12 w-12 text-primary/80" />
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-primary">
                {event.subtitle}
              </p>
              <h2 className="mt-1 font-semibold text-secondary">
                {event.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FiCalendar className="h-3.5 w-3.5" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="h-3.5 w-3.5" />
                  {event.time}
                </span>
              </div>

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
