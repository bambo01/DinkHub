import type { Request, Response } from "express";
import * as bookingsService from "../services/bookings.service.js";
import { createBookingSchema } from "../validators/bookings.validator.js";

export async function createBooking(req: Request, res: Response) {
  const input = createBookingSchema.parse(req.body);
  const booking = await bookingsService.createBooking(req.userId!, input);
  res.status(201).json({ success: true, data: booking });
}

export async function listBookings(req: Request, res: Response) {
  const filters: { status?: bookingsService.BookingStatus; date?: string } = {};
  if (typeof req.query.status === "string") {
    filters.status = req.query.status as bookingsService.BookingStatus;
  }
  if (typeof req.query.date === "string") {
    filters.date = req.query.date;
  }

  const bookings = await bookingsService.listBookings(filters);
  res.status(200).json({ success: true, data: bookings });
}

export async function listMyBookings(req: Request, res: Response) {
  const bookings = await bookingsService.listBookingsForUser(req.userId!);
  res.status(200).json({ success: true, data: bookings });
}

export async function getBooking(req: Request, res: Response) {
  const booking = await bookingsService.getCustomerBookingById(
    req.userId!,
    req.params.id as string,
  );
  res.status(200).json({ success: true, data: booking });
}
