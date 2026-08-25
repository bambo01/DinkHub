import Image from "next/image";
import { FiCheckCircle } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";

const highlights = [
  "Online pickleball court booking and scheduling",
  "Easy-to-manage bookings, customers, and facility operations",
  "Tools designed to help pickleball businesses grow and attract more players",
];

export function AboutUs() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96 lg:h-[420px]">
          <Image
            src="/about.png"
            alt="DinkHub pickleball court booking and management platform"
            fill
            className="object-cover object-center"
          />
        </div>

        <div>
          <span className="inline-block rounded-full bg-primary/15 px-4 py-1 text-sm font-semibold text-primary">
            About DinkHub
          </span>

          <h2 className="mt-4 text-3xl font-bold text-secondary">
            Grow Your Pickleball Business with DinkHub
          </h2>

          <p className="mt-4 text-gray-600">
            DinkHub is a pickleball management and booking platform built to
            help pickleball facilities simplify their daily operations and grow
            their business. From online court reservations to customer
            management, DinkHub brings essential tools together in one
            easy-to-use platform.
          </p>

          <ul className="mt-6 space-y-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <FiCheckCircle className="mt-0.5 h-5 w-5 flex-none text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LinkButton href="/features" variant="primary">
              Explore DinkHub
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
