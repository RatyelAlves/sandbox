import type { Evento, Terreiro } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";
import { getTerreirosSnapshot } from "@/lib/data-source";

export type ListSortOption =
  | "name-asc"
  | "name-desc"
  | "distance-asc"
  | "distance-desc";

export const LIST_SORT_OPTIONS: { value: ListSortOption; label: string }[] = [
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "distance-asc", label: "Menor distância" },
  { value: "distance-desc", label: "Maior distância" },
];

/** Ponto de referência mock para usuário (centro de BH). */
export function getUsuarioReferencePoint() {
  return { lat: -19.9167, lng: -43.9345 };
}

/** Ponto de referência do terreiro logado no protótipo. */
export function getTerreiroReferencePoint() {
  const terreiro = getTerreirosSnapshot().find((t) => t.id === LOGGED_TERREIRO_ID);
  return {
    lat: terreiro?.lat ?? -19.9167,
    lng: terreiro?.lng ?? -43.9345,
  };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortTerreiros(
  items: Terreiro[],
  sort: ListSortOption | "",
  ref: { lat: number; lng: number },
): Terreiro[] {
  if (!sort) return items;

  const sorted = [...items];

  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    case "name-desc":
      return sorted.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
    case "distance-asc":
      return sorted.sort(
        (a, b) =>
          haversineKm(ref.lat, ref.lng, a.lat, a.lng) -
          haversineKm(ref.lat, ref.lng, b.lat, b.lng),
      );
    case "distance-desc":
      return sorted.sort(
        (a, b) =>
          haversineKm(ref.lat, ref.lng, b.lat, b.lng) -
          haversineKm(ref.lat, ref.lng, a.lat, a.lng),
      );
    default:
      return items;
  }
}

export function sortEventos(
  items: Evento[],
  sort: ListSortOption | "",
  ref: { lat: number; lng: number },
): Evento[] {
  if (!sort) return items;

  const terreiroById = new Map(getTerreirosSnapshot().map((t) => [t.id, t]));
  const distanceFor = (evento: Evento) => {
    const terreiro = terreiroById.get(evento.terreiroId);
    if (!terreiro) return Number.POSITIVE_INFINITY;
    return haversineKm(ref.lat, ref.lng, terreiro.lat, terreiro.lng);
  };

  const sorted = [...items];

  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    case "name-desc":
      return sorted.sort((a, b) => b.titulo.localeCompare(a.titulo, "pt-BR"));
    case "distance-asc":
      return sorted.sort((a, b) => distanceFor(a) - distanceFor(b));
    case "distance-desc":
      return sorted.sort((a, b) => distanceFor(b) - distanceFor(a));
    default:
      return items;
  }
}
