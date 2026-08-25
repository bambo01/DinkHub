export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  referenceNumber: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
}

export interface AdminBooking extends Booking {
  courtName: string;
  customerName: string | null;
  customerEmail: string;
}

export interface CustomerBooking extends Booking {
  courtName: string;
}

// "Not yet done" — still awaiting payment or confirmed for a date that
// hasn't passed. Everything else (cancelled/expired/completed, or a
// confirmed booking whose date has already passed) is history.
const ACTIVE_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED"];

export function isUpcomingBooking(booking: Booking, todayKey: string): boolean {
  return ACTIVE_STATUSES.includes(booking.status) && booking.bookingDate >= todayKey;
}

export function isPastBooking(booking: Booking, todayKey: string): boolean {
  return !isUpcomingBooking(booking, todayKey);
}

// Hours a court is already held for, from the public /courts/:id/booked-hours
// endpoint (real bookings) — as distinct from admin-set blocked slots.
export interface BookedRange {
  startHour: number;
  endHour: number;
}
