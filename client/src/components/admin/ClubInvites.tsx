"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCopy, FiLink, FiMail, FiX } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { ClubInvite } from "@/types/club";

const inputClass =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ClubInvites({ clubId }: { clubId: string }) {
  const { accessToken } = useAuth();
  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<ClubInvite[]>(`/clubs/${clubId}/invites`, accessToken)
      .then(setInvites)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load invites"));
  }, [clubId, accessToken]);

  async function createInvite(inviteEmail?: string) {
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const invite = await apiFetch<ClubInvite>(`/clubs/${clubId}/invites`, accessToken, {
        method: "POST",
        body: JSON.stringify(inviteEmail ? { email: inviteEmail } : {}),
      });
      setInvites((current) => [invite, ...current]);

      if (inviteEmail) {
        setNotice(`Invitation emailed to ${inviteEmail}.`);
        setEmail("");
      } else {
        await copyLink(invite.link);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create invite");
    } finally {
      setIsBusy(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Invite link copied to clipboard.");
    } catch {
      // Clipboard can be blocked (insecure origin / permissions) — the link
      // is still visible in the list below to copy by hand.
      setNotice("Couldn't copy automatically — copy the link from the list below.");
    }
  }

  async function revoke(invite: ClubInvite) {
    try {
      await apiFetch(`/clubs/${clubId}/invites/${invite.id}`, accessToken, { method: "DELETE" });
      setInvites((current) => current.filter((i) => i.id !== invite.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke invite");
    }
  }

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (email.trim()) createInvite(email.trim());
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-secondary">Invitations</h2>
      <p className="mt-1 text-sm text-gray-600">
        This club is private. People can only join with an invitation.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}

      <div className="mt-4 space-y-4">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => createInvite()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
        >
          <FiLink className="h-4 w-4" />
          Generate invite link
        </button>

        <form onSubmit={handleEmailSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Invite by email"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isBusy || !email.trim()}
            className="flex flex-none items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary/10 disabled:opacity-50"
          >
            <FiMail className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>

      {invites.length > 0 && (
        <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-secondary">
                  {invite.email ?? "Shareable link"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {invite.link}
                </p>
                <p className="text-xs text-gray-400">
                  Used {invite.uses}
                  {invite.maxUses !== null ? `/${invite.maxUses}` : ""}
                  {invite.expiresAt &&
                    ` · expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyLink(invite.link)}
                aria-label="Copy invite link"
                className="text-gray-400 hover:text-secondary"
              >
                <FiCopy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => revoke(invite)}
                aria-label="Revoke invite"
                className="text-gray-400 hover:text-red-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
