import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import { assertClubExists, getMembershipSet } from "./clubs.service.js";
import { sendClubInviteEmail } from "./email.service.js";

export interface ClubInvite {
  id: string;
  token: string;
  link: string;
  email: string | null;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface InvitePreview {
  clubId: string;
  clubName: string;
  clubImageUrl: string | null;
  memberCount: number;
  email: string | null;
  alreadyMember: boolean;
}

interface InviteRow {
  id: string;
  club_id: string;
  token: string;
  email: string | null;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const INVITE_COLUMNS =
  "id, club_id, token, email, max_uses, uses, expires_at, revoked_at, created_at";
const INVITE_TTL_DAYS = 7;

function mapInvite(row: InviteRow): ClubInvite {
  return {
    id: row.id,
    token: row.token,
    link: `${env.FRONTEND_URL}/clubs/invite/${row.token}`,
    email: row.email,
    uses: row.uses,
    maxUses: row.max_uses,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function isUsable(row: InviteRow): boolean {
  if (row.revoked_at) return false;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return false;
  if (row.max_uses !== null && row.uses >= row.max_uses) return false;
  return true;
}

export async function createInvite(
  clubId: string,
  userId: string,
  email?: string,
): Promise<ClubInvite> {
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", clubId)
    .maybeSingle();
  if (!club) throw new AppError("Club not found", 404);

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("club_invites")
    .insert({
      club_id: clubId,
      token: randomBytes(24).toString("base64url"),
      email: email ?? null,
      created_by: userId,
      // An emailed invite is for one person; a shared link is open-ended
      // until it expires or the admin revokes it.
      max_uses: email ? 1 : null,
      expires_at: expiresAt.toISOString(),
    })
    .select(INVITE_COLUMNS)
    .single();

  if (error || !data) throw new AppError("Failed to create invite", 500);
  const invite = mapInvite(data as InviteRow);

  if (email) {
    await sendClubInviteEmail(email, club.name as string, invite.link);
  }

  return invite;
}

export async function listInvites(clubId: string): Promise<ClubInvite[]> {
  await assertClubExists(clubId);

  const { data, error } = await supabase
    .from("club_invites")
    .select(INVITE_COLUMNS)
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) throw new AppError("Failed to load invites", 500);
  return ((data ?? []) as InviteRow[]).filter(isUsable).map(mapInvite);
}

export async function revokeInvite(clubId: string, inviteId: string): Promise<void> {
  const { data, error } = await supabase
    .from("club_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("club_id", clubId)
    .select("id");

  if (error) throw new AppError("Failed to revoke invite", 500);
  if (!data || data.length === 0) throw new AppError("Invite not found", 404);
}

async function loadUsableInvite(token: string): Promise<InviteRow> {
  const { data } = await supabase
    .from("club_invites")
    .select(INVITE_COLUMNS)
    .eq("token", token)
    .maybeSingle();

  if (!data) throw new AppError("This invite link is not valid", 404);
  if (!isUsable(data as InviteRow)) {
    throw new AppError("This invite has expired or was revoked", 410);
  }
  return data as InviteRow;
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.from("users").select("email").eq("id", userId).single();
  return (data?.email as string | undefined)?.toLowerCase() ?? null;
}

export async function previewInvite(token: string, userId: string): Promise<InvitePreview> {
  const invite = await loadUsableInvite(token);

  const [{ data: club }, memberOf] = await Promise.all([
    supabase
      .from("clubs")
      .select("id, name, image_url, club_members(count)")
      .eq("id", invite.club_id)
      .single(),
    getMembershipSet(userId),
  ]);

  if (!club) throw new AppError("Club not found", 404);

  return {
    clubId: club.id as string,
    clubName: club.name as string,
    clubImageUrl: club.image_url as string | null,
    memberCount: (club.club_members as { count: number }[])[0]?.count ?? 0,
    email: invite.email,
    alreadyMember: memberOf.has(invite.club_id),
  };
}

export async function acceptInvite(token: string, userId: string): Promise<{ clubId: string }> {
  const invite = await loadUsableInvite(token);

  if (invite.email && invite.email !== (await getUserEmail(userId))) {
    throw new AppError("This invite was sent to a different email address", 403);
  }

  // Already in the club — nothing to consume, just send them there.
  const memberOf = await getMembershipSet(userId);
  if (memberOf.has(invite.club_id)) return { clubId: invite.club_id };

  // Optimistic claim: only succeeds if nobody else used the invite since we
  // loaded it, so a single-use invite can't be accepted twice concurrently.
  const { data: claimed } = await supabase
    .from("club_invites")
    .update({ uses: invite.uses + 1 })
    .eq("id", invite.id)
    .eq("uses", invite.uses)
    .select("id");

  if (!claimed || claimed.length === 0) {
    throw new AppError("This invite was just used — please try again", 409);
  }

  const { error } = await supabase
    .from("club_members")
    .upsert({ club_id: invite.club_id, user_id: userId }, { onConflict: "club_id,user_id" });

  if (error) throw new AppError("Failed to join club", 500);
  return { clubId: invite.club_id };
}
