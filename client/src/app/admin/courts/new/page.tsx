"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { GiTennisCourt } from "react-icons/gi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour } from "@/lib/mock-courts";
import type { Court } from "@/types/court";

export default function NewCourtPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<Court["type"]>("INDOOR");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [openHour, setOpenHour] = useState(8);
  const [closeHour, setCloseHour] = useState(19);
  const [pricePerHour, setPricePerHour] = useState(500);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const court = await apiFetch<Court>("/courts", accessToken, {
        method: "POST",
        body: JSON.stringify({
          name,
          type,
          location,
          description: description || undefined,
          defaultOpenHour: openHour,
          defaultCloseHour: closeHour,
          pricePerHour,
        }),
      });

      if (imageFile) {
        // Best-effort — the court itself is already created at this point,
        // so a failed image upload shouldn't block navigation or look like
        // the whole creation failed. It can always be added from the edit
        // page instead.
        const formData = new FormData();
        formData.append("image", imageFile);
        await apiFetch(`/courts/${court.id}/image`, accessToken, {
          method: "PATCH",
          body: formData,
        }).catch(() => {});
      }

      router.push(`/admin/courts/${court.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create court");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/courts")}
        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Courts
      </button>

      <div className="mt-4 max-w-xl rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold text-secondary">Add Court</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set the court&apos;s default open hours — you can change these, or
          block off specific dates, at any time after it&apos;s created.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ImageUploadField
            label="Court image"
            imageUrl={imagePreviewUrl}
            onFileSelected={handleImageSelected}
            fallbackIcon={GiTennisCourt}
          />

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-secondary">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Court 5"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-secondary">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(event) => setType(event.target.value as Court["type"])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="INDOOR">Indoor</option>
                <option value="OUTDOOR">Outdoor</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-secondary">
                Location
              </label>
              <input
                id="location"
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Main Hall"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-secondary">
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
            <p className="mb-1 text-sm font-medium text-secondary">
              Default open hours
            </p>
            <div className="flex items-center gap-3">
              <select
                aria-label="Open hour"
                value={openHour}
                onChange={(event) => setOpenHour(Number(event.target.value))}
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
                aria-label="Close hour"
                value={closeHour}
                onChange={(event) => setCloseHour(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
            {openHour >= closeHour && (
              <p className="mt-1 text-xs text-red-600">
                Open hour must be before close hour.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-secondary">
              Price per hour (₱)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step={0.01}
              required
              value={pricePerHour}
              onChange={(event) => setPricePerHour(Number(event.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || openHour >= closeHour}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create Court"}
          </button>
        </form>
      </div>
    </div>
  );
}

