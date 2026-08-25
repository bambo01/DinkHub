export type CourtType = "INDOOR" | "OUTDOOR";
export type CourtStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  location: string;
  description: string | null;
  status: CourtStatus;
  defaultOpenHour: number;
  defaultCloseHour: number;
  pricePerHour: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedSlot {
  id: string;
  courtId: string;
  blockedDate: string;
  startHour: number;
  endHour: number;
  reason: string | null;
  createdAt: string;
}

export function courtTypeLabel(type: CourtType) {
  return type === "INDOOR" ? "Indoor" : "Outdoor";
}

// Expands a list of [startHour, endHour) ranges — admin blocked slots or
// real bookings, anything with that shape — into a flat set of individual
// unavailable hours for quick lookup.
export function hoursFromRanges(
  ranges: Array<{ startHour: number; endHour: number }>,
): Set<number> {
  const hours = new Set<number>();
  for (const range of ranges) {
    for (let hour = range.startHour; hour < range.endHour; hour++) {
      hours.add(hour);
    }
  }
  return hours;
}
