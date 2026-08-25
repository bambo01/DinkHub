import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    return next(new AppError("Authentication required", 401));
  }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", req.userId)
    .single();

  if (error || data?.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }

  next();
}
