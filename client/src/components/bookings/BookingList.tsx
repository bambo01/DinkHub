import Link from "next/link";
import { FiCalendar, FiClock } from "react-icons/fi";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { DisplayBooking } from "@/lib/booking-display";

const statusStyles: Record<DisplayBooking["status"], string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-primary/15 text-secondary",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-secondary/10 text-secondary",
  EXPIRED: "bg-gray-100 text-gray-400",
};

export function BookingList({ bookings }: { bookings: DisplayBooking[] }) {
  return (
    <ul className="space-y-3">
      {bookings.map((booking) => (
        <li key={`${booking.kind}-${booking.id}`}>
          <Link
            href={booking.href}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-secondary">
                {booking.title}
                {booking.kind === "open-play" && (
                  <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                    Open Play
                  </span>
                )}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5" />
                  {booking.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiClock className="h-3.5 w-3.5" />
                  {formatHour(booking.startHour)} – {formatHour(booking.endHour)}
                </span>
              </p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                {booking.referenceNumber}
              </p>
            </div>

            <div className="text-right">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  statusStyles[booking.status],
                )}
              >
                {booking.status.replace("_", " ")}
              </span>
              <p className="mt-1 text-sm font-semibold text-secondary">
                ₱{booking.amount.toFixed(2)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
