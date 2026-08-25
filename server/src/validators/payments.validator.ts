import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  bookingId: z.string().uuid("Invalid booking"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export const createOpenPlayCheckoutSessionSchema = z.object({
  openPlayBookingId: z.string().uuid("Invalid booking"),
});

export type CreateOpenPlayCheckoutSessionInput = z.infer<
  typeof createOpenPlayCheckoutSessionSchema
>;
