import type { Evento } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import {
  getEventosSnapshot,
  subscribeDataSource,
  upsertEvento,
} from "@/lib/data-source";

export type EventoStatus = "ativo" | "cancelado";

export type EventoFormInput = {
  titulo: string;
  categoria: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  linkIngresso?: string;
};

export const EMPTY_EVENTOS: Evento[] = [];

type EventoWithStatus = Evento & { status?: EventoStatus };

let listeners: Array<() => void> = [];

let cachedPublicEventosSource: EventoWithStatus[] | null = null;
let cachedPublicEventos: Evento[] = EMPTY_EVENTOS;

const cachedTerreiroEventos = new Map<
  string,
  { source: EventoWithStatus[]; result: Evento[] }
>();

const cachedPublicEventosByTerreiro = new Map<
  string,
  { source: EventoWithStatus[]; result: Evento[] }
>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToEventos(callback: () => void) {
  listeners.push(callback);
  const unsubscribeData = subscribeDataSource(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    unsubscribeData();
  };
}

function getEventoStatus(evento: EventoWithStatus): EventoStatus {
  return evento.status ?? "ativo";
}

function getAllEventos(): EventoWithStatus[] {
  return getEventosSnapshot() as EventoWithStatus[];
}

export function getTerreiroEventos(terreiroId: string): Evento[] {
  const source = getAllEventos();
  const cached = cachedTerreiroEventos.get(terreiroId);
  if (cached?.source === source) return cached.result;

  const result = source.filter((evento) => evento.terreiroId === terreiroId);
  const stable = result.length === 0 ? EMPTY_EVENTOS : result;
  cachedTerreiroEventos.set(terreiroId, { source, result: stable });
  return stable;
}

export function getPublicEventos(): Evento[] {
  const source = getAllEventos();
  if (cachedPublicEventosSource === source) return cachedPublicEventos;

  const result = source.filter(
    (evento) => getEventoStatus(evento) === "ativo",
  );
  cachedPublicEventosSource = source;
  cachedPublicEventos = result.length === 0 ? EMPTY_EVENTOS : result;
  return cachedPublicEventos;
}

export function getEventoById(id: string): Evento | undefined {
  return getAllEventos().find((evento) => evento.id === id);
}

export async function addTerreiroEvento(
  evento: Omit<Evento, "id">,
): Promise<Evento | undefined> {
  const response = await fetch("/api/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evento),
  });

  if (!response.ok) return undefined;

  const created = (await response.json()) as EventoWithStatus;
  upsertEvento(created);
  emitChange();
  return created;
}

export async function cancelarEvento(eventoId: string) {
  const response = await fetch("/api/eventos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: eventoId, action: "cancelar" }),
  });
  if (!response.ok) return;
  upsertEvento((await response.json()) as EventoWithStatus);
  emitChange();
}

export async function reativarEvento(eventoId: string) {
  const response = await fetch("/api/eventos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: eventoId, action: "reativar" }),
  });
  if (!response.ok) return;
  upsertEvento((await response.json()) as EventoWithStatus);
  emitChange();
}

export async function updateEventoFromForm(eventoId: string, input: EventoFormInput) {
  const response = await fetch("/api/eventos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: eventoId, action: "update", input }),
  });
  if (!response.ok) return;
  upsertEvento((await response.json()) as EventoWithStatus);
  emitChange();
}

export function canManageEvento(evento: Evento): boolean {
  return evento.terreiroId === LOGGED_TERREIRO_ID;
}

export function getEventosPublicosByTerreiro(terreiroId: string): Evento[] {
  const source = getAllEventos();
  const cached = cachedPublicEventosByTerreiro.get(terreiroId);
  if (cached?.source === source) return cached.result;

  const result = source.filter(
    (evento) =>
      evento.terreiroId === terreiroId &&
      getEventoStatus(evento) === "ativo",
  );
  const stable = result.length === 0 ? EMPTY_EVENTOS : result;
  cachedPublicEventosByTerreiro.set(terreiroId, { source, result: stable });
  return stable;
}

export { getEventoStatus };
