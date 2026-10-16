import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateClubInput,
  CreatePostInput,
  CreateSessionInput,
  UpdateClubInput,
} from "../validators/clubs.validator.js";

export type PostKind = "FEED" | "ANNOUNCEMENT";
export type SessionStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type SessionResponse = "IN" | "OUT";

export type ClubVisibility = "PUBLIC" | "PRIVATE";

export interface Club {
  id: string;
  name: string;
  description: string | null;
  visibility: ClubVisibility;
  imageUrl: string | null;
  memberCount: number;
  postCount: number;
  sessionCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface Author {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ClubPost {
  id: string;
  kind: PostKind;
  body: string;
  pinned: boolean;
  imageUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: Author;
}

export interface ClubSession {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  playDate: string;
  startHour: number;
  endHour: number;
  maxPlayers: number | null;
  status: SessionStatus;
  inCount: number;
  // Names of everyone who answered IN, so the card can show who's playing.
  attendees: { id: string; fullName: string | null }[];
  myResponse: SessionResponse | null;
}

export interface ClubMessage {
  id: number;
  body: string;
  createdAt: string;
  author: Author;
}

interface UserEmbed {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function mapAuthor(user: UserEmbed | null, fallbackId: string): Author {
  return {
    id: user?.id ?? fallbackId,
    fullName: user?.full_name ?? null,
    avatarUrl: user?.avatar_url ?? null,
  };
}

const AUTHOR_EMBED = "users(id, full_name, avatar_url)";

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("role").eq("id", userId).single();
  return data?.role === "ADMIN";
}

export async function assertClubExists(clubId: string) {
  const { data } = await supabase.from("clubs").select("id").eq("id", clubId).maybeSingle();
  if (!data) throw new AppError("Club not found", 404);
}

// Members and admins may read and post inside a club; everyone else gets a
// 403. Returns whether the caller is an admin, since several actions (delete
// anyone's post, etc.) widen for admins.
async function assertMember(clubId: string, userId: string): Promise<{ isAdmin: boolean }> {
  await assertClubExists(clubId);

  const isAdmin = await isAdminUser(userId);
  if (isAdmin) return { isAdmin };

  const { data } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) throw new AppError("Join this club to access it", 403);
  return { isAdmin: false };
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  image_url: string | null;
  visibility: ClubVisibility;
  club_members: { count: number }[];
  club_posts: { count: number }[];
  club_sessions: { count: number }[];
}

const CLUB_COLUMNS =
  "id, name, description, image_url, visibility, created_at, club_members(count), club_posts(count), club_sessions(count)";

function mapClub(row: ClubRow, memberOf: Set<string>): Club {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    visibility: row.visibility,
    memberCount: row.club_members[0]?.count ?? 0,
    postCount: row.club_posts[0]?.count ?? 0,
    sessionCount: row.club_sessions[0]?.count ?? 0,
    isMember: memberOf.has(row.id),
    createdAt: row.created_at,
  };
}

export async function getMembershipSet(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId);

  if (error) throw new AppError("Failed to load clubs", 500);
  return new Set((data ?? []).map((row) => row.club_id as string));
}

export async function listClubs(userId: string): Promise<Club[]> {
  const [{ data, error }, memberOf, isAdmin] = await Promise.all([
    supabase.from("clubs").select(CLUB_COLUMNS).order("created_at", { ascending: false }),
    getMembershipSet(userId),
    isAdminUser(userId),
  ]);

  if (error) throw new AppError("Failed to load clubs", 500);
  // Private clubs are invisible to anyone who is neither a member nor admin.
  return ((data ?? []) as ClubRow[])
    .filter((row) => isAdmin || row.visibility === "PUBLIC" || memberOf.has(row.id))
    .map((row) => mapClub(row, memberOf));
}

export async function getClub(clubId: string, userId: string): Promise<Club> {
  const [{ data, error }, memberOf, isAdmin] = await Promise.all([
    supabase.from("clubs").select(CLUB_COLUMNS).eq("id", clubId).maybeSingle(),
    getMembershipSet(userId),
    isAdminUser(userId),
  ]);

  if (error) throw new AppError("Failed to load club", 500);
  // 404 (not 403) for a hidden private club, so its existence isn't leaked.
  if (!data || (!isAdmin && data.visibility === "PRIVATE" && !memberOf.has(clubId))) {
    throw new AppError("Club not found", 404);
  }
  return mapClub(data as ClubRow, memberOf);
}

export async function createClub(userId: string, input: CreateClubInput): Promise<Club> {
  const { data, error } = await supabase
    .from("clubs")
    .insert({
      name: input.name,
      description: input.description ?? null,
      visibility: input.visibility,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) throw new AppError("Failed to create club", 500);
  return getClub(data.id as string, userId);
}

export async function updateClub(
  clubId: string,
  userId: string,
  input: UpdateClubInput,
): Promise<Club> {
  await assertClubExists(clubId);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.visibility !== undefined) patch.visibility = input.visibility;

  const { error } = await supabase.from("clubs").update(patch).eq("id", clubId);
  if (error) throw new AppError("Failed to update club", 500);

  return getClub(clubId, userId);
}

export async function deleteClub(clubId: string): Promise<void> {
  await assertClubExists(clubId);

  const { error } = await supabase.from("clubs").delete().eq("id", clubId);
  if (error) throw new AppError("Failed to delete club", 500);
}

export async function joinClub(clubId: string, userId: string): Promise<void> {
  const { data: club } = await supabase
    .from("clubs")
    .select("visibility")
    .eq("id", clubId)
    .maybeSingle();

  // Same 404 as getClub, so a private club can't be probed by id.
  if (!club) throw new AppError("Club not found", 404);

  if (club.visibility === "PRIVATE" && !(await isAdminUser(userId))) {
    throw new AppError("This club is invite-only", 403);
  }

  // Upsert so a double-click (or rejoining) is a no-op instead of a
  // duplicate-key error.
  const { error } = await supabase
    .from("club_members")
    .upsert({ club_id: clubId, user_id: userId }, { onConflict: "club_id,user_id" });

  if (error) throw new AppError("Failed to join club", 500);
}

export async function leaveClub(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId);

  if (error) throw new AppError("Failed to leave club", 500);
}

// ---------------------------------------------------------------------------
// Feed & announcements
// ---------------------------------------------------------------------------

interface PostRow {
  id: string;
  user_id: string;
  kind: PostKind;
  body: string;
  pinned: boolean;
  image_url: string | null;
  created_at: string;
  users: UserEmbed | null;
  club_post_likes: { user_id: string }[];
}

// `users!user_id` pins the embed to the author FK: club_posts also reaches
// users through club_post_likes, which makes a bare `users(...)` ambiguous.
const POST_COLUMNS =
  "id, user_id, kind, body, pinned, image_url, created_at, users!user_id(id, full_name, avatar_url), club_post_likes(user_id)";
const IMAGE_BUCKET = "listing-images";

function mapPost(row: PostRow, userId: string): ClubPost {
  return {
    id: row.id,
    kind: row.kind,
    body: row.body,
    pinned: row.pinned,
    imageUrl: row.image_url,
    likeCount: row.club_post_likes.length,
    likedByMe: row.club_post_likes.some((like) => like.user_id === userId),
    createdAt: row.created_at,
    author: mapAuthor(row.users, row.user_id),
  };
}

export async function listPosts(clubId: string, userId: string): Promise<ClubPost[]> {
  await assertMember(clubId, userId);

  const { data, error } = await supabase
    .from("club_posts")
    .select(POST_COLUMNS)
    .eq("club_id", clubId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new AppError("Failed to load posts", 500);
  return ((data ?? []) as unknown as PostRow[]).map((row) => mapPost(row, userId));
}

export async function createPost(
  clubId: string,
  userId: string,
  input: CreatePostInput,
  file?: Express.Multer.File,
): Promise<ClubPost> {
  await assertMember(clubId, userId);

  if (!input.body && !file) {
    throw new AppError("Write something or add a photo first", 422);
  }

  let imageUrl: string | null = null;
  if (file) {
    // Unique path per post — unlike a cover image, posts never overwrite
    // each other.
    const ext = file.mimetype.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `club-posts/${clubId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new AppError("Failed to upload image", 500);

    imageUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("club_posts")
    .insert({
      club_id: clubId,
      user_id: userId,
      kind: input.kind,
      body: input.body,
      image_url: imageUrl,
    })
    .select(POST_COLUMNS)
    .single();

  if (error || !data) throw new AppError("Failed to create post", 500);
  return mapPost(data as unknown as PostRow, userId);
}

export async function setPostLiked(
  clubId: string,
  postId: string,
  userId: string,
  liked: boolean,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  await assertMember(clubId, userId);

  const { data: post } = await supabase
    .from("club_posts")
    .select("id")
    .eq("id", postId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!post) throw new AppError("Post not found", 404);

  const { error } = liked
    ? await supabase
        .from("club_post_likes")
        .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id" })
    : await supabase
        .from("club_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

  if (error) throw new AppError("Failed to update like", 500);

  const { count } = await supabase
    .from("club_post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  return { likeCount: count ?? 0, likedByMe: liked };
}

export async function listMembers(clubId: string, userId: string): Promise<Author[]> {
  await assertMember(clubId, userId);

  const { data, error } = await supabase
    .from("club_members")
    .select(`user_id, ${AUTHOR_EMBED}`)
    .eq("club_id", clubId)
    .order("joined_at", { ascending: false })
    .limit(30);

  if (error) throw new AppError("Failed to load members", 500);
  return ((data ?? []) as unknown as { user_id: string; users: UserEmbed | null }[]).map(
    (row) => mapAuthor(row.users, row.user_id),
  );
}

export async function deletePost(
  clubId: string,
  postId: string,
  userId: string,
): Promise<void> {
  const { isAdmin } = await assertMember(clubId, userId);

  const { data: post } = await supabase
    .from("club_posts")
    .select("user_id, image_url")
    .eq("id", postId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!post) throw new AppError("Post not found", 404);
  if (!isAdmin && post.user_id !== userId) {
    throw new AppError("You can only delete your own posts", 403);
  }

  const { error } = await supabase.from("club_posts").delete().eq("id", postId);
  if (error) throw new AppError("Failed to delete post", 500);

  // Best-effort cleanup — an orphaned file is harmless, whereas failing the
  // delete over it would not be.
  const marker = `/${IMAGE_BUCKET}/`;
  const imageUrl = post.image_url as string | null;
  if (imageUrl?.includes(marker)) {
    await supabase.storage
      .from(IMAGE_BUCKET)
      .remove([imageUrl.split(marker)[1]!.split("?")[0]!]);
  }
}

export async function setPostPinned(
  clubId: string,
  postId: string,
  pinned: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from("club_posts")
    .update({ pinned })
    .eq("id", postId)
    .eq("club_id", clubId)
    .select("id");

  if (error) throw new AppError("Failed to update post", 500);
  if (!data || data.length === 0) throw new AppError("Post not found", 404);
}

// ---------------------------------------------------------------------------
// Scheduling (admin-created "who's in?" polls)
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  play_date: string;
  start_hour: number;
  end_hour: number;
  max_players: number | null;
  status: SessionStatus;
  club_session_responses: {
    user_id: string;
    response: SessionResponse;
    users: { full_name: string | null } | null;
  }[];
}

const SESSION_COLUMNS =
  "id, title, description, location, play_date, start_hour, end_hour, max_players, status, club_session_responses(user_id, response, users(full_name))";

function mapSession(row: SessionRow, userId: string): ClubSession {
  const attendees = row.club_session_responses
    .filter((r) => r.response === "IN")
    .map((r) => ({ id: r.user_id, fullName: r.users?.full_name ?? null }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    playDate: row.play_date,
    startHour: row.start_hour,
    endHour: row.end_hour,
    maxPlayers: row.max_players,
    status: row.status,
    inCount: attendees.length,
    attendees,
    myResponse:
      row.club_session_responses.find((r) => r.user_id === userId)?.response ?? null,
  };
}

async function loadSession(clubId: string, sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from("club_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) throw new AppError("Failed to load session", 500);
  if (!data) throw new AppError("Session not found", 404);
  return mapSession(data as unknown as SessionRow, userId);
}

export async function listSessions(clubId: string, userId: string): Promise<ClubSession[]> {
  await assertMember(clubId, userId);

  const { data, error } = await supabase
    .from("club_sessions")
    .select(SESSION_COLUMNS)
    .eq("club_id", clubId)
    .order("play_date", { ascending: true })
    .order("start_hour", { ascending: true });

  if (error) throw new AppError("Failed to load sessions", 500);
  return ((data ?? []) as unknown as SessionRow[]).map((row) => mapSession(row, userId));
}

export async function createSession(
  clubId: string,
  userId: string,
  input: CreateSessionInput,
): Promise<ClubSession> {
  await assertClubExists(clubId);

  const { data, error } = await supabase
    .from("club_sessions")
    .insert({
      club_id: clubId,
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      play_date: input.playDate,
      start_hour: input.startHour,
      end_hour: input.endHour,
      max_players: input.maxPlayers ?? null,
    })
    .select("id")
    .single();

  if (error || !data) throw new AppError("Failed to create session", 500);
  return loadSession(clubId, data.id as string, userId);
}

export async function updateSessionStatus(
  clubId: string,
  sessionId: string,
  userId: string,
  status: SessionStatus,
): Promise<ClubSession> {
  const { data, error } = await supabase
    .from("club_sessions")
    .update({ status })
    .eq("id", sessionId)
    .eq("club_id", clubId)
    .select("id");

  if (error) throw new AppError("Failed to update session", 500);
  if (!data || data.length === 0) throw new AppError("Session not found", 404);

  return loadSession(clubId, sessionId, userId);
}

export async function deleteSession(clubId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("club_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("club_id", clubId);

  if (error) throw new AppError("Failed to delete session", 500);
}

export async function respondToSession(
  clubId: string,
  sessionId: string,
  userId: string,
  response: SessionResponse,
): Promise<ClubSession> {
  await assertMember(clubId, userId);
  const session = await loadSession(clubId, sessionId, userId);

  if (session.status !== "OPEN") {
    throw new AppError("This session is no longer taking responses", 409);
  }

  if (
    response === "IN" &&
    session.myResponse !== "IN" &&
    session.maxPlayers !== null &&
    session.inCount >= session.maxPlayers
  ) {
    throw new AppError("This session is full", 409);
  }

  const { error } = await supabase.from("club_session_responses").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      response,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" },
  );

  if (error) throw new AppError("Failed to save your response", 500);
  return loadSession(clubId, sessionId, userId);
}

// ---------------------------------------------------------------------------
// Live chat
// ---------------------------------------------------------------------------

interface MessageRow {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  users: UserEmbed | null;
}

const MESSAGE_COLUMNS = `id, user_id, body, created_at, ${AUTHOR_EMBED}`;

function mapMessage(row: MessageRow): ClubMessage {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    author: mapAuthor(row.users, row.user_id),
  };
}

// Without `afterId` this returns the latest 50 (oldest-first). With it, only
// messages newer than that id — the cheap incremental fetch the chat polls.
export async function listMessages(
  clubId: string,
  userId: string,
  afterId?: number,
): Promise<ClubMessage[]> {
  await assertMember(clubId, userId);

  if (afterId !== undefined) {
    const { data, error } = await supabase
      .from("club_messages")
      .select(MESSAGE_COLUMNS)
      .eq("club_id", clubId)
      .gt("id", afterId)
      .order("id", { ascending: true })
      .limit(100);

    if (error) throw new AppError("Failed to load messages", 500);
    return ((data ?? []) as unknown as MessageRow[]).map(mapMessage);
  }

  const { data, error } = await supabase
    .from("club_messages")
    .select(MESSAGE_COLUMNS)
    .eq("club_id", clubId)
    .order("id", { ascending: false })
    .limit(50);

  if (error) throw new AppError("Failed to load messages", 500);
  return ((data ?? []) as unknown as MessageRow[]).map(mapMessage).reverse();
}

export async function sendMessage(
  clubId: string,
  userId: string,
  body: string,
): Promise<ClubMessage> {
  await assertMember(clubId, userId);

  const { data, error } = await supabase
    .from("club_messages")
    .insert({ club_id: clubId, user_id: userId, body })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error || !data) throw new AppError("Failed to send message", 500);
  return mapMessage(data as unknown as MessageRow);
}

export async function updateClubImage(
  clubId: string,
  userId: string,
  file: Express.Multer.File,
): Promise<Club> {
  await assertClubExists(clubId);

  // Fixed path per club — a re-upload overwrites instead of leaving
  // orphaned files behind.
  const path = `club-avatars/${clubId}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) throw new AppError("Failed to upload image", 500);

  const { publicUrl } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data;
  // Cache-bust so the browser/CDN doesn't keep serving the previous image.
  const { error } = await supabase
    .from("clubs")
    .update({ image_url: `${publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() })
    .eq("id", clubId);

  if (error) throw new AppError("Failed to save image", 500);
  return getClub(clubId, userId);
}
