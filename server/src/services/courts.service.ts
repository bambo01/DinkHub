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
  created_at: string;
  updated_at: string;
}

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
    .select(
      "id, name, type, location, description, status, default_open_hour, default_close_hour, price_per_hour, created_at, updated_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError("Failed to load courts", 500);
  }

  return (data ?? []).map(mapCourt);
}

export async function getCourtById(id: string): Promise<Court> {
  const { data, error } = await supabase
    .from("courts")
    .select(
      "id, name, type, location, description, status, default_open_hour, default_close_hour, price_per_hour, created_at, updated_at",
    )
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
    .select(
      "id, name, type, location, description, status, default_open_hour, default_close_hour, price_per_hour, created_at, updated_at",
    )
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
    .select(
      "id, name, type, location, description, status, default_open_hour, default_close_hour, price_per_hour, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new AppError("Failed to update court", 500);
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
