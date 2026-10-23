import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const proxiedUrl =
    typeof window === "undefined"
      ? supabaseUrl
      : `${window.location.origin}/supabase-proxy`;

  // Keep the cookie name tied to the real project so server-side clients
  // (which talk to Supabase directly) read the same session.
  return createBrowserClient(proxiedUrl, supabaseAnonKey, {
    cookieOptions: { name: `sb-${projectRef}-auth-token` },
  });
}
