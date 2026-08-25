"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiSave, FiUsers } from "react-icons/fi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import type { Court } from "@/types/court";
import type { Activity, ActivityStatus, SkillLevel } from "@/types/openPlay";

const today = new Date();

export default function AdminOpenPlayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [courts, setCourts] = useState<Court[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(toDateKey(today));
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(10);
  const [capacity, setCapacity] = useState(8);
  const [pricePerSlot, setPricePerSlot] = useState(250);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("ALL_LEVELS");
  const [status, setStatus] = useState<ActivityStatus>("ACTIVE");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!accessToken || !id) return;

    setIsLoading(true);
    setLoadError(null);

    apiFetch<Activity>(`/open-play/${id}`, accessToken)
      .then((data) => {
        setActivity(data);
        setCourtIds(data.courts.map((court) => court.id));
        setTitle(data.title);
        setDescription(data.description ?? "");
        setEventDate(data.eventDate);
        setStartHour(data.startHour);
        setEndHour(data.endHour);
        setCapacity(data.capacity);
        setPricePerSlot(data.pricePerSlot);
        setSkillLevel(data.skillLevel);
        setStatus(data.status);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load activity"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Court[]>("/courts", accessToken)
      .then(setCourts)
      .catch(() => setCourts([]));
  }, [accessToken]);

  function toggleCourt(courtId: string) {
    setCourtIds((prev) =>
      prev.includes(courtId) ? prev.filter((cid) => cid !== courtId) : [...prev, courtId],
    );
  }

  async function handleImageSelected(file: File) {
    setImageError(null);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const updated = await apiFetch<Activity>(`/open-play/${id}/image`, accessToken, {
        method: "PATCH",
        body: formData,
      });
      setActivity(updated);
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const updated = await apiFetch<Activity>(`/open-play/${id}`, accessToken, {
        method: "PATCH",
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
          status,
        }),
      });
      setActivity(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
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

      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      {!isLoading && !loadError && activity && (
        <form
          onSubmit={handleSave}
          className="mt-4 max-w-xl rounded-xl border border-gray-200 bg-white p-6"
        >
          <h1 className="text-xl font-bold text-secondary">{activity.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Customers reserve individual player slots for this session.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <ImageUploadField
                label="Activity image"
                imageUrl={activity.imageUrl}
                onFileSelected={handleImageSelected}
                isUploading={isUploadingImage}
                fallbackIcon={FiUsers}
              />
              {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
            </div>

            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-secondary">
                Title
              </label>
              <input
                id="title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
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
                Every selected court stays auto-blocked for this date and time.
              </p>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="mb-1 block text-sm font-medium text-secondary">
                  Date
                </label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-secondary">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ActivityStatus)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
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

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saved && !saveError && <p className="text-sm text-primary">Saved.</p>}

            <button
              type="submit"
              disabled={isSaving || startHour >= endHour || courtIds.length === 0}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
            >
              <FiSave className="h-4 w-4" />
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
