"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const STORAGE_KEY = "dinkhub-test-notice-dismissed";

export function TestNotice() {
  const [isDismissed, setIsDismissed] = useState(true);

  // Defaults to hidden during SSR/first render, then reads localStorage
  // after mount — avoids a flash of the banner for someone who already
  // dismissed it, without risking a server/client markup mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setIsDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setIsDismissed(false);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isDismissed) return null;

  function dismiss() {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Not persisted — it'll just show again next visit, which is fine.
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex max-w-xs items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 shadow-lg">
      <FiAlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
      <p className="flex-1 text-xs leading-snug text-amber-800">
        This site is for testing purposes only. Bookings made here are not
        official.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notice"
        className="flex-none text-amber-500 hover:text-amber-700"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}
