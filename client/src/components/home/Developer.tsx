import { FiExternalLink, FiMail } from "react-icons/fi";

const CONTACT_URL = "https://marklaurencepangan.vercel.app/#contact";
const PORTFOLIO_URL = "https://marklaurencepangan.vercel.app/";

export function Developer() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="rounded-2xl bg-secondary px-6 py-12 text-center sm:px-12">
        <span className="inline-block rounded-full bg-primary/15 px-4 py-1 text-sm font-semibold text-primary">
          Built by Mark Laurence Pangan
        </span>
        <h2 className="mt-4 text-3xl font-bold text-white">
          Want a Booking System Like This?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Whether you want a platform like DinkHub built for your own
          facility, or you&apos;re interested in investing in a system like
          this, get in touch and let&apos;s talk.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:opacity-90"
          >
            <FiMail className="h-4 w-4" />
            Contact Me
          </a>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/60 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <FiExternalLink className="h-4 w-4" />
            View Portfolio
          </a>
        </div>
      </div>
    </section>
  );
}
