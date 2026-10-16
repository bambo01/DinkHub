import type { Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import * as clubsService from "../services/clubs.service.js";
import * as invitesService from "../services/club-invites.service.js";
import {
  createClubSchema,
  createCommentSchema,
  createInviteSchema,
  createPostSchema,
  createSessionSchema,
  respondSchema,
  sendMessageSchema,
  updateClubSchema,
  updateSessionStatusSchema,
  uuidParam,
} from "../validators/clubs.validator.js";

function param(req: Request, name: string): string {
  return uuidParam.parse(req.params[name]);
}

export async function listClubs(req: Request, res: Response) {
  const clubs = await clubsService.listClubs(req.userId!);
  res.status(200).json({ success: true, data: clubs });
}

export async function getClub(req: Request, res: Response) {
  const club = await clubsService.getClub(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: club });
}

export async function createClub(req: Request, res: Response) {
  const input = createClubSchema.parse(req.body);
  const club = await clubsService.createClub(req.userId!, input);
  res.status(201).json({ success: true, data: club });
}

export async function updateClub(req: Request, res: Response) {
  const input = updateClubSchema.parse(req.body);
  const club = await clubsService.updateClub(param(req, "id"), req.userId!, input);
  res.status(200).json({ success: true, data: club });
}

export async function deleteClub(req: Request, res: Response) {
  await clubsService.deleteClub(param(req, "id"));
  res.status(200).json({ success: true, data: null });
}

export async function joinClub(req: Request, res: Response) {
  await clubsService.joinClub(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: null });
}

export async function leaveClub(req: Request, res: Response) {
  await clubsService.leaveClub(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: null });
}

export async function listPosts(req: Request, res: Response) {
  const posts = await clubsService.listPosts(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: posts });
}

export async function createPost(req: Request, res: Response) {
  const input = createPostSchema.parse(req.body);
  const post = await clubsService.createPost(
    param(req, "id"),
    req.userId!,
    input,
    req.file,
  );
  res.status(201).json({ success: true, data: post });
}

export async function deletePost(req: Request, res: Response) {
  await clubsService.deletePost(param(req, "id"), param(req, "postId"), req.userId!);
  res.status(200).json({ success: true, data: null });
}

export async function pinPost(req: Request, res: Response) {
  const pinned = req.body?.pinned !== false;
  await clubsService.setPostPinned(param(req, "id"), param(req, "postId"), pinned);
  res.status(200).json({ success: true, data: null });
}

export async function listSessions(req: Request, res: Response) {
  const sessions = await clubsService.listSessions(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: sessions });
}

export async function createSession(req: Request, res: Response) {
  const input = createSessionSchema.parse(req.body);
  const session = await clubsService.createSession(param(req, "id"), req.userId!, input);
  res.status(201).json({ success: true, data: session });
}

export async function updateSessionStatus(req: Request, res: Response) {
  const input = updateSessionStatusSchema.parse(req.body);
  const session = await clubsService.updateSessionStatus(
    param(req, "id"),
    param(req, "sessionId"),
    req.userId!,
    input.status,
  );
  res.status(200).json({ success: true, data: session });
}

export async function deleteSession(req: Request, res: Response) {
  await clubsService.deleteSession(param(req, "id"), param(req, "sessionId"));
  res.status(200).json({ success: true, data: null });
}

export async function respondToSession(req: Request, res: Response) {
  const input = respondSchema.parse(req.body);
  const session = await clubsService.respondToSession(
    param(req, "id"),
    param(req, "sessionId"),
    req.userId!,
    input.response,
  );
  res.status(200).json({ success: true, data: session });
}

export async function listMessages(req: Request, res: Response) {
  const after = Number(req.query.after);
  const messages = await clubsService.listMessages(
    param(req, "id"),
    req.userId!,
    Number.isInteger(after) && after >= 0 ? after : undefined,
  );
  res.status(200).json({ success: true, data: messages });
}

export async function sendMessage(req: Request, res: Response) {
  const input = sendMessageSchema.parse(req.body);
  const message = await clubsService.sendMessage(param(req, "id"), req.userId!, input.body);
  res.status(201).json({ success: true, data: message });
}

export async function likePost(req: Request, res: Response) {
  const result = await clubsService.setPostLiked(
    param(req, "id"),
    param(req, "postId"),
    req.userId!,
    req.body?.liked !== false,
  );
  res.status(200).json({ success: true, data: result });
}

export async function listMembers(req: Request, res: Response) {
  const members = await clubsService.listMembers(param(req, "id"), req.userId!);
  res.status(200).json({ success: true, data: members });
}

export async function updateClubImage(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("No image file provided", 422);
  }
  const club = await clubsService.updateClubImage(param(req, "id"), req.userId!, req.file);
  res.status(200).json({ success: true, data: club });
}

export async function createInvite(req: Request, res: Response) {
  const input = createInviteSchema.parse(req.body ?? {});
  const invite = await invitesService.createInvite(param(req, "id"), req.userId!, input.email);
  res.status(201).json({ success: true, data: invite });
}

export async function listInvites(req: Request, res: Response) {
  const invites = await invitesService.listInvites(param(req, "id"));
  res.status(200).json({ success: true, data: invites });
}

export async function revokeInvite(req: Request, res: Response) {
  await invitesService.revokeInvite(param(req, "id"), param(req, "inviteId"));
  res.status(200).json({ success: true, data: null });
}

// Invite tokens are random strings, not uuids, so these skip `param()`.
export async function previewInvite(req: Request, res: Response) {
  const preview = await invitesService.previewInvite(req.params.token as string, req.userId!);
  res.status(200).json({ success: true, data: preview });
}

export async function acceptInvite(req: Request, res: Response) {
  const result = await invitesService.acceptInvite(req.params.token as string, req.userId!);
  res.status(200).json({ success: true, data: result });
}

export async function listComments(req: Request, res: Response) {
  const comments = await clubsService.listComments(
    param(req, "id"),
    param(req, "postId"),
    req.userId!,
  );
  res.status(200).json({ success: true, data: comments });
}

export async function createComment(req: Request, res: Response) {
  const input = createCommentSchema.parse(req.body);
  const comment = await clubsService.createComment(
    param(req, "id"),
    param(req, "postId"),
    req.userId!,
    input.body,
  );
  res.status(201).json({ success: true, data: comment });
}

export async function deleteComment(req: Request, res: Response) {
  await clubsService.deleteComment(
    param(req, "id"),
    param(req, "postId"),
    param(req, "commentId"),
    req.userId!,
  );
  res.status(200).json({ success: true, data: null });
}
