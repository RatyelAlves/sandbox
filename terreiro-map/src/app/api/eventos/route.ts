import { NextResponse } from "next/server";
import { jsonError, requireTerreiro } from "@/lib/auth/require";
import {
  createEvento,
  getEventoById,
  listEventos,
  setEventoStatus,
  updateEvento,
} from "@/lib/db/eventos";
import type { EventoFormInput } from "@/lib/eventos-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const terreiroId = searchParams.get("terreiroId") ?? undefined;
    const publicOnly = searchParams.get("public") === "1";

    return NextResponse.json(await listEventos({ terreiroId, publicOnly }));
  } catch (error) {
    console.error("[GET /api/eventos]", error);
    return jsonError("Erro ao listar eventos.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as EventoFormInput;
    const created = await createEvento(auth.profile.terreiroId, body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/eventos]", error);
    return jsonError("Erro ao criar evento.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireTerreiro();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      id?: string;
      action?: "cancelar" | "reativar" | "update";
      input?: EventoFormInput;
    };

    if (!body.id) {
      return jsonError("ID obrigatório.", 400);
    }

    const existing = await getEventoById(body.id);
    if (!existing || existing.terreiroId !== auth.profile.terreiroId) {
      return jsonError("Acesso negado.", 403);
    }

    if (body.action === "cancelar") {
      return NextResponse.json(await setEventoStatus(body.id, "cancelado"));
    }

    if (body.action === "reativar") {
      return NextResponse.json(await setEventoStatus(body.id, "ativo"));
    }

    if (body.action === "update" && body.input) {
      return NextResponse.json(await updateEvento(body.id, body.input));
    }

    return jsonError("Ação inválida.", 400);
  } catch (error) {
    console.error("[PATCH /api/eventos]", error);
    return jsonError("Erro ao atualizar evento.", 500);
  }
}
