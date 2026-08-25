export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

// A post-login/register redirect must be an internal path (starts with "/",
// never "//") so a crafted link can't bounce a user off to an external URL.
export function safeRedirect(value: string | null) {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}
