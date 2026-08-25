import Image from "next/image";
import { FiCheckCircle } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";

const highlights = [
  "Four courts, indoor and outdoor",
  "Regular Open Play sessions for all skill levels",
  "A community that keeps growing, on and off the court",
];

export function AboutUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="relative h-72 overflow-hidden rounded-2xl shadow-lg sm:h-96 lg:h-[420px]">
          <Image
            src="/hero3.png"
            alt="Players on a DinkHub court"
            fill
            className="object-cover object-right"
          />
        </div>

        <div>
          <span className="inline-block rounded-full bg-primary/15 px-4 py-1 text-sm font-semibold text-primary">
            About Us
          </span>
          <h2 className="mt-4 text-3xl font-bold text-secondary">
            Built by players, for players
          </h2>
          <p className="mt-4 text-gray-600">
            DinkHub started with a single indoor court and a group of players
            who wanted an easier way to book time and find people to play
            with. Today we run four courts and regular Open Play sessions,
            and we&apos;re still focused on the same thing: making it simple
            to get on a court and play.
          </p>

          <ul className="mt-6 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <FiCheckCircle className="mt-0.5 h-5 w-5 flex-none text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LinkButton href="/courts" variant="primary">
              View Our Courts
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
