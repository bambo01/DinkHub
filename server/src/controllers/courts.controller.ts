import type { Request, Response } from "express";
import * as courtsService from "../services/courts.service.js";
import * as bookingsService from "../services/bookings.service.js";
import { AppError } from "../utils/app-error.js";
import {
  createBlockedSlotSchema,
  createCourtSchema,
  updateCourtSchema,
} from "../validators/courts.validator.js";

export async function listCourts(_req: Request, res: Response) {
  const courts = await courtsService.listCourts();
  res.status(200).json({ success: true, data: courts });
}

export async function getCourt(req: Request, res: Response) {
  const court = await courtsService.getCourtById(req.params.id as string);
  res.status(200).json({ success: true, data: court });
}

export async function createCourt(req: Request, res: Response) {
  const input = createCourtSchema.parse(req.body);
  const court = await courtsService.createCourt(input);
  res.status(201).json({ success: true, data: court });
}

export async function updateCourt(req: Request, res: Response) {
  const input = updateCourtSchema.parse(req.body);
  const court = await courtsService.updateCourt(req.params.id as string, input);
  res.status(200).json({ success: true, data: court });
}

export async function deleteCourt(req: Request, res: Response) {
  await courtsService.deleteCourt(req.params.id as string);
  res.status(200).json({ success: true, data: null });
}

export async function updateCourtImage(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("No image file provided", 422);
  }
  const court = await courtsService.updateCourtImage(req.params.id as string, req.file);
  res.status(200).json({ success: true, data: court });
}

export async function listBlockedSlots(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const slots = await courtsService.listBlockedSlots(req.params.id as string, date);
  res.status(200).json({ success: true, data: slots });
}

export async function listBookedHours(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  if (!date) {
    throw new AppError("date query parameter is required", 422);
  }
  const ranges = await bookingsService.getBookedRanges(req.params.id as string, date);
  res.status(200).json({ success: true, data: ranges });
}

export async function createBlockedSlot(req: Request, res: Response) {
  const input = createBlockedSlotSchema.parse(req.body);
  const slot = await courtsService.createBlockedSlot(req.params.id as string, input);
  res.status(201).json({ success: true, data: slot });
}

export async function deleteBlockedSlot(req: Request, res: Response) {
  await courtsService.deleteBlockedSlot(req.params.id as string, req.params.slotId as string);
  res.status(200).json({ success: true, data: null });
}
