"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { AdminPayment, PaymentStatus } from "@/types/payment";

const statusStyles: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-primary/15 text-secondary",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-secondary/10 text-secondary",
};

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    apiFetch<AdminPayment[]>("/payments", accessToken)
      .then(setPayments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load payments"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalPaid = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            {payments.length} payment{payments.length === 1 ? "" : "s"} · ₱
            {totalPaid.toFixed(2)} collected
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}

        {!error && isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading payments…</p>
        )}

        {!error && !isLoading && payments.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No payments yet.</p>
        )}

        {!error && !isLoading && payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Booking</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-secondary">
                        {payment.customerName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{payment.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-mono text-xs text-gray-500">
                        {payment.bookingReferenceNumber}
                      </span>
                      <br />
                      {payment.courtName}
                      <br />
                      <span className="text-xs text-gray-400">
                        {payment.bookingDate}, {formatHour(payment.startHour)} –{" "}
                        {formatHour(payment.endHour)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ₱{payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusStyles[payment.status],
                        )}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {payment.paymongoCheckoutSessionId}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
