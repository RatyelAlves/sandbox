import type { GiraHorario } from "@/lib/mock-data";

export function formatGiraHorario(gira: GiraHorario): string {
  if (gira.horarioFim) {
    return `${gira.horarioInicio} – ${gira.horarioFim}`;
  }
  return gira.horarioInicio;
}

export function formatGiraTitulo(gira: GiraHorario): string {
  if (gira.titulo) return gira.titulo;
  return gira.dia;
}

export function formatGiraSubtitle(gira: GiraHorario): string {
  const parts = [gira.titulo ? gira.dia : undefined, formatGiraHorario(gira)].filter(
    Boolean,
  );
  return parts.join(" · ");
}
