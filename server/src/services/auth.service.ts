import { createAuthClient, supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator.js";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

async function loadProfile(userId: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new AppError("User profile not found", 404);
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    role: data.role,
  };
}

export async function login({ email, password }: LoginInput) {
  const { data, error } = await createAuthClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = await loadProfile(data.user.id);

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    user,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  return loadProfile(userId);
}

export async function register({ email, password, fullName }: RegisterInput) {
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    const message = createError?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("exists")) {
      throw new AppError("An account with this email already exists", 409);
    }
    throw new AppError(createError?.message ?? "Registration failed", 400);
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role: "CUSTOMER",
  });

  if (insertError) {
    // Log the underlying Postgres error — the AppError below only carries a
    // generic message to the client, so this is the only place the real
    // cause (missing table, constraint violation, etc.) is visible.
    console.error("Failed to insert user profile during registration:", insertError);
    // Roll back the auth user so a failed registration doesn't leave an
    // orphaned auth account with no profile row.
    await supabase.auth.admin.deleteUser(created.user.id);
    throw new AppError("Failed to create user profile", 500);
  }

  return login({ email, password });
}

export async function updateAvatar(
  userId: string,
  file: Express.Multer.File,
): Promise<AuthUser> {
  // Fixed path per user (no extension) — every upload overwrites the same
  // storage object instead of accumulating orphaned files from previous
  // uploads in a different format. Supabase Storage serves the correct
  // Content-Type from the upload metadata regardless of the missing
  // extension in the path.
  const path = `${userId}/avatar`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) {
    throw new AppError("Failed to upload avatar", 500);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the browser/CDN doesn't keep serving the previous image
  // from this same URL after a re-upload.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (updateError) {
    throw new AppError("Failed to save avatar", 500);
  }

  return loadProfile(userId);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const profile = await loadProfile(userId);

  // Verifying the current password by attempting a real sign-in (on a
  // disposable client — see createAuthClient's own comment) is the only way
  // to confirm it without ever storing/comparing raw passwords ourselves.
  const { error: verifyError } = await createAuthClient().auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new AppError("Current password is incorrect", 401);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    throw new AppError("Failed to update password", 500);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  // Always resolves the same way whether or not the email is registered —
  // the response must not reveal account existence.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.FRONTEND_URL}/reset-password`,
  });
}

export async function resetPassword(
  accessToken: string,
  newPassword: string,
): Promise<void> {
  // The token in the recovery email link is a real Supabase-issued access
  // token — validating it this way (rather than decoding it ourselves)
  // means Supabase's own expiry/signature checks are the source of truth.
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new AppError("This reset link is invalid or has expired", 401);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
    password: newPassword,
  });

  if (updateError) {
    throw new AppError("Failed to reset password", 500);
  }
}
