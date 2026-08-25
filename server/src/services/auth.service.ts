import { createAuthClient, supabase } from "../config/supabase.js";
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
  role: UserRole;
}

async function loadProfile(userId: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new AppError("User profile not found", 404);
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
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
