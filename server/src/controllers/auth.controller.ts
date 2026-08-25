import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

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
