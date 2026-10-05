import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/auth/server";
import { jsonError } from "@/lib/auth/require";
import { listCampanhas } from "@/lib/db/campanhas";
import { listEventos } from "@/lib/db/eventos";
import { listFavoriteEventoIds, listFavoriteTerreiroIds } from "@/lib/db/favoritos";
import { listPropostas } from "@/lib/db/propostas";
import { listTerreiros } from "@/lib/db/terreiros";

export async function GET() {
  try {
    const profile = await getAuthProfile();

    const [terreiros, eventos, campanhas] = await Promise.all([
      listTerreiros(),
      listEventos(),
      listCampanhas(),
    ]);

    const propostas =
      profile?.accountType === "terreiro" && profile.terreiroId
        ? await listPropostas({ terreiroId: profile.terreiroId })
        : [];

    const favoritos = {
      usuario:
        profile?.accountType === "usuario"
          ? await listFavoriteTerreiroIds(profile.userId)
          : [],
      terreiro:
        profile?.accountType === "terreiro"
          ? await listFavoriteEventoIds(profile.userId)
          : [],
    };

    return NextResponse.json({
      terreiros,
      eventos,
      campanhas,
      propostas,
      favoritos,
    });
  } catch (error) {
    console.error("[GET /api/bootstrap]", error);
    return jsonError("Falha ao carregar dados do banco.", 500);
  }
}
