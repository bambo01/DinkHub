"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { Club, ClubVisibility } from "@/types/club";

const inputClass =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default function AdminClubsPage() {
  const { accessToken } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("PUBLIC");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<Club[]>("/clubs", accessToken)
      .then(setClubs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load clubs"))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const club = await apiFetch<Club>("/clubs", accessToken, {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined, visibility }),
      });
      setClubs((current) => [club, ...current]);
      setName("");
      setDescription("");
      setVisibility("PUBLIC");
      setVisibility("PUBLIC");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create club");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(club: Club) {
    if (!window.confirm(`Delete "${club.name}"? Its posts, schedule and chat will be lost.`)) {
      return;
    }
    try {
      await apiFetch(`/clubs/${club.id}`, accessToken, { method: "DELETE" });
      setClubs((current) => current.filter((c) => c.id !== club.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete club");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Clubs</h1>
          <p className="mt-1 text-sm text-gray-600">
            {clubs.length} club{clubs.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90"
        >
          <FiPlus className="h-4 w-4" />
          Create Club
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Club name"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Description (optional)"
            className={inputClass}
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as ClubVisibility)}
            className={inputClass}
            aria-label="Visibility"
          >
            <option value="PUBLIC">Public — anyone can find and join</option>
            <option value="PRIVATE">Private — invite only</option>
          </select>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="p-6 text-sm text-gray-500">Loading clubs…</p>}
        {!isLoading && clubs.length === 0 && !error && (
          <p className="p-6 text-sm text-gray-500">
            No clubs yet. Create your first one to get started.
          </p>
        )}

        {clubs.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clubs/${club.id}`}
                      className="flex items-center gap-3 font-medium text-secondary hover:underline"
                    >
                      {club.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={club.imageUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold">
                          {club.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {club.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{club.memberCount}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(club.createdAt).toLocaleDateString()}
                  </td>
                  <td className="flex items-center justify-end gap-4 px-4 py-3 text-right">
                    <Link
                      href={`/admin/clubs/${club.id}`}
                      className="text-sm font-medium text-secondary hover:underline"
                    >
                      Manage
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(club)}
                      aria-label={`Delete ${club.name}`}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
