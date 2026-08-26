import type { BookingStatus, CustomerBooking } from "@/types/booking";
import type { CustomerOpenPlayBooking, OpenPlayBookingStatus } from "@/types/openPlay";

// Court bookings and Open Play bookings have different field names for the
// same concepts (courtName vs activityTitle, bookingDate vs eventDate,
// totalAmount vs amount) — this normalizes both into one shape so
// BookingList and the confirmation/history pages don't need to branch on
// booking type everywhere.
export interface DisplayBooking {
  id: string;
  kind: "court" | "open-play";
  title: string;
  date: string;
  startHour: number;
  endHour: number;
  referenceNumber: string;
  amount: number;
  status: BookingStatus | OpenPlayBookingStatus;
  href: string;
}

export function courtBookingToDisplay(booking: CustomerBooking): DisplayBooking {
  return {
    id: booking.id,
    kind: "court",
    title: booking.courtName,
    date: booking.bookingDate,
    startHour: booking.startHour,
    endHour: booking.endHour,
    referenceNumber: booking.referenceNumber,
    amount: booking.totalAmount,
    status: booking.status,
    href: `/bookings/confirmation?bookingId=${booking.id}`,
  };
}

export function openPlayBookingToDisplay(booking: CustomerOpenPlayBooking): DisplayBooking {
  return {
    id: booking.id,
    kind: "open-play",
    title: booking.activityTitle,
    date: booking.eventDate,
    startHour: booking.startHour,
    endHour: booking.endHour,
    referenceNumber: booking.referenceNumber,
    amount: booking.amount,
    status: booking.status,
    href: `/bookings/confirmation?openPlayBookingId=${booking.id}`,
  };
}
