import type { Request, Response } from "express";
import * as loyaltyService from "../services/loyalty.service.js";

export async function getMyLoyalty(req: Request, res: Response) {
  const status = await loyaltyService.getLoyaltyStatus(req.userId!);
  res.status(200).json({ success: true, data: status });
}

export async function redeem(req: Request, res: Response) {
  const reward = await loyaltyService.redeemStickers(req.userId!);
  res.status(201).json({ success: true, data: reward });
}
