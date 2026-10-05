import { mapProposta, toMetaTipo } from "@/lib/db/mappers";
import type { CampanhaFormInput } from "@/lib/campanhas-store";
import { createCampanhaFromProposta } from "@/lib/db/campanhas";
import { prisma } from "@/lib/prisma";

export async function listPropostas(filters?: { terreiroId?: string }) {
  const rows = await prisma.propostaCampanha.findMany({
    where: filters?.terreiroId
      ? {
          OR: [
            { deTerreiroId: filters.terreiroId },
            { paraTerreiroId: filters.terreiroId },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapProposta);
}

export async function createProposta(
  deTerreiroId: string,
  paraTerreiroId: string,
  input: CampanhaFormInput & { dataInicio: string; dataFim: string },
) {
  const common = {
    id: crypto.randomUUID(),
    deTerreiroId,
    paraTerreiroId,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    metaTipo: toMetaTipo(input.metaTipo),
  };

  const row =
    input.metaTipo === "monetaria"
      ? await prisma.propostaCampanha.create({
          data: {
            ...common,
            metaArrecadacao: input.metaMonetaria ?? 0,
          },
        })
      : await prisma.propostaCampanha.create({
          data: {
            ...common,
            itemDescricao: input.itemDescricao?.trim() ?? "",
            metaQuantidade: input.metaQuantidade ?? 0,
            unidade: input.unidade?.trim() || "itens",
          },
        });

  return mapProposta(row);
}

export async function aceitarProposta(propostaId: string) {
  const proposta = await prisma.propostaCampanha.findUnique({
    where: { id: propostaId },
  });
  if (!proposta || proposta.status !== "PENDENTE") return null;

  const campanha = await createCampanhaFromProposta({
    deTerreiroId: proposta.deTerreiroId,
    paraTerreiroId: proposta.paraTerreiroId,
    titulo: proposta.titulo,
    descricao: proposta.descricao,
    metaTipo: proposta.metaTipo === "MONETARIA" ? "monetaria" : "itens",
    dataInicio: proposta.dataInicio,
    dataFim: proposta.dataFim,
    metaArrecadacao: proposta.metaArrecadacao ?? undefined,
    itemDescricao: proposta.itemDescricao ?? undefined,
    metaQuantidade: proposta.metaQuantidade ?? undefined,
    unidade: proposta.unidade ?? undefined,
  });

  const updated = await prisma.propostaCampanha.update({
    where: { id: propostaId },
    data: {
      status: "ACEITA",
      campanhaId: campanha.id,
    },
  });

  return { proposta: mapProposta(updated), campanha };
}

export async function recusarProposta(propostaId: string) {
  const proposta = await prisma.propostaCampanha.findUnique({
    where: { id: propostaId },
  });
  if (!proposta || proposta.status !== "PENDENTE") return null;

  const updated = await prisma.propostaCampanha.update({
    where: { id: propostaId },
    data: { status: "RECUSADA" },
  });
  return mapProposta(updated);
}
