import { mapEvento, toEventoStatus } from "@/lib/db/mappers";
import type { EventoFormInput } from "@/lib/eventos-store";
import { prisma } from "@/lib/prisma";

export async function listEventos(filters?: {
  terreiroId?: string;
  publicOnly?: boolean;
}) {
  const rows = await prisma.evento.findMany({
    where: {
      terreiroId: filters?.terreiroId,
      status: filters?.publicOnly ? "ATIVO" : undefined,
    },
    orderBy: [{ data: "asc" }, { horario: "asc" }],
  });
  return rows.map(mapEvento);
}

export async function getEventoById(id: string) {
  const row = await prisma.evento.findUnique({ where: { id } });
  return row ? mapEvento(row) : null;
}

export async function createEvento(
  terreiroId: string,
  input: EventoFormInput,
) {
  const row = await prisma.evento.create({
    data: {
      id: crypto.randomUUID(),
      terreiroId,
      titulo: input.titulo.trim(),
      categoria: input.categoria,
      data: input.data,
      horario: input.horario,
      local: input.local.trim(),
      descricao: input.descricao.trim(),
      linkIngresso: input.linkIngresso?.trim() || null,
    },
  });
  return mapEvento(row);
}

export async function updateEvento(id: string, input: EventoFormInput) {
  const row = await prisma.evento.update({
    where: { id },
    data: {
      titulo: input.titulo.trim(),
      categoria: input.categoria,
      data: input.data,
      horario: input.horario,
      local: input.local.trim(),
      descricao: input.descricao.trim(),
      linkIngresso: input.linkIngresso?.trim() || null,
    },
  });
  return mapEvento(row);
}

export async function setEventoStatus(id: string, status: "ativo" | "cancelado") {
  const row = await prisma.evento.update({
    where: { id },
    data: { status: toEventoStatus(status) },
  });
  return mapEvento(row);
}
