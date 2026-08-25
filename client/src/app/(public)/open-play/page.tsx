import { FiClock, FiUsers } from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";

export default function OpenPlayPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-secondary">
        <FiUsers className="h-8 w-8" />
      </span>

      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <FiClock className="h-3.5 w-3.5" />
        Coming Soon
      </span>

      <h1 className="mt-4 text-3xl font-bold text-secondary">
        Open Play is on its way
      </h1>
      <p className="mt-3 text-gray-600">
        We&apos;re still building the Open Play scheduling experience —
        drop-in sessions where you can join the community and play with
        others by the slot, not the full court. Check back soon.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/courts" variant="primary">
          Book a Court Instead
        </LinkButton>
        <LinkButton href="/" variant="outline">
          Back to Home
        </LinkButton>
      </div>
    </section>
  );
}
