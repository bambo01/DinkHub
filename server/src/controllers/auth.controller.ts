import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { AppError } from "../utils/app-error.js";

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json({ success: true, data: result });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json({ success: true, data: result });
}

export async function getMe(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.userId!);
  res.status(200).json({ success: true, data: user });
}

export async function updateAvatar(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("No image file provided", 422);
  }
  const user = await authService.updateAvatar(req.userId!, req.file);
  res.status(200).json({ success: true, data: user });
}

export async function changePassword(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.userId!, input.currentPassword, input.newPassword);
  res.status(200).json({ success: true, data: null });
}

export async function forgotPassword(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(input.email);
  res.status(200).json({ success: true, data: null });
}

export async function resetPassword(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(input.accessToken, input.newPassword);
  res.status(200).json({ success: true, data: null });
}
