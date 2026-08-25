import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateActivityInput,
  UpdateActivityInput,
} from "../validators/open-play.validator.js";

export type SkillLevel = "ALL_LEVELS" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ActivityStatus = "ACTIVE" | "CANCELLED";

export interface ActivityCourt {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  courts: ActivityCourt[];
  title: string;
  description: string | null;
  eventDate: string;
  startHour: number;
  endHour: number;
  capacity: number;
  pricePerSlot: number;
  skillLevel: SkillLevel;
  status: ActivityStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Players with a CONFIRMED (i.e. paid) reservation — what "who's already
  // joined" should show.
  confirmedCount: number;
  // capacity minus every active hold (PENDING_PAYMENT + CONFIRMED), so the
  // join button and availability display can't oversell a spot someone
  // else is mid-checkout on.
  spotsLeft: number;
}

interface ActivityRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_hour: number;
  end_hour: number;
  capacity: number;
  // PostgREST returns `numeric` columns as strings to avoid precision loss.
  price_per_slot: string;
  skill_level: SkillLevel;
  status: ActivityStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  open_play_activity_courts: { courts: ActivityCourt | null }[];
}

const ACTIVITY_COLUMNS =
  "id, title, description, event_date, start_hour, end_hour, capacity, price_per_slot, skill_level, status, image_url, created_at, updated_at, open_play_activity_courts(courts(id, name))";

type ActivityBase = Omit<Activity, "confirmedCount" | "spotsLeft">;

function mapActivity(row: ActivityRow): ActivityBase {
  return {
    id: row.id,
    courts: row.open_play_activity_courts
      .map((junction) => junction.courts)
      .filter((court): court is ActivityCourt => court !== null),
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    startHour: row.start_hour,
    endHour: row.end_hour,
    capacity: row.capacity,
    pricePerSlot: Number(row.price_per_slot),
    skillLevel: row.skill_level,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// A single extra query (not one per activity) tallying every active hold —
// PENDING_PAYMENT counts toward spotsLeft (so the UI can't oversell a spot
// someone else is mid-checkout on) but not toward confirmedCount (which
// reflects who has actually paid and is shown as "joined").
async function getBookingCounts(
  activityIds: string[],
): Promise<Record<string, { confirmed: number; taken: number }>> {
  if (activityIds.length === 0) return {};

  const { data, error } = await supabase
    .from("open_play_bookings")
    .select("activity_id, status, slots")
    .in("activity_id", activityIds)
    .in("status", ["PENDING_PAYMENT", "CONFIRMED"]);

  if (error) {
    throw new AppError("Failed to load open play activities", 500);
  }

  const counts: Record<string, { confirmed: number; taken: number }> = {};
  for (const row of data as { activity_id: string; status: string; slots: number }[]) {
    const entry = counts[row.activity_id] ?? { confirmed: 0, taken: 0 };
    entry.taken += row.slots;
    if (row.status === "CONFIRMED") entry.confirmed += row.slots;
    counts[row.activity_id] = entry;
  }
  return counts;
}

function withCounts(
  activity: ActivityBase,
  counts: Record<string, { confirmed: number; taken: number }>,
): Activity {
  const entry = counts[activity.id] ?? { confirmed: 0, taken: 0 };
  return {
    ...activity,
    confirmedCount: entry.confirmed,
    spotsLeft: Math.max(activity.capacity - entry.taken, 0),
  };
}

// Blocked slots the backend auto-creates for an activity's courts, keyed by
// open_play_activity_id, are fully owned by the activity: every call here
// wipes and (if the activity is still ACTIVE) rebuilds them from scratch, so
// callers never need to diff what changed.
async function syncBlockedSlotsForActivity(activity: Activity): Promise<void> {
  const { error: deleteError } = await supabase
    .from("court_blocked_slots")
    .delete()
    .eq("open_play_activity_id", activity.id);

  if (deleteError) {
    throw new AppError("Failed to sync blocked court time for open play activity", 500);
  }

  if (activity.status !== "ACTIVE" || activity.courts.length === 0) {
    return;
  }

  const rows = activity.courts.map((court) => ({
    court_id: court.id,
    blocked_date: activity.eventDate,
    start_hour: activity.startHour,
    end_hour: activity.endHour,
    reason: `Open Play: ${activity.title}`,
    open_play_activity_id: activity.id,
  }));

  const { error: insertError } = await supabase.from("court_blocked_slots").insert(rows);

  if (insertError) {
    throw new AppError("Failed to block court time for open play activity", 500);
  }
}

async function assertCourtsExist(courtIds: string[]): Promise<void> {
  const { data, error } = await supabase.from("courts").select("id").in("id", courtIds);

  if (error || !data || data.length !== courtIds.length) {
    throw new AppError("One or more courts not found", 422);
  }
}

export async function listActivities(filters?: {
  status?: ActivityStatus;
  date?: string;
}): Promise<Activity[]> {
  let query = supabase
    .from("open_play_activities")
    .select(ACTIVITY_COLUMNS)
    .order("event_date", { ascending: true })
    .order("start_hour", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.date) query = query.eq("event_date", filters.date);

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load open play activities", 500);
  }

  const activities = ((data ?? []) as unknown as ActivityRow[]).map(mapActivity);
  const counts = await getBookingCounts(activities.map((activity) => activity.id));
  return activities.map((activity) => withCounts(activity, counts));
}

export async function getActivityById(id: string): Promise<Activity> {
  const { data, error } = await supabase
    .from("open_play_activities")
    .select(ACTIVITY_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError("Open play activity not found", 404);
  }

  const activity = mapActivity(data as unknown as ActivityRow);
  const counts = await getBookingCounts([activity.id]);
  return withCounts(activity, counts);
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const courtIds = Array.from(new Set(input.courtIds));
  await assertCourtsExist(courtIds);

  const { data, error } = await supabase
    .from("open_play_activities")
    .insert({
      title: input.title,
      description: input.description ?? null,
      event_date: input.eventDate,
      start_hour: input.startHour,
      end_hour: input.endHour,
      capacity: input.capacity,
      price_per_slot: input.pricePerSlot,
      skill_level: input.skillLevel,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError("Failed to create open play activity", 500);
  }

  const activityId = data.id as string;

  try {
    const { error: junctionError } = await supabase
      .from("open_play_activity_courts")
      .insert(courtIds.map((courtId) => ({ activity_id: activityId, court_id: courtId })));

    if (junctionError) {
      throw new AppError("Failed to assign courts to open play activity", 500);
    }

    const activity = await getActivityById(activityId);
    await syncBlockedSlotsForActivity(activity);
    return activity;
  } catch (err) {
    // Cascading deletes clean up the junction rows and any blocked slots
    // that made it in before the failure.
    await supabase.from("open_play_activities").delete().eq("id", activityId);
    throw err;
  }
}

export async function updateActivity(
  id: string,
  input: UpdateActivityInput,
): Promise<Activity> {
  const existing = await getActivityById(id);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.eventDate !== undefined) patch.event_date = input.eventDate;
  if (input.startHour !== undefined) patch.start_hour = input.startHour;
  if (input.endHour !== undefined) patch.end_hour = input.endHour;
  if (input.capacity !== undefined) patch.capacity = input.capacity;
  if (input.pricePerSlot !== undefined) patch.price_per_slot = input.pricePerSlot;
  if (input.skillLevel !== undefined) patch.skill_level = input.skillLevel;
  if (input.status !== undefined) patch.status = input.status;

  const startHour = input.startHour ?? existing.startHour;
  const endHour = input.endHour ?? existing.endHour;
  if (startHour >= endHour) {
    throw new AppError("Start hour must be before end hour", 422);
  }

  const courtIds = input.courtIds ? Array.from(new Set(input.courtIds)) : undefined;
  if (courtIds) {
    await assertCourtsExist(courtIds);
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("open_play_activities").update(patch).eq("id", id);
    if (error) {
      throw new AppError("Failed to update open play activity", 500);
    }
  }

  if (courtIds) {
    const { error: deleteError } = await supabase
      .from("open_play_activity_courts")
      .delete()
      .eq("activity_id", id);
    if (deleteError) {
      throw new AppError("Failed to update open play activity courts", 500);
    }

    const { error: insertError } = await supabase
      .from("open_play_activity_courts")
      .insert(courtIds.map((courtId) => ({ activity_id: id, court_id: courtId })));
    if (insertError) {
      throw new AppError("Failed to update open play activity courts", 500);
    }
  }

  const activity = await getActivityById(id);

  const needsResync =
    courtIds !== undefined ||
    input.eventDate !== undefined ||
    input.startHour !== undefined ||
    input.endHour !== undefined ||
    input.status !== undefined;

  if (needsResync) {
    await syncBlockedSlotsForActivity(activity);
  }

  return activity;
}

export async function deleteActivity(id: string): Promise<void> {
  // Confirm the activity exists so a bad id 404s with a clear message.
  await getActivityById(id);

  const { count, error: bookingError } = await supabase
    .from("open_play_bookings")
    .select("id", { count: "exact", head: true })
    .eq("activity_id", id);

  if (bookingError) {
    throw new AppError("Failed to check open play bookings", 500);
  }
  if (count) {
    throw new AppError(
      "This activity has bookings and can't be deleted. Set it to Cancelled instead.",
      409,
    );
  }

  // court_blocked_slots and open_play_activity_courts both reference this
  // activity with ON DELETE CASCADE, so removing the activity row cleans
  // those up automatically.
  const { error } = await supabase.from("open_play_activities").delete().eq("id", id);

  if (error) {
    throw new AppError("Failed to delete open play activity", 500);
  }
}

export async function updateActivityImage(
  id: string,
  file: Express.Multer.File,
): Promise<Activity> {
  // Confirm the activity exists so a bad id 404s instead of uploading an
  // orphaned image no activity will ever reference.
  await getActivityById(id);

  // Fixed path per activity (no extension) — every upload overwrites the
  // same storage object instead of accumulating orphaned files from a
  // previous upload in a different format.
  const path = `open-play/${id}`;

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

  const { error } = await supabase
    .from("open_play_activities")
    .update({ image_url: imageUrl })
    .eq("id", id);

  if (error) {
    throw new AppError("Failed to save image", 500);
  }

  return getActivityById(id);
}
