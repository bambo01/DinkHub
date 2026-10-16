import { z } from "zod";

const hourField = z.number().int().min(0).max(24);

export const uuidParam = z.string().uuid("Invalid id");

export const createClubSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const updateClubSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export const createInviteSchema = z.object({
  // Omit for a shareable link; set to restrict the invite to one address.
  email: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
});

export const createPostSchema = z.object({
  // Optional because a post may be photo-only; the service rejects a post
  // with neither text nor an image.
  body: z.string().trim().max(2000).default(""),
  kind: z.enum(["FEED", "ANNOUNCEMENT"]).default("FEED"),
});

export const createSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().trim().max(500).optional(),
    location: z.string().trim().max(120).optional(),
    playDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startHour: hourField,
    endHour: hourField,
    maxPlayers: z.number().int().min(1).optional(),
  })
  .refine((data) => data.startHour < data.endHour, {
    message: "Start hour must be before end hour",
    path: ["endHour"],
  });

export const updateSessionStatusSchema =z.object({
  status: z.enum(["OPEN", "CLOSED", "CANCELLED"]),
});

export const respondSchema = z.object({
  response: z.enum(["IN", "OUT"]),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
