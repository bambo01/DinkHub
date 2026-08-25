"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSave, FiUsers } from "react-icons/fi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import type { Court } from "@/types/court";
import type { Activity, SkillLevel } from "@/types/openPlay";

const today = new Date();

export default function NewOpenPlayPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [courts, setCourts] = useState<Court[]>([]);
  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(toDateKey(today));
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(10);
  const [capacity, setCapacity] = useState(8);
  const [pricePerSlot, setPricePerSlot] = useState(250);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("ALL_LEVELS");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  // setCourts runs synchronously in a .then() callback, not the effect body
  // directly — no react-hooks/set-state-in-effect issue here.
  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Court[]>("/courts", accessToken)
      .then((data) => {
        setCourts(data);
        if (data.length > 0) setCourtIds((current) => (current.length > 0 ? current : [data[0]!.id]));
      })
      .catch(() => setCourts([]));
  }, [accessToken]);

  function toggleCourt(courtId: string) {
    setCourtIds((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const activity = await apiFetch<Activity>("/open-play", accessToken, {
        method: "POST",
        body: JSON.stringify({
          courtIds,
          title,
          description: description || undefined,
          eventDate,
          startHour,
          endHour,
          capacity,
          pricePerSlot,
          skillLevel,
        }),
      });

      if (imageFile) {
        // Best-effort — the activity itself is already created at this
        // point, so a failed image upload shouldn't block navigation. It
        // can always be added from the edit page instead.
        const formData = new FormData();
        formData.append("image", imageFile);
        await apiFetch(`/open-play/${activity.id}/image`, accessToken, {
          method: "PATCH",
          body: formData,
        }).catch(() => {});
      }

      router.push(`/admin/open-play/${activity.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create activity");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/open-play")}
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Open Play
      </button>

      <div className="mt-4 max-w-xl rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold text-secondary">Add Open Play Activity</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customers will be able to reserve individual player slots for this
          session, not the whole court.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ImageUploadField
            label="Activity image"
            imageUrl={imagePreviewUrl}
            onFileSelected={handleImageSelected}
            fallbackIcon={FiUsers}
          />

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-secondary">
              Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Saturday Morning Open Play"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-secondary"
            >
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-secondary">Courts</p>
            <p className="mb-2 text-xs text-gray-500">
              Every selected court gets auto-blocked for this date and time once created.
            </p>
            {courts.length === 0 && (
              <p className="text-sm text-gray-500">No courts available.</p>
            )}
            <div className="space-y-2 rounded-md border border-gray-300 p-3">
              {courts.map((court) => (
                <label key={court.id} className="flex items-center gap-2 text-sm text-secondary">
                  <input
                    type="checkbox"
                    checked={courtIds.includes(court.id)}
                    onChange={() => toggleCourt(court.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {court.name}
                </label>
              ))}
            </div>
            {courtIds.length === 0 && (
              <p className="mt-1 text-xs text-red-600">Select at least one court.</p>
            )}
          </div>

          <div>
            <label htmlFor="skillLevel" className="mb-1 block text-sm font-medium text-secondary">
              Skill Level
            </label>
            <select
              id="skillLevel"
              value={skillLevel}
              onChange={(event) => setSkillLevel(event.target.value as SkillLevel)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="ALL_LEVELS">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="eventDate" className="mb-1 block text-sm font-medium text-secondary">
              Date
            </label>
            <input
              id="eventDate"
              type="date"
              required
              min={toDateKey(today)}
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-secondary">Time</p>
            <div className="flex items-center gap-3">
              <select
                aria-label="Start hour"
                value={startHour}
                onChange={(event) => setStartHour(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">to</span>
              <select
                aria-label="End hour"
                value={endHour}
                onChange={(event) => setEndHour(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
            {startHour >= endHour && (
              <p className="mt-1 text-xs text-red-600">
                Start hour must be before end hour.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-secondary">
                Player Capacity
              </label>
              <input
                id="capacity"
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-medium text-secondary">
                Price per Slot (₱)
              </label>
              <input
                id="price"
                type="number"
                min={0}
                step={0.01}
                required
                value={pricePerSlot}
                onChange={(event) => setPricePerSlot(Number(event.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || startHour >= endHour || courtIds.length === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create Activity"}
          </button>
        </form>
      </div>
    </div>
  );
}
