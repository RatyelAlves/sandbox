import { NextResponse } from "next/server";
import {
  createCampanhaFromForm,
  getCampanhaById,
  listCampanhas,
  setCampanhaStatus,
  updateCampanhaFromForm,
} from "@/lib/db/campanhas";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
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
    return NextResponse.json({ error: "Erro ao listar campanhas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CampanhaFormInput & {
      parceiroTerreiroId?: string;
      terreiroId?: string;
    };

    const terreiroId = body.terreiroId ?? LOGGED_TERREIRO_ID;
    const input = {
      ...body,
      dataFim: normalizeDataFim(body.dataFim, new Date().toISOString().slice(0, 10)),
    };

    const created = await createCampanhaFromForm(terreiroId, input, {
      parceiroTerreiroId: body.parceiroTerreiroId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/campanhas]", error);
    return NextResponse.json({ error: "Erro ao criar campanha." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "encerrar" | "reativar" | "update";
      input?: CampanhaFormInput;
    };

    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    if (body.action === "encerrar") {
      return NextResponse.json(await setCampanhaStatus(body.id, "encerrada"));
    }

    if (body.action === "reativar") {
      return NextResponse.json(await setCampanhaStatus(body.id, "ativa"));
    }

    if (body.action === "update" && body.input) {
      const existing = await getCampanhaById(body.id);
      if (!existing) {
        return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
      }

      const input = {
        ...body.input,
        dataFim: normalizeDataFim(body.input.dataFim, existing.dataFim),
      };

      return NextResponse.json(
        await updateCampanhaFromForm(body.id, input, existing.dataFim),
      );
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/campanhas]", error);
    return NextResponse.json({ error: "Erro ao atualizar campanha." }, { status: 500 });
  }
}
