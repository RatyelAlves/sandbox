import {
  mapCampanha,
  toCampanhaStatus,
  toMetaTipo,
} from "@/lib/db/mappers";
import type { CampanhaFormInput, CampanhaPropostaPayload } from "@/lib/campanhas-store";
import { prisma } from "@/lib/prisma";

export async function listCampanhas(filters?: { terreiroId?: string }) {
  const rows = await prisma.campanha.findMany({
    where: filters?.terreiroId
      ? {
          OR: [
            { terreiroId: filters.terreiroId },
            { parceiroTerreiroId: filters.terreiroId },
          ],
        }
      : undefined,
    orderBy: { dataInicio: "desc" },
  });
  return rows.map(mapCampanha);
}

export async function getCampanhaById(id: string) {
  const row = await prisma.campanha.findUnique({ where: { id } });
  return row ? mapCampanha(row) : null;
}

function campanhaCreateData(
  base: {
    id: string;
    terreiroId: string;
    parceiroTerreiroId?: string;
    titulo: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
  },
  input: CampanhaFormInput | CampanhaPropostaPayload,
) {
  if (input.metaTipo === "monetaria") {
    const meta =
      "metaMonetaria" in input
        ? input.metaMonetaria
        : "metaArrecadacao" in input
          ? input.metaArrecadacao
          : 0;
    return {
      ...base,
      metaTipo: "MONETARIA" as const,
      metaArrecadacao: meta ?? 0,
      valorArrecadado: 0,
    };
  }

  return {
    ...base,
    metaTipo: "ITENS" as const,
    itemDescricao: input.itemDescricao?.trim() ?? "",
    metaQuantidade: input.metaQuantidade ?? 0,
    quantidadeArrecadada: 0,
    unidade: input.unidade?.trim() || "itens",
  };
}

export async function createCampanhaFromForm(
  terreiroId: string,
  input: CampanhaFormInput,
  options?: { parceiroTerreiroId?: string; dataInicio?: string },
) {
  const row = await prisma.campanha.create({
    data: campanhaCreateData(
      {
        id: crypto.randomUUID(),
        terreiroId,
        parceiroTerreiroId: options?.parceiroTerreiroId,
        titulo: input.titulo.trim(),
        descricao: input.descricao.trim(),
        dataInicio: options?.dataInicio ?? new Date().toISOString().slice(0, 10),
        dataFim: input.dataFim.includes("/")
          ? input.dataFim
          : input.dataFim,
      },
      input,
    ),
  });
  return mapCampanha(row);
}

export async function createCampanhaFromProposta(proposta: CampanhaPropostaPayload) {
  const row = await prisma.campanha.create({
    data: campanhaCreateData(
      {
        id: crypto.randomUUID(),
        terreiroId: proposta.deTerreiroId,
        parceiroTerreiroId: proposta.paraTerreiroId,
        titulo: proposta.titulo,
        descricao: proposta.descricao,
        dataInicio: proposta.dataInicio,
        dataFim: proposta.dataFim,
      },
      proposta,
    ),
  });
  return mapCampanha(row);
}

export async function updateCampanhaFromForm(
  id: string,
  input: CampanhaFormInput,
  currentDataFim: string,
) {
  const dataFim = input.dataFim.trim() || currentDataFim;
  const common = {
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    dataFim,
    metaTipo: toMetaTipo(input.metaTipo),
  };

  const row =
    input.metaTipo === "monetaria"
      ? await prisma.campanha.update({
          where: { id },
          data: {
            ...common,
            metaArrecadacao: input.metaMonetaria ?? 0,
            valorArrecadado: input.valorArrecadado ?? 0,
            itemDescricao: null,
            metaQuantidade: null,
            quantidadeArrecadada: null,
            unidade: null,
          },
        })
      : await prisma.campanha.update({
          where: { id },
          data: {
            ...common,
            itemDescricao: input.itemDescricao?.trim() ?? "",
            metaQuantidade: input.metaQuantidade ?? 0,
            quantidadeArrecadada: input.quantidadeArrecadada ?? 0,
            unidade: input.unidade?.trim() || "itens",
            metaArrecadacao: null,
            valorArrecadado: null,
          },
        });

  return mapCampanha(row);
}

export async function setCampanhaStatus(
  id: string,
  status: "ativa" | "encerrada" | "rascunho",
) {
  const row = await prisma.campanha.update({
    where: { id },
    data: { status: toCampanhaStatus(status) },
  });
  return mapCampanha(row);
}
