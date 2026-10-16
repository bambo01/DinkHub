"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { Avatar, authorName } from "@/components/clubs/Avatar";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { PostComment } from "@/types/club";

interface PostCommentsProps {
  clubId: string;
  postId: string;
  initialCount: number;
  // The caption sits at the top of the scroll area, above the comments.
  caption: ReactNode;
  // The like row sits between the scroll area and the comment box.
  actions: ReactNode;
  onCountChange: (delta: number) => void;
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function PostComments({
  clubId,
  postId,
  initialCount,
  caption,
  actions,
  onCountChange,
}: PostCommentsProps) {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only posts that already have comments cost a request — the rest start
  // empty, so a long feed doesn't fire one fetch per post.
  useEffect(() => {
    if (!accessToken || initialCount === 0) return;

    apiFetch<PostComment[]>(`/clubs/${clubId}/posts/${postId}/comments`, accessToken)
      .then(setComments)
      .catch(() => setError("Couldn't load comments"));
    // initialCount is intentionally read once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, postId, accessToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const comment = await apiFetch<PostComment>(
        `/clubs/${clubId}/posts/${postId}/comments`,
        accessToken,
        { method: "POST", body: JSON.stringify({ body }) },
      );
      setComments((current) => [...current, comment]);
      onCountChange(1);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post comment");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await apiFetch(`/clubs/${clubId}/posts/${postId}/comments/${commentId}`, accessToken, {
        method: "DELETE",
      });
      setComments((current) => current.filter((c) => c.id !== commentId));
      onCountChange(-1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete comment");
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {caption}

        {comments.length > 0 && (
          <ul className="mt-4 space-y-3">
            {comments.map((comment) => {
              const canDelete = isAdmin || comment.author.id === user?.id;
              return (
                <li key={comment.id} className="group flex items-start gap-2">
                  <Avatar author={comment.author} />
                  <div className="min-w-0 flex-1 text-sm text-gray-700">
                    <p className="whitespace-pre-wrap wrap-break-word">
                      <span className="mr-1.5 font-semibold text-secondary">
                        {authorName(comment.author)}
                      </span>
                      {comment.body}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{timeAgo(comment.createdAt)}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      aria-label="Delete comment"
                      className="mt-1 text-gray-300 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {actions}

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="text-sm font-semibold text-secondary disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </>
  );
}
