"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import { cn } from "@/lib/utils";
import type { ClubSession, SessionResponse, SessionStatus } from "@/types/club";

const inputClass =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

const statusStyles: Record<SessionStatus, string> = {
  OPEN: "bg-primary/15 text-secondary",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

interface SessionForm {
  title: string;
  description: string;
  location: string;
  playDate: string;
  startHour: string;
  endHour: string;
  maxPlayers: string;
}

const emptyForm: SessionForm = {
  title: "",
  description: "",
  location: "",
  playDate: "",
  startHour: "18",
  endHour: "20",
  maxPlayers: "",
};

export function ClubSchedule({ clubId }: { clubId: string }) {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<ClubSession[]>(`/clubs/${clubId}/sessions`, accessToken)
      .then(setSessions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load schedule"))
      .finally(() => setIsLoading(false));
  }, [clubId, accessToken]);

  function replaceSession(next: ClubSession) {
    setSessions((current) => current.map((s) => (s.id === next.id ? next : s)));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const created = await apiFetch<ClubSession>(`/clubs/${clubId}/sessions`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          location: form.location || undefined,
          playDate: form.playDate,
          startHour: Number(form.startHour),
          endHour: Number(form.endHour),
          maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : undefined,
        }),
      });
      setSessions((current) =>
        [...current, created].sort(
          (a, b) => a.playDate.localeCompare(b.playDate) || a.startHour - b.startHour,
        ),
      );
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create session");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRespond(session: ClubSession, response: SessionResponse) {
    setError(null);
    try {
      replaceSession(
        await apiFetch<ClubSession>(
          `/clubs/${clubId}/sessions/${session.id}/response`,
          accessToken,
          { method: "PUT", body: JSON.stringify({ response }) },
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save your response");
    }
  }

  async function handleStatus(session: ClubSession, status: SessionStatus) {
    setError(null);
    try {
      replaceSession(
        await apiFetch<ClubSession>(`/clubs/${clubId}/sessions/${session.id}`, accessToken, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update session");
    }
  }

  async function handleDelete(sessionId: string) {
    if (!window.confirm("Delete this session?")) return;
    try {
      await apiFetch(`/clubs/${clubId}/sessions/${sessionId}`, accessToken, { method: "DELETE" });
      setSessions((current) => current.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete session");
    }
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-6">
          {!showForm ? (
            <Button type="button" onClick={() => setShowForm(true)}>
              <FiPlus className="mr-1.5 h-4 w-4" />
              Schedule a Play
            </Button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title (e.g. Saturday Morning Doubles)"
                className={inputClass}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details (optional)"
                rows={2}
                className={inputClass}
              />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location / court (optional)"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <input
                  required
                  type="date"
                  value={form.playDate}
                  onChange={(e) => setForm({ ...form, playDate: e.target.value })}
                  className={inputClass}
                />
                <select
                  value={form.startHour}
                  onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                  className={inputClass}
                  aria-label="Start time"
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </select>
                <select
                  value={form.endHour}
                  onChange={(e) => setForm({ ...form, endHour: e.target.value })}
                  className={inputClass}
                  aria-label="End time"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={form.maxPlayers}
                  onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                  placeholder="Max players"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Open Sign-ups"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-gray-500">Loading schedule…</p>}
      {!isLoading && sessions.length === 0 && (
        <p className="text-sm text-gray-500">No plays scheduled yet.</p>
      )}

      <ul className="space-y-4">
        {sessions.map((session) => {
          const dateLabel = new Date(`${session.playDate}T00:00:00`).toLocaleDateString(
            undefined,
            { weekday: "short", month: "short", day: "numeric" },
          );
          const isOpen = session.status === "OPEN";
          const isFull = session.maxPlayers !== null && session.inCount >= session.maxPlayers;

          return (
            <li key={session.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-secondary">{session.title}</h3>
                  {session.description && (
                    <p className="mt-1 text-sm text-gray-600">{session.description}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusStyles[session.status],
                  )}
                >
                  {session.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p className="flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5" /> {dateLabel}
                </p>
                <p className="flex items-center gap-1.5">
                  <FiClock className="h-3.5 w-3.5" />
                  {formatHour(session.startHour)} – {formatHour(session.endHour)}
                </p>
                {session.location && (
                  <p className="flex items-center gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5" /> {session.location}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-secondary">
                  {session.inCount}
                  {session.maxPlayers !== null && `/${session.maxPlayers}`} in
                </p>
                {session.attendees.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {session.attendees.map((a) => a.fullName ?? "Member").join(", ")}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isOpen && (
                  <>
                    <Button
                      type="button"
                      variant={session.myResponse === "IN" ? "primary" : "outline"}
                      disabled={isFull && session.myResponse !== "IN"}
                      onClick={() => handleRespond(session, "IN")}
                    >
                      {isFull && session.myResponse !== "IN" ? "Full" : "I'm in"}
                    </Button>
                    <Button
                      type="button"
                      variant={session.myResponse === "OUT" ? "secondary" : "outline"}
                      onClick={() => handleRespond(session, "OUT")}
                    >
                      Can&apos;t make it
                    </Button>
                  </>
                )}

                {isAdmin && (
                  <div className="ml-auto flex items-center gap-3 text-xs font-medium">
                    {session.status === "OPEN" ? (
                      <button
                        type="button"
                        onClick={() => handleStatus(session, "CLOSED")}
                        className="text-gray-500 hover:text-secondary"
                      >
                        Close sign-ups
                      </button>
                    ) : session.status === "CLOSED" ? (
                      <button
                        type="button"
                        onClick={() => handleStatus(session, "OPEN")}
                        className="text-gray-500 hover:text-secondary"
                      >
                        Reopen
                      </button>
                    ) : null}
                    {session.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => handleStatus(session, "CANCELLED")}
                        className="text-gray-500 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id)}
                      aria-label="Delete session"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
