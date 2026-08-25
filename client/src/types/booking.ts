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

// Hours a court is already held for, from the public /courts/:id/booked-hours
// endpoint (real bookings) — as distinct from admin-set blocked slots.
export interface BookedRange {
  startHour: number;
  endHour: number;
}
