import type { Campanha, Terreiro } from "@/lib/mock-data";

export function formatCampanhaMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatCampanhaQuantidade(
  quantidade: number,
  unidade: string,
): string {
  return `${quantidade.toLocaleString("pt-BR")} ${unidade}`;
}

export function formatCampanhaDate(data: string): string {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getCampanhaProgress(campanha: Campanha): number {
  const meta =
    campanha.metaTipo === "monetaria"
      ? campanha.metaArrecadacao
      : campanha.metaQuantidade;
  const atual =
    campanha.metaTipo === "monetaria"
      ? campanha.valorArrecadado
      : campanha.quantidadeArrecadada;

  if (meta <= 0) return 0;
  return Math.min(100, Math.round((atual / meta) * 100));
}

export function getCampanhaMetaAtual(campanha: Campanha): string {
  if (campanha.metaTipo === "monetaria") {
    return formatCampanhaMoney(campanha.valorArrecadado);
  }
  return formatCampanhaQuantidade(
    campanha.quantidadeArrecadada,
    campanha.unidade,
  );
}

export function getCampanhaMetaTotal(campanha: Campanha): string {
  if (campanha.metaTipo === "monetaria") {
    return formatCampanhaMoney(campanha.metaArrecadacao);
  }
  return formatCampanhaQuantidade(campanha.metaQuantidade, campanha.unidade);
}

export function getCampanhaProgressLabels(campanha: Campanha): {
  atual: string;
  meta: string;
} {
  if (campanha.metaTipo === "monetaria") {
    return { atual: "Arrecadado", meta: "Meta" };
  }
  return { atual: "Recebido", meta: "Meta" };
}

export function getCampanhaParceiroLabel(
  campanha: Campanha,
  terreiros: Terreiro[],
): string | null {
  if (!campanha.parceiroTerreiroId) return null;
  const parceiro = terreiros.find((t) => t.id === campanha.parceiroTerreiroId);
  return parceiro?.nome ?? null;
}

export const CAMPANHA_STATUS_LABEL: Record<Campanha["status"], string> = {
  ativa: "Ativa",
  encerrada: "Encerrada",
  rascunho: "Rascunho",
};

export const CAMPANHA_META_TIPO_LABEL: Record<Campanha["metaTipo"], string> = {
  monetaria: "Recursos financeiros",
  itens: "Arrecadação de itens",
};
