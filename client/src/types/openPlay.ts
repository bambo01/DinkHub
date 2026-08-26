export type SkillLevel = "ALL_LEVELS" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ActivityStatus = "ACTIVE" | "CANCELLED";

export interface ActivityCourt {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  courts: ActivityCourt[];
  title: string;
  description: string | null;
  eventDate: string;
  startHour: number;
  endHour: number;
  capacity: number;
  pricePerSlot: number;
  skillLevel: SkillLevel;
  status: ActivityStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedCount: number;
  spotsLeft: number;
}

export type OpenPlayBookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

export interface OpenPlayBooking {
  id: string;
  activityId: string;
  userId: string;
  referenceNumber: string;
  amount: number;
  slots: number;
  guestNames: string[];
  status: OpenPlayBookingStatus;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface AdminOpenPlayBooking extends OpenPlayBooking {
  customerName: string | null;
  customerEmail: string;
}

export interface CustomerOpenPlayBooking extends OpenPlayBooking {
  activityTitle: string;
  eventDate: string;
  startHour: number;
  endHour: number;
}

// Mirrors isUpcomingBooking/isPastBooking in types/booking.ts — Open Play
// bookings don't have COMPLETED/EXPIRED statuses, so "active" here just
// means "not cancelled and not already played."
const ACTIVE_OPEN_PLAY_STATUSES: OpenPlayBookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED"];

export function isUpcomingOpenPlayBooking(
  booking: CustomerOpenPlayBooking,
  todayKey: string,
): boolean {
  return ACTIVE_OPEN_PLAY_STATUSES.includes(booking.status) && booking.eventDate >= todayKey;
}

export function isPastOpenPlayBooking(booking: CustomerOpenPlayBooking, todayKey: string): boolean {
  return !isUpcomingOpenPlayBooking(booking, todayKey);
}

export function skillLevelLabel(level: SkillLevel) {
  switch (level) {
    case "ALL_LEVELS":
      return "All Levels";
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
  }
}
