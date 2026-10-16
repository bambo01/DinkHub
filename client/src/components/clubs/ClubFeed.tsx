"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  FiHeart,
  FiImage,
  FiMapPin,
  FiMoreHorizontal,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { Avatar, authorName } from "@/components/clubs/Avatar";
import { PostComments } from "@/components/clubs/PostComments";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ClubPost, PostKind } from "@/types/club";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Dark, Instagram-style feed: composer on top, then posts as cards with the
// photo on the left and author/caption/likes on the right (stacked on mobile).
export function ClubFeed({
  clubId,
  onPostCountChange,
}: {
  clubId: string;
  onPostCountChange?: (delta: number) => void;
}) {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<PostKind>("FEED");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<ClubPost[]>(`/clubs/${clubId}/posts`, accessToken)
      .then(setPosts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load posts"))
      .finally(() => setIsLoading(false));
  }, [clubId, accessToken]);

  // Revoke the object URL when the preview is replaced or the component goes
  // away, so picked photos don't leak memory.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFilePicked(picked: File | undefined) {
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5MB or smaller");
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
  }

  const canPost = (body.trim().length > 0 || file !== null) && !isPosting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPost) return;

    setIsPosting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("body", body);
      form.append("kind", kind);
      if (file) form.append("image", file);

      const post = await apiFetch<ClubPost>(`/clubs/${clubId}/posts`, accessToken, {
        method: "POST",
        body: form,
      });
      // Pinned posts stay on top; a fresh post goes right below them.
      setPosts((current) => [
        ...current.filter((p) => p.pinned),
        post,
        ...current.filter((p) => !p.pinned),
      ]);
      onPostCountChange?.(1);
      setBody("");
      setKind("FEED");
      clearFile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleDelete(postId: string) {
    setMenuPostId(null);
    try {
      await apiFetch(`/clubs/${clubId}/posts/${postId}`, accessToken, { method: "DELETE" });
      setPosts((current) => current.filter((p) => p.id !== postId));
      onPostCountChange?.(-1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete post");
    }
  }

  async function handlePin(post: ClubPost) {
    setMenuPostId(null);
    try {
      await apiFetch(`/clubs/${clubId}/posts/${post.id}/pin`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !post.pinned }),
      });
      setPosts((current) =>
        current
          .map((p) => (p.id === post.id ? { ...p, pinned: !p.pinned } : p))
          .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update post");
    }
  }

  async function handleLike(post: ClubPost) {
    const liked = !post.likedByMe;
    // Optimistic — the heart should respond instantly; roll back on failure.
    const apply = (likedByMe: boolean, likeCount: number) =>
      setPosts((current) =>
        current.map((p) => (p.id === post.id ? { ...p, likedByMe, likeCount } : p)),
      );
    apply(liked, post.likeCount + (liked ? 1 : -1));

    try {
      const result = await apiFetch<{ likeCount: number; likedByMe: boolean }>(
        `/clubs/${clubId}/posts/${post.id}/like`,
        accessToken,
        { method: "PUT", body: JSON.stringify({ liked }) },
      );
      apply(result.likedByMe, result.likeCount);
    } catch {
      apply(post.likedByMe, post.likeCount);
    }
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const me = {
    id: user?.id ?? "",
    fullName: user?.fullName ?? null,
    avatarUrl: user?.avatarUrl ?? null,
  };

  return (
    <div>
      {/* Composer */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <Avatar author={me} />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={body || file ? 3 : 1}
            placeholder={`What's on your mind, ${firstName}?`}
            className="min-h-10 flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-2 text-sm text-secondary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {preview && (
          <div className="relative mt-3">
            {/* Local blob preview — next/image can't optimize an object URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected photo"
              className="max-h-80 w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove photo"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <FiImage className="h-5 w-5 text-green-500" />
              Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleFilePicked(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => setKind((k) => (k === "FEED" ? "ANNOUNCEMENT" : "FEED"))}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                kind === "ANNOUNCEMENT"
                  ? "bg-primary/20 text-secondary"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              📣 Announcement
            </button>
          </div>

          <button
            type="submit"
            disabled={!canPost}
            className="rounded-md bg-primary px-5 py-1.5 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-40"
          >
            {isPosting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="mt-6 text-sm text-gray-500">Loading feed…</p>}
      {!isLoading && posts.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          No posts yet — share the first photo.
        </p>
      )}

      {/* Posts */}
      <ul className="mt-5 space-y-5">
        {posts.map((post) => {
          const canDelete = isAdmin || post.author.id === user?.id;
          const hasMenu = isAdmin || canDelete;
          const isAnnouncement = post.kind === "ANNOUNCEMENT";

          return (
            <li
              key={post.id}
              className={cn(
                "overflow-hidden rounded-xl border border-gray-200 bg-white",
                post.imageUrl && "md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
              )}
            >
              {post.imageUrl && (
                // Uploaded images are served from Supabase Storage's public
                // bucket — a plain <img> avoids needing that domain
                // allow-listed for next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full max-h-160 w-full bg-black object-cover"
                />
              )}

              <div className="flex min-h-0 flex-col md:max-h-160">
                <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                  <Avatar author={post.author} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-secondary">
                      {authorName(post.author)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      {timeAgo(post.createdAt)}
                      {post.pinned && (
                        <>
                          · <FiMapPin className="h-3 w-3" /> Pinned
                        </>
                      )}
                    </p>
                  </div>
                  {hasMenu && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                        aria-label="Post options"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                      >
                        <FiMoreHorizontal className="h-5 w-5" />
                      </button>
                      {menuPostId === post.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handlePin(post)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary hover:bg-gray-50"
                            >
                              <FiMapPin className="h-4 w-4" />
                              {post.pinned ? "Unpin post" : "Pin post"}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(post.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                            >
                              <FiTrash2 className="h-4 w-4" />
                              Delete post
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <PostComments
                  clubId={clubId}
                  postId={post.id}
                  initialCount={post.commentCount}
                  onCountChange={(delta) =>
                    setPosts((current) =>
                      current.map((p) =>
                        p.id === post.id ? { ...p, commentCount: p.commentCount + delta } : p,
                      ),
                    )
                  }
                  caption={
                    <>
                  {isAnnouncement && (
                    <span className="mb-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-secondary">
                      📣 Announcement
                    </span>
                  )}
                  {post.body && (
                    <p className="whitespace-pre-wrap wrap-break-word text-sm text-gray-700">
                      <span className="mr-1.5 font-semibold text-secondary">
                        {authorName(post.author)}
                      </span>
                      {post.body}
                    </p>
                  )}
                    </>
                  }
                  actions={
                <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleLike(post)}
                    aria-label={post.likedByMe ? "Unlike" : "Like"}
                    aria-pressed={post.likedByMe}
                    className="transition-transform active:scale-90"
                  >
                    <FiHeart
                      className={cn(
                        "h-6 w-6",
                        post.likedByMe ? "fill-red-500 text-red-500" : "text-secondary",
                      )}
                    />
                  </button>
                  <span className="text-sm font-semibold text-secondary">
                    {post.likeCount} like{post.likeCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
                  </span>
                </div>
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
