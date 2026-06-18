import type {
  Campanha,
  CampanhaMetaTipo,
} from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import { parseDateBRToISO } from "@/lib/masks";
import {
  getCampanhasSnapshotAll,
  subscribeDataSource,
  upsertCampanha,
} from "@/lib/data-source";

export const EMPTY_CAMPANHAS: Campanha[] = [];

export type CampanhaPropostaPayload = {
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
};

export type CampanhaFormInput = {
  titulo: string;
  descricao: string;
  metaTipo: CampanhaMetaTipo;
  dataFim: string;
  metaMonetaria?: number;
  itemDescricao?: string;
  metaQuantidade?: number;
  unidade?: string;
  valorArrecadado?: number;
  quantidadeArrecadada?: number;
};

let listeners: Array<() => void> = [];

let cachedCampanhasSnapshotSource: Campanha[] | null = null;
let cachedCampanhasSnapshot: Campanha[] = EMPTY_CAMPANHAS;

const cachedCampanhasPublicasByTerreiro = new Map<
  string,
  { source: Campanha[]; result: Campanha[] }
>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToCampanhas(callback: () => void) {
  listeners.push(callback);
  const unsubscribeData = subscribeDataSource(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    unsubscribeData();
  };
}

function belongsToLoggedTerreiro(campanha: Campanha): boolean {
  return (
    campanha.terreiroId === LOGGED_TERREIRO_ID ||
    campanha.parceiroTerreiroId === LOGGED_TERREIRO_ID
  );
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDataFim(dataFim: string, fallback: string): string {
  if (!dataFim.trim()) return fallback;
  if (dataFim.includes("/")) return parseDateBRToISO(dataFim);
  return dataFim;
}

export function getCampanhasPublicasByTerreiro(terreiroId: string): Campanha[] {
  const source = getCampanhasSnapshotAll();
  const cached = cachedCampanhasPublicasByTerreiro.get(terreiroId);
  if (cached?.source === source) return cached.result;

  const result: Campanha[] = [];
  for (const campanha of source) {
    if (campanha.status !== "ativa") continue;
    if (
      campanha.terreiroId === terreiroId ||
      campanha.parceiroTerreiroId === terreiroId
    ) {
      result.push(campanha);
    }
  }

  const stable = result.length === 0 ? EMPTY_CAMPANHAS : result;
  cachedCampanhasPublicasByTerreiro.set(terreiroId, { source, result: stable });
  return stable;
}

export function getCampanhasSnapshot(): Campanha[] {
  const source = getCampanhasSnapshotAll();
  if (cachedCampanhasSnapshotSource === source) return cachedCampanhasSnapshot;

  const result = source.filter(belongsToLoggedTerreiro);
  cachedCampanhasSnapshotSource = source;
  cachedCampanhasSnapshot = result.length === 0 ? EMPTY_CAMPANHAS : result;
  return cachedCampanhasSnapshot;
}

export function getCampanhaById(campanhaId: string): Campanha | undefined {
  return getCampanhasSnapshot().find((campanha) => campanha.id === campanhaId);
}

export async function encerrarCampanha(campanhaId: string) {
  const response = await fetch("/api/campanhas", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: campanhaId, action: "encerrar" }),
  });
  if (!response.ok) return;
  upsertCampanha((await response.json()) as Campanha);
  emitChange();
}

export async function reativarCampanha(campanhaId: string) {
  const response = await fetch("/api/campanhas", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: campanhaId, action: "reativar" }),
  });
  if (!response.ok) return;
  upsertCampanha((await response.json()) as Campanha);
  emitChange();
}

export async function updateCampanhaFromForm(
  campanhaId: string,
  input: CampanhaFormInput,
) {
  const response = await fetch("/api/campanhas", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: campanhaId, action: "update", input }),
  });
  if (!response.ok) return;
  upsertCampanha((await response.json()) as Campanha);
  emitChange();
}

export async function addCampanhaFromForm(
  input: CampanhaFormInput,
  options?: { parceiroTerreiroId?: string },
): Promise<Campanha | undefined> {
  const response = await fetch("/api/campanhas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      dataFim: normalizeDataFim(input.dataFim, todayISO()),
      parceiroTerreiroId: options?.parceiroTerreiroId,
    }),
  });
  if (!response.ok) return undefined;
  const created = (await response.json()) as Campanha;
  upsertCampanha(created);
  emitChange();
  return created;
}
