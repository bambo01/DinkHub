// One-off script to create the first ADMIN account.
// Requires the `users` table to already exist (see supabase/migrations/0001_create_users.sql).
// Run with: SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npx tsx src/scripts/create-superadmin.ts

import { supabase } from "../config/supabase.js";

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables before running this script.",
    );
    process.exit(1);
  }

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    throw createError;
  }

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: created.user.id,
      email,
      role: "ADMIN",
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    throw upsertError;
  }

  console.log(`Superadmin created: ${email} (${created.user.id})`);
}

main().catch((error) => {
  console.error("Failed to create superadmin:", error.message ?? error);
  process.exit(1);
});
