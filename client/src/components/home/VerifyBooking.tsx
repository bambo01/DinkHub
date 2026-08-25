"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/Button";

export function VerifyBooking() {
  const router = useRouter();
  const [reference, setReference] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-secondary">Have a Booking Reference?</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter it below to check your booking — the same thing scanning your
          QR code does.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center"
        >
          <input
            type="text"
            required
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="DH-A1B2C3"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none sm:max-w-xs"
          />
          <Button
            type="submit"
            variant="primary"
            className="flex items-center justify-center gap-1.5"
          >
            <FiSearch className="h-4 w-4" />
            Check Booking
          </Button>
        </form>
      </div>
    </section>
  );
}
