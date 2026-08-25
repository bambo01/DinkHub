"use client";

import { FormEvent, useRef, useState } from "react";
import { FiCamera, FiLock, FiMail, FiShield, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { LoyaltyCard } from "@/components/profile/LoyaltyCard";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/context/AuthContext";

function AvatarSection() {
  const { user, accessToken, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !accessToken) return;

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const updated = await apiFetch<AuthUser>("/auth/me/avatar", accessToken, {
        method: "PATCH",
        body: formData,
      });
      updateUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  }

  const displayName = user?.fullName ?? user?.email ?? "";

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {user?.avatarUrl ? (
          // Avatar URLs come from Supabase Storage's public bucket — a
          // plain <img> avoids needing that domain allow-listed for
          // next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-secondary">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white shadow disabled:opacity-50"
        >
          <FiCamera className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-secondary">Profile photo</p>
        <p className="text-xs text-gray-500">
          {isUploading ? "Uploading…" : "JPG or PNG, up to 5MB."}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const { accessToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/change-password", accessToken, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1 block text-sm font-medium text-secondary"
        >
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-secondary">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-secondary"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-primary">Password updated.</p>}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-1.5"
      >
        <FiLock className="h-4 w-4" />
        {isSubmitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-secondary">View Profile</h1>
      <p className="mt-1 text-sm text-gray-600">
        Your account details on DinkHub.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 p-6">
        <AvatarSection />
      </div>

      <div className="mt-6">
        <LoyaltyCard />
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiUser className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="text-sm font-medium text-secondary">
              {user?.fullName ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiMail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-secondary">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiShield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-sm font-medium text-secondary">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-secondary">Change Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          You&apos;ll need your current password to set a new one.
        </p>
        <div className="mt-4">
          <ChangePasswordSection />
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Editing your name isn&apos;t wired up yet.
      </p>
    </section>
  );
}
