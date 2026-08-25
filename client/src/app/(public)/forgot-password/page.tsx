"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiSend } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/forgot-password", null, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setIsSubmitted(true);
    } catch (err) {
      // The backend never actually reports "email not found" — this only
      // catches real failures (rate limiting, network errors, etc.).
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-gray-200 p-8">
        {isSubmitted ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <FiCheckCircle className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-secondary">Check your email</h1>
            <p className="mt-2 text-sm text-gray-600">
              If an account exists for {email}, we&apos;ve sent a link to reset
              your password.
            </p>
            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-secondary hover:underline"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-secondary">Forgot password?</h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-1.5"
              >
                <FiSend className="h-4 w-4" />
                {isSubmitting ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-secondary hover:underline"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
