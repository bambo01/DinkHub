import type { Request, Response } from "express";
import QRCode from "qrcode";
import { env } from "../config/env.js";
import * as verifyService from "../services/verify.service.js";

export async function getByReference(req: Request, res: Response) {
  const result = await verifyService.getByReference(req.params.reference as string);
  res.status(200).json({ success: true, data: result });
}

// Hosted QR image for the confirmation emails — Brevo's API has no
// cid/inline-attachment support, so the QR has to be an <img src> pointing
// at a real URL rather than an email attachment.
export async function getQrCode(req: Request, res: Response) {
  const verifyUrl = `${env.FRONTEND_URL}/verify/${req.params.reference}`;
  const png = await QRCode.toBuffer(verifyUrl, { width: 240, margin: 1 });
  res.type("image/png").send(png);
}
