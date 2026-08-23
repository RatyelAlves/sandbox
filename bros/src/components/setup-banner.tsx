import { isSupabaseConfigured } from "@/lib/env";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-accent/25 bg-accent/10 px-4 py-3 text-center text-sm text-accent">
      Configure o Supabase: copie{" "}
      <code className="text-ink">.env.example</code> para{" "}
      <code className="text-ink">.env.local</code> e rode o SQL em{" "}
      <code className="text-ink">supabase/schema.sql</code>.
    </div>
  );
}
