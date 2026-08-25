import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return next(new AppError("Invalid or expired token", 401));
  }

  req.userId = data.user.id;
  next();
}
