import { NextResponse } from "next/server";
import {
  createEvento,
  getEventoById,
  listEventos,
  setEventoStatus,
  updateEvento,
} from "@/lib/db/eventos";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import type { EventoFormInput } from "@/lib/eventos-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const terreiroId = searchParams.get("terreiroId") ?? undefined;
    const publicOnly = searchParams.get("public") === "1";

    return NextResponse.json(await listEventos({ terreiroId, publicOnly }));
  } catch (error) {
    console.error("[GET /api/eventos]", error);
    return NextResponse.json({ error: "Erro ao listar eventos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventoFormInput & { terreiroId?: string };
    const terreiroId = body.terreiroId ?? LOGGED_TERREIRO_ID;
    const created = await createEvento(terreiroId, body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/eventos]", error);
    return NextResponse.json({ error: "Erro ao criar evento." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "cancelar" | "reativar" | "update";
      input?: EventoFormInput;
    };

    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    if (body.action === "cancelar") {
      return NextResponse.json(await setEventoStatus(body.id, "cancelado"));
    }

    if (body.action === "reativar") {
      return NextResponse.json(await setEventoStatus(body.id, "ativo"));
    }

    if (body.action === "update" && body.input) {
      const existing = await getEventoById(body.id);
      if (!existing) {
        return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
      }
      return NextResponse.json(await updateEvento(body.id, body.input));
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/eventos]", error);
    return NextResponse.json({ error: "Erro ao atualizar evento." }, { status: 500 });
  }
}
