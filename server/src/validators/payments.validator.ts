import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  bookingId: z.string().uuid("Invalid booking"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
