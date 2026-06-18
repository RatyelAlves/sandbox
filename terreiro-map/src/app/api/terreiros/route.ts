import { NextResponse } from "next/server";
import { getTerreiroById, listTerreiros, updateTerreiroProfile } from "@/lib/db/terreiros";

export async function GET() {
  try {
    return NextResponse.json(await listTerreiros());
  } catch (error) {
    console.error("[GET /api/terreiros]", error);
    return NextResponse.json({ error: "Erro ao listar terreiros." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      horarioAbertura?: string;
      horarioFechamento?: string;
      giras?: unknown;
    };

    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const existing = await getTerreiroById(body.id);
    if (!existing) {
      return NextResponse.json({ error: "Terreiro não encontrado." }, { status: 404 });
    }

    const updated = await updateTerreiroProfile(body.id, {
      horarioAbertura: body.horarioAbertura ?? existing.horarioAbertura,
      horarioFechamento: body.horarioFechamento ?? existing.horarioFechamento,
      giras: body.giras ?? existing.giras,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/terreiros]", error);
    return NextResponse.json({ error: "Erro ao atualizar terreiro." }, { status: 500 });
  }
}
