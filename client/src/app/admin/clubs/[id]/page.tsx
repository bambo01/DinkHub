"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiUsers } from "react-icons/fi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { ClubInvites } from "@/components/admin/ClubInvites";
import { ClubSchedule } from "@/components/clubs/ClubSchedule";
import type { Club, ClubVisibility } from "@/types/club";

const inputClass =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default function ManageClubPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("PUBLIC");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiFetch<Club>(`/clubs/${id}`, accessToken)
      .then((loaded) => {
        setClub(loaded);
        setName(loaded.name);
        setDescription(loaded.description ?? "");
        setVisibility(loaded.visibility);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load club"))
      .finally(() => setIsLoading(false));
  }, [id, accessToken]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<Club>(`/clubs/${id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ name, description, visibility }),
      });
      setClub(updated);
      setNotice("Club details saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save club");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImage(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller");
      return;
    }
    setIsUploading(true);
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const updated = await apiFetch<Club>(`/clubs/${id}/image`, accessToken, {
        method: "PATCH",
        body: form,
      });
      setClub(updated);
      setNotice("Club image updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading club…</p>;
  if (!club) return <p className="text-sm text-red-600">{error ?? "Club not found"}</p>;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-secondary"
      >
        <FiArrowLeft className="h-4 w-4" /> All clubs
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-secondary">Manage Club</h1>
      <p className="mt-1 text-sm text-gray-600">
        {club.memberCount} member{club.memberCount === 1 ? "" : "s"} · {club.postCount} post
        {club.postCount === 1 ? "" : "s"}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}

      <div className="mt-6 space-y-6 rounded-xl border border-gray-200 bg-white p-5">
        <ImageUploadField
          label="Club profile image"
          imageUrl={club.imageUrl}
          fallbackIcon={FiUsers}
          isUploading={isUploading}
          onFileSelected={handleImage}
        />

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Name</label>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Visibility</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as ClubVisibility)}
              className={inputClass}
            >
              <option value="PUBLIC">Public — anyone can find and join</option>
              <option value="PRIVATE">Private — invite only</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {club.visibility === "PRIVATE" && <ClubInvites clubId={club.id} />}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-secondary">Schedule</h2>
        <p className="mt-1 text-sm text-gray-600">
          Open a play for sign-ups. Members answer &ldquo;I&apos;m in&rdquo; or &ldquo;Can&apos;t
          make it&rdquo;, and you can close, cancel or delete it here.
        </p>
        <div className="mt-4">
          <ClubSchedule clubId={club.id} />
        </div>
      </div>
    </div>
  );
}
