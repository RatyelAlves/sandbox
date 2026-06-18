import type { Campanha, Evento, Terreiro } from "@/lib/mock-data";
import {
  MOCK_CAMPANHAS,
  MOCK_EVENTOS,
  MOCK_TERREIROS,
} from "@/lib/mock-data";
import type { PropostaCampanha } from "@/lib/propostas-store";

export type BootstrapPayload = {
  terreiros: Terreiro[];
  eventos: (Evento & { status?: "ativo" | "cancelado" })[];
  campanhas: Campanha[];
  propostas: PropostaCampanha[];
  favoritos: {
    usuario: string[];
    terreiro: string[];
  };
};

const DEFAULT_FAVORITOS: BootstrapPayload["favoritos"] = {
  usuario: MOCK_TERREIROS.slice(0, 3).map((t) => t.id),
  terreiro: MOCK_EVENTOS.map((e) => e.id),
};

let snapshot: BootstrapPayload = {
  terreiros: MOCK_TERREIROS,
  eventos: MOCK_EVENTOS,
  campanhas: MOCK_CAMPANHAS,
  propostas: [],
  favoritos: DEFAULT_FAVORITOS,
};

let hydratedFromDb = false;
let hydratePromise: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeDataSource(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTerreirosSnapshot() {
  return snapshot.terreiros;
}

export function getEventosSnapshot() {
  return snapshot.eventos;
}

export function getCampanhasSnapshotAll() {
  return snapshot.campanhas;
}

export function getPropostasSnapshotAll() {
  return snapshot.propostas;
}

export function getFavoriteTerreiroIdsSnapshot() {
  return snapshot.favoritos.usuario;
}

export function getFavoriteEventoIdsSnapshot() {
  return snapshot.favoritos.terreiro;
}

export function setBootstrapPayload(payload: BootstrapPayload) {
  snapshot = payload;
  hydratedFromDb = true;
  notify();
}

export function patchSnapshot(partial: Partial<BootstrapPayload>) {
  snapshot = { ...snapshot, ...partial };
  notify();
}

export function upsertTerreiro(terreiro: Terreiro) {
  const index = snapshot.terreiros.findIndex((item) => item.id === terreiro.id);
  const terreiros =
    index >= 0
      ? snapshot.terreiros.map((item, i) => (i === index ? terreiro : item))
      : [...snapshot.terreiros, terreiro];
  patchSnapshot({ terreiros });
}

export function upsertEvento(evento: Evento & { status?: "ativo" | "cancelado" }) {
  const index = snapshot.eventos.findIndex((item) => item.id === evento.id);
  const eventos =
    index >= 0
      ? snapshot.eventos.map((item, i) => (i === index ? evento : item))
      : [...snapshot.eventos, evento];
  patchSnapshot({ eventos });
}

export function upsertCampanha(campanha: Campanha) {
  const index = snapshot.campanhas.findIndex((item) => item.id === campanha.id);
  const campanhas =
    index >= 0
      ? snapshot.campanhas.map((item, i) => (i === index ? campanha : item))
      : [...snapshot.campanhas, campanha];
  patchSnapshot({ campanhas });
}

export function upsertProposta(proposta: PropostaCampanha) {
  const index = snapshot.propostas.findIndex((item) => item.id === proposta.id);
  const propostas =
    index >= 0
      ? snapshot.propostas.map((item, i) => (i === index ? proposta : item))
      : [...snapshot.propostas, proposta];
  patchSnapshot({ propostas });
}

export function setFavoriteTerreiroIds(ids: string[]) {
  patchSnapshot({ favoritos: { ...snapshot.favoritos, usuario: ids } });
}

export function setFavoriteEventoIds(ids: string[]) {
  patchSnapshot({ favoritos: { ...snapshot.favoritos, terreiro: ids } });
}

export async function hydrateFromApi(): Promise<boolean> {
  if (hydratedFromDb) return true;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const response = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!response.ok) return false;
      const payload = (await response.json()) as BootstrapPayload;
      setBootstrapPayload(payload);
      return true;
    } catch {
      return false;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

export async function refreshFromApi(): Promise<boolean> {
  hydratedFromDb = false;
  return hydrateFromApi();
}
