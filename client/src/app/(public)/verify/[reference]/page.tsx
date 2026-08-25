import { notFound } from "next/navigation";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiUser,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { ApiError, apiFetch } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";

// A booking's status (e.g. pending -> confirmed) can change after this page
// is first generated — always render fresh instead of serving a stale
// cached snapshot for a given reference number.
export const dynamic = "force-dynamic";

type VerifyResult =
  | {
      type: "COURT";
      referenceNumber: string;
      status: string;
      customerName: string | null;
      courtName: string;
      bookingDate: string;
      startHour: number;
      endHour: number;
      totalAmount: number;
    }
  | {
      type: "OPEN_PLAY";
      referenceNumber: string;
      status: string;
      customerName: string | null;
      activityTitle: string;
      eventDate: string;
      startHour: number;
      endHour: number;
      slots: number;
      guestNames: string[];
      amount: number;
    };

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FiCalendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-secondary">{value}</p>
      </div>
    </div>
  );
}

export default async function VerifyPage(
  props: PageProps<"/verify/[reference]">,
) {
  const { reference } = await props.params;

  let result: VerifyResult;
  try {
    result = await apiFetch<VerifyResult>(`/verify/${reference}`, null);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const isConfirmed = result.status === "CONFIRMED";
  const isCancelled = result.status === "CANCELLED";

  const dateLabel = new Date(
    `${result.type === "COURT" ? result.bookingDate : result.eventDate}T00:00:00`,
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeRange = `${formatHour(result.startHour)} – ${formatHour(result.endHour)}`;

  const statusTone = isConfirmed
    ? { icon: FiCheckCircle, className: "bg-primary/15 text-primary", label: "Confirmed" }
    : isCancelled
      ? { icon: FiXCircle, className: "bg-red-100 text-red-600", label: "Cancelled" }
      : { icon: FiXCircle, className: "bg-amber-100 text-amber-700", label: result.status.replace("_", " ") };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${statusTone.className}`}
        >
          <statusTone.icon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-secondary">
          {isConfirmed ? "Booking Confirmed" : statusTone.label}
        </h1>
        <p className="mt-1 font-mono text-sm text-gray-500">{result.referenceNumber}</p>

        <div className="mt-6 space-y-4 border-t border-gray-100 pt-6 text-left">
          {result.customerName && <Row icon={FiUser} label="Guest" value={result.customerName} />}

          {result.type === "COURT" ? (
            <Row icon={FiMapPin} label="Court" value={result.courtName} />
          ) : (
            <Row icon={FiUsers} label="Session" value={result.activityTitle} />
          )}

          <Row icon={FiCalendar} label="Date" value={dateLabel} />
          <Row icon={FiClock} label="Time" value={timeRange} />

          {result.type === "OPEN_PLAY" && result.slots > 1 && (
            <Row
              icon={FiUsers}
              label="Players"
              value={`${result.slots}${
                result.guestNames.length > 0 ? ` (with ${result.guestNames.join(", ")})` : ""
              }`}
            />
          )}
        </div>
      </div>
    </section>
  );
}
