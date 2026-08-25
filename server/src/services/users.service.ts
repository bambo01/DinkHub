import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";
import type { UserRole } from "./auth.service.js";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
}

function mapUser(row: {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}): AdminUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function listUsers(search?: string): Promise<AdminUser[]> {
  let query = supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  // Strip characters that are structurally meaningful in a PostgREST `.or()`
  // filter string so a search term can't alter the filter shape.
  const sanitized = search?.replace(/[,()]/g, " ").trim();
  if (sanitized) {
    query = query.or(`email.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load users", 500);
  }

  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<AdminUser> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError("User not found", 404);
  }

  return mapUser(data);
}
