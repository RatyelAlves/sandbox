"use client";

import { useSyncExternalStore } from "react";
import {
  getTerreirosSnapshot,
  subscribeDataSource,
} from "@/lib/data-source";
import { MOCK_TERREIROS } from "@/lib/mock-data";

function subscribe(callback: () => void) {
  return subscribeDataSource(callback);
}

export function useTerreiros() {
  return useSyncExternalStore(
    subscribe,
    getTerreirosSnapshot,
    () => MOCK_TERREIROS,
  );
}

export function useTerreiroById(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => getTerreirosSnapshot().find((terreiro) => terreiro.id === id),
    () => MOCK_TERREIROS.find((terreiro) => terreiro.id === id),
  );
}
