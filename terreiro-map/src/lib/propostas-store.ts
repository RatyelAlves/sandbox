import type { Campanha } from "@/lib/mock-data";
import type { CampanhaFormInput } from "@/lib/campanhas-store";
import type { CampanhaMetaTipo } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import {
  getPropostasSnapshotAll,
  subscribeDataSource,
  upsertCampanha,
  upsertProposta,
} from "@/lib/data-source";

export type PropostaStatus = "pendente" | "aceita" | "recusada";

export interface PropostaCampanha {
  id: string;
  deTerreiroId: string;
  paraTerreiroId: string;
  titulo: string;
  descricao: string;
  metaTipo: CampanhaMetaTipo;
  dataInicio: string;
  dataFim: string;
  metaArrecadacao?: number;
  itemDescricao?: string;
  metaQuantidade?: number;
  unidade?: string;
  status: PropostaStatus;
  campanhaId?: string;
}

export const EMPTY_PROPOSTAS: PropostaCampanha[] = [];

let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToPropostas(callback: () => void) {
  listeners.push(callback);
  const unsubscribeData = subscribeDataSource(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    unsubscribeData();
  };
}

export function getPropostasSnapshot(): PropostaCampanha[] {
  return getPropostasSnapshotAll();
}

export async function createPropostaCampanha(
  paraTerreiroId: string,
  input: CampanhaFormInput,
  deTerreiroId = LOGGED_TERREIRO_ID,
): Promise<PropostaCampanha | undefined> {
  const response = await fetch("/api/propostas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paraTerreiroId,
      deTerreiroId,
      ...input,
    }),
  });
  if (!response.ok) return undefined;
  const created = (await response.json()) as PropostaCampanha;
  upsertProposta(created);
  emitChange();
  return created;
}

export async function aceitarProposta(
  propostaId: string,
): Promise<Campanha | undefined> {
  const response = await fetch("/api/propostas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "aceitar", propostaId }),
  });
  if (!response.ok) return undefined;

  const payload = (await response.json()) as {
    proposta: PropostaCampanha;
    campanha: Campanha;
  };

  upsertProposta(payload.proposta);
  upsertCampanha(payload.campanha);
  emitChange();
  return payload.campanha;
}

export async function recusarProposta(propostaId: string) {
  const response = await fetch("/api/propostas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "recusar", propostaId }),
  });
  if (!response.ok) return;
  upsertProposta((await response.json()) as PropostaCampanha);
  emitChange();
}
