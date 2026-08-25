import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateBlockedSlotInput,
  CreateCourtInput,
  UpdateCourtInput,
} from "../validators/courts.validator.js";

export type CourtType = "INDOOR" | "OUTDOOR";
export type CourtStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  location: string;
  description: string | null;
  status: CourtStatus;
  defaultOpenHour: number;
  defaultCloseHour: number;
  pricePerHour: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedSlot {
  id: string;
  courtId: string;
  blockedDate: string;
  startHour: number;
  endHour: number;
  reason: string | null;
  createdAt: string;
}

interface CourtRow {
  id: string;
  name: string;
  type: CourtType;
  location: string;
  description: string | null;
  status: CourtStatus;
  default_open_hour: number;
  default_close_hour: number;
  // PostgREST returns `numeric` columns as strings to avoid precision loss.
  price_per_hour: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const COURT_COLUMNS =
  "id, name, type, location, description, status, default_open_hour, default_close_hour, price_per_hour, image_url, created_at, updated_at";

interface BlockedSlotRow {
  id: string;
  court_id: string;
  blocked_date: string;
  start_hour: number;
  end_hour: number;
  reason: string | null;
  created_at: string;
}

function mapCourt(row: CourtRow): Court {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    location: row.location,
    description: row.description,
    status: row.status,
    defaultOpenHour: row.default_open_hour,
    defaultCloseHour: row.default_close_hour,
    pricePerHour: Number(row.price_per_hour),
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBlockedSlot(row: BlockedSlotRow): BlockedSlot {
  return {
    id: row.id,
    courtId: row.court_id,
    blockedDate: row.blocked_date,
    startHour: row.start_hour,
    endHour: row.end_hour,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export async function listCourts(): Promise<Court[]> {
  const { data, error } = await supabase
    .from("courts")
    .select(COURT_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError("Failed to load courts", 500);
  }

  return (data ?? []).map(mapCourt);
}

export async function getCourtById(id: string): Promise<Court> {
  const { data, error } = await supabase
    .from("courts")
    .select(COURT_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError("Court not found", 404);
  }

  return mapCourt(data);
}

export async function createCourt(input: CreateCourtInput): Promise<Court> {
  const { data, error } = await supabase
    .from("courts")
    .insert({
      name: input.name,
      type: input.type,
      location: input.location,
      description: input.description ?? null,
      default_open_hour: input.defaultOpenHour,
      default_close_hour: input.defaultCloseHour,
      price_per_hour: input.pricePerHour,
    })
    .select(COURT_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError("Failed to create court", 500);
  }

  return mapCourt(data);
}

export async function updateCourt(
  id: string,
  input: UpdateCourtInput,
): Promise<Court> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.type !== undefined) patch.type = input.type;
  if (input.location !== undefined) patch.location = input.location;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.defaultOpenHour !== undefined) patch.default_open_hour = input.defaultOpenHour;
  if (input.defaultCloseHour !== undefined) patch.default_close_hour = input.defaultCloseHour;
  if (input.pricePerHour !== undefined) patch.price_per_hour = input.pricePerHour;

  // Re-check the open/close ordering against the persisted value whenever
  // only one side of the pair is being changed in this request.
  if (
    (input.defaultOpenHour !== undefined) !== (input.defaultCloseHour !== undefined)
  ) {
    const existing = await getCourtById(id);
    const openHour = input.defaultOpenHour ?? existing.defaultOpenHour;
    const closeHour = input.defaultCloseHour ?? existing.defaultCloseHour;
    if (openHour >= closeHour) {
      throw new AppError("Open hour must be before close hour", 422);
    }
  }

  const { data, error } = await supabase
    .from("courts")
    .update(patch)
    .eq("id", id)
    .select(COURT_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError("Failed to update court", 500);
  }

  return mapCourt(data);
}

export async function deleteCourt(id: string): Promise<void> {
  // Confirm the court exists so a bad id 404s with a clear message.
  await getCourtById(id);

  const { count: bookingCount, error: bookingError } = await supabase
    .from("court_bookings")
    .select("id", { count: "exact", head: true })
    .eq("court_id", id);

  if (bookingError) {
    throw new AppError("Failed to check court bookings", 500);
  }
  if (bookingCount) {
    throw new AppError(
      "This court has booking history and can't be deleted. Set it to Inactive instead.",
      409,
    );
  }

  const { count: activityCount, error: activityError } = await supabase
    .from("open_play_activity_courts")
    .select("court_id", { count: "exact", head: true })
    .eq("court_id", id);

  if (activityError) {
    throw new AppError("Failed to check open play activities", 500);
  }
  if (activityCount) {
    throw new AppError(
      "This court is linked to an Open Play activity and can't be deleted. Remove it from that activity first, or set it to Inactive.",
      409,
    );
  }

  const { error } = await supabase.from("courts").delete().eq("id", id);

  if (error) {
    throw new AppError("Failed to delete court", 500);
  }
}

export async function updateCourtImage(
  id: string,
  file: Express.Multer.File,
): Promise<Court> {
  // Confirm the court exists so a bad id 404s instead of uploading an
  // orphaned image no court will ever reference.
  await getCourtById(id);

  // Fixed path per court (no extension) — every upload overwrites the same
  // storage object instead of accumulating orphaned files from a previous
  // upload in a different format.
  const path = `courts/${id}`;

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) {
    throw new AppError("Failed to upload image", 500);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(path);
  // Cache-bust so the browser/CDN doesn't keep serving the previous image
  // from this same URL after a re-upload.
  const imageUrl = `${publicUrl}?v=${Date.now()}`;

  const { data, error } = await supabase
    .from("courts")
    .update({ image_url: imageUrl })
    .eq("id", id)
    .select(COURT_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError("Failed to save image", 500);
  }

  return mapCourt(data);
}

export async function listBlockedSlots(
  courtId: string,
  date?: string,
): Promise<BlockedSlot[]> {
  let query = supabase
    .from("court_blocked_slots")
    .select("id, court_id, blocked_date, start_hour, end_hour, reason, created_at")
    .eq("court_id", courtId)
    .order("blocked_date", { ascending: true })
    .order("start_hour", { ascending: true });

  if (date) {
    query = query.eq("blocked_date", date);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load blocked slots", 500);
  }

  return (data ?? []).map(mapBlockedSlot);
}

export async function createBlockedSlot(
  courtId: string,
  input: CreateBlockedSlotInput,
): Promise<BlockedSlot> {
  // Confirm the court exists so a bad courtId 404s instead of silently
  // creating an orphaned blocked slot.
  await getCourtById(courtId);

  const { data, error } = await supabase
    .from("court_blocked_slots")
    .insert({
      court_id: courtId,
      blocked_date: input.blockedDate,
      start_hour: input.startHour,
      end_hour: input.endHour,
      reason: input.reason ?? null,
    })
    .select("id, court_id, blocked_date, start_hour, end_hour, reason, created_at")
    .single();

  if (error || !data) {
    throw new AppError("Failed to create blocked slot", 500);
  }

  return mapBlockedSlot(data);
}

export async function deleteBlockedSlot(
  courtId: string,
  slotId: string,
): Promise<void> {
  const { error, count } = await supabase
    .from("court_blocked_slots")
    .delete({ count: "exact" })
    .eq("id", slotId)
    .eq("court_id", courtId);

  if (error) {
    throw new AppError("Failed to remove blocked slot", 500);
  }

  if (!count) {
    throw new AppError("Blocked slot not found", 404);
  }
}
