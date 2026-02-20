import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // During build time, return a dummy that won't be called
    return null as any;
  }

  return createClient(url, key);
}

export const supabaseAdmin = createSupabaseAdmin();
