import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  if (statusCode === 500) {
    console.error(err);
  }

  const message =
    statusCode === 500 && env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
}
