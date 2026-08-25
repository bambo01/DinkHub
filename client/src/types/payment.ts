export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export interface AdminPayment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymongoCheckoutSessionId: string;
  createdAt: string;
  bookingReferenceNumber: string;
  courtName: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  customerName: string | null;
  customerEmail: string;
}
