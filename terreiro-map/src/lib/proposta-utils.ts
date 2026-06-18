import type { PropostaStatus } from "@/lib/propostas-store";

export const PROPOSTA_STATUS_LABEL: Record<PropostaStatus, string> = {
  pendente: "Aguardando resposta",
  aceita: "Aceita",
  recusada: "Recusada",
};

export function formatPropostaMeta(proposta: {
  metaTipo: "monetaria" | "itens";
  metaArrecadacao?: number;
  itemDescricao?: string;
  metaQuantidade?: number;
  unidade?: string;
}): string {
  if (proposta.metaTipo === "monetaria") {
    return `Meta: ${(proposta.metaArrecadacao ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    })}`;
  }

  const quantidade = (proposta.metaQuantidade ?? 0).toLocaleString("pt-BR");
  const unidade = proposta.unidade ?? "itens";
  const itens = proposta.itemDescricao ? ` · ${proposta.itemDescricao}` : "";
  return `Meta: ${quantidade} ${unidade}${itens}`;
}
