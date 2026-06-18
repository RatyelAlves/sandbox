import type { GeocodedLocationInput } from "@/lib/geocode";
import type { Terreiro } from "@/lib/mock-data";

export function formatTerreiroAddress(terreiro: Terreiro): string {
  return `${terreiro.rua}, ${terreiro.numero} — ${terreiro.bairro}, ${terreiro.cidade}, ${terreiro.uf}`;
}

export function terreiroToGeocodedLocation(
  terreiro: Terreiro,
): GeocodedLocationInput {
  return {
    id: terreiro.id,
    address: formatTerreiroAddress(terreiro),
    title: terreiro.nome,
    description: `${terreiro.cidade}, ${terreiro.uf}`,
    fallbackLat: terreiro.lat,
    fallbackLng: terreiro.lng,
  };
}
