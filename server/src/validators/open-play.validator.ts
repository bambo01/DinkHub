import { z } from "zod";

const hourField = z.number().int().min(0).max(24);

const skillLevelEnum = z.enum(["ALL_LEVELS", "BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createActivitySchema = z
  .object({
    courtIds: z.array(z.string().uuid("Invalid court")).min(1, "Select at least one court"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startHour: hourField,
    endHour: hourField,
    capacity: z.number().int().min(1, "Capacity must be at least 1"),
    pricePerSlot: z.number().min(0),
    skillLevel: skillLevelEnum.default("ALL_LEVELS"),
  })
  .refine((data) => data.startHour < data.endHour, {
    message: "Start hour must be before end hour",
    path: ["endHour"],
  });

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z
  .object({
    courtIds: z.array(z.string().uuid()).min(1, "Select at least one court").optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startHour: hourField.optional(),
    endHour: hourField.optional(),
    capacity: z.number().int().min(1).optional(),
    pricePerSlot: z.number().min(0).optional(),
    skillLevel: skillLevelEnum.optional(),
    status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
  })
  .refine(
    (data) =>
      data.startHour === undefined ||
      data.endHour === undefined ||
      data.startHour < data.endHour,
    {
      message: "Start hour must be before end hour",
      path: ["endHour"],
    },
  );

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
