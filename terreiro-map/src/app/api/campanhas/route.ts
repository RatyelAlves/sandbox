import { NextResponse } from "next/server";
import { jsonError, requireTerreiro } from "@/lib/auth/require";
import {
  createCampanhaFromForm,
  getCampanhaById,
  listCampanhas,
  setCampanhaStatus,
  updateCampanhaFromForm,
} from "@/lib/db/campanhas";
import type { CampanhaFormInput } from "@/lib/campanhas-store";
import { parseDateBRToISO } from "@/lib/masks";

function normalizeDataFim(dataFim: string, fallback: string) {
  if (!dataFim.trim()) return fallback;
  if (dataFim.includes("/")) return parseDateBRToISO(dataFim);
  return dataFim;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const terreiroId = searchParams.get("terreiroId") ?? undefined;
    return NextResponse.json(await listCampanhas({ terreiroId }));
  } catch (error) {
    console.error("[GET /api/campanhas]", error);
    return jsonError("Erro ao listar campanhas.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as CampanhaFormInput & {
      parceiroTerreiroId?: string;
    };

    const input = {
      ...body,
      dataFim: normalizeDataFim(body.dataFim, new Date().toISOString().slice(0, 10)),
    };

    const created = await createCampanhaFromForm(auth.profile.terreiroId, input, {
      parceiroTerreiroId: body.parceiroTerreiroId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/campanhas]", error);
    return jsonError("Erro ao criar campanha.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      id?: string;
      action?: "encerrar" | "reativar" | "update";
      input?: CampanhaFormInput;
    };

    if (!body.id) {
      return jsonError("ID obrigatório.", 400);
    }

    const existing = await getCampanhaById(body.id);
    if (!existing || existing.terreiroId !== auth.profile.terreiroId) {
      return jsonError("Acesso negado.", 403);
    }

    if (body.action === "encerrar") {
      return NextResponse.json(await setCampanhaStatus(body.id, "encerrada"));
    }

    if (body.action === "reativar") {
      return NextResponse.json(await setCampanhaStatus(body.id, "ativa"));
    }

    if (body.action === "update" && body.input) {
      const input = {
        ...body.input,
        dataFim: normalizeDataFim(body.input.dataFim, existing.dataFim),
      };

      return NextResponse.json(
        await updateCampanhaFromForm(body.id, input, existing.dataFim),
      );
    }

    return jsonError("Ação inválida.", 400);
  } catch (error) {
    console.error("[PATCH /api/campanhas]", error);
    return jsonError("Erro ao atualizar campanha.", 500);
  }
}
