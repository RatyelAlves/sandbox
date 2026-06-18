import type { GiraHorario, Terreiro } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import {
  getTerreirosSnapshot,
  subscribeDataSource,
  upsertTerreiro,
} from "@/lib/data-source";

export type TerreiroProfilePatch = {
  giras?: GiraHorario[];
  horarioAbertura?: string;
  horarioFechamento?: string;
};

let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToTerreiroProfile(callback: () => void) {
  listeners.push(callback);
  const unsubscribeData = subscribeDataSource(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    unsubscribeData();
  };
}

export function normalizeGiras(giras: GiraHorario[]): GiraHorario[] {
  return giras
    .map((gira) => ({
      dia: gira.dia.trim(),
      titulo: gira.titulo?.trim() || undefined,
      horarioInicio: gira.horarioInicio.trim(),
      horarioFim: gira.horarioFim?.trim() || undefined,
    }))
    .filter((gira) => gira.dia && gira.horarioInicio);
}

export function getLoggedTerreiroProfile(): TerreiroProfilePatch {
  const terreiro = getTerreiroForDisplay(LOGGED_TERREIRO_ID);
  return {
    horarioAbertura: terreiro?.horarioAbertura ?? "",
    horarioFechamento: terreiro?.horarioFechamento ?? "",
    giras: terreiro?.giras ?? [],
  };
}

export async function saveTerreiroProfile(input: TerreiroProfilePatch) {
  const current = getTerreiroForDisplay(LOGGED_TERREIRO_ID);
  if (!current) return;

  const payload = {
    id: LOGGED_TERREIRO_ID,
    horarioAbertura: input.horarioAbertura ?? current.horarioAbertura,
    horarioFechamento: input.horarioFechamento ?? current.horarioFechamento,
    giras: input.giras ? normalizeGiras(input.giras) : current.giras,
  };

  const response = await fetch("/api/terreiros", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return;

  upsertTerreiro((await response.json()) as Terreiro);
  emitChange();
}

export function getTerreiroForDisplay(id: string): Terreiro | undefined {
  return getTerreirosSnapshot().find((terreiro) => terreiro.id === id);
}
