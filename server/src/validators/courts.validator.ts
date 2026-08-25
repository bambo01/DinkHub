import { z } from "zod";

const hourField = z.number().int().min(0).max(24);
const priceField = z.number().min(0);

export const createCourtSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["INDOOR", "OUTDOOR"]),
    location: z.string().min(1, "Location is required"),
    description: z.string().optional(),
    defaultOpenHour: hourField.default(8),
    defaultCloseHour: hourField.default(19),
    pricePerHour: priceField.default(500),
  })
  .refine((data) => data.defaultOpenHour < data.defaultCloseHour, {
    message: "Open hour must be before close hour",
    path: ["defaultCloseHour"],
  });

export type CreateCourtInput = z.infer<typeof createCourtSchema>;

export const updateCourtSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["INDOOR", "OUTDOOR"]).optional(),
    location: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
    defaultOpenHour: hourField.optional(),
    defaultCloseHour: hourField.optional(),
    pricePerHour: priceField.optional(),
  })
  .refine(
    (data) =>
      data.defaultOpenHour === undefined ||
      data.defaultCloseHour === undefined ||
      data.defaultOpenHour < data.defaultCloseHour,
    {
      message: "Open hour must be before close hour",
      path: ["defaultCloseHour"],
    },
  );

export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;

export const createBlockedSlotSchema = z
  .object({
    blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startHour: hourField,
    endHour: hourField,
    reason: z.string().optional(),
  })
  .refine((data) => data.startHour < data.endHour, {
    message: "Start hour must be before end hour",
    path: ["endHour"],
  });

export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
