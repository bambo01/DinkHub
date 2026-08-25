"use client";

import { FormEvent, useState } from "react";
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend } from "react-icons/fi";
import { Button } from "@/components/ui/Button";

const contactDetails = [
  {
    icon: FiMapPin,
    label: "Address",
    value: "123 Pickleball Ave, Quezon City, Metro Manila",
  },
  {
    icon: FiPhone,
    label: "Phone",
    value: "+63 912 345 6789",
  },
  {
    icon: FiMail,
    label: "Email",
    value: "hello@dinkhub.com",
  },
  {
    icon: FiClock,
    label: "Hours",
    value: "Mon – Sun: 6:00 AM – 10:00 PM",
  },
];

export function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary">Get in Touch</h2>
        <p className="mt-2 text-gray-600">
          Have a question about courts or Open Play? Send us a message.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          {contactDetails.map((detail) => (
            <div key={detail.label} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-secondary">
                <detail.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-secondary">
                  {detail.label}
                </p>
                <p className="text-sm text-gray-600">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 p-6"
        >
          {isSubmitted ? (
            <p className="py-10 text-center text-secondary">
              Thanks for reaching out! We&apos;ll get back to you soon.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="How can we help?"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="flex w-full items-center justify-center gap-1.5"
              >
                <FiSend className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
