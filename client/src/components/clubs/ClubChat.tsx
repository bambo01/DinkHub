"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { Avatar, authorName } from "@/components/clubs/Avatar";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ClubMessage } from "@/types/club";

const POLL_INTERVAL_MS = 4000;

export function ClubChat({ clubId }: { clubId: string }) {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  // The poll loop reads the latest id through a ref so the interval doesn't
  // need to be torn down and recreated on every incoming message.
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  function appendMessages(incoming: ClubMessage[]) {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length === 0 ? current : [...current, ...fresh];
    });
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
  }

  // Initial history load, then incremental polling for anything newer than
  // the last message seen. Polling pauses while the tab is hidden.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    apiFetch<ClubMessage[]>(`/clubs/${clubId}/messages`, accessToken)
      .then((history) => {
        if (!cancelled) appendMessages(history);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load chat");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const timer = setInterval(() => {
      if (document.hidden) return;
      apiFetch<ClubMessage[]>(
        `/clubs/${clubId}/messages?after=${lastIdRef.current}`,
        accessToken,
      )
        .then((incoming) => {
          if (!cancelled) appendMessages(incoming);
        })
        .catch(() => {
          // A missed poll just means the next one catches up.
        });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [clubId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const sent = await apiFetch<ClubMessage>(`/clubs/${clubId}/messages`, accessToken, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      appendMessages([sent]);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-gray-500">Loading chat…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-gray-500">No messages yet — say hi 👋</p>
        )}

        {messages.map((message) => {
          const isMine = message.author.id === user?.id;
          return (
            <div key={message.id} className={cn("flex gap-2", isMine && "flex-row-reverse")}>
              <Avatar author={message.author} />
              <div className={cn("max-w-[75%]", isMine && "text-right")}>
                <p className="text-xs text-gray-400">
                  {!isMine && `${authorName(message.author)} · `}
                  {new Date(message.createdAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p
                  className={cn(
                    "mt-0.5 inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-sm",
                    isMine ? "bg-primary text-secondary" : "bg-gray-100 text-gray-800",
                  )}
                >
                  {message.body}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          aria-label="Send message"
          className="flex items-center justify-center rounded-md bg-primary px-4 text-secondary hover:opacity-90 disabled:opacity-50"
        >
          <FiSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
