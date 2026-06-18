import { NextResponse } from "next/server";
import {
  aceitarProposta,
  createProposta,
  listPropostas,
  recusarProposta,
} from "@/lib/db/propostas";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import type { CampanhaFormInput } from "@/lib/campanhas-store";
import { parseDateBRToISO } from "@/lib/masks";

function normalizeDataFim(dataFim: string) {
  if (!dataFim.trim()) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 3);
    return fallback.toISOString().slice(0, 10);
  }
  if (dataFim.includes("/")) return parseDateBRToISO(dataFim);
  return dataFim;
}

export async function GET() {
  try {
    return NextResponse.json(await listPropostas());
  } catch (error) {
    console.error("[GET /api/propostas]", error);
    return NextResponse.json({ error: "Erro ao listar propostas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CampanhaFormInput & {
      paraTerreiroId?: string;
      deTerreiroId?: string;
      action?: "aceitar" | "recusar" | "create";
      propostaId?: string;
    };

    if (body.action === "aceitar" && body.propostaId) {
      const result = await aceitarProposta(body.propostaId);
      if (!result) {
        return NextResponse.json({ error: "Proposta inválida." }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (body.action === "recusar" && body.propostaId) {
      const result = await recusarProposta(body.propostaId);
      if (!result) {
        return NextResponse.json({ error: "Proposta inválida." }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (!body.paraTerreiroId) {
      return NextResponse.json(
        { error: "Terreiro destino obrigatório." },
        { status: 400 },
      );
    }

    const dataFim = normalizeDataFim(body.dataFim);
    const created = await createProposta(
      body.deTerreiroId ?? LOGGED_TERREIRO_ID,
      body.paraTerreiroId,
      {
        ...body,
        dataInicio: new Date().toISOString().slice(0, 10),
        dataFim,
      },
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/propostas]", error);
    return NextResponse.json({ error: "Erro ao processar proposta." }, { status: 500 });
  }
}
