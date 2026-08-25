import { z } from "zod";

export const joinActivitySchema = z.object({
  // Capped well above anything a real court session could seat — just a
  // sanity bound, not the real limit (spotsLeft enforces that).
  guestNames: z
    .array(z.string().trim().min(1, "Guest name is required").max(80))
    .max(20)
    .default([]),
});

export type JoinActivityInput = z.infer<typeof joinActivitySchema>;
