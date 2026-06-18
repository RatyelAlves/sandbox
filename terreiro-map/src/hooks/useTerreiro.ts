"use client";

import { useSyncExternalStore } from "react";
import type { Terreiro } from "@/lib/mock-data";
import {
  getTerreiroForDisplay,
  subscribeToTerreiroProfile,
} from "@/lib/terreiro-profile-store";
import { getTerreirosSnapshot, subscribeDataSource } from "@/lib/data-source";

function subscribe(callback: () => void) {
  const unsubProfile = subscribeToTerreiroProfile(callback);
  const unsubData = subscribeDataSource(callback);
  return () => {
    unsubProfile();
    unsubData();
  };
}

export function useTerreiroDisplay(id: string): Terreiro | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getTerreiroForDisplay(id),
    () => getTerreirosSnapshot().find((terreiro) => terreiro.id === id),
  );
}
