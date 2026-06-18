"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_PROPOSTAS,
  getPropostasSnapshot,
  subscribeToPropostas,
} from "@/lib/propostas-store";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";

function subscribe(callback: () => void) {
  return subscribeToPropostas(callback);
}

export function usePropostas() {
  const propostas = useSyncExternalStore(
    subscribe,
    getPropostasSnapshot,
    () => EMPTY_PROPOSTAS,
  );

  const recebidas = propostas.filter(
    (proposta) => proposta.paraTerreiroId === LOGGED_TERREIRO_ID,
  );
  const enviadas = propostas.filter(
    (proposta) => proposta.deTerreiroId === LOGGED_TERREIRO_ID,
  );

  return {
    propostas,
    recebidas,
    enviadas,
    recebidasPendentes: recebidas.filter(
      (proposta) => proposta.status === "pendente",
    ),
    enviadasPendentes: enviadas.filter(
      (proposta) => proposta.status === "pendente",
    ),
  };
}
