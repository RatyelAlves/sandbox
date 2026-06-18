"use client";

import { useSyncExternalStore } from "react";
import {
  getEventoById,
  getPublicEventos,
  getTerreiroEventos,
  subscribeToEventos,
  EMPTY_EVENTOS,
} from "@/lib/eventos-store";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";

function subscribe(callback: () => void) {
  return subscribeToEventos(callback);
}

export function useTerreiroEventos(terreiroId = LOGGED_TERREIRO_ID) {
  return useSyncExternalStore(
    subscribe,
    () => getTerreiroEventos(terreiroId),
    () => EMPTY_EVENTOS,
  );
}

export function usePublicEventos() {
  return useSyncExternalStore(subscribe, getPublicEventos, () => []);
}

export function useEvento(eventoId: string) {
  return useSyncExternalStore(
    subscribe,
    () => getEventoById(eventoId),
    () => undefined,
  );
}
