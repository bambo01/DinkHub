import type { Request, Response } from "express";
import * as verifyService from "../services/verify.service.js";

export async function getByReference(req: Request, res: Response) {
  const result = await verifyService.getByReference(req.params.reference as string);
  res.status(200).json({ success: true, data: result });
}
