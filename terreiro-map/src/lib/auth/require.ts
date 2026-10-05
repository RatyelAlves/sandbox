import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/auth/server";
import type { AuthProfile } from "@/lib/auth/types";

export type TerreiroProfile = AuthProfile & { terreiroId: string };

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireTerreiro(): Promise<
  | { ok: true; profile: TerreiroProfile }
  | { ok: false; response: NextResponse }
> {
  const profile = await getAuthProfile();
  if (!profile) {
    return { ok: false, response: jsonError("Não autenticado.", 401) };
  }
  if (profile.accountType !== "terreiro" || !profile.terreiroId) {
    return {
      ok: false,
      response: jsonError("Perfil de terreiro necessário.", 403),
    };
  }
  return { ok: true, profile: { ...profile, terreiroId: profile.terreiroId } };
}
