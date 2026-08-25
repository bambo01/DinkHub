"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { formatHour, toDateKey } from "@/lib/mock-courts";
import type { BlockedSlot, Court } from "@/types/court";

const today = new Date();

export default function AdminCourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [court, setCourt] = useState<Court | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable court fields.
  const [name, setName] = useState("");
  const [type, setType] = useState<Court["type"]>("INDOOR");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Court["status"]>("ACTIVE");
  const [openHour, setOpenHour] = useState(8);
  const [closeHour, setCloseHour] = useState(19);
  const [pricePerHour, setPricePerHour] = useState(500);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Per-date blocked slots.
  const [blockedDate, setBlockedDate] = useState(toDateKey(today));
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [newStartHour, setNewStartHour] = useState(10);
  const [newEndHour, setNewEndHour] = useState(12);
  const [newReason, setNewReason] = useState("");
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // setIsLoading/setError run synchronously before the fetch kicks off, which
  // react-hooks/set-state-in-effect flags on principle — but the loading
  // state genuinely needs to reset before each fetch starts.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!accessToken || !id) return;

    setIsLoading(true);
    setLoadError(null);

    apiFetch<Court>(`/courts/${id}`, accessToken)
      .then((data) => {
        setCourt(data);
        setName(data.name);
        setType(data.type);
        setLocation(data.location);
        setDescription(data.description ?? "");
        setStatus(data.status);
        setOpenHour(data.defaultOpenHour);
        setCloseHour(data.defaultCloseHour);
        setPricePerHour(data.pricePerHour);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load court"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);

  useEffect(() => {
    if (!accessToken || !id) return;

    setIsLoadingSlots(true);
    setSlotsError(null);

    apiFetch<BlockedSlot[]>(
      `/courts/${id}/blocked-slots?date=${blockedDate}`,
      accessToken,
    )
      .then(setBlockedSlots)
      .catch((err) =>
        setSlotsError(err instanceof ApiError ? err.message : "Failed to load blocked slots"),
      )
      .finally(() => setIsLoadingSlots(false));
  }, [accessToken, id, blockedDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const updated = await apiFetch<Court>(`/courts/${id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          type,
          location,
          description: description || undefined,
          status,
          defaultOpenHour: openHour,
          defaultCloseHour: closeHour,
          pricePerHour,
        }),
      });
      setCourt(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddBlockedSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSlotsError(null);
    setIsAddingSlot(true);

    try {
      const slot = await apiFetch<BlockedSlot>(`/courts/${id}/blocked-slots`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          blockedDate,
          startHour: newStartHour,
          endHour: newEndHour,
          reason: newReason || undefined,
        }),
      });
      setBlockedSlots((prev) => [...prev, slot].sort((a, b) => a.startHour - b.startHour));
      setNewReason("");
    } catch (err) {
      setSlotsError(err instanceof ApiError ? err.message : "Failed to add blocked slot");
    } finally {
      setIsAddingSlot(false);
    }
  }

  async function handleRemoveBlockedSlot(slotId: string) {
    setSlotsError(null);

    try {
      await apiFetch(`/courts/${id}/blocked-slots/${slotId}`, accessToken, {
        method: "DELETE",
      });
      setBlockedSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    } catch (err) {
      setSlotsError(err instanceof ApiError ? err.message : "Failed to remove blocked slot");
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

      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      {!isLoading && !loadError && court && (
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSave}
            className="h-fit rounded-xl border border-gray-200 bg-white p-6"
          >
            <h1 className="text-xl font-bold text-secondary">{court.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Default open hours apply to every date unless blocked below.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-secondary">
                  Name
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
                  <label htmlFor="status" className="mb-1 block text-sm font-medium text-secondary">
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as Court["status"])}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Description
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

              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              {saved && !saveError && (
                <p className="text-sm text-primary">Saved.</p>
              )}

              <button
                type="submit"
                disabled={isSaving || openHour >= closeHour}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary hover:opacity-90 disabled:opacity-50"
              >
                <FiSave className="h-4 w-4" />
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="h-fit rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary">Blocked Time Slots</h2>
            <p className="mt-1 text-sm text-gray-600">
              Close off part of a specific date — every other date keeps the
              default hours above.
            </p>

            <div className="mt-4">
              <label
                htmlFor="blocked-date"
                className="mb-1 block text-sm font-medium text-secondary"
              >
                Date
              </label>
              <input
                id="blocked-date"
                type="date"
                min={toDateKey(today)}
                value={blockedDate}
                onChange={(event) => setBlockedDate(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-4 space-y-2">
              {isLoadingSlots && (
                <p className="text-sm text-gray-500">Loading…</p>
              )}

              {!isLoadingSlots && blockedSlots.length === 0 && (
                <p className="text-sm text-gray-500">
                  No blocked slots for this date — open {formatHour(court.defaultOpenHour)} –{" "}
                  {formatHour(court.defaultCloseHour)}.
                </p>
              )}

              {!isLoadingSlots &&
                blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {formatHour(slot.startHour)} – {formatHour(slot.endHour)}
                      </p>
                      {slot.reason && (
                        <p className="text-xs text-gray-500">{slot.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedSlot(slot.id)}
                      aria-label="Remove blocked slot"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>

            {slotsError && (
              <p className="mt-3 text-sm text-red-600">{slotsError}</p>
            )}

            <form
              onSubmit={handleAddBlockedSlot}
              className="mt-4 space-y-3 border-t border-gray-100 pt-4"
            >
              <p className="text-sm font-medium text-secondary">Block a time range</p>
              <div className="flex items-center gap-3">
                <select
                  aria-label="Block start hour"
                  value={newStartHour}
                  onChange={(event) => setNewStartHour(Number(event.target.value))}
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
                  aria-label="Block end hour"
                  value={newEndHour}
                  onChange={(event) => setNewEndHour(Number(event.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </select>
              </div>
              {newStartHour >= newEndHour && (
                <p className="text-xs text-red-600">
                  Start hour must be before end hour.
                </p>
              )}

              <input
                type="text"
                value={newReason}
                onChange={(event) => setNewReason(event.target.value)}
                placeholder="Reason (optional) — e.g. private event"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />

              <button
                type="submit"
                disabled={isAddingSlot || newStartHour >= newEndHour}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-secondary hover:bg-gray-50 disabled:opacity-50"
              >
                <FiPlus className="h-4 w-4" />
                {isAddingSlot ? "Adding…" : "Add Blocked Slot"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
