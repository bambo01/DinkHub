import type { Request, Response } from "express";
import * as openPlayService from "../services/open-play.service.js";
import * as openPlayBookingsService from "../services/open-play-bookings.service.js";
import {
  createActivitySchema,
  updateActivitySchema,
} from "../validators/open-play.validator.js";
import { joinActivitySchema } from "../validators/open-play-bookings.validator.js";
import { AppError } from "../utils/app-error.js";

export async function listActivities(req: Request, res: Response) {
  const filters: { status?: openPlayService.ActivityStatus; date?: string } = {};
  if (typeof req.query.status === "string") {
    filters.status = req.query.status as openPlayService.ActivityStatus;
  }
  if (typeof req.query.date === "string") {
    filters.date = req.query.date;
  }

  const activities = await openPlayService.listActivities(filters);
  res.status(200).json({ success: true, data: activities });
}

export async function getActivity(req: Request, res: Response) {
  const activity = await openPlayService.getActivityById(req.params.id as string);
  res.status(200).json({ success: true, data: activity });
}

export async function createActivity(req: Request, res: Response) {
  const input = createActivitySchema.parse(req.body);
  const activity = await openPlayService.createActivity(input);
  res.status(201).json({ success: true, data: activity });
}

export async function updateActivity(req: Request, res: Response) {
  const input = updateActivitySchema.parse(req.body);
  const activity = await openPlayService.updateActivity(req.params.id as string, input);
  res.status(200).json({ success: true, data: activity });
}

export async function deleteActivity(req: Request, res: Response) {
  await openPlayService.deleteActivity(req.params.id as string);
  res.status(200).json({ success: true, data: null });
}

export async function updateActivityImage(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("No image file provided", 422);
  }
  const activity = await openPlayService.updateActivityImage(req.params.id as string, req.file);
  res.status(200).json({ success: true, data: activity });
}

export async function getParticipants(req: Request, res: Response) {
  const participants = await openPlayBookingsService.listConfirmedParticipants(
    req.params.id as string,
  );
  res.status(200).json({ success: true, data: participants });
}

export async function joinActivity(req: Request, res: Response) {
  const input = joinActivitySchema.parse(req.body);
  const booking = await openPlayBookingsService.joinActivity(
    req.userId!,
    req.params.id as string,
    input.guestNames,
  );
  res.status(201).json({ success: true, data: booking });
}

export async function getMyBooking(req: Request, res: Response) {
  const booking = await openPlayBookingsService.getMyBookingForActivity(
    req.userId!,
    req.params.id as string,
  );
  res.status(200).json({ success: true, data: booking });
}

export async function listMyOpenPlayBookings(req: Request, res: Response) {
  const bookings = await openPlayBookingsService.listBookingsForUser(req.userId!);
  res.status(200).json({ success: true, data: bookings });
}

export async function getOpenPlayBooking(req: Request, res: Response) {
  const booking = await openPlayBookingsService.getCustomerBookingById(
    req.userId!,
    req.params.id as string,
  );
  res.status(200).json({ success: true, data: booking });
}

export async function listActivityBookings(req: Request, res: Response) {
  const bookings = await openPlayBookingsService.listBookingsForActivity(
    req.params.id as string,
  );
  res.status(200).json({ success: true, data: bookings });
}
