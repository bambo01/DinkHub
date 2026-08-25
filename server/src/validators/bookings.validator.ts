import { z } from "zod";

export const createBookingSchema = z
  .object({
    courtId: z.string().uuid("Invalid court"),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
  })
  .refine((data) => data.startHour < data.endHour, {
    message: "Start hour must be before end hour",
    path: ["endHour"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
