import type { Evento } from "@/lib/mock-data";
import { getEventoStatus } from "@/lib/eventos-store";

export function formatEventoDate(data: string): string {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventoSubtitle(evento: Evento, extra?: string) {
  const parts = [
    evento.categoria,
    new Date(evento.data).toLocaleDateString("pt-BR"),
    evento.horario,
    evento.local,
    extra,
  ].filter(Boolean);

  return parts.join(" · ");
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isEventoPassado(evento: Evento): boolean {
  return evento.data < todayISO();
}

export function isEventoCancelado(evento: Evento): boolean {
  return getEventoStatus(evento) === "cancelado";
}

export function isEventoEncerrado(evento: Evento): boolean {
  return isEventoCancelado(evento) || isEventoPassado(evento);
}

export function isEventoProximo(evento: Evento): boolean {
  return !isEventoEncerrado(evento);
}

export const EVENTO_STATUS_LABEL = {
  ativo: "Ativo",
  cancelado: "Cancelado",
  realizado: "Realizado",
} as const;

export function getEventoDisplayStatus(evento: Evento): string {
  if (isEventoCancelado(evento)) return EVENTO_STATUS_LABEL.cancelado;
  if (isEventoPassado(evento)) return EVENTO_STATUS_LABEL.realizado;
  return EVENTO_STATUS_LABEL.ativo;
}
