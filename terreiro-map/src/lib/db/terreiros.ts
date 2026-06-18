import { mapTerreiro } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";

export async function listTerreiros() {
  const rows = await prisma.terreiro.findMany({ orderBy: { id: "asc" } });
  return rows.map(mapTerreiro);
}

export async function getTerreiroById(id: string) {
  const row = await prisma.terreiro.findUnique({ where: { id } });
  return row ? mapTerreiro(row) : null;
}

export async function updateTerreiroProfile(
  id: string,
  data: {
    horarioAbertura?: string;
    horarioFechamento?: string;
    giras?: unknown;
  },
) {
  const row = await prisma.terreiro.update({
    where: { id },
    data: {
      horarioAbertura: data.horarioAbertura,
      horarioFechamento: data.horarioFechamento,
      giras: data.giras ? (data.giras as object) : undefined,
    },
  });
  return mapTerreiro(row);
}
