"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import {
  earliestBookableHour,
  formatHour,
  formatHourRangeShort,
  getHourSlots,
  toDateKey,
} from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import { hoursFromRanges, courtTypeLabel, type BlockedSlot, type Court } from "@/types/court";
import type { BookedRange } from "@/types/booking";

interface CourtDetailProps {
  court: Court;
  initialDate?: string;
  initialStart?: number;
  initialEnd?: number;
}

const today = new Date();

export function CourtDetail({
  court,
  initialDate,
  initialStart,
  initialEnd,
}: CourtDetailProps) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? toDateKey(today),
  );
  const [rangeStart, setRangeStart] = useState<number | null>(
    initialStart ?? null,
  );
  const [rangeEnd, setRangeEnd] = useState<number | null>(
    initialEnd ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [bookedHours, setBookedHours] = useState<Set<number>>(new Set());
  const router = useRouter();

  const isBookable = court.status === "ACTIVE";
  const slots = useMemo(() => {
    const earliestHour = earliestBookableHour(court.defaultOpenHour, selectedDate);
    return getHourSlots(earliestHour, court.defaultCloseHour);
  }, [court.defaultOpenHour, court.defaultCloseHour, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch<BlockedSlot[]>(`/courts/${court.id}/blocked-slots?date=${selectedDate}`, null),
      apiFetch<BookedRange[]>(`/courts/${court.id}/booked-hours?date=${selectedDate}`, null),
    ])
      .then(([blocked, booked]) => {
        if (!cancelled) setBookedHours(hoursFromRanges([...blocked, ...booked]));
      })
      .catch(() => {
        if (!cancelled) setBookedHours(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [court.id, selectedDate]);

  function resetSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setError(null);
  }

  function handleSlotClick(hour: number) {
    setError(null);

    if (rangeStart === null || rangeEnd !== null) {
      setRangeStart(hour);
      setRangeEnd(null);
      return;
    }

    if (hour === rangeStart) {
      resetSelection();
      return;
    }

    const start = Math.min(rangeStart, hour);
    const end = Math.max(rangeStart, hour);
    const spansBookedHour = Array.from(bookedHours).some(
      (h) => h >= start && h <= end,
    );

    if (spansBookedHour) {
      setError(
        "That range crosses an already-booked hour. Pick a different range.",
      );
      setRangeStart(hour);
      setRangeEnd(null);
      return;
    }

    setRangeStart(start);
    setRangeEnd(end);
  }

  const hasFullRange = rangeStart !== null && rangeEnd !== null;
  const durationHours = hasFullRange
    ? rangeEnd! - rangeStart! + 1
    : rangeStart !== null
      ? 1
      : 0;

  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary to-secondary/70 sm:h-72">
          {court.imageUrl ? (
            // Uploaded images are served from Supabase Storage's public
            // bucket — a plain <img> avoids needing that domain
            // allow-listed for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={court.imageUrl}
              alt={court.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <GiTennisCourt className="h-20 w-20 text-primary/80" />
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-secondary">
            {courtTypeLabel(court.type)}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">
            {court.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary">
            <FiMapPin className="h-4 w-4" />
            {courtTypeLabel(court.type)} &middot; {court.location}
          </p>
          {court.description && (
            <p className="mt-4 text-sm text-gray-600">{court.description}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-secondary">
            ₱{court.pricePerHour.toFixed(2)} / hour
          </p>

          {!isBookable && (
            <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This court is currently{" "}
              {court.status === "MAINTENANCE" ? "under maintenance" : "inactive"}{" "}
              and not available for booking.
            </p>
          )}

          <div className="mt-6 rounded-lg bg-secondary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Selected Time
            </p>
            {rangeStart !== null ? (
              <>
                <p className="mt-1 text-secondary">
                  <span className="font-semibold">
                    {formatHour(rangeStart)} –{" "}
                    {formatHour((rangeEnd ?? rangeStart) + 1)}
                  </span>{" "}
                  <span className="text-gray-500">
                    on{" "}
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      undefined,
                      { month: "long", day: "numeric", year: "numeric" },
                    )}{" "}
                    ({durationHours} hr{durationHours > 1 ? "s" : ""})
                  </span>
                </p>
                <p className="mt-1 text-sm font-semibold text-secondary">
                  Total: ₱{(court.pricePerHour * durationHours).toFixed(2)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                No time selected yet — pick one below.
              </p>
            )}
          </div>

          <div
            className={cn(
              "mt-8 border-t border-gray-200 pt-6",
              !isBookable && "pointer-events-none opacity-50",
            )}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary">
                  Adjust Date &amp; Time
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Click a start hour and an end hour to select a range.
                </p>
              </div>

              <div>
                <label
                  htmlFor="court-date"
                  className="mb-1 block text-xs font-medium text-secondary"
                >
                  Date
                </label>
                <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                  <input
                    id="court-date"
                    type="date"
                    min={toDateKey(today)}
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      resetSelection();
                    }}
                    className="text-sm text-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {slots.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">
                No more availability today — try picking a different date.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map((hour) => {
                  const isHourBooked = bookedHours.has(hour);
                  const isInRange =
                    rangeStart !== null &&
                    hour >= rangeStart &&
                    hour <= (rangeEnd ?? rangeStart);

                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={isHourBooked}
                      onClick={() => handleSlotClick(hour)}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        isHourBooked
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                          : isInRange
                            ? "border-primary bg-primary text-secondary"
                            : "border-gray-200 text-secondary hover:border-primary hover:bg-primary/10",
                      )}
                    >
                      <FiClock className="h-3 w-3" />
                      {formatHourRangeShort(hour, hour + 1)}
                    </button>
                  );
                })}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm border border-gray-300" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-gray-200" />
                  Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-primary" />
                  Selected
                </span>
              </div>

              {rangeStart !== null && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-xs font-medium text-gray-500 hover:text-secondary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={rangeStart === null || !isBookable}
              onClick={() =>
                router.push(
                  `/checkout?courtId=${court.id}&date=${selectedDate}&start=${rangeStart}&end=${rangeEnd ?? rangeStart}`,
                )
              }
              className="mt-6 w-full"
            >
              Continue to Checkout
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
