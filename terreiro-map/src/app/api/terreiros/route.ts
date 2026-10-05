import { NextResponse } from "next/server";
import { jsonError, requireTerreiro } from "@/lib/auth/require";
import { getTerreiroById, listTerreiros, updateTerreiroProfile } from "@/lib/db/terreiros";

export async function GET() {
  try {
    return NextResponse.json(await listTerreiros());
  } catch (error) {
    console.error("[GET /api/terreiros]", error);
    return jsonError("Erro ao listar terreiros.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      id?: string;
      horarioAbertura?: string;
      horarioFechamento?: string;
      giras?: unknown;
    };

    if (body.id && body.id !== auth.profile.terreiroId) {
      return jsonError("Acesso negado.", 403);
    }

    const existing = await getTerreiroById(auth.profile.terreiroId);
    if (!existing) {
      return jsonError("Terreiro não encontrado.", 404);
    }

    const updated = await updateTerreiroProfile(auth.profile.terreiroId, {
      horarioAbertura: body.horarioAbertura ?? existing.horarioAbertura,
      horarioFechamento: body.horarioFechamento ?? existing.horarioFechamento,
      giras: body.giras ?? existing.giras,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/terreiros]", error);
    return jsonError("Erro ao atualizar terreiro.", 500);
  }
}
