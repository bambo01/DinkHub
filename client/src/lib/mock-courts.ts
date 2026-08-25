// Pure date/hour helpers shared across the courts + booking UI. Court data
// itself now comes from the real /api/courts endpoint (see @/types/court and
// @/lib/api) — this file no longer holds any mock records.

export const DEFAULT_HOURS = { open: 8, close: 19 };

export function getHourSlots(
  open: number = DEFAULT_HOURS.open,
  close: number = DEFAULT_HOURS.close,
): number[] {
  const hours: number[] = [];
  for (let hour = open; hour < close; hour++) {
    hours.push(hour);
  }
  return hours;
}

export function formatHour(hour: number) {
  if (hour === 24) return "12:00 AM";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

// Compact "start–end" label for a single hour slot, e.g. "8–9 AM" or
// "6–7 PM" — makes it clear each button's slot reaches into the next hour,
// rather than just showing the start time and leaving the end implicit.
export function formatHourRangeShort(startHour: number, endHour: number) {
  const startPeriod = startHour >= 12 ? "PM" : "AM";
  const normalizedEnd = endHour === 24 ? 0 : endHour;
  const endPeriod = normalizedEnd >= 12 ? "PM" : "AM";
  const startDisplay = startHour % 12 === 0 ? 12 : startHour % 12;
  const endDisplay = normalizedEnd % 12 === 0 ? 12 : normalizedEnd % 12;

  return startPeriod === endPeriod
    ? `${startDisplay}–${endDisplay} ${endPeriod}`
    : `${startDisplay} ${startPeriod}–${endDisplay} ${endPeriod}`;
}

export function toDateKey(date: Date) {
  // Local date components, not toISOString() — that converts to UTC first,
  // which silently returns the wrong calendar date for any local time that
  // crosses a UTC day boundary (e.g. before 8am in UTC+8).
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// The earliest hour still bookable for a given date — the court's normal
// opening hour on any future date, but for *today* nothing at or before the
// current hour (e.g. if it's 10:15pm, the earliest bookable slot is 11pm).
export function earliestBookableHour(openHour: number, dateKey: string): number {
  const now = new Date();
  if (dateKey !== toDateKey(now)) return openHour;
  return Math.max(openHour, now.getHours() + 1);
}
