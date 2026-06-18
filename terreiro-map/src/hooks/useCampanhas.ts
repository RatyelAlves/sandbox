"use client";

import { useSyncExternalStore } from "react";
import {
  getCampanhasSnapshot,
  getCampanhaById,
  subscribeToCampanhas,
} from "@/lib/campanhas-store";
import { getCampanhasSnapshotAll } from "@/lib/data-source";

function subscribe(callback: () => void) {
  return subscribeToCampanhas(callback);
}

function getServerSnapshot() {
  return getCampanhasSnapshot();
}

export function useCampanhas() {
  const campanhas = useSyncExternalStore(
    subscribe,
    getCampanhasSnapshot,
    getServerSnapshot,
  );

  return {
    campanhas,
    ativas: campanhas.filter((campanha) => campanha.status === "ativa"),
    encerradas: campanhas.filter((campanha) => campanha.status === "encerrada"),
  };
}

export function useCampanha(campanhaId: string) {
  return useSyncExternalStore(
    subscribe,
    () => getCampanhaById(campanhaId),
    () => getCampanhasSnapshotAll().find((c) => c.id === campanhaId),
  );
}
