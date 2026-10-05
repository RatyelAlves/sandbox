import { NextResponse } from "next/server";
import { jsonError, requireTerreiro } from "@/lib/auth/require";
import {
  aceitarProposta,
  createProposta,
  listPropostas,
  recusarProposta,
} from "@/lib/db/propostas";
import type { CampanhaFormInput } from "@/lib/campanhas-store";
import { parseDateBRToISO } from "@/lib/masks";
import { prisma } from "@/lib/prisma";

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
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;
    return NextResponse.json(
      await listPropostas({ terreiroId: auth.profile.terreiroId }),
    );
  } catch (error) {
    console.error("[GET /api/propostas]", error);
    return jsonError("Erro ao listar propostas.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as CampanhaFormInput & {
      paraTerreiroId?: string;
      action?: "aceitar" | "recusar" | "create";
      propostaId?: string;
    };

    if (body.action === "aceitar" && body.propostaId) {
      const proposta = await prisma.propostaCampanha.findUnique({
        where: { id: body.propostaId },
      });
      if (!proposta || proposta.paraTerreiroId !== auth.profile.terreiroId) {
        return jsonError("Acesso negado.", 403);
      }
      const result = await aceitarProposta(body.propostaId);
      if (!result) {
        return jsonError("Proposta inválida.", 400);
      }
      return NextResponse.json(result);
    }

    if (body.action === "recusar" && body.propostaId) {
      const proposta = await prisma.propostaCampanha.findUnique({
        where: { id: body.propostaId },
      });
      if (!proposta || proposta.paraTerreiroId !== auth.profile.terreiroId) {
        return jsonError("Acesso negado.", 403);
      }
      const result = await recusarProposta(body.propostaId);
      if (!result) {
        return jsonError("Proposta inválida.", 400);
      }
      return NextResponse.json(result);
    }

    if (!body.paraTerreiroId) {
      return jsonError("Terreiro destino obrigatório.", 400);
    }

    if (body.paraTerreiroId === auth.profile.terreiroId) {
      return jsonError("Não é possível propor para o próprio terreiro.", 400);
    }

    const dataFim = normalizeDataFim(body.dataFim);
    const created = await createProposta(
      auth.profile.terreiroId,
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
    return jsonError("Erro ao processar proposta.", 500);
  }
}
