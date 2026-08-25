"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiCalendar,
  FiArrowRight,
  FiShield,
  FiUsers,
  FiAward,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";
import { toDateKey } from "@/lib/mock-courts";

const today = new Date();

const features = [
  {
    icon: FiShield,
    title: "Verified & Well-Maintained",
    subtitle: "Courts",
  },
  {
    icon: FiUsers,
    title: "Player-Focused",
    subtitle: "Booking Experience",
  },
  {
    icon: FiAward,
    title: "Top-Rated",
    subtitle: "By the Community",
  },
  {
    icon: FiMapPin,
    title: "Easy to Find",
    subtitle: "Courts Near You",
  },
];

export function Hero() {
  const [date, setDate] = useState(toDateKey(today));

  return (
    <section className="relative isolate bg-secondary">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/hero3.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/40"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-4 pb-24 pt-20 sm:pb-28">
        <div className="max-w-xl">
          <span className="inline-block rounded-full bg-primary/15 px-4 py-1 text-sm font-semibold text-primary">
            Your local pickleball hub
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Book a court. Join Open Play. Play more pickleball.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Find open courts, reserve your slot in seconds, and connect with the
            DinkHub community — all in one place.
          </p>
          <div className="mt-8 flex flex-col gap-2 rounded-xl bg-white/95 p-3 shadow-lg sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <FiCalendar className="h-4 w-4 flex-none text-gray-400" />
              <input
                type="date"
                min={toDateKey(today)}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-label="Date"
                className="w-full bg-transparent text-sm text-secondary focus:outline-none"
              />
            </div>
            <LinkButton
              href={`/courts?date=${date}`}
              icon={FiSearch}
              variant="primary"
              className="justify-center"
            >
              Check Availability
            </LinkButton>
          </div>

          <div className="mt-3">
            <LinkButton
              href="/open-play"
              icon={FiArrowRight}
              variant="outline-light"
            >
              Open Play
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 pb-10 sm:-mt-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl bg-[#f4f7ea] px-6 py-6 shadow-xl sm:grid-cols-4 sm:gap-6">
          {features.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-secondary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="text-sm leading-tight">
                <p className="font-semibold text-secondary">{title}</p>
                <p className="text-secondary/70">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
