"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiCalendar, FiClock, FiMapPin, FiSearch } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch } from "@/lib/api";
import { earliestBookableHour, formatHour, formatHourRangeShort, toDateKey } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import { hoursFromRanges, courtTypeLabel, type BlockedSlot, type Court } from "@/types/court";
import type { BookedRange } from "@/types/booking";

interface AvailabilityProps {
  courts: Court[];
}

const today = new Date();
const isValidDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function Availability({ courts }: AvailabilityProps) {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const initialDate =
    requestedDate &&
    isValidDateKey(requestedDate) &&
    requestedDate >= toDateKey(today)
      ? requestedDate
      : toDateKey(today);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [unavailableByCourtId, setUnavailableByCourtId] = useState<Record<string, Set<number>>>({});
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedRange, setSearchedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // The shared grid spans the widest range any active court is open —
  // per-hour, whether a given court counts as "open" is checked separately
  // below against that court's own hours and blocked slots. For today, the
  // range also can't start before the current hour.
  const slots = useMemo(() => {
    if (courts.length === 0) return [];
    const open = Math.min(...courts.map((court) => court.defaultOpenHour));
    const close = Math.max(...courts.map((court) => court.defaultCloseHour));
    const earliestHour = earliestBookableHour(open, selectedDate);
    const hours: number[] = [];
    for (let hour = earliestHour; hour < close; hour++) hours.push(hour);
    return hours;
  }, [courts, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      courts.map((court) =>
        Promise.all([
          apiFetch<BlockedSlot[]>(`/courts/${court.id}/blocked-slots?date=${selectedDate}`, null),
          apiFetch<BookedRange[]>(`/courts/${court.id}/booked-hours?date=${selectedDate}`, null),
        ])
          .then(([blocked, booked]) => [court.id, hoursFromRanges([...blocked, ...booked])] as const)
          .catch(() => [court.id, new Set<number>()] as const),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setUnavailableByCourtId(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [courts, selectedDate]);

  function isCourtOpenAt(court: Court, hour: number) {
    if (hour < court.defaultOpenHour || hour >= court.defaultCloseHour) return false;
    return !unavailableByCourtId[court.id]?.has(hour);
  }

  // A shared-grid hour is fully booked only when no active court is open then.
  const fullyBookedSlots = useMemo(
    () => slots.filter((hour) => !courts.some((court) => isCourtOpenAt(court, hour))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, courts, unavailableByCourtId],
  );

  function resetSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setError(null);
    setSearchedRange(null);
  }

  function handleSlotClick(hour: number) {
    setError(null);
    setSearchedRange(null);

    // No selection yet, or a full range was already picked — start fresh.
    if (rangeStart === null || rangeEnd !== null) {
      setRangeStart(hour);
      setRangeEnd(null);
      return;
    }

    // Clicking the same slot again clears the selection.
    if (hour === rangeStart) {
      resetSelection();
      return;
    }

    const start = Math.min(rangeStart, hour);
    const end = Math.max(rangeStart, hour);
    const spansFullyBookedHour = fullyBookedSlots.some(
      (h) => h >= start && h <= end,
    );

    if (spansFullyBookedHour) {
      setError(
        "That range crosses an hour with no courts open. Pick a different range.",
      );
      setRangeStart(hour);
      setRangeEnd(null);
      return;
    }

    setRangeStart(start);
    setRangeEnd(end);
  }

  function handleSearch() {
    if (rangeStart === null) return;
    setSearchedRange({ start: rangeStart, end: rangeEnd ?? rangeStart });
  }

  const hasFullRange = rangeStart !== null && rangeEnd !== null;
  const durationHours = hasFullRange
    ? rangeEnd! - rangeStart! + 1
    : rangeStart !== null
      ? 1
      : 0;

  const availableCourts = searchedRange
    ? courts.filter((court) => {
        for (let hour = searchedRange.start; hour <= searchedRange.end; hour++) {
          if (!isCourtOpenAt(court, hour)) return false;
        }
        return true;
      })
    : [];

  return (
    <section id="availability" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-secondary">
              Check Court Availability
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Pick a date, then click a start hour and an end hour to search
              for open courts.
            </p>
          </div>

          <div>
            <label
              htmlFor="availability-date"
              className="mb-1 block text-xs font-medium text-secondary"
            >
              Date
            </label>
            <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
              <FiCalendar className="h-4 w-4 text-gray-400" />
              <input
                id="availability-date"
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
              const isFullyBooked = fullyBookedSlots.includes(hour);
              const isInRange =
                rangeStart !== null &&
                hour >= rangeStart &&
                hour <= (rangeEnd ?? rangeStart);

              return (
                <button
                  key={hour}
                  type="button"
                  disabled={isFullyBooked}
                  onClick={() => handleSlotClick(hour)}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                    isFullyBooked
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
              Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-gray-200" />
              Fully booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-primary" />
              Selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            {rangeStart !== null && (
              <>
                <p className="text-sm text-secondary">
                  <span className="font-semibold">
                    {formatHour(rangeStart)} –{" "}
                    {formatHour((rangeEnd ?? rangeStart) + 1)}
                  </span>{" "}
                  <span className="text-gray-500">
                    ({durationHours} hr{durationHours > 1 ? "s" : ""})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-xs font-medium text-gray-500 hover:text-secondary hover:underline"
                >
                  Clear
                </button>
              </>
            )}
            <Button
              type="button"
              variant="primary"
              disabled={rangeStart === null}
              onClick={handleSearch}
              className="flex items-center gap-1.5"
            >
              <FiSearch className="h-4 w-4" />
              Search Courts
            </Button>
          </div>
        </div>

        {searchedRange && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm font-medium text-secondary">
              {availableCourts.length > 0
                ? `${availableCourts.length} court${availableCourts.length > 1 ? "s" : ""} available for ${formatHour(searchedRange.start)} – ${formatHour(searchedRange.end + 1)}`
                : "No courts available for that time."}
            </p>

            {availableCourts.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {availableCourts.map((court) => (
                  <div
                    key={court.id}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-secondary to-secondary/70">
                      <GiTennisCourt className="h-10 w-10 text-primary/80" />
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        {courtTypeLabel(court.type)}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-secondary">
                        {court.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <FiMapPin className="h-3 w-3" />
                        {court.location}
                      </p>
                      <LinkButton
                        href={`/courts/${court.id}?date=${selectedDate}&start=${searchedRange.start}&end=${searchedRange.end}`}
                        variant="primary"
                        className="mt-3 w-full px-3 py-1.5 text-xs"
                      >
                        Book Now
                      </LinkButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
