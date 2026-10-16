export type PostKind = "FEED" | "ANNOUNCEMENT";
export type SessionStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type SessionResponse = "IN" | "OUT";
export type ClubVisibility = "PUBLIC" | "PRIVATE";

export interface Club {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  visibility: ClubVisibility;
  memberCount: number;
  postCount: number;
  sessionCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface ClubAuthor {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ClubPost {
  id: string;
  kind: PostKind;
  body: string;
  pinned: boolean;
  imageUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
  author: ClubAuthor;
}

export interface ClubSession {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  playDate: string;
  startHour: number;
  endHour: number;
  maxPlayers: number | null;
  status: SessionStatus;
  inCount: number;
  attendees: { id: string; fullName: string | null }[];
  myResponse: SessionResponse | null;
}

export interface ClubMessage {
  id: number;
  body: string;
  createdAt: string;
  author: ClubAuthor;
}

export interface ClubInvite {
  id: string;
  token: string;
  link: string;
  email: string | null;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface InvitePreview {
  clubId: string;
  clubName: string;
  clubImageUrl: string | null;
  memberCount: number;
  email: string | null;
  alreadyMember: boolean;
}

export interface PostComment {
  id: string;
  body: string;
  createdAt: string;
  author: ClubAuthor;
}
