import type { Evento, Terreiro } from "@/lib/mock-data";
import {
  getEventosSnapshot,
  getFavoriteEventoIdsSnapshot as readFavoriteEventoIds,
  getFavoriteTerreiroIdsSnapshot as readFavoriteTerreiroIds,
  getTerreirosSnapshot,
  setFavoriteEventoIds,
  setFavoriteTerreiroIds,
  subscribeDataSource,
} from "@/lib/data-source";

export const EMPTY_FAVORITE_TERREIROS: Terreiro[] = [];
export const EMPTY_FAVORITE_EVENTOS: Evento[] = [];
export const EMPTY_FAVORITE_TERREIRO_IDS: string[] = [];

let listeners: Array<() => void> = [];

let cachedFavoriteTerreiros: Terreiro[] = EMPTY_FAVORITE_TERREIROS;
let cachedFavoriteTerreirosIds: string[] | null = null;
let cachedFavoriteTerreirosSource: Terreiro[] | null = null;

let cachedFavoriteEventos: Evento[] = EMPTY_FAVORITE_EVENTOS;
let cachedFavoriteEventosIds: string[] | null = null;
let cachedFavoriteEventosSource: Evento[] | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToFavoritos(callback: () => void) {
  listeners.push(callback);
  const unsubscribeData = subscribeDataSource(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    unsubscribeData();
  };
}

function buildTerreirosFromIds(ids: string[]): Terreiro[] {
  if (ids.length === 0) return EMPTY_FAVORITE_TERREIROS;
  const byId = new Map(getTerreirosSnapshot().map((terreiro) => [terreiro.id, terreiro]));
  return ids
    .map((id) => byId.get(id))
    .filter((terreiro): terreiro is Terreiro => Boolean(terreiro));
}

function buildEventosFromIds(ids: string[]): Evento[] {
  if (ids.length === 0) return EMPTY_FAVORITE_EVENTOS;
  const byId = new Map(getEventosSnapshot().map((evento) => [evento.id, evento]));
  return ids
    .map((id) => byId.get(id))
    .filter((evento): evento is Evento => Boolean(evento));
}

export function getFavoriteTerreiroIdsSnapshot(): string[] {
  return readFavoriteTerreiroIds();
}

export async function removeFavoriteTerreiro(id: string) {
  const response = await fetch("/api/favoritos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "usuario", action: "remove", id }),
  });
  if (!response.ok) return;
  setFavoriteTerreiroIds((await response.json()) as string[]);
  emitChange();
}

export async function addFavoriteTerreiro(id: string) {
  const response = await fetch("/api/favoritos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "usuario", action: "add", id }),
  });
  if (!response.ok) return;
  setFavoriteTerreiroIds((await response.json()) as string[]);
  emitChange();
}

export async function toggleFavoriteTerreiro(id: string) {
  const response = await fetch("/api/favoritos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "usuario", action: "toggle", id }),
  });
  if (!response.ok) return;
  setFavoriteTerreiroIds((await response.json()) as string[]);
  emitChange();
}

export async function removeFavoriteEvento(id: string) {
  const response = await fetch("/api/favoritos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "terreiro", action: "remove", id }),
  });
  if (!response.ok) return;
  setFavoriteEventoIds((await response.json()) as string[]);
  emitChange();
}

export function getFavoriteTerreirosSnapshot(): Terreiro[] {
  const ids = readFavoriteTerreiroIds();
  const source = getTerreirosSnapshot();
  if (
    cachedFavoriteTerreirosIds === ids &&
    cachedFavoriteTerreirosSource === source
  ) {
    return cachedFavoriteTerreiros;
  }
  cachedFavoriteTerreirosIds = ids;
  cachedFavoriteTerreirosSource = source;
  cachedFavoriteTerreiros = buildTerreirosFromIds(ids);
  return cachedFavoriteTerreiros;
}

export function getFavoriteEventosSnapshot(): Evento[] {
  const ids = readFavoriteEventoIds();
  const source = getEventosSnapshot();
  if (
    cachedFavoriteEventosIds === ids &&
    cachedFavoriteEventosSource === source
  ) {
    return cachedFavoriteEventos;
  }
  cachedFavoriteEventosIds = ids;
  cachedFavoriteEventosSource = source;
  cachedFavoriteEventos = buildEventosFromIds(ids);
  return cachedFavoriteEventos;
}
