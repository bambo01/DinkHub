import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// `signInWithPassword` mutates the session stored on whichever client
// instance calls it. Since `supabase` above is a singleton shared by every
// request, signing a user in on it would silently replace its service-role
// credentials with that user's session for every later call — including
// unrelated requests from other users. Password verification gets its own
// disposable client so the shared client's service-role auth is never
// overwritten.
export function createAuthClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
