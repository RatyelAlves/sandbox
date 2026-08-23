import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase não configurado. Preencha o .env.local.");
  }
  return createBrowserClient(env.url, env.key);
}
