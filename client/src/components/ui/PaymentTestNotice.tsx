import { FiAlertTriangle } from "react-icons/fi";

// Shown right before any button that redirects to PayMongo's hosted
// checkout — that page is entirely PayMongo's own, so this is the last
// point in the flow where we can actually tell someone it's test mode.
export function PaymentTestNotice() {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
      <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
      This is a test payment page — you don&apos;t need to enter real card or
      account details. This is just a mock confirmation.
    </p>
  );
}
