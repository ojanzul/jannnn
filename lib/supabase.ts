import { createClient } from "@supabase/supabase-js";

// Public/anon client — used in server components for read-only queries
// against tables that have public SELECT policies (instruments, signals,
// ml_models — see 0001_init.sql). Safe to use the anon key here since RLS
// enforces what it can actually read.
export function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Service-role client — SERVER-SIDE ONLY (used in app/api/journal/route.ts).
// Never import this into a client component or expose the key to the
// browser; it bypasses Row Level Security entirely.
export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
