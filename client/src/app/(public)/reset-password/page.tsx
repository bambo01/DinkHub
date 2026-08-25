"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCheckCircle, FiLock, FiXCircle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { apiFetch, ApiError } from "@/lib/api";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Supabase delivers the recovery token in the URL hash fragment (not a
  // query param), which only exists client-side — window isn't available
  // during SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setAccessToken(params.get("access_token"));
    setIsTokenChecked(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!accessToken) return;

    setIsSubmitting(true);

    try {
      await apiFetch("/auth/reset-password", null, {
        method: "POST",
        body: JSON.stringify({ accessToken, newPassword }),
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isTokenChecked) {
    return (
      <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-500">
        Loading…
      </p>
    );
  }

  if (!accessToken) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <FiXCircle className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-secondary">
          Invalid or expired link
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          This password reset link is missing or no longer valid. Request a
          new one.
        </p>
        <LinkButton href="/forgot-password" variant="primary" className="mt-6 justify-center">
          Request New Link
        </LinkButton>
      </section>
    );
  }

  if (isSuccess) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <FiCheckCircle className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-secondary">Password updated</h1>
        <p className="mt-2 text-sm text-gray-600">
          You can now log in with your new password.
        </p>
        <LinkButton href="/login" variant="primary" className="mt-6 justify-center">
          Go to Login
        </LinkButton>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary">Set a new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-secondary"
            >
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
      </div>
    </section>
  );
}
