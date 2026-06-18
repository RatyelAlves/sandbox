import type {
  CampanhaMetaTipo as PrismaMetaTipo,
  CampanhaStatus as PrismaCampanhaStatus,
  EventoStatus as PrismaEventoStatus,
  PropostaStatus as PrismaPropostaStatus,
} from "@/generated/prisma/client";
import type { Campanha as PrismaCampanha } from "@/generated/prisma/client";
import type { Evento as PrismaEvento } from "@/generated/prisma/client";
import type { PropostaCampanha as PrismaProposta } from "@/generated/prisma/client";
import type { Terreiro as PrismaTerreiro } from "@/generated/prisma/client";
import type {
  Campanha,
  CampanhaMetaTipo,
  CampanhaStatus,
  Evento,
  GiraHorario,
  Terreiro,
} from "@/lib/mock-data";
import type { PropostaCampanha } from "@/lib/propostas-store";

function mapEventoStatus(status: PrismaEventoStatus): "ativo" | "cancelado" {
  return status === "ATIVO" ? "ativo" : "cancelado";
}

export function toEventoStatus(status: "ativo" | "cancelado"): PrismaEventoStatus {
  return status === "ativo" ? "ATIVO" : "CANCELADO";
}

function mapCampanhaStatus(status: PrismaCampanhaStatus): CampanhaStatus {
  if (status === "ATIVA") return "ativa";
  if (status === "ENCERRADA") return "encerrada";
  return "rascunho";
}

export function toCampanhaStatus(status: CampanhaStatus): PrismaCampanhaStatus {
  if (status === "ativa") return "ATIVA";
  if (status === "encerrada") return "ENCERRADA";
  return "RASCUNHO";
}

export function toMetaTipo(metaTipo: CampanhaMetaTipo): PrismaMetaTipo {
  return metaTipo === "monetaria" ? "MONETARIA" : "ITENS";
}

export function mapPropostaStatus(
  status: PrismaPropostaStatus,
): PropostaCampanha["status"] {
  if (status === "ACEITA") return "aceita";
  if (status === "RECUSADA") return "recusada";
  return "pendente";
}

export function toPropostaStatus(
  status: PropostaCampanha["status"],
): PrismaPropostaStatus {
  if (status === "aceita") return "ACEITA";
  if (status === "recusada") return "RECUSADA";
  return "PENDENTE";
}

function parseGiras(value: unknown): GiraHorario[] | undefined {
  if (!value || !Array.isArray(value)) return undefined;
  return value as GiraHorario[];
}

export function mapTerreiro(row: PrismaTerreiro): Terreiro {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    descricao: row.descricao,
    dataFundacao: row.dataFundacao,
    liderReligioso: row.liderReligioso,
    fundador: row.fundador,
    nacaoFundador: row.nacaoFundador,
    uf: row.uf,
    cidade: row.cidade,
    bairro: row.bairro,
    rua: row.rua,
    numero: row.numero,
    horarioAbertura: row.horarioAbertura,
    horarioFechamento: row.horarioFechamento,
    giras: parseGiras(row.giras),
    telefone: row.telefone,
    email: row.email,
    site: row.site ?? undefined,
    instagram: row.instagram ?? undefined,
    facebook: row.facebook ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    lat: row.lat,
    lng: row.lng,
    fotos: row.fotos,
  };
}

export function mapEvento(row: PrismaEvento): Evento & { status?: "ativo" | "cancelado" } {
  return {
    id: row.id,
    terreiroId: row.terreiroId,
    titulo: row.titulo,
    categoria: row.categoria,
    data: row.data,
    horario: row.horario,
    local: row.local,
    descricao: row.descricao,
    linkIngresso: row.linkIngresso ?? undefined,
    status: mapEventoStatus(row.status),
  };
}

export function mapCampanha(row: PrismaCampanha): Campanha {
  const base = {
    id: row.id,
    terreiroId: row.terreiroId,
    parceiroTerreiroId: row.parceiroTerreiroId ?? undefined,
    titulo: row.titulo,
    descricao: row.descricao,
    dataInicio: row.dataInicio,
    dataFim: row.dataFim,
    status: mapCampanhaStatus(row.status),
  };

  if (row.metaTipo === "MONETARIA") {
    return {
      ...base,
      metaTipo: "monetaria",
      metaArrecadacao: row.metaArrecadacao ?? 0,
      valorArrecadado: row.valorArrecadado ?? 0,
    };
  }

  return {
    ...base,
    metaTipo: "itens",
    itemDescricao: row.itemDescricao ?? "",
    metaQuantidade: row.metaQuantidade ?? 0,
    quantidadeArrecadada: row.quantidadeArrecadada ?? 0,
    unidade: row.unidade ?? "itens",
  };
}

export function mapProposta(row: PrismaProposta): PropostaCampanha {
  const base = {
    id: row.id,
    deTerreiroId: row.deTerreiroId,
    paraTerreiroId: row.paraTerreiroId,
    titulo: row.titulo,
    descricao: row.descricao,
    dataInicio: row.dataInicio,
    dataFim: row.dataFim,
    status: mapPropostaStatus(row.status),
    campanhaId: row.campanhaId ?? undefined,
  };

  if (row.metaTipo === "MONETARIA") {
    return {
      ...base,
      metaTipo: "monetaria",
      metaArrecadacao: row.metaArrecadacao ?? 0,
    };
  }

  return {
    ...base,
    metaTipo: "itens",
    itemDescricao: row.itemDescricao ?? "",
    metaQuantidade: row.metaQuantidade ?? 0,
    unidade: row.unidade ?? "itens",
  };
}
