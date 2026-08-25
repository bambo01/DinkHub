import type { Request, Response } from "express";
import * as usersService from "../services/users.service.js";

export async function listUsers(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const users = await usersService.listUsers(search);
  res.status(200).json({ success: true, data: users });
}

export async function getUser(req: Request, res: Response) {
  const user = await usersService.getUserById(req.params.id as string);
  res.status(200).json({ success: true, data: user });
}
